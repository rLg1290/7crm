import React, { useState, useEffect, useRef } from 'react'
import { Users, Search, Plus, Mail, Phone, Edit, Trash2, X, ChevronLeft, ChevronRight, FileText, User, MessageCircle, Calendar, CreditCard, Globe } from 'lucide-react'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface Cliente {
  id: number
  nome: string
  email: string
  telefone: string
  data_nascimento: string | null
  cpf: string
  rg?: string
  passaporte?: string
  data_expedicao?: string
  data_expiracao?: string
  nacionalidade: string
  rede_social?: string
  observacoes?: string
  empresa_id: string
  created_at: string
}

interface NovoClienteForm {
  nome: string
  dataNascimento: string
  cpf: string
  rg: string
  passaporte: string
  dataExpedicao: string
  dataExpiracao: string
  nacionalidade: string
  email: string
  telefone: string
  redeSocial: string
  observacoes: string
}

interface ClientesProps {
  user: SupabaseUser
}

const Clientes: React.FC<ClientesProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingClient, setViewingClient] = useState<Cliente | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [editingClient, setEditingClient] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState<NovoClienteForm>({
    nome: '',
    dataNascimento: '',
    cpf: '',
    rg: '',
    passaporte: '',
    dataExpedicao: '',
    dataExpiracao: '',
    nacionalidade: 'Brasileira',
    email: '',
    telefone: '',
    redeSocial: '',
    observacoes: ''
  })

  const lastEmpresaIdRef = useRef<string | null>(null)

  const steps = [
    { number: 1, title: 'Documentos', icon: FileText, description: 'Dados pessoais e documentação' },
    { number: 2, title: 'Contato', icon: User, description: 'Informações de contato e endereço' },
    { number: 3, title: 'Observações', icon: MessageCircle, description: 'Notas e preferências' }
  ]

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

  // Salvar cliente no Supabase
  const salvarCliente = async () => {
    setLoading(true)
    
    try {
      const empresaId = user.user_metadata?.empresa_id
      
      if (!empresaId) {
        logger.error('❌ Empresa ID não encontrado nos metadados', user.user_metadata)
        alert('Erro: Empresa ID não encontrado. Faça login novamente.')
        setLoading(false)
        return
      }
      
      logger.debug('💾 Salvando cliente para empresa', { empresaId })
      
      const clienteData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        data_nascimento: formData.dataNascimento,
        cpf: formData.cpf,
        rg: formData.rg || null,
        passaporte: formData.passaporte || null,
        data_expedicao: formData.dataExpedicao || null,
        data_expiracao: formData.dataExpiracao || null,
        nacionalidade: formData.nacionalidade,
        rede_social: formData.redeSocial || null,
        observacoes: formData.observacoes || null,
        empresa_id: empresaId
      }

      logger.debug('📄 Dados do cliente a serem salvos', clienteData)

      const { data, error } = await supabase
        .from('clientes')
        .insert([clienteData])
        .select()

      if (error) {
        logger.error('❌ Erro ao salvar cliente', error)
        alert('Erro ao salvar cliente: ' + error.message)
        return
      }

      logger.info('✅ Cliente salvo com sucesso', { count: Array.isArray(data) ? data.length : 0 })

      // Recarregar a lista de clientes
      await fetchClientes()
      
      // Fechar modal e resetar formulário
      handleCloseModal()
      
      alert('Cliente salvo com sucesso! 🎉')
    } catch (error) {
      logger.error('💥 Erro inesperado ao salvar cliente', error)
      alert('Erro inesperado ao salvar cliente.')
    } finally {
      setLoading(false)
    }
  }

  // Editar cliente no Supabase
  const editarCliente = async () => {
    setLoading(true)
    
    try {
      const empresaId = user.user_metadata?.empresa_id
      
      if (!empresaId) {
        logger.error('❌ Empresa ID não encontrado nos metadados', user.user_metadata)
        alert('Erro: Empresa ID não encontrado. Faça login novamente.')
        setLoading(false)
        return
      }
      
      if (!editingClient) {
        logger.error('❌ Cliente para edição não encontrado')
        alert('Erro: Cliente para edição não encontrado.')
        setLoading(false)
        return
      }
      
      logger.debug('✏️ Editando cliente', { id: editingClient.id })
      
      const clienteData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        data_nascimento: formData.dataNascimento,
        cpf: formData.cpf,
        rg: formData.rg || null,
        passaporte: formData.passaporte || null,
        data_expedicao: formData.dataExpedicao || null,
        data_expiracao: formData.dataExpiracao || null,
        nacionalidade: formData.nacionalidade,
        rede_social: formData.redeSocial || null,
        observacoes: formData.observacoes || null
      }

      logger.debug('📄 Dados do cliente a serem atualizados', clienteData)

      const { data, error } = await supabase
        .from('clientes')
        .update(clienteData)
        .eq('id', editingClient.id)
        .eq('empresa_id', empresaId) // Segurança extra
        .select()

      if (error) {
        logger.error('❌ Erro ao editar cliente', error)
        alert('Erro ao editar cliente: ' + error.message)
        return
      }

      logger.info('✅ Cliente editado com sucesso', { count: Array.isArray(data) ? data.length : 0 })

      // Recarregar a lista de clientes
      await fetchClientes()
      
      // Limpar estado de edição e fechar modal
      setEditingClient(null)
      handleCloseModal()
      
      alert('Cliente editado com sucesso! ✏️')
    } catch (error) {
      logger.error('💥 Erro inesperado ao editar cliente', error)
      alert('Erro inesperado ao editar cliente.')
    } finally {
      setLoading(false)
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
    setCurrentStep(1)
    setFormData({
      nome: '',
      dataNascimento: '',
      cpf: '',
      rg: '',
      passaporte: '',
      dataExpedicao: '',
      dataExpiracao: '',
      nacionalidade: 'Brasileira',
      email: '',
      telefone: '',
      redeSocial: '',
      observacoes: '',
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setCurrentStep(1)
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

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Função para editar cliente
  const handleEditClient = (cliente: Cliente) => {
    setEditingClient(cliente)
    
    // Preencher o formulário com os dados do cliente
    setFormData({
      nome: `${cliente.nome}`,
      dataNascimento: cliente.data_nascimento || '',
      cpf: cliente.cpf,
      rg: cliente.rg || '',
      passaporte: cliente.passaporte || '',
      dataExpedicao: cliente.data_expedicao || '',
      dataExpiracao: cliente.data_expiracao || '',
      nacionalidade: cliente.nacionalidade,
      email: cliente.email,
      telefone: cliente.telefone,
      redeSocial: cliente.rede_social || '',
      observacoes: cliente.observacoes || ''
    })
    
    setCurrentStep(1)
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

  // Função para aplicar máscara no CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  // Função para aplicar máscara no telefone
  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    let formattedValue = value
    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (name === 'telefone') {
      formattedValue = formatTelefone(value)
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }))
  }

  const handleSubmit = () => {
    // Validar campos obrigatórios
    const camposObrigatorios = {
      nome: 'Nome completo é obrigatório',
      dataNascimento: 'Data de nascimento é obrigatória',
      cpf: 'CPF é obrigatório',
      email: 'Email é obrigatório',
      telefone: 'Telefone é obrigatório'
    }

    const erros = []
    
    for (const [campo, mensagem] of Object.entries(camposObrigatorios)) {
      if (!formData[campo as keyof NovoClienteForm] || formData[campo as keyof NovoClienteForm].trim() === '') {
        erros.push(mensagem)
      }
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      erros.push('Email deve ter um formato válido')
    }

    // Validar CPF (deve ter 14 caracteres com pontos e hífen)
    if (formData.cpf && formData.cpf.length !== 14) {
      erros.push('CPF deve ser preenchido completamente')
    }

    if (erros.length > 0) {
      alert('Por favor, corrija os seguintes erros:\n\n' + erros.join('\n'))
      return
    }

    console.log('✅ Dados do cliente validados:', formData)
    
    // Verificar se está editando ou criando
    if (editingClient) {
      editarCliente()
    } else {
      salvarCliente()
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Documentos e Dados Pessoais</h4>
            
            {/* Nome completo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Data de Nascimento e CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataNascimento" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Nascimento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={formData.dataNascimento}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
                  CPF <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </div>
              </div>
            </div>

            {/* RG e Passaporte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rg" className="block text-sm font-medium text-gray-700 mb-2">
                  RG
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="rg"
                    name="rg"
                    value={formData.rg}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Digite o RG"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="passaporte" className="block text-sm font-medium text-gray-700 mb-2">
                  Passaporte
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="passaporte"
                    name="passaporte"
                    value={formData.passaporte}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    placeholder="Digite o número do passaporte"
                  />
                </div>
              </div>
            </div>

            {/* Datas de Expedição e Expiração */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dataExpedicao" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Expedição
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="dataExpedicao"
                    name="dataExpedicao"
                    value={formData.dataExpedicao}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="dataExpiracao" className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Expiração
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="dataExpiracao"
                    name="dataExpiracao"
                    value={formData.dataExpiracao}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Nacionalidade */}
            <div>
              <label htmlFor="nacionalidade" className="block text-sm font-medium text-gray-700 mb-2">
                Nacionalidade
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="nacionalidade"
                  name="nacionalidade"
                  value={formData.nacionalidade}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Digite a nacionalidade"
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Informações de Contato</h4>
            
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-mail <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Digite o e-mail"
                  required
                />
              </div>
            </div>

            {/* Telefone */}
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                Telefone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>
            </div>

            {/* Rede Social */}
            <div>
              <label htmlFor="redeSocial" className="block text-sm font-medium text-gray-700 mb-2">
                Rede Social
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="redeSocial"
                  name="redeSocial"
                  value={formData.redeSocial}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="@usuario ou link da rede social"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ex: @joaosilva, instagram.com/joaosilva, linkedin.com/in/joao-silva
              </p>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Observações e Preferências</h4>
            
            {/* Observações */}
            <div>
              <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={6}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-vertical"
                  placeholder="Digite aqui quaisquer observações sobre o cliente: preferências de viagem, restrições alimentares, necessidades especiais, histórico de viagens, contatos de emergência, ou qualquer informação relevante..."
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Use este espaço livremente para anotar informações importantes sobre o cliente que possam ajudar no atendimento personalizado.
              </p>
            </div>
          </div>
        )
      default:
        return null
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Indicador de Etapas */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = step.number === currentStep
                  const isCompleted = step.number < currentStep
                  
                  return (
                    <div key={step.number} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                          isActive 
                            ? 'bg-purple-600 border-purple-600 text-white' 
                            : isCompleted 
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="mt-2 text-center">
                          <div className={`text-sm font-medium ${
                            isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.title}
                          </div>
                          <div className="text-xs text-gray-500 max-w-24">
                            {step.description}
                          </div>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-4 ${
                          step.number < currentStep ? 'bg-green-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Conteúdo da Etapa */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {renderStepContent()}
            </div>

            {/* Footer com Botões */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                
                {currentStep === 3 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingClient ? 'Salvando...' : 'Salvando...'}
                      </>
                    ) : (
                      editingClient ? 'Salvar Alterações' : 'Salvar Cliente'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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
