import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Tag, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertCircle,
  Check,
  X,
  Calendar,
  Building2
} from 'lucide-react'

interface Promocao {
  id: string
  destino: string
  valor_de: number
  valor_por: number
  tipo: string
  observacoes: string
  imagem?: string
  ativo: boolean
  empresa_id?: string
  empresa?: {
    nome: string
    codigo_agencia: string
  }
  created_at: string
}

interface Empresa {
  id: string
  nome: string
  codigo_agencia: string
}

const Promocoes = () => {
  const [promocoes, setPromocoes] = useState<Promocao[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPromocao, setEditingPromocao] = useState<Promocao | null>(null)
  const [formData, setFormData] = useState({
    destino: '',
    valor_de: 0,
    valor_por: 0,
    tipo: '',
    observacoes: '',
    imagem: '',
    ativo: true,
    empresa_id: ''
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      
      // Carregar promoções com dados da empresa
      const { data: promocoesData, error: promocoesError } = await supabase
        .from('promocoes')
        .select(`
          *,
          empresa:empresas(
            nome,
            codigo_agencia
          )
        `)
        .order('created_at', { ascending: false })
      
      if (promocoesError) throw promocoesError
      
      // Carregar empresas para o select
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresas')
        .select('id, nome, codigo_agencia')
        .eq('ativo', true)
        .order('nome')
      
      if (empresasError) throw empresasError
      
      setPromocoes(promocoesData || [])
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
    
    // Validações
    if (formData.valor_por >= formData.valor_de) {
      setError('O valor promocional deve ser menor que o valor normal')
      return
    }
    
    try {
      setError('') // Limpar erros anteriores
      
      const promocaoData = {
        destino: formData.destino.trim(),
        valor_de: formData.valor_de,
        valor_por: formData.valor_por,
        tipo: formData.tipo,
        observacoes: formData.observacoes.trim(),
        imagem: formData.imagem.trim() || null,
        ativo: formData.ativo,
        empresa_id: formData.empresa_id || null
      }
      
      if (editingPromocao) {
        // Atualizar promoção existente
        const { error } = await supabase
          .from('promocoes')
          .update(promocaoData)
          .eq('id', editingPromocao.id)
        
        if (error) throw error
      } else {
        // Criar nova promoção
        const { error } = await supabase
          .from('promocoes')
          .insert(promocaoData)
        
        if (error) throw error
      }
      
      setShowModal(false)
      setEditingPromocao(null)
      resetForm()
      carregarDados()
    } catch (err) {
      console.error('Erro ao salvar promoção:', err)
      setError('Erro ao salvar promoção')
    }
  }

  const handleEdit = (promocao: Promocao) => {
    setEditingPromocao(promocao)
    setFormData({
      destino: promocao.destino,
      valor_de: promocao.valor_de,
      valor_por: promocao.valor_por,
      tipo: promocao.tipo,
      observacoes: promocao.observacoes,
      imagem: promocao.imagem || '',
      ativo: promocao.ativo,
      empresa_id: promocao.empresa_id || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta promoção?')) return
    
    try {
      const { error } = await supabase
        .from('promocoes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      carregarDados()
    } catch (err) {
      console.error('Erro ao excluir promoção:', err)
      setError('Erro ao excluir promoção')
    }
  }

  const toggleStatus = async (promocao: Promocao) => {
    try {
      const { error } = await supabase
        .from('promocoes')
        .update({ ativo: !promocao.ativo })
        .eq('id', promocao.id)
      
      if (error) throw error
      carregarDados()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
      setError('Erro ao alterar status da promoção')
    }
  }

  const resetForm = () => {
    setFormData({
      destino: '',
      valor_de: 0,
      valor_por: 0,
      tipo: '',
      observacoes: '',
      imagem: '',
      ativo: true,
      empresa_id: ''
    })
  }



  const filteredPromocoes = promocoes.filter(promocao =>
    promocao.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promocao.observacoes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promocao.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promocao.empresa?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando promoções...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Promoções</h1>
          <p className="text-gray-500 mt-1">Administre as promoções do sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingPromocao(null)
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Promoção</span>
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
            placeholder="Buscar por destino, tipo, observações ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de Promoções */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPromocoes.map((promocao) => (
                <tr key={promocao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {promocao.imagem ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={promocao.imagem}
                            alt={promocao.destino}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Tag className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{promocao.destino}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">{promocao.observacoes}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {promocao.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="line-through text-gray-500">
                        R$ {promocao.valor_de.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-green-600 font-medium">
                        R$ {promocao.valor_por.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promocao.empresa ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{promocao.empresa.nome}</div>
                        <div className="text-sm text-gray-500">{promocao.empresa.codigo_agencia}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Todas as empresas</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(promocao)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        promocao.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {promocao.ativo ? (
                        <><Check className="h-3 w-3 mr-1" /> Ativa</>
                      ) : (
                        <><X className="h-3 w-3 mr-1" /> Inativa</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(promocao)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promocao.id)}
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
        
        {filteredPromocoes.length === 0 && (
          <div className="text-center py-12">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma promoção encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando uma nova promoção'}
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
                {editingPromocao ? 'Editar Promoção' : 'Nova Promoção'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destino *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destino}
                    onChange={(e) => setFormData(prev => ({ ...prev, destino: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Paris, França"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="Pacote">Pacote</option>
                    <option value="Aéreo">Aéreo</option>
                    <option value="Hotel">Hotel</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Normal *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.valor_de}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_de: parseFloat(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Promocional *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.valor_por}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_por: parseFloat(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva os detalhes da promoção..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={formData.imagem}
                    onChange={(e) => setFormData(prev => ({ ...prev, imagem: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <select
                    value={formData.empresa_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, empresa_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas as empresas</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.nome} ({empresa.codigo_agencia})
                      </option>
                    ))}
                  </select>
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
                    Promoção ativa
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingPromocao(null)
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
                    {editingPromocao ? 'Atualizar' : 'Criar'}
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

export default Promocoes