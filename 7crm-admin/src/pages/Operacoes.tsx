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
  Receipt,
  Pencil,
  Save,
  Trash2,
  Mail,
  Phone,
  RotateCcw,
} from 'lucide-react'

// Status mapping
const OP_STATUSES = [
  { id: 'OP_GERADA', label: 'Novas OPs', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'LINK_GERADO', label: 'Link Gerado', color: 'bg-purple-50 border-purple-200 text-purple-700' },
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

  // Função para tocar som de notificação (Beep sintético)
  const playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Configuração do som (ding agradável)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error('Erro ao tocar som:', e);
    }
  }

  useEffect(() => {
    fetchOps()
    
    // Configurar refresh automático a cada 1 minuto
    const intervalId = setInterval(() => {
        fetchOps()
    }, 60000)

    // Solicitar permissão para notificações
    if (Notification.permission === 'default') {
        Notification.requestPermission()
    }

    return () => clearInterval(intervalId)
  }, [])

  const fetchOps = async () => {
    try {
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

      // Verificar novas OPs para notificação
      if (data && ops.length > 0) {
        const currentIds = new Set(ops.map(o => o.id))
        const newOps = data.filter(o => !currentIds.has(o.id))
        
        if (newOps.length > 0) {
            // Tocar som sintético
            playNotificationSound()

            // Mostrar notificação desktop
            if (Notification.permission === 'granted') {
                newOps.forEach(op => {
                    new Notification('Nova OP Recebida', {
                        body: `OP #${op.codigo || op.id} - ${op.empresas?.nome || 'Agência'}`,
                        icon: '/vite.svg'
                    })
                })
            }
        }
      }

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
      setOps(prev => prev.map(op => op.id === opId ? { ...op, ...updateData } : op))
      
      if (selectedOp && selectedOp.id === opId) {
        setSelectedOp((prev: any) => ({ ...prev, ...updateData }))
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
    const [activeTab, setActiveTab] = useState<'voos' | 'passageiros' | 'financeiro'>('voos')
    const [details, setDetails] = useState<{ flights: any[], passengers: any[], contasPagar: any[], contasReceber: any[] }>({ flights: [], passengers: [], contasPagar: [], contasReceber: [] })
    const [loading, setLoading] = useState(true)
    const [editingConta, setEditingConta] = useState<{id: string, type: 'pagar' | 'receber', data: any} | null>(null)
    
    // Estados para o Modal de Link
    const [showLinkModal, setShowLinkModal] = useState(false)
    const [linkPagamento, setLinkPagamento] = useState('')
    const [salvandoLink, setSalvandoLink] = useState(false)

    // Estados para o Modal de Finalização
    const [showFinalizeModal, setShowFinalizeModal] = useState(false)

    const fetchDetails = async () => {
        setLoading(true)
        try {
            const [flightsRes, passengersRes, contasPagarRes, contasReceberRes] = await Promise.all([
                supabase.from('voos').select('*').eq('cotacao_id', op.id),
                supabase.from('cotacao_passageiros').select('*, clientes(*)').eq('cotacao_id', op.id),
                supabase.from('contas_pagar').select('*').eq('origem_id', String(op.id)).eq('origem', 'COTACAO'),
                supabase.from('contas_receber').select('*').eq('origem_id', String(op.id)).eq('origem', 'COTACAO')
            ])
            
            setDetails({
                flights: flightsRes.data || [],
                passengers: passengersRes.data || [],
                contasPagar: contasPagarRes.data || [],
                contasReceber: contasReceberRes.data || []
            })
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDetails()
    }, [op.id])

    const handleUpdateConta = async (type: 'pagar' | 'receber') => {
        if (!editingConta) return
        
        try {
            const table = type === 'pagar' ? 'contas_pagar' : 'contas_receber'
            const { error } = await supabase
                .from(table)
                .update(editingConta.data)
                .eq('id', editingConta.id)

            if (error) throw error
            
            await fetchDetails()
            setEditingConta(null)
            alert('Conta atualizada com sucesso!')
        } catch (error: any) {
            console.error('Erro ao atualizar conta:', error)
            alert('Erro ao atualizar conta: ' + error.message)
        }
    }

    const handleDeleteConta = async (id: string, type: 'pagar' | 'receber') => {
        if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return

        try {
            const table = type === 'pagar' ? 'contas_pagar' : 'contas_receber'
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id)

            if (error) throw error
            
            await fetchDetails()
            alert('Conta excluída com sucesso!')
        } catch (error: any) {
            console.error('Erro ao excluir conta:', error)
            alert('Erro ao excluir conta: ' + error.message)
        }
    }

    const handleSalvarLink = async () => {
        if (!linkPagamento) {
            alert('Por favor, informe o link de pagamento.')
            return
        }
        
        setSalvandoLink(true)
        try {
            await onStatusChange(op.id, 'LINK_GERADO', { link_pagamento: linkPagamento })
            setShowLinkModal(false)
            setLinkPagamento('')
        } catch (error) {
            console.error('Erro ao salvar link:', error)
            alert('Erro ao salvar link')
        } finally {
            setSalvandoLink(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
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

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6 bg-white sticky top-0 z-10">
                    <button
                        onClick={() => setActiveTab('voos')}
                        className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'voos' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Plane className="w-4 h-4" />
                        Voos
                    </button>
                    <button
                        onClick={() => setActiveTab('passageiros')}
                        className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'passageiros' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Passageiros
                    </button>
                    <button
                        onClick={() => setActiveTab('financeiro')}
                        className={`py-4 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                            activeTab === 'financeiro' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <Receipt className="w-4 h-4" />
                        Financeiro
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
                    {/* Ações de Status */}
                    <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 mb-4">
                        <div className="flex gap-2 justify-end">
                            {/* Voltar Status (Undo) */}
                            {op.status === 'LINK_GERADO' && (
                                <button 
                                    onClick={() => {
                                        if (window.confirm('Tem certeza que deseja voltar para OP Gerada? O link será descartado.')) {
                                            onStatusChange(op.id, 'OP_GERADA', { link_pagamento: null })
                                        }
                                    }}
                                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium shadow-sm flex items-center gap-2 mr-auto"
                                    title="Voltar para OP Gerada"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span className="hidden sm:inline">Voltar</span>
                                </button>
                            )}
                            
                            {op.status === 'PAGAMENTO_CONFIRMADO' && (
                                <button 
                                    onClick={() => {
                                        const target = op.forma_pagamento === 'cartao' ? 'LINK_GERADO' : 'OP_GERADA';
                                        if (window.confirm(`Tem certeza que deseja voltar para ${target === 'LINK_GERADO' ? 'Link Gerado' : 'OP Gerada'}?`)) {
                                            onStatusChange(op.id, target)
                                        }
                                    }}
                                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium shadow-sm flex items-center gap-2 mr-auto"
                                    title="Voltar status"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span className="hidden sm:inline">Voltar</span>
                                </button>
                            )}

                            {op.status === 'EM_EMISSAO' && (
                                <button 
                                    onClick={() => {
                                        if (window.confirm('Tem certeza que deseja voltar para Pagamento Confirmado?')) {
                                            onStatusChange(op.id, 'PAGAMENTO_CONFIRMADO', { responsavel_emissao: null })
                                        }
                                    }}
                                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium shadow-sm flex items-center gap-2 mr-auto"
                                    title="Voltar para Pagamento Confirmado"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span className="hidden sm:inline">Voltar</span>
                                </button>
                            )}

                            {['EMITIDO', 'EMITIDO7C'].includes(op.status) && (
                                <button 
                                    onClick={() => {
                                        if (window.confirm('Tem certeza que deseja reabrir esta emissão?')) {
                                            onStatusChange(op.id, 'EM_EMISSAO')
                                        }
                                    }}
                                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium shadow-sm flex items-center gap-2 mr-auto"
                                    title="Voltar para Em Emissão"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span className="hidden sm:inline">Reabrir</span>
                                </button>
                            )}

                            {/* Avançar Status (Ações Normais) */}
                            {op.status === 'OP_GERADA' && (
                                <>
                                    {/* Se for Cartão, exige gerar link */}
                                    {(op.forma_pagamento === 'cartao' || op.formas_pagamento?.nome?.toLowerCase().includes('cartão') || op.formas_pagamento?.nome?.toLowerCase().includes('cartao')) ? (
                                        <button 
                                            onClick={() => setShowLinkModal(true)}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium shadow-sm flex items-center gap-2"
                                        >
                                            <CreditCard className="w-4 h-4" />
                                            Gerar Link (Cartão)
                                        </button>
                                    ) : (
                                        /* Se for PIX ou outro, permite confirmar direto */
                                        <button 
                                            onClick={() => onStatusChange(op.id, 'PAGAMENTO_CONFIRMADO')}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-2"
                                        >
                                            <DollarSign className="w-4 h-4" />
                                            Confirmar Pagamento
                                        </button>
                                    )}
                                </>
                            )}
                            {op.status === 'LINK_GERADO' && (
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
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Opening Finalize Modal');
                                        setShowFinalizeModal(true);
                                    }}
                                    className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium shadow-sm relative z-10"
                                >
                                    Finalizar (Emitido)
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10"><Clock className="w-8 h-8 animate-spin mx-auto text-gray-400"/></div>
                    ) : (
                        <>
                            {activeTab === 'voos' && (
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
                            )}

                            {activeTab === 'passageiros' && (
                                <section>
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-600" />
                                        Passageiros
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {details.passengers.map((p, idx) => {
                                            const nome = p.nome || p.clientes?.nome || 'Nome não encontrado'
                                            const cpf = p.cpf || p.clientes?.cpf
                                            const dataNascimento = p.data_nascimento || p.clientes?.data_nascimento
                                            const email = p.email || p.clientes?.email

                                            return (
                                                <div key={idx} className="border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                        {nome?.charAt(0) || 'P'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{nome}</div>
                                                        <div className="text-sm text-gray-600">CPF: {cpf}</div>
                                                        <div className="text-sm text-gray-600">
                                                            Nasc: {dataNascimento ? dataNascimento.split('T')[0].split('-').reverse().join('/') : 'N/D'}
                                                        </div>
                                                        <div className="text-sm text-gray-600">Email: {email}</div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            )}

                            {activeTab === 'financeiro' && (
                                <div className="space-y-8">
                                    {op.detalhes_pagamento && (op.detalhes_pagamento.nome || op.detalhes_pagamento.email) && (
                                        <section>
                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <CreditCard className="w-5 h-5 text-purple-600" />
                                                Dados do Pagador (Link/Cartão)
                                            </h4>
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <span className="block text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Titular</span>
                                                        <div className="text-gray-900 font-medium">{op.detalhes_pagamento.nome || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Parcelamento</span>
                                                        <div className="text-gray-900 font-medium">
                                                            {op.detalhes_pagamento.parcelas}x 
                                                            {op.detalhes_pagamento.valor_com_juros ? ` (Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.detalhes_pagamento.valor_com_juros)})` : ''}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Email</span>
                                                        <div className="text-gray-900">{op.detalhes_pagamento.email || '-'}</div>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Telefone</span>
                                                        <div className="text-gray-900">{op.detalhes_pagamento.telefone || '-'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* Financeiro / Pagamento Existente */}
                                    <section>
                                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-blue-600" />
                                            Resumo da Emissão
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
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* Contas Geradas (Agência) */}
                                    <section>
                                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <Receipt className="w-5 h-5 text-blue-600" />
                                            Financeiro Agência
                                        </h4>
                                        
                                        {/* Contas a Receber (Agência) */}
                                        <div className="mb-6">
                                            <h5 className="font-semibold text-gray-700 mb-2 pl-1">Contas a Receber (Agência)</h5>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {details.contasReceber.filter(c => c.cliente_id != 3).length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                                    Nenhuma conta a receber da agência.
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {details.contasReceber.filter(c => c.cliente_id != 3).map((conta) => {
                                                            const isEditing = editingConta?.id === conta.id && editingConta?.type === 'receber'
                                                            
                                                            return (
                                                                <tr key={conta.id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input 
                                                                                type="text" 
                                                                                className="border rounded px-2 py-1 w-full" 
                                                                                value={editingConta.data.descricao}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, descricao: e.target.value}})}
                                                                            />
                                                                        ) : conta.descricao}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input 
                                                                                type="number" 
                                                                                step="0.01"
                                                                                className="border rounded px-2 py-1 w-24" 
                                                                                value={editingConta.data.valor}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, valor: parseFloat(e.target.value)}})}
                                                                            />
                                                                        ) : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input 
                                                                                type="date" 
                                                                                className="border rounded px-2 py-1" 
                                                                                value={editingConta.data.vencimento}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, vencimento: e.target.value}})}
                                                                            />
                                                                        ) : new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        {isEditing ? (
                                                                            <select 
                                                                                className="border rounded px-2 py-1"
                                                                                value={editingConta.data.status?.toUpperCase()}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, status: e.target.value}})}
                                                                            >
                                                                                <option value="PENDENTE">Pendente</option>
                                                                                <option value="RECEBIDA">Recebida</option>
                                                                                <option value="VENCIDA">Vencida</option>
                                                                            </select>
                                                                        ) : (
                                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                                conta.status?.toUpperCase() === 'RECEBIDA' ? 'bg-green-100 text-green-800' : 
                                                                                conta.status?.toUpperCase() === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                                {conta.status}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        {isEditing ? (
                                                                            <div className="flex justify-end gap-2">
                                                                                <button onClick={() => handleUpdateConta('receber')} className="text-green-600 hover:text-green-900">
                                                                                    <Save className="w-4 h-4" />
                                                                                </button>
                                                                                <button onClick={() => setEditingConta(null)} className="text-gray-600 hover:text-gray-900">
                                                                                    <XCircle className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex justify-end gap-2">
                                                                                <button 
                                                                                    onClick={() => setEditingConta({id: conta.id, type: 'receber', data: {...conta}})}
                                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                                >
                                                                                    <Pencil className="w-4 h-4" />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleDeleteConta(conta.id, 'receber')}
                                                                                    className="text-red-600 hover:text-red-900"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Contas a Pagar (Agência) */}
                                        <div>
                                            <h5 className="font-semibold text-gray-700 mb-2 pl-1">Contas a Pagar (Agência)</h5>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {details.contasPagar.filter(c => c.fornecedor_id != 3).length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                                    Nenhuma conta a pagar vinculada.
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {details.contasPagar.filter(c => c.fornecedor_id != 3).map((conta) => {
                                                            const isEditing = editingConta?.id === conta.id && editingConta?.type === 'pagar'
                                                            
                                                            return (
                                                                <tr key={conta.id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                         {isEditing ? (
                                                                            <input 
                                                                                type="text" 
                                                                                className="border rounded px-2 py-1 w-full" 
                                                                                value={editingConta.data.observacoes || ''}
                                                                                placeholder="Observações"
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, observacoes: e.target.value}})}
                                                                            />
                                                                        ) : (conta.observacoes || 'Conta a Pagar')}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input 
                                                                                type="number" 
                                                                                step="0.01"
                                                                                className="border rounded px-2 py-1 w-24" 
                                                                                value={editingConta.data.valor}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, valor: parseFloat(e.target.value)}})}
                                                                            />
                                                                        ) : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input 
                                                                                type="date" 
                                                                                className="border rounded px-2 py-1" 
                                                                                value={conta.vencimento ? conta.vencimento.split('T')[0] : ''} // Ajuste para formato date
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, vencimento: e.target.value}})}
                                                                            />
                                                                        ) : new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        {isEditing ? (
                                                                            <select 
                                                                                className="border rounded px-2 py-1"
                                                                                value={editingConta.data.status}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, status: e.target.value}})}
                                                                            >
                                                                                <option value="PENDENTE">Pendente</option>
                                                                                <option value="PAGO">Pago</option>
                                                                                <option value="VENCIDA">Vencida</option>
                                                                            </select>
                                                                        ) : (
                                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                                conta.status === 'PAGO' ? 'bg-green-100 text-green-800' : 
                                                                                conta.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                                {conta.status}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        {isEditing ? (
                                                                            <div className="flex justify-end gap-2">
                                                                                <button onClick={() => handleUpdateConta('pagar')} className="text-green-600 hover:text-green-900">
                                                                                    <Save className="w-4 h-4" />
                                                                                </button>
                                                                                <button onClick={() => setEditingConta(null)} className="text-gray-600 hover:text-gray-900">
                                                                                    <XCircle className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex justify-end gap-2">
                                                                                <button 
                                                                                    onClick={() => setEditingConta({id: conta.id, type: 'pagar', data: {...conta}})}
                                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                                >
                                                                                    <Pencil className="w-4 h-4" />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleDeleteConta(conta.id, 'pagar')}
                                                                                    className="text-red-600 hover:text-red-900"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Financeiro 7C */}
                                    <section className="pt-8 border-t border-gray-200">
                                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <Building className="w-5 h-5 text-purple-600" />
                                            Financeiro 7C
                                        </h4>
                                        
                                        {/* Contas a Receber (7C) - (Vem das Contas a Pagar da Agência onde fornecedor = 7C) */}
                                        <div className="mb-6">
                                            <h5 className="font-semibold text-gray-700 mb-2 pl-1">Contas a Receber (7C)</h5>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status (Agência)</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {details.contasPagar.filter(c => c.fornecedor_id == 3).length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                                    Nenhuma conta a receber para 7C (origem contas a pagar agência).
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {details.contasPagar.filter(c => c.fornecedor_id == 3).map((conta) => {
                                                            const isEditing = editingConta?.id === conta.id && editingConta?.type === 'pagar'
                                                            return (
                                                                <tr key={`7c-rec-${conta.id}`}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="text"
                                                                                className="border rounded px-2 py-1 w-full"
                                                                                value={editingConta.data.observacoes || ''}
                                                                                placeholder="Observações"
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, observacoes: e.target.value}})}
                                                                            />
                                                                        ) : (conta.observacoes || conta.descricao || 'Conta a Receber (7C)')}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                         {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                className="border rounded px-2 py-1 w-24"
                                                                                value={editingConta.data.valor}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, valor: parseFloat(e.target.value)}})}
                                                                            />
                                                                        ) : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="date"
                                                                                className="border rounded px-2 py-1"
                                                                                value={conta.vencimento ? conta.vencimento.split('T')[0] : ''}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, vencimento: e.target.value}})}
                                                                            />
                                                                        ) : new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        {isEditing ? (
                                                                            <select
                                                                                className="border rounded px-2 py-1"
                                                                                value={editingConta.data.status}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, status: e.target.value}})}
                                                                            >
                                                                                <option value="PENDENTE">Pendente</option>
                                                                                <option value="PAGO">Recebido (Pago pela Agência)</option>
                                                                                <option value="VENCIDA">Vencida</option>
                                                                            </select>
                                                                        ) : (
                                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                                conta.status === 'PAGO' ? 'bg-green-100 text-green-800' :
                                                                                conta.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                                {conta.status === 'PAGO' ? 'RECEBIDO' : conta.status}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        {isEditing ? (
                                                                            <div className="flex justify-end gap-2">
                                                                                <button onClick={() => handleUpdateConta('pagar')} className="text-green-600 hover:text-green-900">
                                                                                    <Save className="w-4 h-4" />
                                                                                </button>
                                                                                <button onClick={() => setEditingConta(null)} className="text-gray-600 hover:text-gray-900">
                                                                                    <XCircle className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => setEditingConta({id: conta.id, type: 'pagar', data: {...conta}})}
                                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                                >
                                                                                    <Pencil className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteConta(conta.id, 'pagar')}
                                                                                    className="text-red-600 hover:text-red-900"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Contas a Pagar (7C) - (Vem das Contas a Receber da Agência onde cliente = 7C) */}
                                        <div>
                                            <h5 className="font-semibold text-gray-700 mb-2 pl-1">Contas a Pagar (7C)</h5>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status (Agência)</th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {details.contasReceber.filter(c => c.cliente_id == 3).length === 0 && (
                                                            <tr>
                                                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                                    Nenhuma conta a pagar da 7C (origem contas a receber agência).
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {details.contasReceber.filter(c => c.cliente_id == 3).map((conta) => {
                                                            const isEditing = editingConta?.id === conta.id && editingConta?.type === 'receber'
                                                            return (
                                                                <tr key={`7c-pag-${conta.id}`}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                         {isEditing ? (
                                                                            <input
                                                                                type="text"
                                                                                className="border rounded px-2 py-1 w-full"
                                                                                value={editingConta.data.descricao}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, descricao: e.target.value}})}
                                                                            />
                                                                        ) : (conta.descricao || 'Conta a Pagar (7C)')}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                className="border rounded px-2 py-1 w-24"
                                                                                value={editingConta.data.valor}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, valor: parseFloat(e.target.value)}})}
                                                                            />
                                                                        ) : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="date"
                                                                                className="border rounded px-2 py-1"
                                                                                value={editingConta.data.vencimento}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, vencimento: e.target.value}})}
                                                                            />
                                                                        ) : new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                                        {isEditing ? (
                                                                            <select
                                                                                className="border rounded px-2 py-1"
                                                                                value={editingConta.data.status?.toUpperCase()}
                                                                                onChange={(e) => setEditingConta({...editingConta, data: {...editingConta.data, status: e.target.value}})}
                                                                            >
                                                                                <option value="PENDENTE">Pendente</option>
                                                                                <option value="RECEBIDA">Pago (Recebida pela Agência)</option>
                                                                                <option value="VENCIDA">Vencida</option>
                                                                            </select>
                                                                        ) : (
                                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                                conta.status?.toUpperCase() === 'RECEBIDA' ? 'bg-green-100 text-green-800' :
                                                                                conta.status?.toUpperCase() === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                                            }`}>
                                                                                {conta.status?.toUpperCase() === 'RECEBIDA' ? 'PAGO' : conta.status}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                        {isEditing ? (
                                                                            <div className="flex justify-end gap-2">
                                                                                <button onClick={() => handleUpdateConta('receber')} className="text-green-600 hover:text-green-900">
                                                                                    <Save className="w-4 h-4" />
                                                                                </button>
                                                                                <button onClick={() => setEditingConta(null)} className="text-gray-600 hover:text-gray-900">
                                                                                    <XCircle className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex justify-end gap-2">
                                                                                <button
                                                                                    onClick={() => setEditingConta({id: conta.id, type: 'receber', data: {...conta}})}
                                                                                    className="text-indigo-600 hover:text-indigo-900"
                                                                                >
                                                                                    <Pencil className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteConta(conta.id, 'receber')}
                                                                                    className="text-red-600 hover:text-red-900"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Gerar Link */}
            {showLinkModal && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                Gerar Link de Pagamento
                            </h3>
                            <button onClick={() => setShowLinkModal(false)} className="text-white/80 hover:text-white transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 space-y-3">
                                <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wide mb-2">Dados do Titular</h4>
                                
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-purple-700 font-semibold">Nome Completo</div>
                                            <div className="text-gray-900 font-medium">{op.detalhes_pagamento?.nome || 'Não informado'}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Mail className="w-4 h-4" /> 
                                        </div>
                                        <div>
                                            <div className="text-xs text-purple-700 font-semibold">E-mail</div>
                                            <div className="text-gray-900 font-medium">{op.detalhes_pagamento?.email || 'Não informado'}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Phone className="w-4 h-4" /> 
                                        </div>
                                        <div>
                                            <div className="text-xs text-purple-700 font-semibold">Telefone</div>
                                            <div className="text-gray-900 font-medium">{op.detalhes_pagamento?.telefone || 'Não informado'}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 border-t border-purple-200 pt-2 mt-1">
                                         <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                            <DollarSign className="w-4 h-4" /> 
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-green-700 font-semibold">Valor Total (c/ juros)</div>
                                            <div className="text-green-900 font-bold text-lg">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.detalhes_pagamento?.valor_com_juros || op.valor || 0)}
                                            </div>
                                            <div className="text-xs text-green-600">
                                                {op.detalhes_pagamento?.parcelas || 1}x no cartão
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 font-semibold">Valor Original (s/ juros)</div>
                                            <div className="text-gray-700 font-bold text-sm">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(op.detalhes_pagamento?.valor_sem_juros || op.valor || 0)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Link de Pagamento Gerado</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                    placeholder="Cole aqui o link gerado (ex: https://pag.ae/...)"
                                    value={linkPagamento}
                                    onChange={(e) => setLinkPagamento(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Este link será enviado automaticamente para a agência/cliente via sistema.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button 
                                    onClick={() => setShowLinkModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                    disabled={salvandoLink}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSalvarLink}
                                    disabled={salvandoLink}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium shadow-md flex items-center gap-2 transition-all disabled:opacity-70"
                                >
                                    {salvandoLink ? (
                                        <>
                                            <Clock className="w-4 h-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Salvar Link e Enviar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Finalização */}
            {showFinalizeModal && (
                <FinalizeEmissionModal 
                    op={op}
                    passengers={details.passengers}
                    onClose={() => setShowFinalizeModal(false)}
                    onConfirm={async (finalData: any) => {
                        // finalData contém locators e custos
                        // Aqui orquestramos o salvamento e mudança de status
                        try {
                            // 1. Atualizar Localizadores
                            for (const p of finalData.passengers) {
                                if (p.localizador || p.bilhete) {
                                    await supabase.from('cotacao_passageiros').update({ localizador: p.localizador, bilhete: p.bilhete }).eq('id', p.id)
                                }
                            }
                            
                            // 2. Inserir Custos Internos (Contas a Pagar da 7C)
                            if (finalData.costs.length > 0) {
                                const { error: errCosts } = await supabase.from('contas_pagar').insert(finalData.costs.map((c: any) => ({
                                    ...c,
                                    origem_id: String(op.id),
                                    origem: 'COTACAO',
                                    status: 'PENDENTE',
                                    empresa_id: 3 // ID da 7C (Custos da 7C)
                                })))
                                if (errCosts) throw errCosts
                            }
                            
                            // 3. Atualizar Status
                            await onStatusChange(op.id, 'EMITIDO7C')
                            
                            setShowFinalizeModal(false)
                            fetchDetails()
                            alert('Emissão finalizada com sucesso!')
                        } catch (e: any) {
                            console.error(e)
                            alert('Erro ao finalizar: ' + e.message)
                        }
                    }}
                />
            )}
        </div>
    )
}

function FinalizeEmissionModal({ op, passengers, onClose, onConfirm }: any) {
    // Usando op para evitar erro de variável não lida, mesmo que seja apenas logando
    useEffect(() => {
        if (op) console.log('Finalizing emission for OP:', op.id)
    }, [op])

    const [step, setStep] = useState(1) // 1: Localizadores, 2: Financeiro
    const [localizadores, setLocalizadores] = useState<any[]>((passengers || []).map((p: any) => ({ ...p, localizador: p.localizador || '', bilhete: p.bilhete || '' })))
    const [globalLoc, setGlobalLoc] = useState('')
    const [custos, setCustos] = useState<any[]>([])
    const [novoCusto, setNovoCusto] = useState({ descricao: '', valor: 0, vencimento: '', fornecedor_id: '' })
    const [fornecedores, setFornecedores] = useState<any[]>([])
    
    useEffect(() => {
        if (passengers && passengers.length > 0) {
             setLocalizadores(passengers.map((p: any) => ({ ...p, localizador: p.localizador || '', bilhete: p.bilhete || '' })))
        }
    }, [passengers])

    useEffect(() => {
        supabase.from('fornecedores').select('id, nome').order('nome').then(({ data }) => setFornecedores(data || []))
    }, [])

    const applyGlobalLoc = () => {
        setLocalizadores(prev => prev.map(p => ({ ...p, localizador: globalLoc })))
    }

    const addCusto = () => {
        if (!novoCusto.descricao || !novoCusto.valor || !novoCusto.vencimento) {
            alert('Preencha os campos obrigatórios')
            return
        }
        setCustos(prev => [...prev, { ...novoCusto, id: Math.random() }]) // Temp ID
        setNovoCusto({ descricao: '', valor: 0, vencimento: '', fornecedor_id: '' })
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                <div className="bg-teal-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Plane className="w-5 h-5" />
                        Finalizar Emissão
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <label className="block text-sm font-bold text-blue-900 mb-2">Localizador Geral (Aplicar a todos)</label>
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 border rounded px-3 py-2 uppercase font-mono"
                                        value={globalLoc}
                                        onChange={e => setGlobalLoc(e.target.value.toUpperCase())}
                                        placeholder="XYZ123"
                                    />
                                    <button 
                                        onClick={applyGlobalLoc}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium text-sm"
                                    >
                                        Aplicar
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-700">Passageiros</h4>
                                {localizadores.map((p, idx) => (
                                    <div key={idx} className="flex gap-4 items-center border-b pb-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{p.nome || p.clientes?.nome}</div>
                                            <div className="text-xs text-gray-500">{p.tipo}</div>
                                        </div>
                                        <div className="w-32">
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">Localizador</label>
                                            <input 
                                                className="w-full border rounded px-2 py-1 uppercase font-mono text-sm"
                                                value={p.localizador}
                                                onChange={e => {
                                                    const val = e.target.value.toUpperCase()
                                                    setLocalizadores(prev => prev.map((item, i) => i === idx ? { ...item, localizador: val } : item))
                                                }}
                                            />
                                        </div>
                                        <div className="w-40">
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">Bilhete (Opcional)</label>
                                            <input 
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                value={p.bilhete}
                                                onChange={e => {
                                                    const val = e.target.value
                                                    setLocalizadores(prev => prev.map((item, i) => i === idx ? { ...item, bilhete: val } : item))
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                <h4 className="font-bold text-yellow-900 mb-4 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Custos Internos (Pagamentos à Cia/Fornecedor)
                                </h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-600">Descrição</label>
                                        <input 
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            placeholder="Ex: Pagamento Latam"
                                            value={novoCusto.descricao}
                                            onChange={e => setNovoCusto({...novoCusto, descricao: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Valor</label>
                                        <input 
                                            type="number"
                                            step="0.01"
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={novoCusto.valor || ''}
                                            onChange={e => setNovoCusto({...novoCusto, valor: parseFloat(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600">Vencimento</label>
                                        <input 
                                            type="date"
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={novoCusto.vencimento}
                                            onChange={e => setNovoCusto({...novoCusto, vencimento: e.target.value})}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-600">Fornecedor (Opcional)</label>
                                        <select 
                                            className="w-full border rounded px-3 py-2 text-sm"
                                            value={novoCusto.fornecedor_id}
                                            onChange={e => setNovoCusto({...novoCusto, fornecedor_id: e.target.value})}
                                        >
                                            <option value="">Selecione...</option>
                                            {fornecedores.map(f => (
                                                <option key={f.id} value={f.id}>{f.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 flex items-end">
                                        <button 
                                            onClick={addCusto}
                                            className="w-full bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700 font-bold text-sm"
                                        >
                                            Adicionar Custo
                                        </button>
                                    </div>
                                </div>

                                {/* Lista de Custos Adicionados */}
                                {custos.length > 0 && (
                                    <div className="mt-4 bg-white rounded border border-gray-200 overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Valor</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vencimento</th>
                                                    <th className="px-4 py-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {custos.map((c, i) => (
                                                    <tr key={i} className="border-t border-gray-100">
                                                        <td className="px-4 py-2 text-sm">{c.descricao}</td>
                                                        <td className="px-4 py-2 text-sm text-red-600 font-medium">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valor)}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm">{new Date(c.vencimento).toLocaleDateString('pt-BR')}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <button 
                                                                onClick={() => setCustos(prev => prev.filter((_, idx) => idx !== i))}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
                    {step === 2 ? (
                        <button 
                            onClick={() => setStep(1)}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                            Voltar
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step === 1 ? (
                        <button 
                            onClick={() => setStep(2)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-sm"
                        >
                            Próximo: Financeiro
                        </button>
                    ) : (
                        <button 
                            onClick={() => onConfirm({ passengers: localizadores, costs: custos })}
                            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 font-bold shadow-sm flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Confirmar Emissão
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
