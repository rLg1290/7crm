import React, { useState, useEffect, useRef } from 'react'
import { Users, Search, Plus, Mail, Phone, Edit, Trash2, X, FileText, User, MessageCircle, Calendar, CreditCard, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'
import { User as SupabaseUser } from '@supabase/supabase-js'
import ClientModal from '../components/ClientModal'
import { Cliente } from '../types/cliente'

interface ClientesProps {
  user: SupabaseUser
}

const Clientes: React.FC<ClientesProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingClient, setViewingClient] = useState<Cliente | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(false)

  const lastEmpresaIdRef = useRef<string | null>(null)

  // Buscar clientes da empresa do usuário logado
  const fetchClientes = async () => {
    try {
      const empresaId = user.user_metadata?.empresa_id
      
      if (!empresaId) {
        logger.error('Empresa ID não encontrado nos metadados do usuário')
        return
      }
      
      logger.debug('🔍 Buscando clientes para empresa', { empresaId })
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('❌ Erro ao buscar clientes', error)
        return
      }

      logger.debug('✅ Clientes encontrados', { total: data?.length || 0 })
      setClientes(data || [])
    } catch (error) {
      logger.error('💥 Erro inesperado ao buscar clientes', error)
    }
  }

  // Carregar clientes ao montar o componente
  useEffect(() => {
    const empresaId = user?.user_metadata?.empresa_id || null
    // Evitar efeito duplicado em desenvolvimento (React 18 StrictMode)
    if (import.meta.env.DEV && lastEmpresaIdRef.current === empresaId) {
      logger.debug('StrictMode dev: evitando re-fetch duplicado de clientes', { empresaId })
      return
    }
    lastEmpresaIdRef.current = empresaId
    fetchClientes()
  }, [user])

  // Função para formatar data evitando problemas de timezone
  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'Data não informada'
    }
    
    try {
      // Cria a data como local ao invés de UTC para evitar problemas de timezone
      const [year, month, day] = dateString.split('T')[0].split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('pt-BR')
    } catch (error) {
      logger.error('Erro ao formatar data', { dateString, error })
      return 'Data inválida'
    }
  }

  // Filtrar clientes baseado na busca
  const clientesFiltrados = clientes.filter(cliente => {
    const searchLower = searchTerm.toLowerCase().trim()
    
    // Se não há busca, retorna todos
    if (!searchTerm.trim()) {
      return true
    }
    
    // Formatação da data para busca
    const dataFormatada = cliente.data_nascimento ? formatDate(cliente.data_nascimento) : ''
    
    // Concatenar nome completo para busca mais eficiente
    const nomeCompleto = `${cliente.nome || ''}`.toLowerCase()
    
    // Verificações de busca com validação mais robusta
    const nomeMatch = cliente.nome ? cliente.nome.toLowerCase().includes(searchLower) : false
    const nomeCompletoMatch = nomeCompleto.includes(searchLower)
    const emailMatch = cliente.email ? cliente.email.toLowerCase().includes(searchLower) : false
    const telefoneMatch = cliente.telefone ? cliente.telefone.toLowerCase().includes(searchLower) : false
    const dataMatch = dataFormatada.includes(searchTerm) || (cliente.data_nascimento ? cliente.data_nascimento.includes(searchTerm) : false)
    const cpfMatch = cliente.cpf ? (cliente.cpf.includes(searchTerm) || cliente.cpf.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))) : false
    const redeMatch = cliente.rede_social ? cliente.rede_social.toLowerCase().includes(searchLower) : false
    
    return nomeMatch || nomeCompletoMatch || emailMatch || telefoneMatch || dataMatch || cpfMatch || redeMatch
  })

  const handleOpenModal = () => {
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClient(null)
  }

  // Função para abrir modal de visualização
  const handleViewClient = (cliente: Cliente) => {
    setViewingClient(cliente)
    setShowViewModal(true)
  }

  // Função para fechar modal de visualização
  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setViewingClient(null)
  }

  // Função para editar cliente
  const handleEditClient = (cliente: Cliente) => {
    setEditingClient(cliente)
    setShowModal(true)
  }

  // Função para excluir cliente com confirmação
  const handleDeleteClient = async (cliente: Cliente) => {
    const confirmacao = window.confirm(
      `⚠️ Tem certeza que deseja excluir o cliente "${cliente.nome}"?\n\nEsta ação não pode ser desfeita.`
    )
    
    if (!confirmacao) {
      return
    }

    try {
      setLoading(true)
      logger.debug('🗑️ Verificando dependências do cliente', { clienteId: cliente.id })

      // Verificar se o cliente tem contas a receber
      const { data: contasReceber, error: contasError } = await supabase
        .from('contas_receber')
        .select('id, valor, vencimento, status')
        .eq('cliente_id', cliente.id)

      if (contasError) {
        logger.error('❌ Erro ao verificar contas a receber', contasError)
        alert('Erro ao verificar dependências do cliente.')
        return
      }

      // Se tem contas a receber, mostrar aviso
      if (contasReceber && contasReceber.length > 0) {
        const totalContas = contasReceber.length
        const valorTotal = contasReceber.reduce((total, conta) => total + (conta.valor || 0), 0)
        
        const mensagem = `Este cliente possui ${totalContas} conta(s) a receber no valor total de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}.\n\nPara excluir o cliente, você precisa primeiro:\n1. Excluir todas as contas a receber vinculadas, ou\n2. Alterar o cliente das contas a receber para outro cliente.\n\nDeseja continuar mesmo assim?`
        
        if (!confirm(mensagem)) {
          setLoading(false)
          return
        }
      }

      logger.debug('🗑️ Excluindo cliente', { id: cliente.id })

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id)

      if (error) {
        logger.error('❌ Erro ao excluir cliente', error)
        
        if (error.code === '23503') {
          const opcao = confirm('Não é possível excluir este cliente porque ele possui contas a receber vinculadas.\n\nDeseja visualizar as contas a receber deste cliente?')
          if (opcao) {
            visualizarContasReceber(cliente.id, `${cliente.nome}`)
          }
        } else {
          alert('Erro ao excluir cliente. Tente novamente.')
        }
        return
      }

      logger.info('✅ Cliente excluído com sucesso', { id: cliente.id })
      
      // Remover cliente da lista local
      setClientes(prev => prev.filter(c => c.id !== cliente.id))
      
      alert('Cliente excluído com sucesso!')
    } catch (error) {
      logger.error('💥 Erro inesperado ao excluir cliente', error)
      alert('Erro inesperado ao excluir cliente.')
    } finally {
      setLoading(false)
    }
  }

  // Função para visualizar contas a receber do cliente
  const visualizarContasReceber = async (clienteId: number, nomeCliente: string) => {
    try {
      const { data: contasReceber, error } = await supabase
        .from('contas_receber')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('vencimento', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar contas a receber:', error)
        alert('Erro ao buscar contas a receber.')
        return
      }

      if (!contasReceber || contasReceber.length === 0) {
        alert('Este cliente não possui contas a receber.')
        return
      }

      const totalContas = contasReceber.length
      const valorTotal = contasReceber.reduce((total, conta) => total + (conta.valor || 0), 0)
      
      let mensagem = `Contas a receber do cliente "${nomeCliente}":\n\n`
      mensagem += `Total: ${totalContas} conta(s) - Valor total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}\n\n`
      
      contasReceber.forEach((conta, index) => {
        const dataVencimento = new Date(conta.vencimento).toLocaleDateString('pt-BR')
        const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor || 0)
        mensagem += `${index + 1}. Vencimento: ${dataVencimento} - Valor: ${valor} - Status: ${conta.status || 'Pendente'}\n`
      })
      
      mensagem += '\nPara excluir o cliente, você precisa primeiro remover ou alterar estas contas a receber.'
      
      alert(mensagem)
    } catch (error) {
      console.error('💥 Erro ao visualizar contas a receber:', error)
      alert('Erro ao visualizar contas a receber.')
    }
  }



  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg border border-purple-200">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
                <p className="text-gray-600 mt-1">Gerencie sua base de clientes</p>
              </div>
            </div>
            
            {/* Botão Novo Cliente */}
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Cliente
            </button>
          </div>

          {/* Barra de Busca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone, CPF ou data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {clientesFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Tente ajustar sua busca ou limpar o filtro.'
                  : 'Comece adicionando seu primeiro cliente.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Nascimento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPF
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            onClick={() => handleViewClient(cliente)}
                            className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors cursor-pointer underline-offset-2 hover:underline"
                          >
                            {cliente.nome}
                          </button>
                          {cliente.rede_social && (
                            <div className="text-sm text-gray-500">{cliente.rede_social}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {cliente.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {cliente.telefone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(cliente.data_nascimento)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                          {cliente.cpf}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleEditClient(cliente)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Editar cliente"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClient(cliente)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Excluir cliente"
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
          )}
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Resultados da Busca</p>
                <p className="text-2xl font-bold text-gray-900">{clientesFiltrados.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Plus className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Novos este Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clientes.filter(cliente => {
                    const cadastro = new Date(cliente.created_at)
                    const agora = new Date()
                    return cadastro.getMonth() === agora.getMonth() && cadastro.getFullYear() === agora.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Novo Cliente */}
      {showModal && (
        <ClientModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSuccess={() => {
            fetchClientes()
          }}
          user={user}
          clienteToEdit={editingClient}
        />
      )}

      {/* Modal de Visualização do Cliente */}
      {showViewModal && viewingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Dados do Cliente
              </h3>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {/* Dados Pessoais */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-purple-600" />
                    Dados Pessoais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {viewingClient.nome}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {formatDate(viewingClient.data_nascimento)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {viewingClient.cpf}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidade</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {viewingClient.nacionalidade}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentos */}
                {(viewingClient.rg || viewingClient.passaporte) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-purple-600" />
                      Documentos
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingClient.rg && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {viewingClient.rg}
                          </div>
                        </div>
                      )}
                      {viewingClient.passaporte && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Passaporte</label>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {viewingClient.passaporte}
                          </div>
                        </div>
                      )}
                      {viewingClient.data_expedicao && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Expedição</label>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {formatDate(viewingClient.data_expedicao)}
                          </div>
                        </div>
                      )}
                      {viewingClient.data_expiracao && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Expiração</label>
                          <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                            {formatDate(viewingClient.data_expiracao)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contato */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-purple-600" />
                    Contato
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {viewingClient.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {viewingClient.telefone}
                      </div>
                    </div>
                    {viewingClient.rede_social && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rede Social</label>
                        <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-gray-400" />
                          {viewingClient.rede_social}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                {viewingClient.observacoes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2 text-purple-600" />
                      Observações
                    </h4>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {viewingClient.observacoes}
                    </div>
                  </div>
                )}

                {/* Data de Cadastro */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    Informações do Sistema
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Cadastro</label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {new Date(viewingClient.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer com Botões */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseViewModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    handleCloseViewModal()
                    handleEditClient(viewingClient)
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clientes
