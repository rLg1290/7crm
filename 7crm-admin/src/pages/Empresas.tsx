import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle,
  Check,
  X,
  Settings,
  MessageCircle,
  Phone,
  Plane,
  Monitor
} from 'lucide-react'

interface Empresa {
  id: number
  nome: string
  codigo_agencia: string
  cnpj?: string
  email?: string
  slug?: string
  ativo: boolean
  logotipo?: string
  cor_primaria?: string
  cor_secundaria?: string
  cor_personalizada?: string
  buscas_mensais_liberadas?: number
  pagamento_pix?: boolean
  pagamento_cartao?: boolean
  pagamento_boleto?: boolean
  pagamento_faturado?: boolean
  sette_enabled?: boolean
  chat_enabled?: boolean
  sette_visible?: boolean
  central_visible?: boolean
  aereo_enabled?: boolean
  created_at: string
}

const Empresas = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    codigo_agencia: '',
    cnpj: '',
    email: '',
    slug: '',
    ativo: true,
    logotipo: '',
    cor_primaria: '#3B82F6',
    cor_secundaria: '',
    cor_personalizada: '',
    buscas_mensais_liberadas: 0,
    pagamento_pix: false,
    pagamento_cartao: true,
    pagamento_boleto: false,
    pagamento_faturado: false,
    sette_enabled: false,
    chat_enabled: true,
    sette_visible: true,
    central_visible: true,
    aereo_enabled: false
  })

  const [activeTab, setActiveTab] = useState('dados')

  const tabs = [
    { id: 'dados', label: 'Dados Cadastrais' },
    { id: 'funcionalidades', label: 'Funcionalidades' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'aparencia', label: 'Aparência' }
  ]

  useEffect(() => {
    carregarEmpresas()
  }, [])

  const carregarEmpresas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setEmpresas(data || [])
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
      setError('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const payload: any = {
        nome: formData.nome,
        ativo: formData.ativo,
        logotipo: formData.logotipo || null,
        cor_primaria: formData.cor_primaria,
        cnpj: formData.cnpj || null,
        email: formData.email || null,
        slug: formData.slug || null,
        cor_secundaria: formData.cor_secundaria || null,
        cor_personalizada: formData.cor_personalizada || null,
        buscas_mensais_liberadas: formData.buscas_mensais_liberadas,
        pagamento_pix: formData.pagamento_pix,
        pagamento_cartao: formData.pagamento_cartao,
        pagamento_boleto: formData.pagamento_boleto,
        pagamento_faturado: formData.pagamento_faturado,
        sette_enabled: formData.sette_enabled,
        chat_enabled: formData.chat_enabled,
        sette_visible: formData.sette_visible,
        central_visible: formData.central_visible,
        aereo_enabled: formData.aereo_enabled
      }
      
      if (formData.codigo_agencia) {
        payload.codigo_agencia = formData.codigo_agencia
      }

      if (editingEmpresa) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('empresas')
          .update(payload)
          .eq('id', editingEmpresa.id)
        
        if (error) throw error
      } else {
        // Criar nova empresa
        const { error } = await supabase
          .from('empresas')
          .insert(payload)
        
        if (error) throw error
      }
      
      setShowModal(false)
      setEditingEmpresa(null)
      resetForm()
      carregarEmpresas()
    } catch (err) {
      console.error('Erro ao salvar empresa:', err)
      setError('Erro ao salvar empresa')
    }
  }

  const handleBulkAction = async (field: keyof Empresa, value: boolean) => {
    if (!confirm(`Tem certeza que deseja ${value ? 'ativar' : 'desativar'} "${field}" para TODAS as empresas?`)) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('empresas')
        .update({ [field]: value })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Atualiza todos os registros (ID != UUID vazio)

      if (error) throw error
      await carregarEmpresas()
      alert('Ação em massa realizada com sucesso!')
    } catch (err) {
      console.error('Erro na ação em massa:', err)
      setError('Erro ao realizar ação em massa')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa)
    setFormData({
      nome: empresa.nome,
      codigo_agencia: empresa.codigo_agencia,
      cnpj: empresa.cnpj || '',
      email: empresa.email || '',
      slug: empresa.slug || '',
      ativo: empresa.ativo,
      logotipo: empresa.logotipo || '',
      cor_primaria: empresa.cor_primaria || '#3B82F6',
      cor_secundaria: empresa.cor_secundaria || '',
      cor_personalizada: empresa.cor_personalizada || '',
      buscas_mensais_liberadas: empresa.buscas_mensais_liberadas || 0,
      pagamento_pix: empresa.pagamento_pix || false,
      pagamento_cartao: empresa.pagamento_cartao || false,
      pagamento_boleto: empresa.pagamento_boleto || false,
      pagamento_faturado: empresa.pagamento_faturado || false,
      sette_enabled: empresa.sette_enabled || false,
      chat_enabled: empresa.chat_enabled || false,
      sette_visible: empresa.sette_visible || false,
      central_visible: empresa.central_visible || false,
      aereo_enabled: empresa.aereo_enabled || false
    })
    setActiveTab('dados')
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return
    
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      carregarEmpresas()
    } catch (err) {
      console.error('Erro ao excluir empresa:', err)
      setError('Erro ao excluir empresa')
    }
  }

  // Suprimindo avisos de variáveis não usadas temporariamente
  // @ts-ignore
  const _ignoreUnused = [toggleStatus, toggleSette, toggleChat, toggleSetteVisible, toggleCentralVisible, toggleAereo]
  const toggleStatus = async (empresa: Empresa) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ ativo: !empresa.ativo })
        .eq('id', empresa.id)
      
      if (error) throw error
      carregarEmpresas()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
      setError('Erro ao alterar status da empresa')
    }
  }

  const toggleSette = async (empresa: Empresa) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ sette_enabled: !empresa.sette_enabled })
        .eq('id', empresa.id)
      if (error) throw error
      carregarEmpresas()
    } catch (err) {
      console.error('Erro ao alterar Sette:', err)
      setError('Erro ao alterar estado do Sette')
    }
  }

  const toggleChat = async (empresa: Empresa) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ chat_enabled: !empresa.chat_enabled })
        .eq('id', empresa.id)
      if (error) throw error
      carregarEmpresas()
    } catch (err) {
      console.error('Erro ao alterar visibilidade do chat:', err)
      setError('Erro ao alterar visibilidade do chat')
    }
  }

  const toggleSetteVisible = async (empresa: Empresa) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ sette_visible: !empresa.sette_visible })
        .eq('id', empresa.id)
      if (error) throw error
      carregarEmpresas()
    } catch (err) {
      console.error('Erro ao alterar visibilidade do Sette:', err)
      setError('Erro ao alterar visibilidade do Sette')
    }
  }

  const toggleCentralVisible = async (empresa: Empresa) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ central_visible: !empresa.central_visible })
        .eq('id', empresa.id)
      if (error) throw error
      carregarEmpresas()
    } catch (err) {
      console.error('Erro ao alterar visibilidade da Central:', err)
      setError('Erro ao alterar visibilidade da Central')
    }
  }

  const toggleAereo = async (empresa: Empresa) => {
    try {
      // Optimistic update
      setEmpresas(prev => prev.map(e => 
        e.id === empresa.id 
          ? { ...e, aereo_enabled: !e.aereo_enabled } 
          : e
      ))

      const { error } = await supabase
        .from('empresas')
        .update({ aereo_enabled: !empresa.aereo_enabled })
        .eq('id', empresa.id)

      if (error) {
        // Revert on error
        setEmpresas(prev => prev.map(e => 
          e.id === empresa.id 
            ? { ...e, aereo_enabled: empresa.aereo_enabled } 
            : e
        ))
        throw error
      }
      
      // Refresh to ensure consistency
      carregarEmpresas()
    } catch (err) {
      console.error('Erro ao alterar acesso Aéreo:', err)
      setError('Erro ao alterar acesso Aéreo')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      codigo_agencia: '',
      cnpj: '',
      email: '',
      slug: '',
      ativo: true,
      logotipo: '',
      cor_primaria: '#3B82F6',
      cor_secundaria: '',
      cor_personalizada: '',
      buscas_mensais_liberadas: 0,
      pagamento_pix: false,
      pagamento_cartao: true,
      pagamento_boleto: false,
      pagamento_faturado: false,
      sette_enabled: false,
      chat_enabled: true,
      sette_visible: true,
      central_visible: true,
      aereo_enabled: false
    })
    setActiveTab('dados')
  }

  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.codigo_agencia.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Empresas</h1>
          <p className="text-gray-500 mt-1">Administre as agências do sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingEmpresa(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Empresa</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar Funcionalidades Globalmente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Sette */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase flex items-center">
              <Monitor className="h-3 w-3 mr-1" /> Sette
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('sette_enabled', true)}
                className="flex-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-100"
              >
                Ativar Todos
              </button>
              <button
                onClick={() => handleBulkAction('sette_enabled', false)}
                className="flex-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-100"
              >
                Desativar
              </button>
            </div>
          </div>

          {/* Sette Visible */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase flex items-center">
              <Monitor className="h-3 w-3 mr-1" /> Sette Visível
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('sette_visible', true)}
                className="flex-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-100"
              >
                Mostrar Todos
              </button>
              <button
                onClick={() => handleBulkAction('sette_visible', false)}
                className="flex-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-100"
              >
                Ocultar
              </button>
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" /> Chat
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('chat_enabled', true)}
                className="flex-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-100"
              >
                Ativar Todos
              </button>
              <button
                onClick={() => handleBulkAction('chat_enabled', false)}
                className="flex-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-100"
              >
                Desativar
              </button>
            </div>
          </div>

          {/* Central */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase flex items-center">
              <Phone className="h-3 w-3 mr-1" /> Central
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('central_visible', true)}
                className="flex-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-100"
              >
                Mostrar Todos
              </button>
              <button
                onClick={() => handleBulkAction('central_visible', false)}
                className="flex-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-100"
              >
                Ocultar
              </button>
            </div>
          </div>

          {/* Aereo */}
          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-gray-500 uppercase flex items-center">
              <Plane className="h-3 w-3 mr-1" /> Aéreo
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('aereo_enabled', true)}
                className="flex-1 bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200 hover:bg-green-100"
              >
                Liberar Todos
              </button>
              <button
                onClick={() => handleBulkAction('aereo_enabled', false)}
                className="flex-1 bg-red-50 text-red-700 text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-100"
              >
                Bloquear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou código da agência..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de Empresas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmpresas.map((empresa) => (
                <tr key={empresa.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {empresa.logotipo ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={empresa.logotipo}
                            alt={empresa.nome}
                          />
                        ) : (
                          <div 
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: empresa.cor_primaria || '#3B82F6' }}
                          >
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{empresa.nome}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {empresa.codigo_agencia}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      empresa.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {empresa.ativo ? (
                        <><Check className="h-3 w-3 mr-1" /> Ativa</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Inativa</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(empresa.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(empresa)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(empresa.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEmpresas.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando uma nova empresa'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-xl rounded-lg bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-2">
              <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">
                {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Tabs Header */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                          ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-4">
                  {/* Dados Cadastrais */}
                  {activeTab === 'dados' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome da Empresa *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Agência Turismo Ltda"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CNPJ
                          </label>
                          <input
                            type="text"
                            value={formData.cnpj}
                            onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="00.000.000/0000-00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código da Agência
                          </label>
                          <input
                            type="text"
                            value={formData.codigo_agencia}
                            onChange={(e) => setFormData(prev => ({ ...prev, codigo_agencia: e.target.value.toUpperCase() }))}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Gerado automaticamente"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Deixe vazio para gerar automaticamente
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="contato@empresa.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Slug (URL)
                          </label>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="minha-agencia"
                          />
                        </div>

                        <div className="flex items-center pt-6">
                          <input
                            type="checkbox"
                            id="ativo"
                            checked={formData.ativo}
                            onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                            Empresa Ativa
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Funcionalidades */}
                  {activeTab === 'funcionalidades' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <h4 className="font-medium text-gray-900">Sette</h4>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.sette_enabled}
                              onChange={(e) => setFormData(prev => ({ ...prev, sette_enabled: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Habilitar Sette</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.sette_visible}
                              onChange={(e) => setFormData(prev => ({ ...prev, sette_visible: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Visível no Menu</span>
                          </label>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <h4 className="font-medium text-gray-900">Comunicação</h4>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.chat_enabled}
                              onChange={(e) => setFormData(prev => ({ ...prev, chat_enabled: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Chat Habilitado</span>
                          </label>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.central_visible}
                              onChange={(e) => setFormData(prev => ({ ...prev, central_visible: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Central Visível</span>
                          </label>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <h4 className="font-medium text-gray-900">Módulos</h4>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.aereo_enabled}
                              onChange={(e) => setFormData(prev => ({ ...prev, aereo_enabled: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">Módulo Aéreo Habilitado</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financeiro */}
                  {activeTab === 'financeiro' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Buscas Mensais Liberadas
                        </label>
                        <input
                          type="number"
                          value={formData.buscas_mensais_liberadas}
                          onChange={(e) => setFormData(prev => ({ ...prev, buscas_mensais_liberadas: Number(e.target.value) }))}
                          className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-medium text-gray-900 mb-4">Métodos de Pagamento Aceitos</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.pagamento_pix}
                              onChange={(e) => setFormData(prev => ({ ...prev, pagamento_pix: e.target.checked }))}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">PIX</span>
                          </label>
                          <label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.pagamento_cartao}
                              onChange={(e) => setFormData(prev => ({ ...prev, pagamento_cartao: e.target.checked }))}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Cartão</span>
                          </label>
                          <label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.pagamento_boleto}
                              onChange={(e) => setFormData(prev => ({ ...prev, pagamento_boleto: e.target.checked }))}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Boleto</span>
                          </label>
                          <label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.pagamento_faturado}
                              onChange={(e) => setFormData(prev => ({ ...prev, pagamento_faturado: e.target.checked }))}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Faturado</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aparência */}
                  {activeTab === 'aparencia' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          URL do Logotipo
                        </label>
                        <input
                          type="url"
                          value={formData.logotipo}
                          onChange={(e) => setFormData(prev => ({ ...prev, logotipo: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://..."
                        />
                        {formData.logotipo && (
                          <div className="mt-2 p-2 border rounded bg-gray-50 inline-block">
                            <img src={formData.logotipo} alt="Preview" className="h-12 object-contain" />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cor Primária
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={formData.cor_primaria}
                              onChange={(e) => setFormData(prev => ({ ...prev, cor_primaria: e.target.value }))}
                              className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-500 uppercase">{formData.cor_primaria}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cor Secundária
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={formData.cor_secundaria || '#ffffff'}
                              onChange={(e) => setFormData(prev => ({ ...prev, cor_secundaria: e.target.value }))}
                              className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-500 uppercase">{formData.cor_secundaria || '#ffffff'}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cor Personalizada
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={formData.cor_personalizada || '#0caf99'}
                              onChange={(e) => setFormData(prev => ({ ...prev, cor_personalizada: e.target.value }))}
                              className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-500 uppercase">{formData.cor_personalizada || '#0caf99'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingEmpresa(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    {editingEmpresa ? 'Salvar Alterações' : 'Criar Empresa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Empresas