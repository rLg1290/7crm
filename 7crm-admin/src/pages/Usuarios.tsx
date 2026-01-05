import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck,
  AlertCircle,
  Building2,
  Mail,
  Calendar,
  User
} from 'lucide-react'

interface Usuario {
  id: string
  email: string
  nome?: string
  role: 'user' | 'admin' | 'comercial' | 'financeiro'
  empresa_id?: string
  // Pode vir como objeto (padrão 1:N) ou array dependendo da query
  empresa?: {
    nome: string
    codigo_agencia: string
  } | {
    nome: string
    codigo_agencia: string
  }[]
  created_at: string
  last_sign_in_at?: string
}

interface Empresa {
  id: number
  nome: string
  codigo_agencia: string
}

type TabType = 'crm' | 'admin' | 'internal'
  
  const Usuarios = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([])
    const [empresas, setEmpresas] = useState<Empresa[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState<TabType>('crm')
    
    // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    password: '',
    role: 'user' as 'user' | 'admin' | 'comercial' | 'financeiro',
    empresa_id: '',
    autoConfirm: false
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar usuários com dados da empresa
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          nome,
          role,
          empresa_id,
          created_at,
          last_sign_in_at,
          empresa:empresas(
            nome,
            codigo_agencia
          )
        `)
        .order('created_at', { ascending: false })
      
      if (usuariosError) throw usuariosError
      
      // Carregar empresas para o select
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome, codigo_agencia')
        .eq('ativo', true)
        .order('nome')
      
      if (empresasError) throw empresasError
      
      setUsuarios(usuariosData || [])
      setEmpresas(empresasData || [])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      if (editingUsuario) {
        // Atualizar usuário existente
        const { error } = await supabase
          .from('profiles')
          .update({
            nome: formData.nome,
            role: formData.role,
            empresa_id: formData.empresa_id || null
          })
          .eq('id', editingUsuario.id)
        
        if (error) throw error
      } else {
        // Criação de novo usuário
        if (formData.autoConfirm) {
          // FLUXO VIA API (Server-side Admin Create) - Auto Confirmação
          // Requer que a API esteja rodando (vercel dev ou produção)
          const apiBase = (import.meta as any).env.VITE_ADMIN_API_BASE_URL || ''
          const url = apiBase ? `${apiBase.replace(/\/$/, '')}/api/create-user` : '/api/create-user'
          
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              nome: formData.nome,
              role: formData.role,
              empresa_id: formData.empresa_id || null,
              autoConfirm: true
            })
          })

          const ct = resp.headers.get('content-type') || ''
          let payload: any = null
          try {
            if (ct.includes('application/json')) payload = await resp.json()
            else {
              const text = await resp.text()
              try { payload = JSON.parse(text) } catch { payload = { raw: text } }
            }
          } catch { payload = null }

          if (!resp.ok) {
            throw new Error((payload && payload.error) || `Falha ao criar usuário via API (HTTP ${resp.status})`)
          }
        } else {
          // FLUXO PADRÃO (Client-side SignUp) - Envia Email de Confirmação
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.nome,
                nome: formData.nome,
                role: formData.role,
                empresa_id: formData.empresa_id || null
              }
            }
          })
          
          if (authError) throw authError
          
          // Se o signUp for bem sucedido, atualizamos o profile para garantir
          if (authData.user) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({
                nome: formData.nome,
                role: formData.role,
                empresa_id: formData.empresa_id || null
              })
              .eq('id', authData.user.id)
            if (profileError) throw profileError
          }
        }
      }
      
      setShowModal(false)
      setEditingUsuario(null)
      resetForm()
      carregarDados()
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err)
      setError(err.message || 'Erro ao salvar usuário')
    }
  }

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData({
      email: usuario.email,
      nome: usuario.nome || '',
      password: '',
      role: usuario.role,
      empresa_id: usuario.empresa_id || '',
      autoConfirm: false
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    
    try {
      // Primeiro deletar o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      
      if (profileError) throw profileError
      
      // Depois deletar o usuário do auth (requer privilégios de admin)
      // Nota: Isso pode falhar se não estiver usando a service role key, mas o profile já foi deletado
      const { error: authError } = await supabase.auth.admin.deleteUser(id)
      
      if (authError) {
        console.warn('Erro ao deletar usuário do auth:', authError)
      }
      
      carregarDados()
    } catch (err) {
      console.error('Erro ao excluir usuário:', err)
      setError('Erro ao excluir usuário')
    }
  }

  const handleAdminConfirmEmail = async (id: string) => {
    try {
      const apiBase = (import.meta as any).env.VITE_ADMIN_API_BASE_URL || ''
      const url = apiBase ? `${apiBase.replace(/\/$/, '')}/api/confirm-user` : '/api/confirm-user'
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id })
      })
      const ct = resp.headers.get('content-type') || ''
      let payload: any = null
      try {
        if (ct.includes('application/json')) payload = await resp.json()
        else {
          const text = await resp.text()
          try { payload = JSON.parse(text) } catch { payload = { raw: text } }
        }
      } catch { payload = null }
      if (!resp.ok) throw new Error((payload && payload.error) || `Falha ao confirmar e-mail (HTTP ${resp.status})`)
      await carregarDados()
    } catch (e: any) {
      setError(e?.message || 'Erro ao confirmar e-mail')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      nome: '',
      password: '',
      role: activeTab === 'admin' ? 'admin' : 'user',
      empresa_id: '',
      autoConfirm: false
    })
  }
  
  // Helper para obter dados da empresa com segurança
  const getEmpresaData = (usuario: Usuario) => {
    if (!usuario.empresa) return null
    if (Array.isArray(usuario.empresa)) {
      return usuario.empresa[0] || null
    }
    return usuario.empresa
  }

  // Filtragem
  const filteredUsuarios = usuarios.filter(usuario => {
    const empresaData = getEmpresaData(usuario)
    const matchesSearch = 
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (usuario.nome && usuario.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      empresaData?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = activeTab === 'crm' 
      ? usuario.role === 'user' 
      : activeTab === 'admin' 
        ? usuario.role === 'admin'
        : ['comercial', 'financeiro'].includes(usuario.role)
    
    return matchesSearch && matchesTab
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-500 mt-1">Administração de acesso e perfis do sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingUsuario(null)
            resetForm()
            setShowModal(true)
          }}
          className="inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Novo Usuário</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Tabs e Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-lg self-start">
              <button
                onClick={() => setActiveTab('crm')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'crm'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Usuários CRM</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">
                  {usuarios.filter(u => u.role === 'user').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'admin'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Administradores</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">
                  {usuarios.filter(u => u.role === 'admin').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('internal')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'internal'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Shield className="h-4 w-4" />
                <span>Equipe Interna</span>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">
                  {usuarios.filter(u => ['comercial', 'financeiro'].includes(u.role)).length}
                </span>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                {activeTab === 'crm' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acesso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsuarios.map((usuario) => {
                const empresaData = getEmpresaData(usuario)
                return (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            usuario.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <User className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{usuario.nome || 'Sem nome'}</div>
                          <div className="text-sm text-gray-500">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    {activeTab === 'crm' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {empresaData ? (
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{empresaData.nome}</div>
                              <div className="text-sm text-gray-500">{empresaData.codigo_agencia}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Sem empresa
                          </span>
                        )}
                      </td>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : ['comercial', 'financeiro'].includes(usuario.role)
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {usuario.role === 'admin' ? (
                          <><ShieldCheck className="h-3 w-3 mr-1" /> Admin</>
                        ) : ['comercial', 'financeiro'].includes(usuario.role) ? (
                          <><Shield className="h-3 w-3 mr-1" /> {usuario.role === 'comercial' ? 'Comercial' : 'Financeiro'}</>
                        ) : (
                          <><Users className="h-3 w-3 mr-1" /> Ativo</>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.last_sign_in_at ? (
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                          {new Date(usuario.last_sign_in_at).toLocaleDateString('pt-BR')}
                          <span className="mx-1 text-gray-300">|</span>
                          {new Date(usuario.last_sign_in_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Nunca acessou</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAdminConfirmEmail(usuario.id)}
                          className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                          title="Confirmar e-mail (Admin)"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              
              {filteredUsuarios.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'crm' ? 5 : 4} className="px-6 py-12 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-300">
                      {activeTab === 'crm' ? <Users className="h-full w-full" /> : <ShieldCheck className="h-full w-full" />}
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'Tente ajustar os termos da busca.' : 
                        activeTab === 'crm' ? 'Não há usuários do CRM cadastrados.' : 
                        activeTab === 'admin' ? 'Não há administradores cadastrados.' : 
                        'Não há equipe interna cadastrada.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Moderno */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    formData.role === 'admin' ? 'bg-purple-100' : 
                    ['comercial', 'financeiro'].includes(formData.role) ? 'bg-orange-100' :
                    'bg-blue-100'
                  }`}>
                    {formData.role === 'admin' ? (
                      <ShieldCheck className="h-6 w-6 text-purple-600" />
                    ) : ['comercial', 'financeiro'].includes(formData.role) ? (
                      <Shield className="h-6 w-6 text-orange-600" />
                    ) : (
                      <User className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      Preencha os dados abaixo para {editingUsuario ? 'atualizar o' : 'criar um novo'} acesso.
                    </div>
                    
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* Tipo de Usuário - Cards Selection */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div 
                          onClick={() => setFormData(prev => ({ ...prev, role: 'user' }))}
                          className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                            formData.role === 'user' 
                              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          <span className="text-xs font-medium text-center">CRM</span>
                        </div>
                        <div 
                          onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                          className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                            formData.role === 'admin' 
                              ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span className="text-xs font-medium text-center">Admin</span>
                        </div>
                        <div 
                          onClick={() => setFormData(prev => ({ ...prev, role: 'comercial' }))}
                          className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center justify-center gap-1 transition-all ${
                            ['comercial', 'financeiro'].includes(formData.role) 
                              ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500' 
                              : 'border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Shield className="h-4 w-4" />
                          <span className="text-xs font-medium text-center">Interno</span>
                        </div>
                      </div>

                      {/* Sub-role selector for Internal Users */}
                      {['comercial', 'financeiro'].includes(formData.role) && (
                        <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-orange-50 rounded-lg border border-orange-100 mb-4">
                          <label className="block text-xs font-medium text-orange-800 mb-2">Departamento Interno</label>
                          <div className="flex gap-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="internal_role" 
                                checked={formData.role === 'comercial'}
                                onChange={() => setFormData(prev => ({ ...prev, role: 'comercial' }))}
                                className="text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700">Comercial</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="internal_role" 
                                checked={formData.role === 'financeiro'}
                                onChange={() => setFormData(prev => ({ ...prev, role: 'financeiro' }))}
                                className="text-orange-600 focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700">Financeiro</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                          <input
                            type="text"
                            required
                            value={formData.nome}
                            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            placeholder="Ex: João da Silva"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Profissional</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="email"
                              required
                              disabled={!!editingUsuario}
                              value={formData.email}
                              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                              placeholder="usuario@empresa.com"
                            />
                          </div>
                        </div>

                        {!editingUsuario && (
                          <div>
                            <label className="block text_sm font_medium text_gray_700 mb_1">Senha Inicial</label>
                            <input
                              type="password"
                              required
                              value={formData.password}
                              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="••••••••"
                              minLength={6}
                            />
                            <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres.</p>
                          </div>
                        )}

                        {!editingUsuario && (
                          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <input
                              type="checkbox"
                              id="autoConfirm"
                              checked={formData.autoConfirm}
                              onChange={(e) => setFormData(prev => ({ ...prev, autoConfirm: e.target.checked }))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex flex-col">
                              <label htmlFor="autoConfirm" className="text-sm font-medium text-blue-900 cursor-pointer">
                                Confirmar e-mail automaticamente
                              </label>
                              <span className="text-xs text-blue-700">
                                O usuário não precisará clicar no link do e-mail.
                              </span>
                            </div>
                          </div>
                        )}

                        {formData.role === 'user' && (
                          <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Vinculada</label>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <select
                                required
                                value={formData.empresa_id}
                                onChange={(e) => setFormData(prev => ({ ...prev, empresa_id: e.target.value }))}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                style={{ color: '#111827', backgroundColor: '#ffffff' }}
                              >
                                <option value="" style={{ color: '#6b7280' }}>Selecione uma empresa...</option>
                                {empresas.map((empresa) => (
                                  <option key={empresa.id} value={empresa.id} style={{ color: '#111827' }}>
                                    {empresa.nome} ({empresa.codigo_agencia})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              O usuário terá acesso aos dados apenas desta empresa.
                            </p>
                          </div>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    formData.role === 'admin' 
                      ? 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {editingUsuario ? 'Salvar Alterações' : 'Criar Usuário'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingUsuario(null)
                    resetForm()
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Usuarios
