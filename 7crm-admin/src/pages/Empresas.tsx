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
  X
} from 'lucide-react'

interface Empresa {
  id: number
  nome: string
  codigo_agencia: string
  ativo: boolean
  logotipo?: string
  cor_primaria?: string
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
    ativo: true,
    logotipo: '',
    cor_primaria: '#3B82F6'
  })

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
      if (editingEmpresa) {
        // Atualizar empresa existente
        const { error } = await supabase
          .from('empresas')
          .update({
            nome: formData.nome,
            codigo_agencia: formData.codigo_agencia,
            ativo: formData.ativo,
            logotipo: formData.logotipo || null,
            cor_primaria: formData.cor_primaria
          })
          .eq('id', editingEmpresa.id)
        
        if (error) throw error
      } else {
        // Criar nova empresa
        const { error } = await supabase
          .from('empresas')
          .insert({
            nome: formData.nome,
            codigo_agencia: formData.codigo_agencia,
            ativo: formData.ativo,
            logotipo: formData.logotipo || null,
            cor_primaria: formData.cor_primaria
          })
        
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

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa)
    setFormData({
      nome: empresa.nome,
      codigo_agencia: empresa.codigo_agencia,
      ativo: empresa.ativo,
      logotipo: empresa.logotipo || '',
      cor_primaria: empresa.cor_primaria || '#3B82F6'
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
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
        .update({ sete_visible: !empresa.sette_visible })
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
      ativo: true,
      logotipo: '',
      cor_primaria: '#3B82F6'
    })
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sette Ativo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sette Visível</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Central</th>
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
                    <button
                      onClick={() => toggleStatus(empresa)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        empresa.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {empresa.ativo ? (
                        <><Check className="h-3 w-3 mr-1" /> Ativa</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Inativa</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleChat(empresa)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        empresa.chat_enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      title={empresa.chat_enabled ? 'Desativar botão de chat' : 'Ativar botão de chat'}
                    >
                      {empresa.chat_enabled ? (
                        <><Check className="h-3 w-3 mr-1" /> Chat Visível</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Chat Oculto</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleSette(empresa)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        empresa.sette_enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      title={empresa.sette_enabled ? 'Desativar Sette' : 'Ativar Sette'}
                    >
                      {empresa.sette_enabled ? (
                        <><Check className="h-3 w-3 mr-1" /> Sette Ativo</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Sette Inativo</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleSetteVisible(empresa)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        empresa.sette_visible ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      title={empresa.sette_visible ? 'Ocultar Sette' : 'Mostrar Sette'}
                    >
                      {empresa.sette_visible ? (
                        <><Check className="h-3 w-3 mr-1" /> Sette Visível</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Sette Oculto</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleCentralVisible(empresa)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        empresa.central_visible ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      title={empresa.central_visible ? 'Ocultar Central 7C' : 'Mostrar Central 7C'}
                    >
                      {empresa.central_visible ? (
                        <><Check className="h-3 w-3 mr-1" /> Central Visível</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Central Oculta</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleAereo(empresa)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        empresa.aereo_enabled ? 'bg-sky-100 text-sky-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      title={empresa.aereo_enabled ? 'Bloquear Aéreo' : 'Liberar Aéreo'}
                    >
                      {empresa.aereo_enabled ? (
                        <><Check className="h-3 w-3 mr-1" /> Aéreo Liberado</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Aéreo Bloqueado</>
                      )}
                    </button>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEmpresa ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    Código da Agência *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo_agencia}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo_agencia: e.target.value.toUpperCase() }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: AG001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do Logotipo
                  </label>
                  <input
                    type="url"
                    value={formData.logotipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, logotipo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor Primária
                  </label>
                  <input
                    type="color"
                    value={formData.cor_primaria}
                    onChange={(e) => setFormData(prev => ({ ...prev, cor_primaria: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                    Empresa ativa
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
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
                    {editingEmpresa ? 'Atualizar' : 'Criar'}
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