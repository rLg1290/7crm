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
  Briefcase
} from 'lucide-react'

// Status mapping
const OP_STATUSES = [
  { id: 'OP_GERADA', label: 'Novas OPs', color: 'bg-blue-50 border-blue-200 text-blue-700' },
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
        .in('status', ['OP_GERADA', 'PAGAMENTO_CONFIRMADO', 'EM_EMISSAO', 'EMITIDO', 'EMITIDO7C', 'CANCELADO'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setOps(data || [])
    } catch (error) {
      console.error('Erro ao buscar OPs:', error)
    } finally {
      // setLoading(false)
    }
  }

  const handleStatusChange = async (opId: number, newStatus: string) => {
    try {
      let updateData: any = { status: newStatus }

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
      setOps(prev => prev.map(op => op.id === opId ? { ...op, status: newStatus, ...(updateData.responsavel_emissao ? { responsavel_emissao: updateData.responsavel_emissao } : {}) } : op))
      
      if (selectedOp && selectedOp.id === opId) {
        setSelectedOp((prev: any) => ({ ...prev, status: newStatus, ...(updateData.responsavel_emissao ? { responsavel_emissao: updateData.responsavel_emissao } : {}) }))
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

function OpDetailsModal({ op, onClose, onStatusChange }: { op: any, onClose: () => void, onStatusChange: (id: number, status: string) => void }) {
    const [details, setDetails] = useState<{ flights: any[], passengers: any[] }>({ flights: [], passengers: [] })
    const [loading, setLoading] = useState(true)

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

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            OP #{op.codigo || op.id}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                op.status === 'OP_GERADA' ? 'bg-blue-100 text-blue-700' :
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

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Ações de Status */}
                    <div className="flex gap-2 justify-end border-b border-gray-100 pb-4">
                        {op.status === 'OP_GERADA' && (
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
                        {op.status === 'EM_EMISSAO' && (
                            <button 
                                onClick={() => onStatusChange(op.id, 'EMITIDO7C')}
                                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium shadow-sm"
                            >
                                Finalizar (Emitido)
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center py-10"><Clock className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>
                    ) : (
                        <>
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

                                    {/* Detalhamento de Custos e Tarifas (Ex-Info Voo) */}
                                    <div className="mt-6 pt-6 border-t border-green-200">
                                        <h5 className="text-sm font-bold text-green-800 mb-4 flex items-center gap-2">
                                            <Info className="w-4 h-4" />
                                            Detalhamento de Tarifas e Custos
                                        </h5>
                                        
                                        {/* Agrega dados de todos os voos se houver mais de um, ou pega do primeiro */}
                                        {details.flights.length > 0 && details.flights[0].dados_voo && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                                    {/* Milhas ou Custo Base (dependendo do tipo tarifário) */}
                                                    {details.flights[0].dados_voo.tipotarifario !== 'C' ? (
                                                        <div>
                                                            <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Milhas (Qtd)</div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Adulto:</span>
                                                                    <span className="font-bold text-green-900">{details.flights[0].dados_voo.Adulto || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Criança:</span>
                                                                    <span className="font-bold text-green-900">{details.flights[0].dados_voo.Crianca || 0}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Bebê:</span>
                                                                    <span className="font-bold text-green-900">{details.flights[0].dados_voo.Bebe || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Custo Base (Consolidadora)</div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Adulto:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.flights[0].dados_voo.Adulto || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Criança:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.flights[0].dados_voo.Crianca || 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Bebê:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(details.flights[0].dados_voo.Bebe || 0)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Custo Milhas (Oculto se for tipo C, ou mantido como custo secundário?) */}
                                                    {details.flights[0].dados_voo.tipotarifario !== 'C' && (
                                                        <div>
                                                            <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Custo Milhas + Taxas</div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Adulto:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.AdultoR || 0) > 0 ? (details.flights[0].dados_voo.AdultoR + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Criança:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.CriancaR || 0) > 0 ? (details.flights[0].dados_voo.CriancaR + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-green-800/70">Bebê:</span>
                                                                    <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.BebeR || 0) > 0 ? (details.flights[0].dados_voo.BebeR + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
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
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.AdultoC || 0) > 0 ? (details.flights[0].dados_voo.AdultoC + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Criança:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.CriancaC || 0) > 0 ? (details.flights[0].dados_voo.CriancaC + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Bebê:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.BebeC || 0) > 0 ? (details.flights[0].dados_voo.BebeC + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Tarifa NET */}
                                                    <div>
                                                        <div className="text-green-700 font-bold mb-2 text-xs uppercase tracking-wide">Tarifa NET + Taxas</div>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Adulto:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.AdultoF || 0) > 0 ? (details.flights[0].dados_voo.AdultoF + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Criança:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.CriancaF || 0) > 0 ? (details.flights[0].dados_voo.CriancaF + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-green-800/70">Bebê:</span>
                                                                <span className="font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((details.flights[0].dados_voo.BebeF || 0) > 0 ? (details.flights[0].dados_voo.BebeF + (details.flights[0].dados_voo.TaxaEmbarque || 0)) : 0)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-8 pt-4 border-t border-green-200/60">
                                                    <div>
                                                        <div className="text-green-700 font-bold mb-1 text-xs uppercase">Lucro Estimado</div>
                                                        <div className="text-lg font-bold text-green-800">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                                details.flights[0].dados_voo.tipotarifario === 'C'
                                                                    ? ((details.flights[0].dados_voo.AdultoF || 0) - (details.flights[0].dados_voo.AdultoC || 0))
                                                                    : ((details.flights[0].dados_voo.AdultoF || 0) - (details.flights[0].dados_voo.AdultoR || 0))
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-green-700 font-bold mb-1 text-xs uppercase">Economia Gerada</div>
                                                        <div className="text-lg font-bold text-green-800">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                                ((details.flights[0].dados_voo.AdultoC || 0) - (details.flights[0].dados_voo.AdultoF || 0))
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
                </div>
            </div>
        </div>
    )
}
