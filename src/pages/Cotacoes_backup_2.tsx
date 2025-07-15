import React, { useState } from 'react'
import { FileText, Plus, User, Calendar, Eye, Edit, Trash2, MoreVertical, Clock, CheckCircle, XCircle, AlertCircle, Target, GripVertical, Plane, Building, MapPin, Route, Users, DollarSign, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface Cotacao {
  id: string
  titulo: string
  cliente: string
  valor: number | null
  dataViagem: string
  dataCriacao: string
  status: 'LEAD' | 'COTAR' | 'AGUARDANDO_CLIENTE' | 'APROVADO' | 'REPROVADO'
  destino: string
  observacoes?: string
}

interface Passageiro {
  id: string
  nome: string
  tipo: 'adulto' | 'crianca' | 'bebe'
  cliente_id?: string // ID do cliente se foi selecionado da lista
  isNovoCliente: boolean
  dataNascimento?: string
  documento?: string
  tipoDocumento?: 'cpf' | 'passaporte'
}

interface Voo {
  id: string
  direcao: 'IDA' | 'VOLTA' | 'INTERNO'
  origem: string
  destino: string
  dataIda: string
  dataVolta?: string
  classe: string
  companhia: string
  numeroVoo: string
  horarioPartida: string
  horarioChegada: string
  observacoes?: string
  preenchimentoAutomatico: boolean
  // Novos campos detalhados
  localizador?: string
  duracao?: string
  numeroCompra?: string
  aberturaCheckin?: string
  bagagemDespachada?: string
  bagagemMao?: string
}

interface FormularioCotacao {
  // Dados gerais
  titulo: string
  cliente: string
  status: 'LEAD' | 'COTAR' | 'AGUARDANDO_CLIENTE' | 'APROVADO' | 'REPROVADO'
  
  // Passageiros
  numeroAdultos: number
  numeroCriancas: number
  numeroBebes: number
  
  // Vôos - nova estrutura com array de voos
  voos: Voo[]
  
  // Hotéis
  nomeHotel: string
  categoria: string
  tipoQuarto: string
  regime: string
  observacoesHotel: string
  
  // Serviços
  traslados: boolean
  passeios: string
  guia: boolean
  seguroViagem: boolean
  observacoesServicos: string
  
  // Roteiro
  diasViagem: number
  itinerario: string
  pontosInteresse: string
  observacoesRoteiro: string
  
  // Passageiros - nova estrutura
  passageiros: Passageiro[]
  observacoesPassageiros: string
  
  // Venda
  valorTotal: number
  valorEntrada: number
  formaPagamento: string
  observacoesVenda: string
}

interface CotacoesProps {
  user: SupabaseUser
}

const Cotacoes: React.FC<CotacoesProps> = ({ user }) => {
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([
    {
      id: '1',
      titulo: 'Viagem para Paris',
      cliente: 'João Silva',
      valor: 8500,
      dataViagem: '2024-03-15',
      dataCriacao: '2024-01-10',
      status: 'LEAD',
      destino: 'Paris, França',
      observacoes: 'Cliente interessado em lua de mel'
    },
    {
      id: '2', 
      titulo: 'Pacote Disney',
      cliente: 'Maria Santos',
      valor: null,
      dataViagem: '2024-04-20',
      dataCriacao: '2024-01-12',
      status: 'COTAR',
      destino: 'Orlando, EUA',
      observacoes: 'Família com 2 crianças'
    },
    {
      id: '3',
      titulo: 'Cruzeiro Caribe',
      cliente: 'Pedro Costa',
      valor: 12500,
      dataViagem: '2024-05-10',
      dataCriacao: '2024-01-08',
      status: 'AGUARDANDO_CLIENTE',
      destino: 'Caribe',
      observacoes: 'Aguardando confirmação da data'
    },
    {
      id: '4',
      titulo: 'Turismo Rural',
      cliente: 'Ana Oliveira',
      valor: 3200,
      dataViagem: '2024-02-28',
      dataCriacao: '2024-01-05',
      status: 'APROVADO',
      destino: 'Serra da Mantiqueira',
      observacoes: 'Pagamento confirmado'
    }
  ])

  const [showModal, setShowModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [editingCotacao, setEditingCotacao] = useState<Cotacao | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingCotacao, setViewingCotacao] = useState<Cotacao | null>(null)
  const [filtroData, setFiltroData] = useState<'mes' | '3meses' | '6meses' | 'ano' | 'total'>('total')
  const [voosSalvos, setVoosSalvos] = useState<Voo[]>([])
  const [incluirHotel, setIncluirHotel] = useState(false)
  const [incluirServicos, setIncluirServicos] = useState(false)
  
  // Lista de clientes simulada (posteriormente virá do Supabase)
  const [clientesExistentes] = useState([
    { id: '1', nome: 'João Silva' },
    { id: '2', nome: 'Maria Santos' },
    { id: '3', nome: 'Pedro Costa' },
    { id: '4', nome: 'Ana Oliveira' },
    { id: '5', nome: 'Carlos Rodrigues' },
    { id: '6', nome: 'Fernanda Lima' }
  ])
  
  const [formData, setFormData] = useState<FormularioCotacao>({
    // Dados gerais
    titulo: '',
    cliente: '',
    status: 'LEAD',
    
    // Passageiros
    numeroAdultos: 1,
    numeroCriancas: 0,
    numeroBebes: 0,
    
    // Vôos - nova estrutura com array de voos
    voos: [],
    
    // Hotéis
    nomeHotel: '',
    categoria: '',
    tipoQuarto: '',
    regime: '',
    observacoesHotel: '',
    
    // Serviços
    traslados: true,
    passeios: '',
    guia: false,
    seguroViagem: true,
    observacoesServicos: '',
    
    // Roteiro
    diasViagem: 7,
    itinerario: '',
    pontosInteresse: '',
    observacoesRoteiro: '',
    
    // Passageiros - nova estrutura
    passageiros: [],
    observacoesPassageiros: '',
    
    // Venda
    valorTotal: 0,
    valorEntrada: 0,
    formaPagamento: 'À vista',
    observacoesVenda: ''
  })

  // Função para adicionar um novo voo
  const adicionarVoo = () => {
    if (formData.voos.length >= 10) {
      alert('Máximo de 10 voos permitidos')
      return
    }
    
    const novoVoo: Voo = {
      id: Date.now().toString(),
      direcao: 'IDA',
      origem: '',
      destino: '',
      dataIda: '',
      classe: '',
      companhia: '',
      numeroVoo: '',
      horarioPartida: '',
      horarioChegada: '',
      observacoes: '',
      preenchimentoAutomatico: false
    }
    
    setFormData(prev => ({
      ...prev,
      voos: [...prev.voos, novoVoo]
    }))
  }

  // Função para buscar dados do voo via API
  const buscarDadosVooAPI = async (numeroVoo: string, data: string) => {
    try {
      console.log('🔍 Buscando dados do voo:', numeroVoo, 'para data:', data)
      
      // Simulação de chamada API - será implementada depois
      const dadosSimulados = {
        origem: 'São Paulo (GRU)',
        destino: 'Rio de Janeiro (GIG)',
        companhia: 'LATAM',
        horarioPartida: '08:30',
        horarioChegada: '09:45',
        classe: 'Econômica'
      }
      
      // Aguardar um pouco para simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return dadosSimulados
    } catch (error) {
      console.error('❌ Erro ao buscar dados do voo:', error)
      throw new Error('Falha ao buscar dados do voo. Tente preenchimento manual.')
    }
  }

  // Função para preencher dados automaticamente
  const preencherDadosAutomatico = async (vooId: string) => {
    const voo = formData.voos.find(v => v.id === vooId)
    if (!voo || !voo.numeroVoo) {
      alert('⚠️ Informe o número do voo para busca automática.')
      return
    }
    
    // Verificar se tem a data correta baseada na direção
    const dataNecessaria = voo.direcao === 'VOLTA' ? voo.dataVolta : voo.dataIda
    if (!dataNecessaria) {
      alert(`⚠️ Informe a ${voo.direcao === 'VOLTA' ? 'data de volta' : 'data de ida'} para busca automática.`)
      return
    }
    
    try {
      const dados = await buscarDadosVooAPI(voo.numeroVoo, dataNecessaria)
      
      setFormData(prev => ({
        ...prev,
        voos: prev.voos.map(v => 
          v.id === vooId ? {
            ...v,
            origem: dados.origem,
            destino: dados.destino,
            companhia: dados.companhia,
            horarioPartida: dados.horarioPartida,
            horarioChegada: dados.horarioChegada,
            classe: dados.classe
          } : v
        )
      }))
      
      alert('✅ Dados do voo preenchidos automaticamente!')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao buscar dados do voo.')
    }
  }

  // Função para remover um voo
  const removerVoo = (vooId: string) => {
    setFormData(prev => ({
      ...prev,
      voos: prev.voos.filter(voo => voo.id !== vooId)
    }))
  }

  // Função para atualizar um voo específico
  const atualizarVoo = (vooId: string, campo: keyof Voo, valor: any) => {
    setFormData(prev => ({
      ...prev,
      voos: prev.voos.map(voo => 
        voo.id === vooId ? { ...voo, [campo]: valor } : voo
      )
    }))
  }

  const steps = [
    { number: 1, title: 'Vôos', icon: Plane, description: 'Informações sobre passagens aéreas' },
    { number: 2, title: 'Hotéis', icon: Building, description: 'Hospedagem e acomodações' },
    { number: 3, title: 'Serviços', icon: MapPin, description: 'Serviços adicionais e extras' },
    { number: 4, title: 'Roteiro', icon: Route, description: 'Itinerário e pontos de interesse' },
    { number: 5, title: 'Passageiros', icon: Users, description: 'Informações dos viajantes' },
    { number: 6, title: 'Venda', icon: DollarSign, description: 'Valores e condições comerciais' }
  ]

  const colunas = [
    {
      id: 'LEAD',
      titulo: 'LEAD',
      cor: 'bg-blue-50 border-blue-200',
      corHeader: 'bg-blue-100 text-blue-800',
      icone: Target
    },
    {
      id: 'COTAR',
      titulo: 'COTAR',
      cor: 'bg-yellow-50 border-yellow-200',
      corHeader: 'bg-yellow-100 text-yellow-800',
      icone: FileText
    },
    {
      id: 'AGUARDANDO_CLIENTE',
      titulo: 'AGUARDANDO CLIENTE',
      cor: 'bg-purple-50 border-purple-200',
      corHeader: 'bg-purple-100 text-purple-800',
      icone: Clock
    },
    {
      id: 'APROVADO',
      titulo: 'APROVADO',
      cor: 'bg-green-50 border-green-200',
      corHeader: 'bg-green-100 text-green-800',
      icone: CheckCircle
    },
    {
      id: 'REPROVADO',
      titulo: 'REPROVADO',
      cor: 'bg-red-50 border-red-200',
      corHeader: 'bg-red-100 text-red-800',
      icone: XCircle
    }
  ]

  const getCotacoesPorStatus = (status: string) => {
    const cotacoesFiltradas = filtrarCotacoesPorData(cotacoes)
    return cotacoesFiltradas.filter(cotacao => cotacao.status === status)
  }

  const getTotalPorStatus = (status: string) => {
    const cotacoesColuna = getCotacoesPorStatus(status)
    const total = cotacoesColuna.reduce((acc, cotacao) => {
      return acc + (cotacao.valor || 0)
    }, 0)
    return total
  }

  const formatarMoeda = (valor: number | null) => {
    if (!valor) return 'A cotar'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarMoedaTotal = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  // Função para filtrar cotações por data de criação
  const filtrarCotacoesPorData = (cotacoes: Cotacao[]) => {
    if (filtroData === 'total') return cotacoes

    const hoje = new Date()
    const dataLimite = new Date()

    switch (filtroData) {
      case 'mes':
        dataLimite.setMonth(hoje.getMonth() - 1)
        break
      case '3meses':
        dataLimite.setMonth(hoje.getMonth() - 3)
        break
      case '6meses':
        dataLimite.setMonth(hoje.getMonth() - 6)
        break
      case 'ano':
        dataLimite.setFullYear(hoje.getFullYear() - 1)
        break
      default:
        return cotacoes
    }

    return cotacoes.filter(cotacao => {
      const dataCotacao = new Date(cotacao.dataCriacao)
      return dataCotacao >= dataLimite
    })
  }

  // Funções do Drag & Drop
  const handleDragStart = (e: React.DragEvent, cotacaoId: string) => {
    setDraggedItem(cotacaoId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', cotacaoId)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Simples verificação se saiu da coluna
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    ) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (e: React.DragEvent, novoStatus: string) => {
    e.preventDefault()
    const cotacaoId = e.dataTransfer.getData('text/plain')
    
    if (cotacaoId) {
      setCotacoes(prevCotacoes => 
        prevCotacoes.map(cotacao => 
          cotacao.id === cotacaoId 
            ? { ...cotacao, status: novoStatus as Cotacao['status'] }
            : cotacao
        )
      )
      
      const cotacao = cotacoes.find(c => c.id === cotacaoId)
      if (cotacao) {
        console.log(`✅ Cotação "${cotacao.titulo}" movida para "${novoStatus}"`)
      }
    }
    
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  // Funções para CRUD das Cotações
  const handleViewCotacao = (cotacao: Cotacao) => {
    console.log('👁️ Visualizando cotação:', cotacao.titulo)
    setViewingCotacao(cotacao)
    setShowViewModal(true)
  }

  const handleEditCotacao = (cotacao: Cotacao) => {
    console.log('✏️ Editando cotação:', cotacao.titulo)
    setEditingCotacao(cotacao)
    
    // Preencher formulário com dados da cotação (implementação futura)
    // Por enquanto, apenas abrimos o modal de criação
    setCurrentStep(1)
    setShowModal(true)
  }

  const handleDeleteCotacao = async (cotacao: Cotacao) => {
    const confirmacao = window.confirm(
      `⚠️ Tem certeza que deseja excluir a cotação "${cotacao.titulo}"?\n\nEsta ação não pode ser desfeita.`
    )
    
    if (!confirmacao) {
      return
    }

    try {
      setLoading(true)
      console.log('🗑️ Excluindo cotação:', cotacao.id)

      // Simular exclusão (futuramente será via Supabase)
      setCotacoes(prev => prev.filter(c => c.id !== cotacao.id))
      
      console.log('✅ Cotação excluída com sucesso')
      alert(`Cotação "${cotacao.titulo}" excluída com sucesso! 🗑️`)
    } catch (error) {
      console.error('💥 Erro inesperado ao excluir:', error)
      alert('Erro inesperado ao excluir cotação.')
    } finally {
      setLoading(false)
    }
  }

  // Funções do Modal
  const handleOpenModal = (statusInicial?: 'LEAD' | 'COTAR' | 'AGUARDANDO_CLIENTE' | 'APROVADO' | 'REPROVADO') => {
    setShowModal(true)
    setCurrentStep(1)
    setEditingCotacao(null)
    // Reset do formulário
    setFormData({
      titulo: '',
      cliente: '',
      status: statusInicial || 'LEAD',
      numeroAdultos: 1,
      numeroCriancas: 0,
      numeroBebes: 0,
      voos: [],
      nomeHotel: '',
      categoria: '',
      tipoQuarto: '',
      regime: '',
      observacoesHotel: '',
      traslados: true,
      passeios: '',
      guia: false,
      seguroViagem: true,
      observacoesServicos: '',
      diasViagem: 7,
      itinerario: '',
      pontosInteresse: '',
      observacoesRoteiro: '',
      passageiros: [],
      observacoesPassageiros: '',
      valorTotal: 0,
      valorEntrada: 0,
      formaPagamento: 'À vista',
      observacoesVenda: ''
    })
  }

  const handleOpenModalFromColumn = (status: 'LEAD' | 'COTAR' | 'AGUARDANDO_CLIENTE' | 'APROVADO' | 'REPROVADO') => {
    console.log(`🎯 Criando nova cotação na coluna: ${status}`)
    handleOpenModal(status)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setCurrentStep(1)
    setEditingCotacao(null)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setViewingCotacao(null)
  }

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (type === 'number') {
      const numValue = Number(value)
      
      // Validação para limite total de passageiros (máximo 9)
      if (name === 'numeroAdultos' || name === 'numeroCriancas' || name === 'numeroBebes') {
        let totalPassageiros = formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes
        
        if (name === 'numeroAdultos') {
          totalPassageiros = numValue + formData.numeroCriancas + formData.numeroBebes
        } else if (name === 'numeroCriancas') {
          totalPassageiros = formData.numeroAdultos + numValue + formData.numeroBebes
        } else if (name === 'numeroBebes') {
          totalPassageiros = formData.numeroAdultos + formData.numeroCriancas + numValue
        }
        
        if (totalPassageiros > 9) {
          alert('⚠️ O número total de passageiros não pode exceder 9 pessoas.')
          return
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = () => {
    setLoading(true)
    
    // Validação básica
    if (!formData.titulo.trim()) {
      alert('⚠️ Por favor, informe o título da cotação.')
      setLoading(false)
      return
    }
    
    if (!formData.cliente || formData.cliente === '__novo__') {
      alert('⚠️ Por favor, selecione ou informe um cliente.')
      setLoading(false)
      return
    }
    
    if (formData.voos.length === 0) {
      alert('⚠️ Por favor, adicione pelo menos um voo.')
      setLoading(false)
      return
    }
    
    // Validar se todos os voos têm os campos obrigatórios
    const voosInvalidos = formData.voos.filter(voo => 
      !voo.origem || !voo.destino || !voo.classe || 
      !voo.companhia || !voo.numeroVoo || !voo.horarioPartida || !voo.horarioChegada ||
      (voo.direcao === 'IDA' && !voo.dataIda) ||
      (voo.direcao === 'INTERNO' && !voo.dataIda) ||
      (voo.direcao === 'VOLTA' && !voo.dataVolta)
    )
    
    if (voosInvalidos.length > 0) {
      alert('⚠️ Por favor, preencha todos os campos obrigatórios dos voos.')
      setLoading(false)
      return
    }
    
    // Simular salvamento
    setTimeout(() => {
      console.log('✅ Cotação criada:', formData)
      
      // Criar nova cotação com ID único
      const primeiroVoo = formData.voos[0]
      const novaCotacao: Cotacao = {
        id: Date.now().toString(),
        titulo: formData.titulo,
        cliente: formData.cliente === '__novo__' ? 'Novo Cliente' : formData.cliente,
        valor: formData.valorTotal || null,
        dataViagem: primeiroVoo.dataIda,
        dataCriacao: new Date().toISOString(),
        status: formData.status,
        destino: primeiroVoo.destino,
        observacoes: formData.observacoesVenda || undefined
      }
      
      // Adicionar nova cotação ao array
      setCotacoes(prev => [novaCotacao, ...prev])
      
      setLoading(false)
      handleCloseModal()
      
      console.log('🎯 Nova cotação adicionada ao Kanban:', novaCotacao)
      alert('Cotação criada com sucesso! Verifique no Kanban.')
    }, 1000)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Vôos
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Informações sobre Vôos</h4>
            
            {/* Dados básicos da cotação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Cotação <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Lua de mel em Paris"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="cliente"
                    value={formData.cliente}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientesExistentes.map(cliente => (
                      <option key={cliente.id} value={cliente.nome}>
                        {cliente.nome}
                      </option>
                    ))}
                    <option value="__novo__">+ Criar novo cliente</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                {formData.cliente === '__novo__' && (
                  <input
                    type="text"
                    placeholder="Digite o nome do novo cliente"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mt-2"
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente: e.target.value }))}
                  />
                )}
              </div>
            </div>

            {/* Status inicial da cotação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Inicial <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="LEAD">LEAD - Cliente em prospecção</option>
                <option value="COTAR">COTAR - Precisa elaborar cotação</option>
                <option value="AGUARDANDO_CLIENTE">AGUARDANDO CLIENTE - Cotação enviada</option>
                <option value="APROVADO">APROVADO - Cliente confirmou</option>
                <option value="REPROVADO">REPROVADO - Cliente cancelou</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Você pode alterar o status depois arrastando o card entre as colunas
              </p>
            </div>

            {/* Número de Passageiros */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-3">
                Número de Passageiros 
                <span className="text-xs text-gray-500 ml-2">(máximo 9 pessoas no total)</span>
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adultos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="numeroAdultos"
                    value={formData.numeroAdultos}
                    onChange={handleInputChange}
                    min="1"
                    max="9"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Crianças (2-11 anos)
                  </label>
                  <input
                    type="number"
                    name="numeroCriancas"
                    value={formData.numeroCriancas}
                    onChange={handleInputChange}
                    min="0"
                    max="8"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bebês (0-2 anos)
                  </label>
                  <input
                    type="number"
                    name="numeroBebes"
                    value={formData.numeroBebes}
                    onChange={handleInputChange}
                    min="0"
                    max="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Indicador do total de passageiros */}
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">
                  Total de passageiros: {formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes} 
                  {(formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes) > 9 && (
                    <span className="text-red-500 ml-2">⚠️ Máximo permitido: 9</span>
                  )}
                </span>
              </div>
            </div>

            {/* Lista de Vôos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium text-gray-900">
                  Vôos ({voosSalvos.length} salvos, {formData.voos.length} em edição)
                </h5>
                <button
                  type="button"
                  onClick={adicionarNovoVoo}
                  disabled={voosSalvos.length + formData.voos.length >= 10}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Voo
                </button>
              </div>

              {/* Vôos Salvos */}
              {voosSalvos.length > 0 && (
                <div className="mb-6">
                  <h6 className="text-sm font-medium text-green-700 mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Vôos Salvos ({voosSalvos.length})
                  </h6>
                  <div className="space-y-3">
                    {voosSalvos.map((voo, index) => (
                      <div key={voo.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {voo.direcao}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              Voo {index + 1} - {voo.companhia} {voo.numeroVoo}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => editarVooSalvo(voo)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Editar voo"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removerVooSalvo(voo.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Remover voo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Origem:</span> {voo.origem}
                          </div>
                          <div>
                            <span className="font-medium">Destino:</span> {voo.destino}
                          </div>
                          <div>
                            <span className="font-medium">Data:</span> {voo.direcao === 'VOLTA' ? voo.dataVolta : voo.dataIda}
                          </div>
                          <div>
                            <span className="font-medium">Horário:</span> {voo.horarioPartida} - {voo.horarioChegada}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vôo em Edição */}
              {formData.voos.length === 0 && voosSalvos.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Nenhum voo adicionado ainda</p>
                  <button
                    type="button"
                    onClick={adicionarNovoVoo}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Voo
                  </button>
                </div>
              ) : formData.voos.length > 0 ? (
                <div className="space-y-4">
                  {formData.voos.map((voo, index) => (
                    <div key={voo.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <h6 className="font-medium text-gray-900">
                          Voo em Edição
                        </h6>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => salvarVoo(voo)}
                            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Salvar Voo
                          </button>
                          <button
                            type="button"
                            onClick={() => removerVoo(voo.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Direção do Voo */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Direção do Voo <span className="text-red-500">*</span>
                          </label>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name={`direcao-${voo.id}`}
                                value="IDA"
                                checked={voo.direcao === 'IDA'}
                                onChange={(e) => atualizarVoo(voo.id, 'direcao', e.target.value)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                              />
                              <label className="ml-2 block text-sm text-gray-700">
                                IDA
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name={`direcao-${voo.id}`}
                                value="VOLTA"
                                checked={voo.direcao === 'VOLTA'}
                                onChange={(e) => atualizarVoo(voo.id, 'direcao', e.target.value)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                              />
                              <label className="ml-2 block text-sm text-gray-700">
                                VOLTA
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name={`direcao-${voo.id}`}
                                value="INTERNO"
                                checked={voo.direcao === 'INTERNO'}
                                onChange={(e) => atualizarVoo(voo.id, 'direcao', e.target.value)}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                              />
                              <label className="ml-2 block text-sm text-gray-700">
                                INTERNO
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Classe */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Classe <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={voo.classe}
                            onChange={(e) => atualizarVoo(voo.id, 'classe', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          >
                            <option value="">Selecione uma classe</option>
                            <option value="Econômica">Econômica</option>
                            <option value="Premium Economy">Premium Economy</option>
                            <option value="Executiva">Executiva</option>
                            <option value="Primeira Classe">Primeira Classe</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Origem */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Origem <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={voo.origem}
                            onChange={(e) => atualizarVoo(voo.id, 'origem', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ex: São Paulo (SAO)"
                            required
                          />
                        </div>
                        
                        {/* Destino */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destino <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={voo.destino}
                            onChange={(e) => atualizarVoo(voo.id, 'destino', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ex: Paris (CDG)"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Data de Ida (apenas para IDA e INTERNO) */}
                        {(voo.direcao === 'IDA' || voo.direcao === 'INTERNO') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Data de Ida <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={voo.dataIda}
                              onChange={(e) => atualizarVoo(voo.id, 'dataIda', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            />
                          </div>
                        )}
                        
                        {/* Data de Volta (apenas para VOLTA) */}
                        {voo.direcao === 'VOLTA' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Data de Volta <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={voo.dataVolta || ''}
                              onChange={(e) => atualizarVoo(voo.id, 'dataVolta', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Companhia */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Companhia <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={voo.companhia}
                            onChange={(e) => atualizarVoo(voo.id, 'companhia', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ex: Air France"
                            required
                          />
                        </div>
                        
                        {/* Número do Voo */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número do Voo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={voo.numeroVoo}
                            onChange={(e) => atualizarVoo(voo.id, 'numeroVoo', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Ex: AF123"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Horário de Partida */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Horário de Partida <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={voo.horarioPartida}
                            onChange={(e) => atualizarVoo(voo.id, 'horarioPartida', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        {/* Horário de Chegada */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Horário de Chegada <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={voo.horarioChegada}
                            onChange={(e) => atualizarVoo(voo.id, 'horarioChegada', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>

                      {/* Opção de Preenchimento Automático */}
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h6 className="font-medium text-blue-900 mb-1">Preenchimento Automático</h6>
                            <p className="text-sm text-blue-700">
                              Preencha o número do voo e a data, depois clique em "Buscar Dados" para preencher automaticamente
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => preencherDadosAutomatico(voo.id)}
                            disabled={!voo.numeroVoo || !(voo.direcao === 'VOLTA' ? voo.dataVolta : voo.dataIda)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            Buscar Dados
                          </button>
                        </div>
                      </div>

                      {/* Observações */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Observações
                        </label>
                        <textarea
                          value={voo.observacoes || ''}
                          onChange={(e) => atualizarVoo(voo.id, 'observacoes', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Observações específicas sobre este voo..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )

      case 2: // Hotéis
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Informações sobre Hotéis</h4>
            
            {/* Opção de incluir hotel */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">Incluir Hospedagem?</h5>
                  <p className="text-sm text-blue-700">
                    Esta cotação incluirá informações sobre hotéis e hospedagem
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirHotel}
                    onChange={(e) => setIncluirHotel(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Campos de hotel (apenas se incluirHotel for true) */}
            {incluirHotel && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Hotel
                    </label>
                    <input
                      type="text"
                      name="nomeHotel"
                      value={formData.nomeHotel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: Hotel Paris"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="2 estrelas">2 estrelas</option>
                      <option value="3 estrelas">3 estrelas</option>
                      <option value="4 estrelas">4 estrelas</option>
                      <option value="5 estrelas">5 estrelas</option>
                      <option value="Resort">Resort</option>
                      <option value="Pousada">Pousada</option>
                      <option value="Boutique">Boutique Hotel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Quarto
                    </label>
                    <select
                      name="tipoQuarto"
                      value={formData.tipoQuarto}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Selecione um tipo</option>
                      <option value="Standard">Standard</option>
                      <option value="Superior">Superior</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suíte">Suíte</option>
                      <option value="Suíte Master">Suíte Master</option>
                      <option value="Apartamento">Apartamento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Regime de Alimentação
                    </label>
                    <select
                      name="regime"
                      value={formData.regime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Selecione um regime</option>
                      <option value="Somente hospedagem">Somente hospedagem</option>
                      <option value="Café da manhã">Café da manhã</option>
                      <option value="Meia pensão">Meia pensão</option>
                      <option value="Pensão completa">Pensão completa</option>
                      <option value="All inclusive">All inclusive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações sobre Hospedagem
                  </label>
                  <textarea
                    name="observacoesHotel"
                    value={formData.observacoesHotel}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Localização preferida, amenities desejados, requisitos especiais..."
                  />
                </div>
              </div>
            )}

            {!incluirHotel && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Hospedagem não incluída</p>
                <p className="text-sm text-gray-400">Ative o toggle acima se desejar incluir informações de hotel</p>
              </div>
            )}
          </div>
        )

      case 3: // Serviços
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Informações sobre Serviços</h4>
            
            {/* Opção de incluir serviços */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">Incluir Serviços Adicionais?</h5>
                  <p className="text-sm text-blue-700">
                    Esta cotação incluirá serviços como traslados, guias, passeios, etc.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirServicos}
                    onChange={(e) => setIncluirServicos(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            {/* Campos de serviços (apenas se incluirServicos for true) */}
            {incluirServicos && (
              <div className="space-y-6">
                {/* Checkboxes para serviços */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="traslados"
                      checked={formData.traslados}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Traslados (aeroporto ↔ hotel)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="guia"
                      checked={formData.guia}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Guia turístico
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="seguroViagem"
                      checked={formData.seguroViagem}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Seguro viagem
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passeios e Tours
                  </label>
                  <textarea
                    name="passeios"
                    value={formData.passeios}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Descreva os passeios incluídos: city tour, museus, pontos turísticos..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações sobre Serviços
                  </label>
                  <textarea
                    name="observacoesServicos"
                    value={formData.observacoesServicos}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Serviços especiais, necessidades específicas..."
                  />
                </div>
              </div>
            )}

            {!incluirServicos && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Serviços não incluídos</p>
                <p className="text-sm text-gray-400">Ative o toggle acima se desejar incluir serviços adicionais</p>
              </div>
            )}
          </div>
        )

      case 4: // Roteiro
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Informações sobre Roteiro</h4>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Route className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <h5 className="font-medium text-blue-900 mb-1">Roteiro Opcional</h5>
                  <p className="text-sm text-blue-700">
                    Preencha apenas se desejar incluir informações detalhadas sobre o roteiro da viagem
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração da Viagem (dias)
                </label>
                <input
                  type="number"
                  name="diasViagem"
                  value={formData.diasViagem}
                  onChange={handleInputChange}
                  min="1"
                  max="365"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: 7"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pontos de Interesse
                </label>
                <input
                  type="text"
                  name="pontosInteresse"
                  value={formData.pontosInteresse}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Torre Eiffel, Museu do Louvre"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Itinerário Detalhado
              </label>
              <textarea
                name="itinerario"
                value={formData.itinerario}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Dia 1: Chegada e check-in&#10;Dia 2: City tour e museus&#10;Dia 3: Passeio de barco..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações sobre o Roteiro
              </label>
              <textarea
                name="observacoesRoteiro"
                value={formData.observacoesRoteiro}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Preferências de horários, ritmo da viagem, restrições..."
              />
            </div>
          </div>
        )

      case 5: // Passageiros
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Informações dos Passageiros</h4>
            
            {/* Resumo dos Passageiros Necessários */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Passageiros para esta viagem:</h5>
              <div className="flex flex-wrap gap-4 text-sm text-blue-800">
                <span>👥 {formData.numeroAdultos} adulto(s)</span>
                {formData.numeroCriancas > 0 && <span>🧒 {formData.numeroCriancas} criança(s)</span>}
                {formData.numeroBebes > 0 && <span>👶 {formData.numeroBebes} bebê(s)</span>}
                <span className="font-medium">Total: {formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes} passageiros</span>
              </div>
            </div>

            {/* Lista de Passageiros Adicionados */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-medium text-gray-900">
                  Passageiros Adicionados ({formData.passageiros.length}/{formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes})
                </h5>
                <button
                  type="button"
                  onClick={() => {
                    // Verificar se já atingiu o limite
                    const totalNecessario = formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes
                    if (formData.passageiros.length >= totalNecessario) {
                      alert('⚠️ Você já adicionou todos os passageiros necessários para esta viagem.')
                      return
                    }
                    
                    // Adicionar novo passageiro
                    const novoPassageiro: Passageiro = {
                      id: Date.now().toString(),
                      nome: '',
                      tipo: 'adulto',
                      isNovoCliente: false,
                      dataNascimento: '',
                      documento: '',
                      tipoDocumento: 'cpf'
                    }
                    
                    setFormData(prev => ({
                      ...prev,
                      passageiros: [...prev.passageiros, novoPassageiro]
                    }))
                  }}
                  className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Passageiro
                </button>
              </div>

              {/* Cards dos Passageiros */}
              <div className="space-y-4">
                {formData.passageiros.map((passageiro, index) => (
                  <div key={passageiro.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h6 className="font-medium text-gray-900">Passageiro {index + 1}</h6>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            passageiros: prev.passageiros.filter(p => p.id !== passageiro.id)
                          }))
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tipo de Passageiro */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Passageiro
                        </label>
                        <select
                          value={passageiro.tipo}
                          onChange={(e) => {
                            const novoTipo = e.target.value as 'adulto' | 'crianca' | 'bebe'
                            setFormData(prev => ({
                              ...prev,
                              passageiros: prev.passageiros.map(p => 
                                p.id === passageiro.id ? { ...p, tipo: novoTipo } : p
                              )
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="adulto">Adulto (12+ anos)</option>
                          <option value="crianca">Criança (2-11 anos)</option>
                          <option value="bebe">Bebê (0-2 anos)</option>
                        </select>
                      </div>

                      {/* Seleção de Cliente */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cliente
                        </label>
                        <select
                          value={passageiro.isNovoCliente ? '__novo__' : (passageiro.cliente_id || '')}
                          onChange={(e) => {
                            const valor = e.target.value
                            if (valor === '__novo__') {
                              setFormData(prev => ({
                                ...prev,
                                passageiros: prev.passageiros.map(p => 
                                  p.id === passageiro.id ? { 
                                    ...p, 
                                    isNovoCliente: true, 
                                    cliente_id: undefined,
                                    nome: ''
                                  } : p
                                )
                              }))
                            } else {
                              const clienteSelecionado = clientesExistentes.find(c => c.id === valor)
                              setFormData(prev => ({
                                ...prev,
                                passageiros: prev.passageiros.map(p => 
                                  p.id === passageiro.id ? { 
                                    ...p, 
                                    isNovoCliente: false, 
                                    cliente_id: valor,
                                    nome: clienteSelecionado?.nome || ''
                                  } : p
                                )
                              }))
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Selecione um cliente</option>
                          {clientesExistentes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.nome}
                            </option>
                          ))}
                          <option value="__novo__">+ Criar novo cliente</option>
                        </select>
                      </div>
                    </div>

                    {/* Campo de Nome para Novo Cliente */}
                    {passageiro.isNovoCliente && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome Completo
                        </label>
                        <input
                          type="text"
                          value={passageiro.nome}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              passageiros: prev.passageiros.map(p => 
                                p.id === passageiro.id ? { ...p, nome: e.target.value } : p
                              )
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Digite o nome completo do passageiro"
                        />
                      </div>
                    )}

                    {/* Dados Adicionais */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data de Nascimento
                        </label>
                        <input
                          type="date"
                          value={passageiro.dataNascimento}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              passageiros: prev.passageiros.map(p => 
                                p.id === passageiro.id ? { ...p, dataNascimento: e.target.value } : p
                              )
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Documento
                        </label>
                        <select
                          value={passageiro.tipoDocumento}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              passageiros: prev.passageiros.map(p => 
                                p.id === passageiro.id ? { ...p, tipoDocumento: e.target.value as 'cpf' | 'passaporte' } : p
                              )
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="cpf">CPF</option>
                          <option value="passaporte">Passaporte</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {passageiro.tipoDocumento === 'cpf' ? 'CPF' : 'Passaporte'}
                        </label>
                        <input
                          type="text"
                          value={passageiro.documento}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              passageiros: prev.passageiros.map(p => 
                                p.id === passageiro.id ? { ...p, documento: e.target.value } : p
                              )
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={passageiro.tipoDocumento === 'cpf' ? '000.000.000-00' : 'Número do passaporte'}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mensagem quando não há passageiros */}
                {formData.passageiros.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum passageiro adicionado</p>
                    <p className="text-xs">Clique em "Adicionar Passageiro" para começar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Observações Gerais */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações sobre Passageiros
              </label>
              <textarea
                name="observacoesPassageiros"
                value={formData.observacoesPassageiros}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Necessidades especiais, restrições alimentares, problemas de mobilidade, preferências..."
              />
            </div>
          </div>
        )

      case 6: // Venda
        return (
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 mb-4">Informações sobre Venda</h4>
            
            {/* Dados básicos da cotação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Total <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="valorTotal"
                  value={formData.valorTotal}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor de Entrada <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="valorEntrada"
                  value={formData.valorEntrada}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="formaPagamento"
                value={formData.formaPagamento}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: À vista, Parcelado"
                required
              />
            </div>

            {/* Observações sobre Venda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações sobre Venda
              </label>
              <textarea
                value={formData.observacoesVenda}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoesVenda: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Observações sobre a venda..."
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Função para salvar um voo individualmente
  const salvarVoo = (voo: Voo) => {
    // Validar campos obrigatórios
    const camposObrigatorios = [
      { campo: 'origem', valor: voo.origem, nome: 'Origem' },
      { campo: 'destino', valor: voo.destino, nome: 'Destino' },
      { campo: 'classe', valor: voo.classe, nome: 'Classe' },
      { campo: 'companhia', valor: voo.companhia, nome: 'Companhia' },
      { campo: 'numeroVoo', valor: voo.numeroVoo, nome: 'Número do Voo' },
      { campo: 'horarioPartida', valor: voo.horarioPartida, nome: 'Horário de Partida' },
      { campo: 'horarioChegada', valor: voo.horarioChegada, nome: 'Horário de Chegada' }
    ]

    // Verificar data baseada na direção
    if (voo.direcao === 'IDA' || voo.direcao === 'INTERNO') {
      camposObrigatorios.push({ campo: 'dataIda', valor: voo.dataIda, nome: 'Data de Ida' })
    } else if (voo.direcao === 'VOLTA') {
      camposObrigatorios.push({ campo: 'dataVolta', valor: voo.dataVolta || '', nome: 'Data de Volta' })
    }

    const camposVazios = camposObrigatorios.filter(campo => !campo.valor)
    
    if (camposVazios.length > 0) {
      alert(`⚠️ Por favor, preencha os seguintes campos:\n${camposVazios.map(c => `• ${c.nome}`).join('\n')}`)
      return false
    }

    // Salvar o voo
    setVoosSalvos(prev => {
      // Verificar se já existe um voo com o mesmo ID
      const vooExistente = prev.find(v => v.id === voo.id)
      if (vooExistente) {
        // Atualizar voo existente
        return prev.map(v => v.id === voo.id ? voo : v)
      } else {
        // Adicionar novo voo
        return [...prev, voo]
      }
    })

    // Remover o voo do formulário atual
    setFormData(prev => ({
      ...prev,
      voos: prev.voos.filter(v => v.id !== voo.id)
    }))

    alert('✅ Voo salvo com sucesso!')
    return true
  }

  // Função para adicionar novo voo (salva automaticamente o atual se existir)
  const adicionarNovoVoo = () => {
    // Se há um voo sendo editado, salvá-lo primeiro
    if (formData.voos.length > 0) {
      const vooAtual = formData.voos[0]
      const salvou = salvarVoo(vooAtual)
      if (!salvou) return // Se não salvou, não adiciona novo
    }

    // Adicionar novo voo
    adicionarVoo()
  }

  // Função para remover voo salvo
  const removerVooSalvo = (vooId: string) => {
    setVoosSalvos(prev => prev.filter(v => v.id !== vooId))
    alert('🗑️ Voo removido da lista!')
  }

  // Função para editar voo salvo
  const editarVooSalvo = (voo: Voo) => {
    // Remover da lista de salvos
    setVoosSalvos(prev => prev.filter(v => v.id !== voo.id))
    
    // Adicionar ao formulário para edição
    setFormData(prev => ({
      ...prev,
      voos: [voo]
    }))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full">
      <div className="max-w-full mx-auto h-full flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg border border-purple-200">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-gray-900">Cotações</h1>
                <p className="text-gray-600 mt-1">Gerencie o funil de vendas de cotações</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Filtro por Data */}
              <div className="relative">
                <select
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value as typeof filtroData)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                >
                  <option value="total">Tempo total</option>
                  <option value="mes">Último mês</option>
                  <option value="3meses">Últimos 3 meses</option>
                  <option value="6meses">Últimos 6 meses</option>
                  <option value="ano">Último ano</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nova Cotação
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {colunas.map((coluna) => {
              const quantidade = getCotacoesPorStatus(coluna.id).length
              const Icone = coluna.icone
              
              return (
                <div key={coluna.id} className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{quantidade}</div>
                  <div className="text-xs text-gray-500">{coluna.titulo}</div>
                </div>
              )
            })}
          </div>

          {/* Indicador do filtro aplicado */}
          {filtroData !== 'total' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">
                    Filtro aplicado: {
                      filtroData === 'mes' ? 'Último mês' :
                      filtroData === '3meses' ? 'Últimos 3 meses' :
                      filtroData === '6meses' ? 'Últimos 6 meses' :
                      'Último ano'
                    }
                  </span>
                  <span className="text-sm text-blue-600 ml-2">
                    ({filtrarCotacoesPorData(cotacoes).length} cotações exibidas)
                  </span>
                </div>
                <button
                  onClick={() => setFiltroData('total')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Limpar filtro
                </button>
              </div>
            </div>
          )}

          {/* Instruções de Drag & Drop */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <GripVertical className="h-4 w-4 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Arraste e solte os cards entre as colunas para alterar o status das cotações
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex gap-6 h-full overflow-x-auto pb-4">
            {colunas.map((coluna) => {
              const cotacoesColuna = getCotacoesPorStatus(coluna.id)
              const Icone = coluna.icone
              const isDropTarget = dragOverColumn === coluna.id
              
              return (
                <div key={coluna.id} className="flex-shrink-0 w-80">
                  <div className={`${coluna.corHeader} rounded-t-lg p-4 border-b-2 border-gray-200 ${
                    isDropTarget ? 'ring-2 ring-purple-400 ring-opacity-50' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Icone className="h-5 w-5 mr-2" />
                        <h3 className="font-semibold text-sm">{coluna.titulo}</h3>
                      </div>
                      <div className="bg-white bg-opacity-70 rounded-full px-2 py-1 text-xs font-medium">
                        {cotacoesColuna.length}
                      </div>
                    </div>
                    
                    {/* Total da coluna */}
                    <div className="text-center">
                      <div className="text-lg font-bold opacity-90">
                        {formatarMoedaTotal(getTotalPorStatus(coluna.id))}
                      </div>
                      <div className="text-xs opacity-75">
                        Total da coluna
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`${coluna.cor} border-l border-r border-b rounded-b-lg p-4 transition-all ${
                      isDropTarget ? 'ring-2 ring-purple-400 ring-opacity-50 bg-purple-100' : ''
                    }`}
                    onDragOver={(e) => handleDragOver(e, coluna.id)}
                    onDragEnter={(e) => handleDragOver(e, coluna.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, coluna.id)}
                  >
                    <div className="space-y-3">
                      {cotacoesColuna.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Icone className="h-12 w-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">
                            {isDropTarget ? 'Solte aqui para mover' : 'Nenhuma cotação'}
                          </p>
                        </div>
                      ) : (
                        cotacoesColuna.map((cotacao) => (
                          <div 
                            key={cotacao.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, cotacao.id)}
                            onDragEnd={handleDragEnd}
                            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 transition-all duration-200 cursor-move group select-none ${
                              draggedItem === cotacao.id 
                                ? 'opacity-50 scale-105 rotate-2 shadow-lg ring-2 ring-purple-300' 
                                : 'hover:shadow-md hover:scale-102'
                            }`}
                          >
                            {/* Handle de Drag */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-start w-full">
                                <div className="drag-handle mr-2 mt-0.5">
                                  <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                                    {cotacao.titulo}
                                  </h4>
                                  <div className="flex items-center text-xs text-gray-500 mb-2">
                                    <User className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{cotacao.cliente}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="text-sm text-gray-600 mb-3 truncate">
                              📍 {cotacao.destino}
                            </div>

                            <div className="text-lg font-bold text-purple-600 mb-3">
                              {formatarMoeda(cotacao.valor)}
                            </div>

                            <div className="flex items-center text-xs text-gray-500 mb-3">
                              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span>Viagem: {formatarData(cotacao.dataViagem)}</span>
                            </div>

                            {cotacao.observacoes && (
                              <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 mb-3">
                                {cotacao.observacoes}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-400">
                                {formatarData(cotacao.dataCriacao)}
                              </div>
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleViewCotacao(cotacao)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  title="Visualizar cotação"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={() => handleEditCotacao(cotacao)}
                                  className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  title="Editar cotação"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCotacao(cotacao)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  title="Excluir cotação"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {/* Área de drop quando vazia */}
                      {isDropTarget && cotacoesColuna.length === 0 && (
                        <div className="border-2 border-dashed border-purple-400 rounded-lg p-8 text-center bg-purple-50">
                          <div className="text-purple-600">
                            <GripVertical className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Solte aqui</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleOpenModalFromColumn(coluna.id as any)}
                      className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4 mx-auto mb-1" />
                      Adicionar cotação
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingCotacao ? 'Editar Cotação' : 'Nova Cotação'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Etapa {currentStep} de 6 - {steps[currentStep - 1].title}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Indicadores de Etapas */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = currentStep === step.number
                  const isCompleted = currentStep > step.number
                  const isPending = currentStep < step.number
                  
                  return (
                    <div key={step.number} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                        isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isActive 
                            ? 'bg-purple-500 border-purple-500 text-white' 
                            : 'border-gray-300 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="ml-2 hidden sm:block">
                        <div className={`text-xs font-medium ${
                          isCompleted ? 'text-green-600' : 
                          isActive ? 'text-purple-600' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-8 h-0.5 mx-4 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Conteúdo do Form */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {renderStepContent()}
            </div>

            {/* Footer com Botões */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center text-sm text-gray-500">
                <div className="flex items-center">
                  {(() => {
                    const Icon = steps[currentStep - 1].icon
                    return <Icon className="h-4 w-4 mr-2" />
                  })()}
                  {steps[currentStep - 1].description}
                </div>
              </div>
              
              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </button>
                )}
                
                {currentStep < 6 ? (
                  <button
                    onClick={handleNextStep}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Criar Cotação
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {showViewModal && viewingCotacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Visualizar Cotação</h3>
                <p className="text-sm text-gray-600 mt-1">Detalhes da cotação</p>
              </div>
              <button
                onClick={handleCloseViewModal}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-600" />
                    Informações Gerais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Título</label>
                      <p className="text-gray-900 font-medium">{viewingCotacao.titulo}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Cliente</label>
                      <p className="text-gray-900 font-medium flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {viewingCotacao.cliente}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Destino</label>
                      <p className="text-gray-900 font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {viewingCotacao.destino}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        viewingCotacao.status === 'LEAD' ? 'bg-blue-100 text-blue-800' :
                        viewingCotacao.status === 'COTAR' ? 'bg-yellow-100 text-yellow-800' :
                        viewingCotacao.status === 'AGUARDANDO_CLIENTE' ? 'bg-purple-100 text-purple-800' :
                        viewingCotacao.status === 'APROVADO' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {viewingCotacao.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informações Financeiras */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    Informações Financeiras
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Valor da Cotação</label>
                      <p className="text-2xl font-bold text-green-600">
                        {formatarMoeda(viewingCotacao.valor)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Cronograma
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Data da Viagem</label>
                      <p className="text-gray-900 font-medium">{formatarData(viewingCotacao.dataViagem)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Data de Criação</label>
                      <p className="text-gray-900 font-medium">{formatarData(viewingCotacao.dataCriacao)}</p>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {viewingCotacao.observacoes && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                      Observações
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{viewingCotacao.observacoes}</p>
                  </div>
                )}

                {/* Placeholder para informações adicionais futuras */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-purple-600" />
                    Informações Detalhadas
                  </h4>
                  <p className="text-gray-600 italic">
                    🚧 Seção em desenvolvimento - Em breve serão exibidas informações detalhadas sobre vôos, hotéis, passageiros e demais dados da cotação.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                ID: {viewingCotacao.id}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    handleCloseViewModal()
                    handleEditCotacao(viewingCotacao)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </button>
                <button
                  onClick={handleCloseViewModal}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cotacoes 