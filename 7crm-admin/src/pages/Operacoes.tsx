import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Plane, 
  User, 
  Clock, 
  XCircle,
  CreditCard,
  Building,
  Info,
  DollarSign,
  Ban,
  Briefcase,
  AlertCircle // Importação adicionada
} from 'lucide-react'

// Status mapping
const OP_STATUSES = [
  { id: 'OP_GERADA', label: 'Novas OPs', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'LINK_GERADO', label: 'Aguardando Pagamento', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'PAGAMENTO_CONFIRMADO', label: 'Pagamento OK', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { id: 'EM_EMISSAO', label: 'Em Emissão', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { id: 'EMITIDO', label: 'Emitido (User)', color: 'bg-green-50 border-green-200 text-green-700' },
  { id: 'EMITIDO7C', label: 'Emitido (7C)', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  { id: 'CANCELADO', label: 'Cancelado/Erro', color: 'bg-red-50 border-red-200 text-red-700' }
]

export default function Operacoes() {
  const [ops, setOps] = useState<any[]>([])
  const [selectedOp, setSelectedOp] = useState<any | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchOps()
  }, [])

  const fetchOps = async () => {
    try {
      // Fetch cotacoes with specific statuses
      // We also need to fetch related data like flights and passengers
      // Since supabase-js doesn't do deep nested joins easily for everything, we might need multiple queries or a view.
      // For now, let's fetch the cotacoes and then fetch details when opening the modal.
      
      const { data, error } = await supabase
        .from('cotacoes')
        .select(`
          *,
          empresas (nome, codigo_agencia),
          formas_pagamento (nome)
        `)
        .in('status', ['OP_GERADA', 'LINK_GERADO', 'PAGAMENTO_CONFIRMADO', 'EM_EMISSAO', 'EMITIDO', 'EMITIDO7C', 'CANCELADO'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setOps(data || [])
    } catch (error) {
      console.error('Erro ao buscar OPs:', error)
    } finally {
      // setLoading(false)
    }
  }

  const handleStatusChange = async (opId: number, newStatus: string, extraData: any = {}) => {
    try {
      let updateData: any = { status: newStatus, ...extraData }

      if (newStatus === 'EM_EMISSAO') {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const nome = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Admin'
            updateData.responsavel_emissao = nome
        }
      }

      const { error } = await supabase
        .from('cotacoes')
        .update(updateData)
        .eq('id', opId)

      if (error) throw error
      
      // Update local state
      setOps(prev => prev.map(op => op.id === opId ? { ...op, status: newStatus, ...updateData, ...(updateData.responsavel_emissao ? { responsavel_emissao: updateData.responsavel_emissao } : {}) } : op))
      
      if (selectedOp && selectedOp.id === opId) {
        setSelectedOp((prev: any) => ({ ...prev, status: newStatus, ...updateData, ...(updateData.responsavel_emissao ? { responsavel_emissao: updateData.responsavel_emissao } : {}) }))
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const columns = useMemo(() => {
    const cols: Record<string, any[]> = {}
    OP_STATUSES.forEach(s => cols[s.id] = [])
    ops.forEach(op => {
      // Normalize status if needed (e.g. handle legacy statuses)
      const status = op.status
      if (cols[status]) {
        cols[status].push(op)
      } else {
        // If status not in our main list, maybe put in CANCELADO or ignore
        // For now, let's add to CANCELADO if it looks like an error/loss
        if (['LOST', 'CANCELADO'].includes(status)) {
             cols['CANCELADO'].push(op)
        }
      }
    })
    return cols
  }, [ops])

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-gray-50">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operações (Emissões)</h1>
          <p className="text-gray-500 mt-1">Gerencie as solicitações de emissão das agências</p>
        </div>
        <button 
            onClick={fetchOps}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
        >
            <Clock className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex space-x-4 h-full min-w-max">
          {OP_STATUSES.map(step => (
            <div 
              key={step.id} 
              className="w-96 flex-shrink-0 flex flex-col rounded-xl bg-gray-100/50 border border-gray-200 max-h-full"
            >
              <div className={`p-4 border-b border-gray-200 flex items-center justify-between rounded-t-xl ${step.color.replace('text-', 'bg-').replace('50', '100').split(' ')[0]}`}>
                <span className="font-bold text-gray-700">{step.label}</span>
                <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                  {columns[step.id]?.length || 0}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {columns[step.id]?.map(op => (
                  <div 
                    key={op.id}
                    onClick={() => {
                        setSelectedOp(op)
                        setShowModal(true)
                    }}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all relative group"
                  >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            #{op.codigo || op.id}
                        </span>
                        <span className="text-xs font-medium text-blue-600">
                            {new Date(op.created_at).toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 mb-1">{op.titulo}</h3>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                        <Building className="w-3 h-3" />
                        <span className="truncate">{op.empresas?.nome || 'Agência Desconhecida'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 truncate max-w-[120px]">{op.cliente}</span>
                        </div>
                        <div className="font-bold text-green-700 text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.valor || 0)}
                        </div>
                    </div>
                  </div>
                ))}
                {columns[step.id]?.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm italic">
                        Nenhuma OP neste status
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Detalhes Modal (Placeholder) */}
      {showModal && selectedOp && (
          <OpDetailsModal 
            op={selectedOp} 
            onClose={() => setShowModal(false)} 
            onStatusChange={handleStatusChange}
          />
      )}
    </div>
  )
}

function OpDetailsModal({ op, onClose, onStatusChange }: { op: any, onClose: () => void, onStatusChange: (id: number, status: string, extraData?: any) => void }) {
    const [details, setDetails] = useState<{ flights: any[], passengers: any[] }>({ flights: [], passengers: [] })
    const [loading, setLoading] = useState(true)
    const [paymentLink, setPaymentLink] = useState(op.link_pagamento || '')
    const [isSavingLink, setIsSavingLink] = useState(false)
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'EMISSION'>('DETAILS')
    
    // Emission Data States
    const [sameLoc, setSameLoc] = useState(false)
    const [emissionData, setEmissionData] = useState<Record<string, any>>({}) // Key format: 'paxId-direction' or 'GLOBAL-direction'
    const [financeiroData, setFinanceiroData] = useState({
        tarifaNet: '',
        taxaLink: '',
        milhas: '',
        custo: '',
        lucro: '',
        du: '',
        taxaEmbarque: ''
    })

    const handleEmissionChange = (key: string, field: 'loc', value: string) => {
        setEmissionData(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }))
    }

    const handleFinanceiroChange = (field: keyof typeof financeiroData, value: string) => {
        setFinanceiroData(prev => ({ ...prev, [field]: value }))
    }

    const totals = useMemo(() => {
        if (!details.flights.length) return null;
        
        // Assume o tipo tarifário do primeiro voo para labels
        const tipoTarifario = details.flights[0].dados_voo?.tipotarifario;

        return details.flights.reduce((acc, flight) => {
            const d = flight.dados_voo || {};
            return {
                tipotarifario: tipoTarifario,
                Adulto: (acc.Adulto || 0) + (d.Adulto || 0),
                Crianca: (acc.Crianca || 0) + (d.Crianca || 0),
                Bebe: (acc.Bebe || 0) + (d.Bebe || 0),
                
                AdultoR: (acc.AdultoR || 0) + (d.AdultoR || 0),
                CriancaR: (acc.CriancaR || 0) + (d.CriancaR || 0),
                BebeR: (acc.BebeR || 0) + (d.BebeR || 0),

                AdultoC: (acc.AdultoC || 0) + (d.AdultoC || 0),
                CriancaC: (acc.CriancaC || 0) + (d.CriancaC || 0),
                BebeC: (acc.BebeC || 0) + (d.BebeC || 0),

                AdultoF: (acc.AdultoF || 0) + (d.AdultoF || 0),
                CriancaF: (acc.CriancaF || 0) + (d.CriancaF || 0),
                BebeF: (acc.BebeF || 0) + (d.BebeF || 0),
                
                TaxaEmbarque: (acc.TaxaEmbarque || 0) + (d.TaxaEmbarque || 0),
            };
        }, {} as any);
    }, [details.flights]);

    // Effect to pre-fill financeiro data
    const directions = useMemo(() => {
        if (!details.flights.length) return []
        // Get unique directions present in flights
        const dirs = Array.from(new Set(details.flights.map(f => f.direcao))).sort((a, b) => {
            if (a === 'IDA') return -1
            if (b === 'IDA') return 1
            return 0
        })
        return dirs
    }, [details.flights])

    useEffect(() => {
        if (!totals) return

        const tarifaF = (totals.AdultoF || 0) + (totals.CriancaF || 0) + (totals.BebeF || 0) + (totals.TaxaEmbarque || 0)
        // Correção: tarifaR agora é apenas a tarifa de custo (sem taxas de embarque), pois a taxa de embarque é tratada separadamente
        const tarifaR = (totals.AdultoR || 0) + (totals.CriancaR || 0) + (totals.BebeR || 0) 
        const milhasQtd = (totals.Adulto || 0) + (totals.Crianca || 0) + (totals.Bebe || 0)
        
        // Calcular Taxa Link (se houver pagamento com juros)
        const valorComJuros = op.detalhes_pagamento?.valor_com_juros || op.valor || 0
        const valorSemJuros = op.detalhes_pagamento?.valor_sem_juros || op.valor || 0
        const taxaLinkCalc = valorComJuros - valorSemJuros
        const taxaDu = op.detalhes_pagamento?.taxa_du || 0
        
        // Tarifa Net Agência = Total (Venda) - DU - Taxa Link
        const tarifaNetAgencia = (op.valor || 0) - taxaDu - taxaLinkCalc

        // Faturamento 7C = Tarifa NET Agência + Taxa Link + DU
        const faturamento7C = tarifaNetAgencia + taxaLinkCalc + taxaDu

        // Lucro = Faturamento - Taxa Link - Custo Real (inicialmente igual ao custo calculado) - DU - Taxa Embarque
        const lucroEstimado = faturamento7C - taxaLinkCalc - tarifaR - taxaDu - (totals.TaxaEmbarque || 0)

        const formatCurrency = (val: number) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
        }

        setFinanceiroData({
            tarifaNet: formatCurrency(tarifaNetAgencia),
            taxaLink: formatCurrency(taxaLinkCalc > 0 ? taxaLinkCalc : 0),
            milhas: milhasQtd.toString(),
            custo: formatCurrency(tarifaR),
            lucro: formatCurrency(lucroEstimado),
            du: formatCurrency(taxaDu),
            taxaEmbarque: formatCurrency(totals.TaxaEmbarque || 0)
        })
    }, [totals, op])

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true)
            try {
                const [flightsRes, passengersRes] = await Promise.all([
                    supabase.from('voos').select('*').eq('cotacao_id', op.id),
                    supabase.from('cotacao_passageiros').select('*, clientes(*)').eq('cotacao_id', op.id)
                ])
                
                setDetails({
                    flights: flightsRes.data || [],
                    passengers: passengersRes.data || []
                })
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [op.id])

    const handleSaveLink = async () => {
        if (!paymentLink) return
        setIsSavingLink(true)
        try {
            await onStatusChange(op.id, 'LINK_GERADO', { link_pagamento: paymentLink })
            onClose()
        } catch (e) {
            console.error(e)
        } finally {
            setIsSavingLink(false)
        }
    }

    const handleConfirmarEmissao = async () => {
        try {
            if (!confirm('Deseja confirmar a emissão e gerar os lançamentos financeiros?')) return;

            setIsSavingLink(true);

            // 1. Atualizar status da cotação
            // TODO: Implementar lógica de contas a pagar/receber (futuro)
            
            // Dados de emissão para salvar (exemplo de estrutura JSONB)
            const dadosEmissao = {
                emission_data: emissionData,
                financeiro: {
                    ...financeiroData,
                    // Converter strings formatadas de volta para números se necessário
                }
            };

            // Atualiza status e salva dados extras (precisaria de campo específico no banco ou usar um campo jsonb existente/novo)
            // Por enquanto vamos apenas mudar o status conforme fluxo atual
            await onStatusChange(op.id, 'EMITIDO', { 
                // Aqui você pode passar dados adicionais se sua função onStatusChange suportar ou fazer um update separado
                // Por exemplo, salvar o lucro real, custo real, etc.
            });
            
            onClose();
        } catch (error) {
            console.error('Erro ao confirmar emissão:', error);
            alert('Erro ao confirmar emissão. Consulte o console.');
        } finally {
            setIsSavingLink(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            OP #{op.codigo || op.id}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                op.status === 'OP_GERADA' ? 'bg-blue-100 text-blue-700' :
                                op.status === 'LINK_GERADO' ? 'bg-purple-100 text-purple-700' :
                                op.status === 'PAGAMENTO_CONFIRMADO' ? 'bg-indigo-100 text-indigo-700' :
                                op.status === 'EM_EMISSAO' ? 'bg-yellow-100 text-yellow-700' :
                                op.status === 'EMITIDO' ? 'bg-green-100 text-green-700' :
                                op.status === 'EMITIDO7C' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100'
                            }`}>
                                {op.status.replace('_', ' ')}
                            </span>
                        </h3>
                        <p className="text-sm text-gray-500">{op.empresas?.nome}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Abas - Visível apenas se status for EM_EMISSAO */}
                {op.status === 'EM_EMISSAO' && (
                    <div className="px-6 border-b border-gray-200 bg-white">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('DETAILS')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === 'DETAILS'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Info className="w-4 h-4" />
                                Detalhes da Solicitação
                            </button>
                            <button
                                onClick={() => setActiveTab('EMISSION')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === 'EMISSION'
                                        ? 'border-yellow-500 text-yellow-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Plane className="w-4 h-4" />
                                Dados de Emissão
                            </button>
                        </nav>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Ações de Status */}
                    <div className="flex gap-2 justify-end border-b border-gray-100 pb-4">
                         {(op.status === 'OP_GERADA' || op.status === 'LINK_GERADO') && (
                            <button 
                                onClick={() => onStatusChange(op.id, 'PAGAMENTO_CONFIRMADO')}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-2"
                            >
                                <DollarSign className="w-4 h-4" />
                                Confirmar Pagamento
                            </button>
                        )}
                        {op.status === 'PAGAMENTO_CONFIRMADO' && (
                            <button 
                                onClick={() => onStatusChange(op.id, 'EM_EMISSAO')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
                            >
                                Assumir Emissão
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-10"><Clock className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>
                    ) : (
                        <>
                          {/* Conteúdo da Aba DETAILS (Fluxo Normal) */}
                          {(op.status !== 'EM_EMISSAO' || activeTab === 'DETAILS') && (
                            <>
                            {/* Input de Link de Pagamento - Apenas se status for OP_GERADA ou LINK_GERADO e tiver cartão */}
                             {(op.status === 'OP_GERADA' || op.status === 'LINK_GERADO') && (
                                <section className="bg-purple-50 border border-purple-100 rounded-xl p-6">
                                    <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-purple-600" />
                                        Gerar Link de Pagamento
                                    </h4>

                                    {op.detalhes_pagamento?.card && (
                                        <div className="mb-6 bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                                            <h5 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Dados do Cartão (Informado pelo Cliente)</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="block text-gray-500 text-xs">Nome no Cartão</span>
                                                    <span className="font-mono font-medium text-gray-900">{op.detalhes_pagamento.card.holderName}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-500 text-xs">CPF do Titular</span>
                                                    <span className="font-mono font-medium text-gray-900">{op.detalhes_pagamento.card.holderCPF}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-500 text-xs">Número do Cartão</span>
                                                    <span className="font-mono font-medium text-gray-900">{op.detalhes_pagamento.card.number}</span>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div>
                                                        <span className="block text-gray-500 text-xs">Validade</span>
                                                        <span className="font-mono font-medium text-gray-900">{op.detalhes_pagamento.card.expiry}</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-gray-500 text-xs">CVV</span>
                                                        <span className="font-mono font-medium text-gray-900">{op.detalhes_pagamento.card.cvc}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-purple-900 mb-1">Link de Pagamento</label>
                                            <input 
                                                type="text" 
                                                value={paymentLink}
                                                onChange={(e) => setPaymentLink(e.target.value)}
                                                placeholder="Cole o link de pagamento aqui..."
                                                className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleSaveLink}
                                            disabled={!paymentLink || isSavingLink}
                                            className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSavingLink ? 'Salvando...' : 'Salvar e Enviar'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-purple-700 mt-2">
                                        Ao salvar, o status mudará para "Aguardando Pagamento" e o cliente será notificado.
                                    </p>
                                </section>
                            )}
                            {/* Voos */}
                            <section>
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Plane className="w-5 h-5 text-blue-600" />
                                    Voos Solicitados
                                </h4>
                                <div className="space-y-4">
                                    {details.flights.map((flight, idx) => {
                                        const segments = (flight.dados_voo?.DetalhesConexoes && flight.dados_voo.DetalhesConexoes.length > 0) 
                                            ? flight.dados_voo.DetalhesConexoes 
                                            : [{
                                                CompanhiaAparente: flight.dados_voo?.CompanhiaAparente || flight.companhia,
                                                NumeroVoo: flight.dados_voo?.NumeroVoo || flight.numero_voo || 'N/A',
                                                EmbarqueCompleto: flight.dados_voo?.Embarque || (flight.data_ida ? `${flight.data_ida.split('T')[0]} ${flight.horario_partida}` : null),
                                                DesembarqueCompleto: flight.dados_voo?.Desembarque || (flight.data_ida ? `${flight.data_ida.split('T')[0]} ${flight.horario_chegada}` : null),
                                                Origem: flight.dados_voo?.Origem || flight.origem,
                                                Destino: flight.dados_voo?.Destino || flight.destino,
                                                Tarifa: flight.dados_voo?.Tarifa || flight.classe
                                            }];

                                        return (
                                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                                            {/* Cabeçalho do Card */}
                                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{flight.direcao || 'VOO'}</h3>
                                                </div>
                                            </div>

                                            {/* Tabela de Voos */}
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">CIA</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">VOO</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">SAÍDA</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">CHEGADA</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ORIGEM</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">DESTINO(S)</th>
                                                            <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">TARIFA</th>
                                                            <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">BAG.</th>
                                                            <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">TOTAL</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {segments.map((segment: any, segIdx: number) => {
                                                            const dataSaida = segment.EmbarqueCompleto 
                                                                ? new Date(segment.EmbarqueCompleto.includes('/') ? segment.EmbarqueCompleto.split(' ')[0].split('/').reverse().join('-') + 'T' + segment.EmbarqueCompleto.split(' ')[1] : segment.EmbarqueCompleto)
                                                                : null;
                                                            const dataChegada = segment.DesembarqueCompleto
                                                                ? new Date(segment.DesembarqueCompleto.includes('/') ? segment.DesembarqueCompleto.split(' ')[0].split('/').reverse().join('-') + 'T' + segment.DesembarqueCompleto.split(' ')[1] : segment.DesembarqueCompleto)
                                                                : null;
                                                            
                                                            const bagagem = flight.bagagem_despachada || (flight.dados_voo?.BagagemDespachada > 0);

                                                            return (
                                                                <tr key={segIdx}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                                                                        {segment.CompanhiaAparente || flight.companhia}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        {segment.NumeroVoo}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {dataSaida ? (
                                                                            <>
                                                                                <div className="font-medium">{dataSaida.toLocaleDateString('pt-BR')}</div>
                                                                                <div className="text-gray-500">{dataSaida.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                                            </>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {dataChegada ? (
                                                                            <>
                                                                                <div className="font-medium">{dataChegada.toLocaleDateString('pt-BR')}</div>
                                                                                <div className="text-gray-500">{dataChegada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                                            </>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                        {segment.Origem}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                        {segment.Destino}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                                                                        {segment.Tarifa || flight.dados_voo?.tipotarifario || 'Standard'}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                        {bagagem ? (
                                                                            <Briefcase className="h-5 w-5 text-blue-500 mx-auto" />
                                                                        ) : (
                                                                            <Ban className="h-5 w-5 text-red-500 mx-auto" />
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                                                        {segIdx === 0 && flight.dados_voo?.AdultoC ? (
                                                                             new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(flight.dados_voo.AdultoC)
                                                                        ) : segIdx === 0 ? 'R$ -' : ''}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Box Azul de Informações (Simplificado) */}
                                            {flight.dados_voo && (
                                                <div className="mx-4 mb-4 mt-4 bg-blue-50/80 rounded-xl border border-blue-100 p-4">
                                                    <div className="flex flex-wrap items-center gap-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-blue-800 font-semibold text-sm">Tipo Tarifário:</span>
                                                            <span className="bg-white px-3 py-1 rounded border border-blue-200 text-blue-600 font-bold text-xs uppercase tracking-wide">
                                                                {flight.dados_voo.tipotarifario}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-blue-800 font-semibold text-sm">Origem Busca:</span>
                                                            <span className="bg-white px-3 py-1 rounded border border-blue-200 text-blue-600 font-bold text-xs uppercase tracking-wide">
                                                                {flight.dados_voo.source}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-blue-800 font-semibold text-sm">Taxa de Embarque:</span>
                                                            <span className="text-blue-700 font-bold text-sm">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(flight.dados_voo.TaxaEmbarque || 0)}
                                                            </span>
                                                        </div>
                                                        {flight.dados_voo.tipotarifario !== 'C' && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-blue-800 font-semibold text-sm">Milhas:</span>
                                                                <span className="text-blue-700 font-bold text-sm">
                                                                    {flight.dados_voo.Adulto}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-blue-200/60">
                                                        <details className="text-xs">
                                                            <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                                                                <span className="text-lg">›</span> Ver JSON Bruto
                                                            </summary>
                                                            <pre className="mt-2 bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-x-auto font-mono">
                                                                {JSON.stringify(flight.dados_voo, null, 2)}
                                                            </pre>
                                                        </details>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Passageiros */}
                            <section>
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Passageiros
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {details.passengers.map((p, idx) => {
                                        const cliente = p.clientes
                                        return (
                                            <div key={idx} className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                    {cliente?.nome?.charAt(0) || 'P'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{cliente?.nome || 'Nome não encontrado'}</div>
                                                    <div className="text-sm text-gray-600">CPF: {cliente?.cpf}</div>
                                                    <div className="text-sm text-gray-600">
                                                        Nasc: {cliente?.data_nascimento ? cliente.data_nascimento.split('T')[0].split('-').reverse().join('/') : 'N/D'}
                                                    </div>
                                                    <div className="text-sm text-gray-600">Email: {cliente?.email}</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </section>

                            {/* Financeiro / Pagamento */}
                             <section>
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    Financeiro
                                </h4>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-green-800 font-medium">Valor Total da Emissão</span>
                                        <span className="text-2xl font-bold text-green-700">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.valor || 0)}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-200">
                                        <div>
                                            <span className="block text-xs text-green-800 opacity-70">Forma de Pagamento</span>
                                            <span className="font-medium text-green-900">
                                                {op.formas_pagamento?.nome || op.forma_pagamento || 'Não informado'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-green-800 opacity-70">Parcelamento</span>
                                            <span className="font-medium text-green-900">
                                                {op.parcelamento ? `${op.parcelamento}x` : 'Não informado'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Detalhamento de Tarifas e Custos (Ex-Info Voo) */}
                                    <div className="mt-6 pt-6 border-t border-green-200">
                                        <h5 className="text-sm font-bold text-green-800 mb-4 flex items-center gap-2">
                                            <Info className="w-4 h-4" />
                                            Detalhamento de Tarifas e Custos
                                        </h5>
                                        
                                        {/* Agrega dados de todos os voos se houver mais de um, ou pega do primeiro */}
                                        {totals && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                                    {/* Milhas ou Custo Base (dependendo do tipo tarifário) */}
                                                    {totals.tipotarifario !== 'C' ? (
                                                        <div>
                                                            <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Milhas (Qtd)</div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Adulto:</span>
                                                                    <span className="font-bold text-green-900">{totals.Adulto || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Criança:</span>
                                                                    <span className="font-bold text-green-900">{totals.Crianca || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Bebê:</span>
                                                                    <span className="font-bold text-green-900">{totals.Bebe || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Custo Base (Consolidadora)</div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Adulto:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.Adulto || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Criança:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.Crianca || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Bebê:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.Bebe || 0)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Custo Milhas (Oculto se for tipo C, ou mantido como custo secundário?) */}
                                                    {totals.tipotarifario !== 'C' && (
                                                        <div>
                                                            <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Custo Milhas + Taxas</div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Adulto:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.AdultoR || 0) > 0 ? (totals.AdultoR + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Criança:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.CriancaR || 0) > 0 ? (totals.CriancaR + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Bebê:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.BebeR || 0) > 0 ? (totals.BebeR + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Concorrente */}
                                                    <div>
                                                        <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Concorrente + Taxas</div>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Adulto:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.AdultoC || 0) > 0 ? (totals.AdultoC + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Criança:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.CriancaC || 0) > 0 ? (totals.CriancaC + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Bebê:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.BebeC || 0) > 0 ? (totals.BebeC + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Tarifa NET */}
                                                    <div>
                                                        <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Tarifa NET + Taxas</div>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Adulto:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.AdultoF || 0) > 0 ? (totals.AdultoF + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Criança:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.CriancaF || 0) > 0 ? (totals.CriancaF + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Bebê:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totals.BebeF || 0) > 0 ? (totals.BebeF + (totals.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-green-200/60">
                                                    <div>
                                                        <div className="text-green-700 font-bold mb-1 text-xs uppercase">Lucro Estimado</div>
                                                        <div className="text-lg font-bold text-green-800">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                                totals.tipotarifario === 'C'
                                                                    ? ((totals.AdultoF || 0) - (totals.AdultoC || 0))
                                                                    : ((totals.AdultoF || 0) - (totals.AdultoR || 0))
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-green-700 font-bold mb-1 text-xs uppercase">Economia Gerada</div>
                                                        <div className="text-lg font-bold text-green-800">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                                ((totals.AdultoC || 0) - (totals.AdultoF || 0))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {op.detalhes_pagamento && (
                                        <div className="mt-4 pt-4 border-t border-green-200">
                                            <span className="block text-xs text-green-800 opacity-70 mb-1">Detalhes do Pagamento</span>
                                            
                                            <div className="flex flex-wrap items-center gap-4 mb-2">
                                                {op.detalhes_pagamento?.taxa_du && (
                                                    <div>
                                                        <span className="text-xs font-semibold text-green-900 bg-white/50 px-2 py-1 rounded border border-green-100">
                                                            DU (Agência): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.detalhes_pagamento.taxa_du)}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {op.detalhes_pagamento?.valor_sem_juros && (
                                                     <div>
                                                        <span className="text-xs font-semibold text-green-900 bg-white/50 px-2 py-1 rounded border border-green-100">
                                                            Valor sem Juros: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.detalhes_pagamento.valor_sem_juros)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Removido JSON bruto */}
                                        </div>
                                    )}
                                </div>
                            </section>
                            </>
                          )}

                          {/* Conteúdo da Aba EMISSION (Apenas EM_EMISSAO) */}
                          {op.status === 'EM_EMISSAO' && activeTab === 'EMISSION' && (
                              <div className="space-y-8">
                                  {/* Dados de Emissão */}
                                  <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                      <div className="flex items-center justify-between mb-6">
                                          <h4 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                                              <Plane className="w-5 h-5 text-blue-600" />
                                              Dados de Emissão
                                          </h4>
                                          
                                          <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                              <input 
                                                  type="checkbox" 
                                                  checked={sameLoc} 
                                                  onChange={(e) => setSameLoc(e.target.checked)}
                                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                              />
                                              <span className="text-sm font-medium text-blue-800">Mesmo LOC/NCOMPRA para todos</span>
                                          </label>
                                      </div>

                                      {sameLoc ? (
                                          <div className="space-y-6">
                                              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800 mb-4">
                                                  <strong>Passageiros:</strong> {details.passengers.map(p => p.clientes?.nome).join(', ')}
                                              </div>
                                              
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                  {directions.map(dir => (
                                                      <div key={dir} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                          <h5 className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">{dir}</h5>
                                                          <div className="space-y-3">
                                                              <div>
                                                                  <label className="block text-xs font-bold text-gray-700 mb-1">Localizador / Nº Compra</label>
                                                                  <input 
                                                                      type="text"
                                                                      value={emissionData[`GLOBAL-${dir}`]?.loc || ''}
                                                                      onChange={(e) => handleEmissionChange(`GLOBAL-${dir}`, 'loc', e.target.value)}
                                                                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase text-gray-900 bg-white"
                                                                      placeholder="Ex: ABC1234 ou 123456789"
                                                                  />
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="space-y-6">
                                              {details.passengers.map((p, idx) => (
                                                  <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-3">
                                                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                                              {p.clientes?.nome?.charAt(0) || 'P'}
                                                          </div>
                                                          <span className="font-bold text-gray-800">{p.clientes?.nome}</span>
                                                      </div>
                                                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                          {directions.map(dir => (
                                                              <div key={dir} className="bg-white p-3 rounded border border-gray-100 shadow-sm">
                                                                  <h5 className="font-bold text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
                                                                      <Plane className="w-3 h-3" /> {dir}
                                                                  </h5>
                                                                  <div>
                                                                      <label className="block text-[10px] font-bold text-gray-700 mb-1">LOC / Nº COMPRA</label>
                                                                      <input 
                                                                          type="text"
                                                                          value={emissionData[`${p.id}-${dir}`]?.loc || ''}
                                                                          onChange={(e) => handleEmissionChange(`${p.id}-${dir}`, 'loc', e.target.value)}
                                                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 uppercase text-gray-900 bg-white"
                                                                      />
                                                                  </div>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </section>

                                  {/* Financeiro */}
                                  <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                                          <DollarSign className="w-5 h-5 text-green-600" />
                                          Financeiro
                                      </h4>
                                      
                                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 text-sm text-yellow-800 flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                        <p>Estes valores gerarão automaticamente as contas a pagar e receber no sistema financeiro.</p>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {/* Coluna Agência */}
                                          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 h-full">
                                              <h5 className="font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2 flex items-center gap-2">
                                                  <User className="w-4 h-4" /> Agência
                                              </h5>
                                              <div className="space-y-4">
                                                  <div>
                                                      <label className="block text-xs font-bold text-blue-900 mb-1">Tarifa NET Agência</label>
                                                      <input 
                                                          type="text" 
                                                          className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-gray-900 font-medium" 
                                                          value={financeiroData.tarifaNet}
                                                          onChange={(e) => handleFinanceiroChange('tarifaNet', e.target.value)}
                                                      />
                                                      <p className="text-[10px] text-blue-700 mt-1">*Total - DU - Taxa Link</p>
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-blue-900 mb-1">DU</label>
                                                      <input 
                                                          type="text" 
                                                          className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-gray-900 font-medium" 
                                                          value={financeiroData.du}
                                                          onChange={(e) => handleFinanceiroChange('du', e.target.value)}
                                                      />
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-blue-900 mb-1">Taxa Link (Juros)</label>
                                                      <input 
                                                          type="text" 
                                                          className="w-full px-3 py-2 bg-white border border-blue-300 rounded-md text-gray-900 font-medium" 
                                                          value={financeiroData.taxaLink}
                                                          onChange={(e) => handleFinanceiroChange('taxaLink', e.target.value)}
                                                      />
                                                  </div>
                                              </div>
                                          </div>

                                          {/* Coluna 7C */}
                                          <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 h-full">
                                              <h5 className="font-bold text-green-800 mb-4 border-b border-green-200 pb-2 flex items-center gap-2">
                                                  <Building className="w-4 h-4" /> 7C
                                              </h5>
                                              <div className="space-y-4">
                                                  <div>
                                                      <label className="block text-xs font-bold text-green-900 mb-1">Faturamento</label>
                                                      <input 
                                                          type="text" 
                                                          className="w-full px-3 py-2 bg-white border border-green-300 rounded-md text-gray-900 font-medium" 
                                                          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.valor || 0)}
                                                          readOnly
                                                      />
                                                      <p className="text-[10px] text-green-700 mt-1">*Tarifa NET + Taxa Link + DU</p>
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-green-900 mb-1">Milhas (Total)</label>
                                                      <input 
                                                          type="text" 
                                                          className="w-full px-3 py-2 bg-white border border-green-300 rounded-md text-gray-900 font-medium" 
                                                          value={financeiroData.milhas}
                                                          onChange={(e) => handleFinanceiroChange('milhas', e.target.value)}
                                                      />
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2">
                                                      <div>
                                                          <label className="block text-xs font-bold text-green-900 mb-1">Custo Calc.</label>
                                                          <input 
                                                              type="text" 
                                                              className="w-full px-3 py-2 bg-gray-50 border border-green-200 rounded-md text-gray-500 font-medium text-xs" 
                                                              value={financeiroData.custo}
                                                              readOnly
                                                          />
                                                      </div>
                                                      <div>
                                                          <label className="block text-xs font-bold text-green-900 mb-1">Custo Real</label>
                                                          <input 
                                                              type="text" 
                                                              className="w-full px-3 py-2 bg-white border border-green-300 rounded-md text-gray-900 font-medium" 
                                                              defaultValue={financeiroData.custo}
                                                              // Em um cenário real, deveria ter um state separado para custoReal, 
                                                              // mas aqui vamos usar o defaultValue por enquanto ou o próprio custo editável
                                                              onChange={(e) => handleFinanceiroChange('custo', e.target.value)}
                                                          />
                                                      </div>
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-green-900 mb-1">Taxa de Embarque</label>
                                                      <input 
                                                          type="text" 
                                                          className="w-full px-3 py-2 bg-white border border-green-300 rounded-md text-gray-900 font-medium" 
                                                          value={financeiroData.taxaEmbarque}
                                                          readOnly
                                                      />
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-green-900 mb-1">Taxa Link</label>
                                                      <input 
                                                          type="text" 
                                                          className="w-full px-3 py-2 bg-white border border-green-300 rounded-md text-gray-900 font-medium" 
                                                          value={financeiroData.taxaLink}
                                                          readOnly
                                                      />
                                                  </div>
                                                  <div>
                                                      <label className="block text-xs font-bold text-green-900 mb-1">Lucro</label>
                                                      <div className="relative">
                                                          <input 
                                                              type="text" 
                                                              className="w-full px-3 py-2 bg-green-100 border border-green-300 rounded-md font-bold text-green-900 text-lg" 
                                                              value={financeiroData.lucro}
                                                              onChange={(e) => handleFinanceiroChange('lucro', e.target.value)}
                                                          />
                                                      </div>
                                                      <p className="text-[10px] text-green-700 mt-1">*Faturamento - Taxa Link - Custo Real - Taxa Embarque - DU</p>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </section>
                                  
                                  <div className="flex justify-end pt-4">
                                      <button 
                                          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                          onClick={handleConfirmarEmissao}
                                          disabled={isSavingLink}
                                      >
                                          {isSavingLink ? 'Processando...' : 'Confirmar Emissão e Gerar Lançamentos'}
                                      </button>
                                  </div>
                              </div>
                          )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
