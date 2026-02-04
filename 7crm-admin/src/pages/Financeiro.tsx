import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  FileText, 
  Filter,
  Plus,
  Pencil,
  Trash2,
  XCircle,
  Save,
  Search,
  CheckCircle
} from 'lucide-react'

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<'visao_geral' | 'contas_pagar' | 'contas_receber' | 'fluxo_caixa'>('visao_geral')
  const [contasPagar, setContasPagar] = useState<any[]>([])
  const [contasReceber, setContasReceber] = useState<any[]>([])
  // @ts-ignore
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [modalType, setModalType] = useState<'pagar' | 'receber'>('receber')

  // Filtros (básico)
  const [searchTerm, setSearchTerm] = useState('')

  // @ts-ignore
  const _ignoreUnused = [Filter, Pencil, Save, loading]

  const fetchFinanceiro = async () => {
    setLoading(true)
    try {
      // Regras de Negócio 7C:
      // 1. O que a Agência DEVE a 7C (Agência Pagar -> Fornecedor 7C) = 7C Receber
      // 2. O que a Agência RECEBE da 7C (Agência Receber -> Cliente 7C) = 7C Pagar
      // 3. Lançamentos Manuais da 7C (origem = MANUAL_ADMIN)

      const ID_7C = 3; 

      const [resPagarAgencia, resReceberAgencia, resPagarManual, resReceberManual] = await Promise.all([
        // Busca contas a pagar das agências onde o fornecedor é 7C (Isso vira RECEITA para 7C)
        supabase.from('contas_pagar').select('*, empresas(nome_fantasia)').eq('fornecedor_id', ID_7C),
        
        // Busca contas a receber das agências onde o cliente é 7C (Isso vira DESPESA para 7C)
        supabase.from('contas_receber').select('*, empresas(nome_fantasia)').eq('cliente_id', ID_7C),

        // Busca contas manuais do admin e custos de emissão (7C)
        supabase.from('contas_pagar').select('*').or('origem.eq.MANUAL_ADMIN,empresa_id.eq.3'),
        supabase.from('contas_receber').select('*').or('origem.eq.MANUAL_ADMIN,empresa_id.eq.3')
      ])

      if (resPagarAgencia.error) throw resPagarAgencia.error
      if (resReceberAgencia.error) throw resReceberAgencia.error
      if (resPagarManual.error) throw resPagarManual.error
      if (resReceberManual.error) throw resReceberManual.error

      // Transformação de Dados

      // 1. Receitas 7C = (Agência Pagar p/ 7C) + (Manual Receber)
      const receitas7C = [
        ...(resPagarAgencia.data || []).map(conta => ({
            ...conta,
            // O status para 7C é o inverso/reflexo? 
            // Se Agência PAGOU (PAGO), 7C RECEBEU (RECEBIDA).
            // Se Agência PENDENTE, 7C PENDENTE.
            status: conta.status === 'PAGO' ? 'recebida' : 'pendente',
            descricao: `[${conta.empresas?.nome_fantasia || 'Agência'}] ${conta.descricao || conta.observacoes}`,
            origem_real: 'AGENCIA_PAGAR'
        })),
        ...(resReceberManual.data || []).map(conta => ({ ...conta, origem_real: 'MANUAL' }))
      ]

      // 2. Despesas 7C = (Agência Receber de 7C) + (Manual Pagar)
      const despesas7C = [
        ...(resReceberAgencia.data || []).map(conta => ({
            ...conta,
            // Se Agência RECEBEU (RECEBIDA), 7C PAGOU (PAGO).
            status: conta.status === 'recebida' ? 'PAGO' : 'PENDENTE',
            descricao: `[${conta.empresas?.nome_fantasia || 'Agência'}] ${conta.descricao}`,
            origem_real: 'AGENCIA_RECEBER'
        })),
        ...(resPagarManual.data || []).map(conta => ({ ...conta, origem_real: 'MANUAL' }))
      ]

      // Ordenar por vencimento
      setContasReceber(receitas7C.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()))
      setContasPagar(despesas7C.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()))

    } catch (error) {
      console.error('Erro ao buscar financeiro:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinanceiro()
  }, [])

  const handleDelete = async (id: string, type: 'pagar' | 'receber') => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return
    
    try {
      const table = type === 'pagar' ? 'contas_pagar' : 'contas_receber'
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      
      fetchFinanceiro()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir registro')
    }
  }

  const handleConfirmar = async (conta: any, type: 'pagar' | 'receber') => {
      if (!window.confirm(`Confirma ${type === 'pagar' ? 'o pagamento' : 'o recebimento'} desta conta?`)) return

      try {
          // 1. Recebimento 7C (Receitas)
          if (type === 'receber') {
              if (conta.origem_real === 'AGENCIA_PAGAR') {
                  // Atualiza conta_pagar da Agência para PAGO
                  const { error } = await supabase.from('contas_pagar').update({ status: 'PAGO' }).eq('id', conta.id)
                  if (error) throw error
              } else {
                  // Atualiza conta_receber Manual da 7C
                  const { error } = await supabase.from('contas_receber').update({ status: 'recebida' }).eq('id', conta.id)
                  if (error) throw error
              }
          } 
          // 2. Pagamento 7C (Despesas)
          else {
              if (conta.origem_real === 'AGENCIA_RECEBER') {
                  // Atualiza conta_receber da Agência para RECEBIDA
                  const { error } = await supabase.from('contas_receber').update({ status: 'recebida' }).eq('id', conta.id)
                  if (error) throw error
              } else {
                  // Atualiza conta_pagar Manual da 7C
                  const { error } = await supabase.from('contas_pagar').update({ status: 'PAGO' }).eq('id', conta.id)
                  if (error) throw error
              }
          }

          fetchFinanceiro()
      } catch (error) {
          console.error('Erro ao confirmar:', error)
          alert('Erro ao confirmar status')
      }
  }

  // Cálculos para Visão Geral
  const totalReceber = contasReceber.reduce((acc, c) => acc + (c.valor || 0), 0)
  const totalPagar = contasPagar.reduce((acc, c) => acc + (c.valor || 0), 0)
  const saldo = totalReceber - totalPagar

  const filteredReceber = contasReceber.filter(c => 
    c.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPagar = contasPagar.filter(c => 
    c.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.observacoes?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-gray-50">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 mt-1">Gestão financeira, contas e fluxo de caixa</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => { setModalType('receber'); setShowNewModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
                <Plus className="w-4 h-4" />
                Nova Receita
            </button>
            <button 
                onClick={() => { setModalType('pagar'); setShowNewModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
                <Plus className="w-4 h-4" />
                Nova Despesa
            </button>
        </div>
      </div>

      {/* Tabs / Subdivisões */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('visao_geral')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'visao_geral'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <Banknote className="w-4 h-4" />
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('contas_receber')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'contas_receber'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <TrendingUp className="w-4 h-4" />
            Contas a Receber
          </button>
          <button
            onClick={() => setActiveTab('contas_pagar')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'contas_pagar'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <TrendingDown className="w-4 h-4" />
            Contas a Pagar
          </button>
          <button
            onClick={() => setActiveTab('fluxo_caixa')}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'fluxo_caixa'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <FileText className="w-4 h-4" />
            Fluxo de Caixa
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'visao_geral' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Receita Total (Cadastrada)</h3>
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceber)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Despesas Totais (Cadastrada)</h3>
                <div className="p-2 bg-red-50 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPagar)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-500 font-medium">Saldo Geral</h3>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contas_receber' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Contas a Receber</h2>
              <div className="flex gap-2">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredReceber.map(conta => (
                            <tr key={conta.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{conta.descricao}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        conta.status === 'recebida' ? 'bg-green-100 text-green-800' : 
                                        conta.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {conta.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.origem || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                    {conta.status !== 'recebida' && (
                                        <button onClick={() => handleConfirmar(conta, 'receber')} className="text-green-600 hover:text-green-900" title="Confirmar Recebimento">
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(conta.id, 'receber')} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredReceber.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Nenhum registro encontrado
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'contas_pagar' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Contas a Pagar</h2>
              <div className="flex gap-2">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPagar.map(conta => (
                            <tr key={conta.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{conta.descricao || conta.observacoes}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(conta.vencimento).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        conta.status === 'PAGO' ? 'bg-green-100 text-green-800' : 
                                        conta.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {conta.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conta.origem || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                    {conta.status !== 'PAGO' && (
                                        <button onClick={() => handleConfirmar(conta, 'pagar')} className="text-green-600 hover:text-green-900" title="Confirmar Pagamento">
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(conta.id, 'pagar')} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {filteredPagar.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    Nenhum registro encontrado
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'fluxo_caixa' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Fluxo de Caixa</h2>
            <div className="text-center py-12 text-gray-500">
              Funcionalidade em desenvolvimento
            </div>
          </div>
        )}
      </div>

      {showNewModal && (
          <NewAccountModal 
            type={modalType} 
            onClose={() => setShowNewModal(false)} 
            onSuccess={() => { setShowNewModal(false); fetchFinanceiro(); }} 
          />
      )}
    </div>
  )
}

function NewAccountModal({ type, onClose, onSuccess }: { type: 'pagar' | 'receber', onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        descricao: '',
        valor: '',
        vencimento: new Date().toISOString().split('T')[0],
        status: 'PENDENTE',
        observacoes: ''
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const table = type === 'pagar' ? 'contas_pagar' : 'contas_receber'
            
            // Get user
            const { data: { user } } = await supabase.auth.getUser()

            const payload = {
                descricao: formData.descricao,
                valor: Number(formData.valor),
                vencimento: formData.vencimento,
                status: formData.status === 'PENDENTE' ? 'pendente' : formData.status === 'PAGO' ? 'recebida' : 'vencida', // Normalizar status
                observacoes: formData.observacoes,
                origem: 'MANUAL_ADMIN',
                user_id: user?.id,
                empresa_id: 3, // 7C
                created_at: new Date().toISOString()
            }

            // Ajuste status especifico por tipo
            if (type === 'pagar') {
                payload.status = formData.status // PENDENTE, PAGO, VENCIDA
            } else {
                // contas_receber usa: pendente, recebida, vencida
                payload.status = formData.status === 'PENDENTE' ? 'pendente' : formData.status === 'PAGO' ? 'recebida' : 'vencida'
            }

            const { error } = await supabase.from(table).insert(payload)
            if (error) throw error
            
            alert('Conta criada com sucesso!')
            onSuccess()
        } catch (error: any) {
            console.error('Erro ao criar conta:', error)
            alert('Erro ao criar conta: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">
                        Nova Conta a {type === 'pagar' ? 'Pagar' : 'Receber'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <input 
                            type="text" 
                            required
                            className="w-full border rounded-lg px-3 py-2"
                            value={formData.descricao}
                            onChange={e => setFormData({...formData, descricao: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                required
                                className="w-full border rounded-lg px-3 py-2"
                                value={formData.valor}
                                onChange={e => setFormData({...formData, valor: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                            <input 
                                type="date" 
                                required
                                className="w-full border rounded-lg px-3 py-2"
                                value={formData.vencimento}
                                onChange={e => setFormData({...formData, vencimento: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                            className="w-full border rounded-lg px-3 py-2"
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value})}
                        >
                            <option value="PENDENTE">Pendente</option>
                            <option value="PAGO">{type === 'pagar' ? 'Pago' : 'Recebido'}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                        <textarea 
                            className="w-full border rounded-lg px-3 py-2"
                            rows={3}
                            value={formData.observacoes}
                            onChange={e => setFormData({...formData, observacoes: e.target.value})}
                        />
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-2">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg text-white font-medium ${type === 'pagar' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            {loading ? 'Salvando...' : 'Salvar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
