import React, { useState, useEffect, useMemo } from 'react'
import { FileText, Plus, User, Calendar, Eye, Edit, Trash2, MoreVertical, Clock, CheckCircle, XCircle, AlertCircle, Target, GripVertical, Plane, Building, MapPin, Route, Users, DollarSign, ChevronLeft, ChevronRight, X, Search, ArrowRight, ArrowLeft, CheckSquare, ChevronDown, Printer } from 'lucide-react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface Cliente {
  id: number
  nome: string
  sobrenome?: string
  email: string
  telefone: string
  cpf?: string
  rg?: string
  passaporte?: string
  data_nascimento?: string
  data_expedicao?: string
  data_expiracao?: string
  nacionalidade?: string
  rede_social?: string
  observacoes?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  created_at: string
}

interface Lead {
  id: number
  cliente_id: string  // Alterado de number para string
  observacao: string
  created_at: string
  cliente?: Cliente // Para join com dados do cliente
}

interface Tarefa {
  id?: number
  lead_id: number
  titulo: string
  descricao: string
  tipo: 'CALL' | 'EMAIL' | 'LEMBRETE' | 'OUTRO'
  data_vencimento: string
  hora_vencimento: string
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA'
  created_at?: string
}

interface Compromisso {
  id?: number
  lead_id: number
  titulo: string
  descricao: string
  data_hora: string
  tipo: 'REUNIAO' | 'CALL' | 'VISITA' | 'OUTRO'
  local?: string
  status: 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO'
  created_at?: string
}

interface Cotacao {
  id: string
  titulo: string
  cliente: string
  cliente_id?: string
  codigo: string
  valor: number | null
  dataViagem: string
  dataCriacao: string
  status: 'LEAD' | 'COTAR' | 'AGUARDANDO_CLIENTE' | 'APROVADO' | 'REPROVADO' | 'LANÇADO'
  destino: string
  observacoes?: string
}

interface Passageiro {
  id: string
  nome: string
  tipo: 'adulto' | 'crianca' | 'bebe'
  cliente_id?: string
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
  // Campo para rastrear se é edição
  idBanco?: string | number  // ID real do banco para atualizações
}

interface FormularioCotacao {
  titulo: string;
  cliente: string;
  status: 'LEAD' | 'COTAR' | 'AGUARDANDO_CLIENTE' | 'APROVADO' | 'REPROVADO' | 'LANÇADO';
  numeroAdultos: number;
  numeroCriancas: number;
  numeroBebes: number;
  voos: Voo[];
  nomeHotel: string;
  categoria: string;
  tipoQuarto: string;
  regime: string;
  observacoesHotel: string;
  traslados: boolean;
  passeios: string;
  guia: boolean;
  seguroViagem: boolean;
  observacoesServicos: string;
  diasViagem: number;
  itinerario: string;
  pontosInteresse: string;
  observacoesRoteiro: string;
  passageiros: Passageiro[];
  observacoesPassageiros: string;
  valorTotal: number;
  valorEntrada: number;
  formaPagamento: string;
  observacoesVenda: string;
}

interface CotacoesProps {
  user: SupabaseUser
}

interface ItemVenda {
  id: string
  fornecedor?: string
  fornecedor_id?: string
  conta: string
  categoria: string
  categoria_id?: string
  descricao: string
  forma: string
  forma_pagamento_id?: string
  forma_recebimento_id?: string
  parcelas: string
  vencimento: string
  valor: number
  cliente?: string
  cliente_id?: string
  created_at?: string
  origem_id?: string // <-- adicionado para permitir uso no filtro do CardCotacao
}

const Cotacoes: React.FC<CotacoesProps> = ({ user }) => {
  // Estados existentes
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [showModal, setShowModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [buscaCliente, setBuscaCliente] = useState('')
  const [abaAtiva, setAbaAtiva] = useState<'VOOS' | 'HOTEIS' | 'SERVICOS' | 'PASSAGEIROS' | 'VENDA'>('VOOS')

  // Estados para a aba de VENDA
  const [dataVenda, setDataVenda] = useState('')
  const [itensCusto, setItensCusto] = useState<ItemVenda[]>([])
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([])
  const [showModalCusto, setShowModalCusto] = useState(false)
  const [showModalVenda, setShowModalVenda] = useState(false)
  const [editandoItem, setEditandoItem] = useState<ItemVenda | null>(null)
  const [observacaoVenda, setObservacaoVenda] = useState('')
  const [valorCustoSimples, setValorCustoSimples] = useState('')
  const [valorVendaSimples, setValorVendaSimples] = useState('')

  // Estados para formulários de custo/venda
  const [formCusto, setFormCusto] = useState({
    fornecedor: '',
    conta: '',
    categoria: '',
    descricao: '',
    forma: '',
    parcelas: '',
    vencimento: '',
    valor: '',
    formaRecebimento: ''
  })

  const [formVenda, setFormVenda] = useState({
    conta: '',
    categoria: '',
    descricao: '',
    forma: '',
    parcelas: '',
    vencimento: '',
    valor: '',
    cliente: '',
    formaRecebimento: ''
  })

  // Estados para os novos campos de voo
  const [notificacaoCheckin, setNotificacaoCheckin] = useState('Notificar Check-in 48h')
  const [bagagemDespachada, setBagagemDespachada] = useState('1')
  const [bagagemMao, setBagagemMao] = useState('1')

  // Estados do Kanban
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [editingCotacao, setEditingCotacao] = useState<Cotacao | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingCotacao, setViewingCotacao] = useState<Cotacao | null>(null)
  const [filtroData, setFiltroData] = useState<'mes' | '3meses' | '6meses' | 'ano' | 'total'>('total')
  const [voosSalvos, setVoosSalvos] = useState<Voo[]>([])
  const [passageirosSalvos, setPassageirosSalvos] = useState<Passageiro[]>([])
  const [abaVooAtiva, setAbaVooAtiva] = useState<'IDA' | 'VOLTA' | 'INTERNO'>('IDA')
  const [voos, setVoos] = useState<Voo[]>([])
  const [passageiros, setPassageiros] = useState<Passageiro[]>([])
  const [showModalCliente, setShowModalCliente] = useState(false)
  const [clienteParaPassageiro, setClienteParaPassageiro] = useState<Passageiro | null>(null)
  const [modoCriacao, setModoCriacao] = useState<'selecionar' | 'criar'>('selecionar')

  // Estados para leads
  const [showModalLead, setShowModalLead] = useState(false)
  const [showModalVisualizarLead, setShowModalVisualizarLead] = useState(false)
  const [observacaoLead, setObservacaoLead] = useState('')
  const [showModalTarefas, setShowModalTarefas] = useState(false)
  const [showModalCompromissos, setShowModalCompromissos] = useState(false)
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null)
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'Média',
    status: 'pendente',
    data_vencimento: '',
    hora_vencimento: '',
    responsavel: '',
    categoria: 'vendas',
    cliente: ''
  })
  const [novoCompromisso, setNovoCompromisso] = useState<Partial<Compromisso>>({
    titulo: '',
    descricao: '',
    data_hora: '',
    tipo: 'CALL',
    local: '',
    status: 'AGENDADO'
  })

  // Estados para modal de visualização de contas
  const [showModalVisualizarConta, setShowModalVisualizarConta] = useState(false)
  const [contaVisualizando, setContaVisualizando] = useState<any>(null)
  const [tipoContaVisualizando, setTipoContaVisualizando] = useState<'pagar' | 'receber'>('pagar')
  // Flag para evitar sobrescrever arrays ao excluir venda
  const [recemExcluido, setRecemExcluido] = useState(false)

  // Formulário de cotação
  const [formData, setFormData] = useState<FormularioCotacao>({
    titulo: '',
    cliente: '',
    status: 'LEAD',
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

  // Carregar dados iniciais
  useEffect(() => {
    carregarClientes()
    carregarCotacoes()
    carregarLeads()
  }, [])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Carregar leads do banco
  const carregarLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          cliente:clientes(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao carregar leads:', error)
        return
      }

      console.log('Leads carregados do Supabase:', data)
      setLeads(data || [])
    } catch (err) {
      console.error('Erro inesperado ao carregar leads:', err)
    }
  }

  // Salvar novo lead
  const salvarLead = async () => {
    if (!clienteSelecionado || !observacaoLead.trim()) {
      alert('Por favor, selecione um cliente e adicione uma observação')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          cliente_id: clienteSelecionado.id,
          observacao: observacaoLead
        }])
        .select()

      if (error) {
        console.error('Erro ao salvar lead:', error)
        alert('Erro ao salvar lead. Tente novamente.')
        return
      }

      console.log('Lead salvo com sucesso:', data)
      await carregarLeads()
      setShowModalLead(false)
      setClienteSelecionado(null)
      setObservacaoLead('')
      alert('Lead criado com sucesso!')
    } catch (err) {
      console.error('Erro inesperado ao salvar lead:', err)
      alert('Erro inesperado ao salvar lead.')
    } finally {
      setLoading(false)
    }
  }

  // Converter lead em cotação
  const converterLeadEmCotacao = async (lead: Lead) => {
    if (!lead.cliente) {
      alert('Erro: Dados do cliente não encontrados')
      return
    }

    try {
      // Gerar código único para a cotação
      const codigoUnico = await gerarCodigoUnico()
      const dataAtual = new Date().toLocaleDateString('pt-BR')
      const nomeCompleto = `${lead.cliente.nome}${lead.cliente.sobrenome ? ' ' + lead.cliente.sobrenome : ''}`
      const titulo = `${nomeCompleto} - ${dataAtual}`

      // Criar cotação
      const cotacaoData = {
        titulo: titulo,
        cliente: nomeCompleto,
        cliente_id: lead.cliente_id,
        codigo: codigoUnico,
        status: 'COTAR',
        valor: 0,
        custo: calcularTotalCusto(), // Salvar o custo ao converter lead
        data_viagem: null,
        data_criacao: new Date().toISOString(),
        destino: '',
        observacoes: lead.observacao
      }

      const { data: cotacao, error: errorCotacao } = await supabase
        .from('cotacoes')
        .insert([cotacaoData])
        .select()
        .single()

      if (errorCotacao) {
        console.error('Erro ao criar cotação:', errorCotacao)
        alert('Erro ao converter lead em cotação')
        return
      }

      // Remover tarefas vinculadas ao lead primeiro
      console.log('Removendo tarefas do lead com ID:', lead.id)
      const { error: errorTarefas } = await supabase
        .from('tarefas')
        .delete()
        .eq('lead_id', lead.id)

      if (errorTarefas) {
        console.error('Erro ao remover tarefas do lead:', errorTarefas)
        alert(`Erro ao remover tarefas do lead: ${errorTarefas.message}`)
        return
      } else {
        console.log('Tarefas do lead removidas com sucesso')
      }

      // Remover lead
      console.log('Removendo lead com ID:', lead.id)
      const { error: errorLead } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id)

      if (errorLead) {
        console.error('Erro ao remover lead:', errorLead)
        alert(`Erro ao remover lead: ${errorLead.message}`)
        // Não falhar se não conseguir remover o lead
      } else {
        console.log('Lead removido com sucesso')
      }

      // Recarregar dados
      await carregarLeads()
      await carregarCotacoes()

      console.log('Lead convertido em cotação com sucesso')
      alert('Lead convertido em cotação com sucesso!')
    } catch (err) {
      console.error('Erro inesperado ao converter lead:', err)
      alert('Erro inesperado ao converter lead em cotação')
    }
  }

  // Abrir modal para criar lead
  const handleOpenModalLead = () => {
    setShowModalLead(true)
    setClienteSelecionado(null)
    setObservacaoLead('')
    setBuscaCliente('')
  }

  // Fechar modal de lead
  const handleCloseModalLead = () => {
    setShowModalLead(false)
    setClienteSelecionado(null)
    setObservacaoLead('')
    setBuscaCliente('')
  }

  // Estados para seleção de cliente para passageiro
  const [showClienteModal, setShowClienteModal] = useState(false)
  const [passageiroEmEdicao, setPassageiroEmEdicao] = useState<Passageiro | null>(null)
  const [buscaClientePassageiro, setBuscaClientePassageiro] = useState('')
  const [clienteSelecionadoPassageiro, setClienteSelecionadoPassageiro] = useState<Cliente | null>(null)
  const [modoCriacaoCliente, setModoCriacaoCliente] = useState(false)

  // 1. Adicione o estado:
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [novoClienteData, setNovoClienteData] = useState({ 
    nome: '', 
    sobrenome: '',
    email: '', 
    telefone: '', 
    cpf: '', 
    rg: '', 
    passaporte: '', 
    data_nascimento: '', 
    data_expedicao: '', 
    data_expiracao: '', 
    nacionalidade: 'Brasileira', 
    rede_social: '', 
    observacoes: '' 
  });

  const navigate = useNavigate();

  // Carregar clientes do Supabase
  useEffect(() => {
    carregarClientes()
    carregarCotacoes()
  }, [])

  const carregarClientes = async () => {
    setLoadingClientes(true)
    try {
      console.log('Iniciando carregamento de clientes...')
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')
      
      if (error) {
        console.error('Erro ao carregar clientes:', error)
        alert('Erro ao carregar clientes: ' + error.message)
        return
      }
      
      console.log('Clientes carregados com sucesso:', data?.length || 0, 'clientes')
      setClientes(data || [])
    } catch (error) {
      console.error('Erro inesperado ao carregar clientes:', error)
      alert('Erro inesperado ao carregar clientes')
    } finally {
      setLoadingClientes(false)
    }
  }

  // Filtrar clientes baseado na busca
  const clientesFiltrados: Cliente[] = useMemo(() => {
    if (!clientes || !Array.isArray(clientes)) return [];
    const searchTerm = buscaCliente.toLowerCase();
    return clientes.filter((cliente: Cliente) => {
      if (!cliente) return false;
      return (
        (cliente.nome && cliente.nome.toLowerCase().includes(searchTerm)) ||
        (cliente.email && cliente.email.toLowerCase().includes(searchTerm)) ||
        (cliente.telefone && cliente.telefone.includes(searchTerm)) ||
        (cliente.cpf && cliente.cpf.includes(searchTerm)) ||
        (cliente.rg && cliente.rg.includes(searchTerm))
      );
    });
  }, [clientes, buscaCliente]);

  // Funções do modal em etapas
  const handleOpenModal = () => {
    setEditingCotacao(null); // Garante que não está editando nenhuma cotação
    setShowModal(true)
    setCurrentStep(1)
    setClienteSelecionado(null)
    setBuscaCliente('')
    setVoosSalvos([]) // Limpar voos salvos
    setFormData({
      titulo: '',
      cliente: '', // Resetar sempre para vazio ao abrir modal
      status: 'COTAR',
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
      passageiros: [], // Limpar passageiros
      observacoesPassageiros: '',
      valorTotal: 0,
      valorEntrada: 0,
      formaPagamento: 'À vista',
      observacoesVenda: ''
    })
    setAbaAtiva('VOOS')
    setValorVendaSimples('');
    setValorCustoSimples('');
    setDataVenda('');
    setObservacaoVenda('');
    setItensVenda([]);
    setItensCusto([]);
    setFormVenda({
      conta: '',
      categoria: '',
      descricao: '',
      forma: '',
      parcelas: '',
      vencimento: '',
      valor: '',
      cliente: '',
      formaRecebimento: ''
    });
    setFormCusto({
      fornecedor: '',
      conta: '',
      categoria: '',
      descricao: '',
      forma: '',
      parcelas: '',
      vencimento: '',
      valor: '',
      formaRecebimento: ''
    });
    setEditandoItem(null);
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setCurrentStep(1)
    setClienteSelecionado(null)
    setBuscaCliente('')
    setVoosSalvos([]) // Limpar voos salvos
    setFormData({
      titulo: '',
      cliente: '',
      status: 'LEAD',
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
      passageiros: [], // Limpar passageiros
      observacoesPassageiros: '',
      valorTotal: 0,
      valorEntrada: 0,
      formaPagamento: 'À vista',
      observacoesVenda: ''
    })
    setAbaAtiva('VOOS')
  }

  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    // Salvar o ID do cliente no formData.cliente para compatibilidade com salvarCotacao
    setFormData(prev => ({ ...prev, cliente: cliente.id.toString() }));
  };

  const handleConfirmarCliente = () => {
    if (clienteSelecionado) {
      // Salvar o ID do cliente no formData.cliente para compatibilidade com salvarCotacao
      setFormData(prev => ({
        ...prev,
        cliente: clienteSelecionado.id.toString()
      }));
      setCurrentStep(2);
    }
  };

  const handleVoltarEtapa = () => {
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

  // Funções do Kanban (mantidas do design original)
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
    if (status === 'LEAD') {
      // Para a coluna LEAD, retornar leads formatados como cotações
      return leads.map(lead => {
        const nomeCompleto = lead.cliente ? 
          `${lead.cliente.nome}${lead.cliente.sobrenome ? ' ' + lead.cliente.sobrenome : ''}` : 
          'Cliente não encontrado';
        
        return {
        id: `lead-${lead.id}`,
          titulo: nomeCompleto,
          cliente: nomeCompleto,
        codigo: `LEAD-${lead.id}`,
        valor: 0,
        dataViagem: '',
        dataCriacao: lead.created_at,
        status: 'LEAD' as const,
        destino: '',
        observacoes: lead.observacao,
        isLead: true,
        leadData: lead
        }
      })
    } else if (status === 'APROVADO') {
      // Exibir cotações APROVADO e LANÇADO na coluna APROVADO
      return cotacoes.filter(cotacao => cotacao.status === 'APROVADO' || cotacao.status === 'LANÇADO')
    } else {
      // Para outras colunas, retornar cotações normais
      return cotacoes.filter(cotacao => cotacao.status === status)
    }
  }

  const getTotalPorStatus = (status: string) => {
    if (status === 'LEAD') {
      // Leads não têm valor, sempre 0
      return 0
    } else {
      const cotacoesColuna = getCotacoesPorStatus(status)
      const total = cotacoesColuna.reduce((acc, cotacao) => {
        return acc + (cotacao.valor || 0)
      }, 0)
      return total
    }
  }

  const formatarMoedaTotal = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  // Funções para a aba de VENDA
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  const calcularTotalCusto = () => {
    return itensCusto.reduce((total, item) => total + item.valor, 0)
  }

  const calcularTotalVenda = () => {
    return itensVenda.reduce((total, item) => total + item.valor, 0)
  }

  const calcularLucro = () => {
    return calcularTotalVenda() - calcularTotalCusto()
  }

  // 1. Corrigir editarItem para preencher corretamente os campos de forma de pagamento e recebimento
  const editarItem = (item: ItemVenda, tipo: 'custo' | 'venda') => {
    setEditandoItem(item);
    if (tipo === 'custo') {
      setFormCusto({
        fornecedor: item.fornecedor_id || '',
        conta: item.conta || '',
        categoria: item.categoria_id || '',
        descricao: item.descricao || '',
        forma: item.forma_pagamento_id || '',
        parcelas: item.parcelas || '',
        vencimento: item.vencimento || '',
        valor: item.valor?.toString() || '',
        formaRecebimento: item.forma_recebimento_id || '' // se existir no formCusto
      });
      setShowModalCusto(true);
    } else {
      setFormVenda({
        conta: item.conta || '',
        categoria: item.categoria_id || '',
        descricao: item.descricao || '',
        forma: item.forma_pagamento_id || '',
        parcelas: item.parcelas || '',
        vencimento: item.vencimento || '',
        valor: item.valor?.toString() || '',
        cliente: item.cliente_id || '',
        formaRecebimento: item.forma_recebimento_id || '' // se existir no formVenda
      });
      setShowModalVenda(true);
    }
  }

  const removerItem = (item: ItemVenda) => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      if (itensCusto.includes(item)) {
        setItensCusto(itensCusto.filter(i => i.id !== item.id))
      } else {
        setItensVenda(itensVenda.filter(i => i.id !== item.id))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
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

  const handleDrop = async (e: React.DragEvent, novoStatus: string) => {
    e.preventDefault();
    const itemId = draggedItem;
    if (!itemId) return;

    try {
      if (novoStatus === 'COTAR' && itemId.startsWith('lead-')) {
        // Converter lead em cotação
        const leadId = parseInt(itemId.replace('lead-', ''));
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          await converterLeadEmCotacao(lead);
        }
      } else if (itemId.startsWith('lead-')) {
        // Leads só podem ser movidos para "COTAR"
        alert('Leads só podem ser convertidos em cotações. Arraste para a coluna "COTAR".');
        return;
      } else if (novoStatus === 'LEAD') {
        // Impedir que cotações voltem para LEAD
        alert('Cotações não podem voltar a ser leads. Uma vez convertida, a cotação permanece como cotação.');
        return;
      } else {
        // Atualizar status de cotação normal
        const cotacao = cotacoes.find(c => c.id === itemId);
        if (cotacao && cotacao.status === 'LANÇADO' && novoStatus !== 'LANÇADO') {
          const confirmou = confirm('Esta cotação está com venda lançada. Ao voltar o status, todas as contas a pagar e receber vinculadas a esta venda serão apagadas. Tem certeza que deseja continuar?');
          if (!confirmou) {
            setDraggedItem(null);
            setDragOverColumn(null);
            return;
          }
          // Excluir contas a pagar
          await supabase
            .from('contas_pagar')
            .delete()
            .eq('origem', 'COTACAO')
            .eq('origem_id', cotacao.id);
          // Excluir contas a receber
          await supabase
            .from('contas_receber')
            .delete()
            .eq('origem', 'COTACAO')
            .eq('origem_id', cotacao.id);
          // Resetar valor da cotação
          await supabase
            .from('cotacoes')
            .update({ valor: 0 })
            .eq('id', cotacao.id);
        }
        let updateData: any = { status: novoStatus };
        if (novoStatus === 'APROVADO') {
          // Buscar valores atuais dos campos simples ou calculados
          if (cotacao) {
            updateData.valor = parseFloat(valorVendaSimples) || cotacao.valor || 0;
            updateData.custo = parseFloat(valorCustoSimples) || calcularTotalCusto();
          }
        }
        const { error } = await supabase
          .from('cotacoes')
          .update(updateData)
          .eq('id', parseInt(itemId));
        if (error) {
          console.error('Erro ao atualizar status da cotação:', error);
          alert('Erro ao atualizar status da cotação');
          return;
        }
        // Atualizar estado local
        setCotacoes(prev =>
          prev.map(cotacao =>
            cotacao.id === itemId
              ? { ...cotacao, status: novoStatus as any, valor: (cotacao.status === 'LANÇADO' && novoStatus !== 'LANÇADO') ? 0 : cotacao.valor }
              : cotacao
          )
        );
        console.log(`Cotação ${itemId} movida para ${novoStatus}`);
      }
    } catch (err) {
      console.error('Erro inesperado ao atualizar status:', err);
      alert('Erro inesperado ao atualizar status');
    }
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragStart = (e: React.DragEvent, cotacaoId: string) => {
    setDraggedItem(cotacaoId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', cotacaoId)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null)
    setDragOverColumn(null)
  }

  const handleViewCotacao = (cotacao: Cotacao) => {
    setViewingCotacao(cotacao)
    setShowViewModal(true)
    // Carregar voos da cotação para visualização
    carregarVoosCotacao(cotacao.id)
    // Carregar passageiros da cotação para visualização
    carregarPassageirosCotacao(cotacao.id)
  }

  const handleEditCotacao = (cotacao: Cotacao) => {
    setEditingCotacao(cotacao);
    setFormData(prev => ({
      ...prev,
      titulo: cotacao.titulo || '',
      cliente: cotacao.cliente || '',
      status: cotacao.status || 'LEAD',
      dataViagem: cotacao.dataViagem || '',
      destino: cotacao.destino || '',
      observacoes: cotacao.observacoes || '',
      valorTotal: cotacao.valor || 0,
      // Adicione outros campos do formulário conforme necessário
    }));
    setShowModal(true);
    setCurrentStep(2);
    // Carregar voos da cotação
    carregarVoosCotacao(cotacao.id);
    // Carregar passageiros da cotação
    carregarPassageirosCotacao(cotacao.id);
  }

  // Função para carregar voos de uma cotação específica
  const carregarVoosCotacao = async (cotacaoId: string) => {
    try {
      const { data: voosData, error } = await supabase
        .from('voos')
        .select('*')
        .eq('cotacao_id', cotacaoId)
      
      if (error) {
        console.error('Erro ao carregar voos:', error)
        return
      }
      
      if (voosData) {
        const voosFormatados = voosData.map((voo: any) => ({
          id: voo.id.toString(),
          idBanco: voo.id, // Salvar ID original do banco
          direcao: voo.direcao,
          origem: voo.origem,
          destino: voo.destino,
          dataIda: voo.data_ida || '',
          dataVolta: voo.data_volta || '',
          classe: voo.classe,
          companhia: voo.companhia,
          numeroVoo: voo.numero_voo,
          horarioPartida: voo.horario_partida,
          horarioChegada: voo.horario_chegada,
          observacoes: voo.observacoes || '',
          preenchimentoAutomatico: false,
          // Carregar campos adicionais do banco
          localizador: voo.localizador || '',
          duracao: voo.duracao || '',
          numeroCompra: voo.numero_compra || '',
          aberturaCheckin: voo.abertura_checkin || '',
          bagagemDespachada: voo.bagagem_despachada?.toString() || '0',
          bagagemMao: voo.bagagem_mao?.toString() || '0'
        }))
        setVoosSalvos(voosFormatados)
      }
    } catch (error) {
      console.error('Erro ao carregar voos:', error)
    }
  }

  // Função para carregar passageiros de uma cotação específica
  const carregarPassageirosCotacao = async (cotacaoId: string) => {
    try {
      // Buscar relacionamentos entre cotação e passageiros
      const { data: cotacaoPassageirosData, error } = await supabase
        .from('cotacao_passageiros')
        .select(`
          *,
          clientes:cliente_id (
            id,
            nome,
            sobrenome,
            email,
            telefone,
            cpf,
            rg,
            passaporte,
            data_nascimento
          )
        `)
        .eq('cotacao_id', cotacaoId)
      
      if (error) {
        console.error('Erro ao carregar passageiros:', error)
        return
      }
      
      if (cotacaoPassageirosData) {
        const passageirosFormatados = cotacaoPassageirosData.map((item: any) => {
          const cliente = item.clientes
          return {
            id: item.id.toString(),
            nome: cliente.nome,
            tipo: item.tipo as 'adulto' | 'crianca' | 'bebe',
            cliente_id: cliente.id.toString(),
            isNovoCliente: false,
            dataNascimento: cliente.data_nascimento || '',
            tipoDocumento: (cliente.passaporte ? 'passaporte' : 'cpf') as 'cpf' | 'passaporte',
            documento: cliente.passaporte || cliente.cpf || cliente.rg || ''
          }
        })
        
        setFormData(prev => ({
          ...prev,
          passageiros: passageirosFormatados
        }))
        
        console.log('Passageiros carregados:', passageirosFormatados)
      }
    } catch (error) {
      console.error('Erro ao carregar passageiros:', error)
    }
  }

  const handleDeleteCotacao = async (cotacao: Cotacao) => {
    if (confirm(`Tem certeza que deseja excluir a cotação "${cotacao.titulo}"?`)) {
      try {
        console.log('Tentando deletar cotação:', cotacao)
        
        // Deletar do Supabase - tratar ID corretamente
        const cotacaoId = typeof cotacao.id === 'string' ? parseInt(cotacao.id) : cotacao.id
        
        const { error } = await supabase
          .from('cotacoes')
          .delete()
          .eq('id', cotacaoId)
        
        if (error) {
          console.error('Erro ao deletar cotação:', error)
          alert('Erro ao deletar cotação: ' + error.message)
          return
        }
        
        // Atualizar estado local
        setCotacoes(prev => prev.filter(c => c.id !== cotacao.id))
        console.log(`Cotação ${cotacao.id} deletada com sucesso`)
      } catch (err) {
        console.error('Erro inesperado ao deletar cotação:', err)
        alert('Erro inesperado ao deletar cotação')
      }
    }
  }

  // Função utilitária para normalizar status (remover acentos e deixar maiúsculo)
  function normalizarStatus(status: string) {
    return status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }

  // Função para truncar texto das observações no card
  const truncarTexto = (texto: string, limite: number = 80): string => {
    if (!texto || texto.length <= limite) {
      return texto || 'Sem observações'
    }
    return texto.substring(0, limite) + '...'
  }

  const CardCotacao = ({ cotacao, onEdit, onDelete, draggable, onDragStart, onDragEnd }: any) => {
    const navigate = useNavigate();
    const isLead = cotacao.isLead;
    const statusNormalizado = normalizarStatus(cotacao.status || '');

    // Soma dos valores de venda para esta cotação
    const totalVendaCotacao = itensVenda
      .filter(item => (item.origem_id ? item.origem_id === cotacao.id || item.origem_id === String(cotacao.id) : item.id === cotacao.id))
      .reduce((acc, item) => acc + (item.valor || 0), 0);
    
    return (
      <div 
        className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative" 
        draggable={draggable} 
        onDragStart={onDragStart} 
        onDragEnd={onDragEnd}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">
                {cotacao.cliente_id ? formatarNomeParaCard(cotacao.cliente_id) : cotacao.cliente}
              </h3>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                {cotacao.codigo}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">
              Criado em: {new Date(cotacao.dataCriacao).toLocaleDateString('pt-BR')}
            </p>
            {isLead ? (
              <p className="text-xs text-gray-600 italic">
                {truncarTexto(cotacao.observacoes)}
              </p>
            ) : (
              <p className="text-xs font-medium text-gray-700">
                {formatarMoedaTotal(cotacao.valor || 0)}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            {isLead ? (
              // Botões específicos para leads
              <>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setLeadSelecionado(cotacao.leadData);
                    setShowModalVisualizarLead(true);
                  }} 
                  className="p-1 hover:bg-purple-50 rounded"
                  title="Visualizar Lead"
                >
                  <Eye className="w-3 h-3 text-purple-500" />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setLeadSelecionado(cotacao.leadData);
                    setObservacaoLead(cotacao.observacoes || '');
                    setShowModalLead(true);
                  }} 
                  className="p-1 hover:bg-blue-50 rounded"
                  title="Editar Observação"
                >
                  <Edit className="w-3 h-3 text-blue-500" />
                </button>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    console.log('Abrindo modal de tarefas para lead:', cotacao.leadData);
                    setLeadSelecionado(cotacao.leadData);
                    setShowModalTarefas(true);
                    carregarTarefas(cotacao.leadData.id);
                  }} 
                  className="p-1 hover:bg-green-50 rounded"
                  title="Gerenciar Tarefas"
                >
                  <Calendar className="w-3 h-3 text-green-500" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                  className="p-1 hover:bg-red-50 rounded"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </>
            ) : (
              // Botões para cotações normais
              <>
                <button 
  onClick={(e) => { e.stopPropagation(); navigate(`/cotacao/${cotacao.id}/html`); }} 
  className="p-1 hover:bg-blue-50 rounded"
  title="Visualizar HTML"
>
  <Eye className="w-3 h-3 text-blue-500" />
</button>
                <button 
                  onClick={(e) => { e.stopPropagation(); window.open(`/cotacao/${cotacao.id}/print`, '_blank'); }} 
                  className="p-1 hover:bg-green-50 rounded"
                  title="Imprimir"
                >
                  <Printer className="w-3 h-3 text-green-500" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(); }} 
                  className="p-1 hover:bg-yellow-50 rounded"
                  title="Editar"
                >
                  <Edit className="w-3 h-3 text-yellow-500" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(); }} 
                  className="p-1 hover:bg-red-50 rounded"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </>
            )}
          </div>
        </div>
        {statusNormalizado === 'LANCADO' && (
          <CheckCircle className="absolute bottom-2 right-2 text-green-600 w-4 h-4" />
        )}
      </div>
    )
  }

  // Função para abrir o pop-up de impressão HTML diretamente
  const abrirPopupImpressao = async (cotacaoId: string) => {
    try {
      // Buscar dados da cotação
      const { data: cotacao } = await supabase
        .from('cotacoes')
        .select('*')
        .eq('id', cotacaoId)
        .single();

      if (!cotacao) {
        alert('Cotação não encontrada');
        return;
      }

      // Buscar dados da empresa
      let empresaInfo = {
        nome: 'Agência',
        cnpj: '-',
        logo: null,
        telefone: '',
        email: '',
        endereco: '',
        cor: '#0d9488'
      };

      if (cotacao.empresa_id) {
        const { data: empresa } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', cotacao.empresa_id)
          .single();
        
        if (empresa) {
          empresaInfo = {
            nome: empresa.nome || 'Agência',
            cnpj: empresa.cnpj || '-',
            logo: empresa.logotipo || null,
            telefone: empresa.telefone || '',
            email: empresa.email || '',
            endereco: empresa.endereco || '',
            cor: empresa.cor_personalizada || '#0d9488'
          };
        }
      }

      // Buscar cliente
      let clienteInfo = null;
      if (cotacao.cliente_id) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', cotacao.cliente_id)
          .single();
        
        if (cliente) {
          clienteInfo = cliente;
        }
      }

      // Buscar voos
      const { data: voos } = await supabase
        .from('voos')
        .select('*')
        .eq('cotacao_id', cotacaoId);

      // Buscar passageiros
      const { data: passageiros } = await supabase
        .from('cotacao_passageiros')
        .select('*')
        .eq('cotacao_id', cotacaoId);

      // Abrir nova janela e gerar HTML
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
      
      if (!printWindow) {
        alert('Por favor, permita pop-ups para visualizar o documento');
        return;
      }

      // Gerar cores personalizadas
      const hex = empresaInfo.cor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      const escurecerCor = (r: number, g: number, b: number, fator: number) => {
        return `rgb(${Math.round(r * fator)}, ${Math.round(g * fator)}, ${Math.round(b * fator)})`;
      };
      
      const cores = {
        primary: empresaInfo.cor,
        gradientFrom: empresaInfo.cor,
        gradientTo: escurecerCor(r, g, b, 0.8)
      };

      // Funções auxiliares
      const formatarDataLocal = (dateString: string): string => {
        if (!dateString) return '-';
        const [ano, mes, dia] = dateString.split('T')[0].split('-');
        return `${dia}/${mes}/${ano}`;
      };

      const formatarNomeCompleto = (nome: string, sobrenome?: string): string => {
        if (!sobrenome) return nome;
        const sobrenomes = sobrenome.trim().split(' ').filter(Boolean);
        if (sobrenomes.length > 0) {
          const ultimoSobrenome = sobrenomes[sobrenomes.length - 1];
          return `${nome} ${ultimoSobrenome}`;
        }
        return nome;
      };

      const formatarHorario = (horario: string): string => {
        if (!horario) return '-';
        if (horario.length === 8 && horario.includes(':')) {
          return horario.substring(0, 5);
        }
        return horario;
      };

      // HTML completo para impressão
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cotação ${cotacao?.codigo || 'Documento'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f9fafb; color: #1f2937; line-height: 1.3; font-size: 11px;
            }
            .container { max-width: 1000px; margin: 0 auto; padding: 8px; background: white; }
            .header {
              background: linear-gradient(135deg, ${cores.gradientFrom} 0%, ${cores.gradientTo} 100%);
              color: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;
            }
            .header-content { display: flex; justify-content: space-between; align-items: center; }
            .header-left { display: flex; align-items: center; gap: 12px; }
            .logo { width: 40px; height: 40px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: ${cores.primary}; font-size: 14px; }
            .contact-info { display: flex; flex-direction: column; gap: 4px; text-align: right; font-size: 11px; }
            .contact-item { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
            .contact-icon { width: 14px; height: 14px; flex-shrink: 0; }
            .header-info h1 { font-size: 20px; font-weight: bold; margin-bottom: 2px; }
            .header-info p { font-size: 11px; opacity: 0.9; }
            .cabecalho-unico { background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 15px; overflow: hidden; }
            .cabecalho-principal { background: linear-gradient(135deg, #3b82f6, #1e40af); padding: 10px 12px; color: white; }
            .reservado-por-titulo { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; }
            .reservado-por-left { display: flex; align-items: center; gap: 8px; }
            .codigo-agencia-right { background: rgba(255, 255, 255, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 7px; font-weight: 700; letter-spacing: 1px; color: white; }
            .reservado-label { font-size: 8px; font-weight: 600; color: rgba(255, 255, 255, 0.9); }
            .cliente-nome-principal { font-size: 9px; font-weight: 700; color: white; }
            .passageiros-detalhados { padding: 12px; }
            .passageiros-titulo { font-size: 8px; font-weight: 700; color: #111827; margin-bottom: 8px; }
            .passageiros-lista-completa { display: flex; flex-direction: column; gap: 6px; }
            .passageiro-linha { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; padding: 6px 8px; background: #f8fafc; border-radius: 4px; border-left: 2px solid #3b82f6; }
            .passageiro-nome-completo { font-size: 7px; font-weight: 600; color: #111827; }
            .passageiro-cpf { font-size: 6px; color: #6b7280; font-weight: 500; }
            .passageiro-nascimento { font-size: 6px; color: #6b7280; font-weight: 500; }
            .status-viagem-section { background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e5e7eb; }
            .status-grid { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
            .status-item { display: flex; align-items: center; gap: 8px; }
            .status-label { font-size: 12px; color: #6b7280; font-weight: 500; }
            .valor-total-display { font-size: 14px; font-weight: 700; color: #059669; }
            .data-atualizacao { font-size: 12px; color: #6b7280; }
            .status-badge { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 6px; text-transform: uppercase; }
            .status-aprovado { background: #dcfce7; color: #166534; }
            .status-lancado { background: #dbeafe; color: #1e40af; }
            .status-aguardando { background: #fef3cd; color: #92400e; }
            .status-default { background: #f3f4f6; color: #374151; }
            @media print { 
              body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 10px; }
              .container { padding: 8px; }
              @page { margin: 1cm; size: A4; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="header-content">
                <div class="header-left">
                  ${empresaInfo.logo ? 
                    `<img src="${empresaInfo.logo}" alt="Logo" class="logo" />` : 
                    '<div class="logo">LOGO</div>'
                  }
                  <div class="header-info">
                    <h1>${empresaInfo.nome}</h1>
                    <p>Agência de Viagens</p>
                    ${empresaInfo.cnpj !== '-' ? `<p>CNPJ: ${empresaInfo.cnpj}</p>` : ''}
                  </div>
                </div>
                <div class="contact-info">
                  ${empresaInfo.telefone ? `<div class="contact-item"><span>${empresaInfo.telefone}</span></div>` : ''}
                  ${empresaInfo.email ? `<div class="contact-item"><span>${empresaInfo.email}</span></div>` : ''}
                </div>
              </div>
            </div>

            <div class="cabecalho-unico">
              <div class="cabecalho-principal">
                <div class="reservado-por-titulo">
                  <div class="reservado-por-left">
                    <span class="reservado-label">Reservado por:</span>
                    <span class="cliente-nome-principal">${clienteInfo ? formatarNomeCompleto(clienteInfo.nome, clienteInfo.sobrenome) : 'Cliente não informado'}</span>
                  </div>
                  <div class="codigo-agencia-right">
                    <span class="codigo-value">${cotacao?.codigo || cotacao?.id}</span>
                  </div>
                </div>
              </div>
              
              <div class="passageiros-detalhados">
                <div class="passageiros-titulo">Passageiros:</div>
                <div class="passageiros-lista-completa">
                  ${passageiros && passageiros.length > 0 ? 
                    passageiros.map((passageiro, index) => `
                      <div class="passageiro-linha">
                        <span class="passageiro-nome-completo">${passageiro.nome || 'Nome não informado'}</span>
                        <span class="passageiro-cpf">${passageiro.documento ? `CPF: ${passageiro.documento}` : 'CPF: Não informado'}</span>
                        <span class="passageiro-nascimento">${passageiro.data_nascimento ? `Nascimento: ${formatarDataLocal(passageiro.data_nascimento)}` : 'Nascimento: Não informado'}</span>
                      </div>
                    `).join('') :
                    `<div class="passageiro-linha">
                      <span class="passageiro-nome-completo">Nenhum passageiro cadastrado</span>
                      <span class="passageiro-cpf">-</span>
                      <span class="passageiro-nascimento">-</span>
                    </div>`
                  }
                </div>
              </div>
              
              <div class="status-viagem-section">
                <div class="status-grid">
                  <div class="status-item">
                    <span class="status-label">Status:</span>
                    <span class="status-badge ${
                      cotacao?.status === 'APROVADO' ? 'status-aprovado' :
                      cotacao?.status === 'LANÇADO' ? 'status-lancado' :
                      cotacao?.status === 'AGUARDANDO_CLIENTE' ? 'status-aguardando' :
                      'status-default'
                    }">
                      ${cotacao?.status?.replace('_', ' ') || 'N/A'}
                    </span>
                  </div>
                  
                  ${cotacao?.valor_total ? `
                    <div class="status-item">
                      <span class="status-label">Valor Total:</span>
                      <span class="valor-total-display">
                        ${cotacao.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ` : ''}
                  
                  <div class="status-item">
                    <span class="status-label">Atualizado em:</span>
                    <span class="data-atualizacao">${formatarDataLocal(new Date().toISOString())} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>

            ${voos && voos.length > 0 ? `
              <!-- Seção de Voos -->
              <div style="margin-bottom: 16px;">
                ${voos.filter(voo => voo.direcao === 'IDA').length > 0 ? `
                  <div style="margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb;">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); display: flex; align-items: center; justify-content: center; color: white;">
                        ✈
                      </div>
                      <h3 style="font-size: 14px; font-weight: 600; color: #1f2937;">Voos de Ida</h3>
                    </div>
                    ${voos.filter(voo => voo.direcao === 'IDA').map((voo, index) => `
                      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 8px;">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="font-size: 8px; font-weight: 600;">${voo.companhia || 'Companhia Aérea'}</div>
                              <div style="font-size: 7px; opacity: 0.9;">Voo ${voo.numero_voo || 'N/A'}</div>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 8px; font-size: 6px; font-weight: 600;">IDA</div>
                          </div>
                        </div>
                        <div style="padding: 8px;">
                          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="text-align: center;">
                              <div style="font-size: 12px; font-weight: bold; color: #1f2937;">${voo.origem}</div>
                              <div style="font-size: 6px; color: #6b7280;">Partida</div>
                              <div style="font-size: 8px; font-weight: 600; color: #2563eb;">${formatarHorario(voo.horario_partida) || 'N/A'}</div>
                            </div>
                            <div style="flex: 1; margin: 0 8px; position: relative; display: flex; align-items: center;">
                              <div style="height: 1px; width: 100%; background: linear-gradient(90deg, #2563eb 0%, #4f46e5 100%); position: relative;">
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 1px solid #2563eb; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; font-size: 6px; color: #2563eb;">✈</div>
                              </div>
                            </div>
                            <div style="text-align: center;">
                              <div style="font-size: 12px; font-weight: bold; color: #1f2937;">${voo.destino}</div>
                              <div style="font-size: 6px; color: #6b7280;">Chegada</div>
                              <div style="font-size: 8px; font-weight: 600; color: #059669;">${formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                            </div>
                          </div>
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="background: #f9fafb; border-radius: 4px; padding: 4px;">
                              <div style="font-size: 6px; color: #6b7280;">Data do Voo</div>
                              <div style="font-size: 7px; font-weight: 600; color: #1f2937;">
                                ${voo.data_ida ? formatarDataLocal(voo.data_ida) : '-'}
                              </div>
                            </div>
                            <div style="background: #f9fafb; border-radius: 4px; padding: 4px;">
                              <div style="font-size: 6px; color: #6b7280;">Classe</div>
                              <div style="font-size: 7px; font-weight: 600; color: #1f2937;">${voo.classe || 'Econômica'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${voos.filter(voo => voo.direcao === 'INTERNO').length > 0 ? `
                  <div style="margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb;">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #059669 0%, #047857 100%); display: flex; align-items: center; justify-content: center; color: white;">
                        ✈
                      </div>
                      <h3 style="font-size: 14px; font-weight: 600; color: #1f2937;">Voos Internos</h3>
                    </div>
                    ${voos.filter(voo => voo.direcao === 'INTERNO').map((voo, index) => `
                      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 8px;">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="font-size: 8px; font-weight: 600;">${voo.companhia || 'Companhia Aérea'}</div>
                              <div style="font-size: 7px; opacity: 0.9;">Voo ${voo.numero_voo || 'N/A'}</div>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 8px; font-size: 6px; font-weight: 600;">INTERNO</div>
                          </div>
                        </div>
                        <div style="padding: 8px;">
                          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="text-align: center;">
                              <div style="font-size: 12px; font-weight: bold; color: #1f2937;">${voo.origem}</div>
                              <div style="font-size: 6px; color: #6b7280;">Partida</div>
                              <div style="font-size: 8px; font-weight: 600; color: #059669;">${formatarHorario(voo.horario_partida) || 'N/A'}</div>
                            </div>
                            <div style="flex: 1; margin: 0 8px; position: relative; display: flex; align-items: center;">
                              <div style="height: 1px; width: 100%; background: linear-gradient(90deg, #059669 0%, #047857 100%); position: relative;">
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 1px solid #059669; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; font-size: 6px; color: #059669;">✈</div>
                              </div>
                            </div>
                            <div style="text-align: center;">
                              <div style="font-size: 12px; font-weight: bold; color: #1f2937;">${voo.destino}</div>
                              <div style="font-size: 6px; color: #6b7280;">Chegada</div>
                              <div style="font-size: 8px; font-weight: 600; color: #2563eb;">${formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                            </div>
                          </div>
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="background: #f9fafb; border-radius: 4px; padding: 4px;">
                              <div style="font-size: 6px; color: #6b7280;">Data do Voo</div>
                              <div style="font-size: 7px; font-weight: 600; color: #1f2937;">
                                ${voo.data_ida ? formatarDataLocal(voo.data_ida) : '-'}
                              </div>
                            </div>
                            <div style="background: #f9fafb; border-radius: 4px; padding: 4px;">
                              <div style="font-size: 6px; color: #6b7280;">Classe</div>
                              <div style="font-size: 7px; font-weight: 600; color: #1f2937;">${voo.classe || 'Econômica'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                ${voos.filter(voo => voo.direcao === 'VOLTA').length > 0 ? `
                  <div style="margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #e5e7eb;">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); display: flex; align-items: center; justify-content: center; color: white;">
                        ✈
                      </div>
                      <h3 style="font-size: 14px; font-weight: 600; color: #1f2937;">Voos de Volta</h3>
                    </div>
                    ${voos.filter(voo => voo.direcao === 'VOLTA').map((voo, index) => `
                      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 8px;">
                          <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                              <div style="font-size: 8px; font-weight: 600;">${voo.companhia || 'Companhia Aérea'}</div>
                              <div style="font-size: 7px; opacity: 0.9;">Voo ${voo.numero_voo || 'N/A'}</div>
                            </div>
                            <div style="background: rgba(255, 255, 255, 0.2); padding: 2px 6px; border-radius: 8px; font-size: 6px; font-weight: 600;">VOLTA</div>
                          </div>
                        </div>
                        <div style="padding: 8px;">
                          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="text-align: center;">
                              <div style="font-size: 12px; font-weight: bold; color: #1f2937;">${voo.origem}</div>
                              <div style="font-size: 6px; color: #6b7280;">Partida</div>
                              <div style="font-size: 8px; font-weight: 600; color: #ea580c;">${formatarHorario(voo.horario_partida) || 'N/A'}</div>
                            </div>
                            <div style="flex: 1; margin: 0 8px; position: relative; display: flex; align-items: center;">
                              <div style="height: 1px; width: 100%; background: linear-gradient(90deg, #ea580c 0%, #dc2626 100%); position: relative;">
                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 1px solid #ea580c; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; font-size: 6px; color: #ea580c;">✈</div>
                              </div>
                            </div>
                            <div style="text-align: center;">
                              <div style="font-size: 12px; font-weight: bold; color: #1f2937;">${voo.destino}</div>
                              <div style="font-size: 6px; color: #6b7280;">Chegada</div>
                              <div style="font-size: 8px; font-weight: 600; color: #059669;">${formatarHorario(voo.horario_chegada) || 'N/A'}</div>
                            </div>
                          </div>
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                            <div style="background: #f9fafb; border-radius: 4px; padding: 4px;">
                              <div style="font-size: 6px; color: #6b7280;">Data do Voo</div>
                              <div style="font-size: 7px; font-weight: 600; color: #1f2937;">
                                ${voo.data_volta ? formatarDataLocal(voo.data_volta) : voo.data_ida ? formatarDataLocal(voo.data_ida) : '-'}
                              </div>
                            </div>
                            <div style="background: #f9fafb; border-radius: 4px; padding: 4px;">
                              <div style="font-size: 6px; color: #6b7280;">Classe</div>
                              <div style="font-size: 7px; font-weight: 600; color: #1f2937;">${voo.classe || 'Econômica'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${cotacao?.observacoes_venda ? `
              <div style="background: #fef3cd; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
                <div style="font-size: 10px; font-weight: 600; color: #92400e; margin-bottom: 6px;">Observações Importantes</div>
                <div style="font-size: 9px; color: #78350f; line-height: 1.4;">${cotacao.observacoes_venda}</div>
              </div>
            ` : ''}
          </div>
          
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 500);
            });
          </script>
        </body>
        </html>
      `;

      // Escrever conteúdo na nova janela
      printWindow.document.write(htmlContent);
      printWindow.document.close();

    } catch (error) {
      console.error('Erro ao abrir pop-up de impressão:', error);
      alert('Erro ao carregar dados da cotação');
    }
  };

  // Função para calcular a data de abertura do check-in
  // Mapeamento de cidades para fusos horários
  // Função para obter horário local do aeroporto via AeroDataBox API
  const obterHorarioLocalAeroporto = async (codigoAeroporto: string): Promise<{ timezone: string; offsetHours: number } | null> => {
    try {
      // Extrair código IATA do formato "MCO - Orlando"
      const codigoIATA = codigoAeroporto.split(' - ')[0].trim().toUpperCase();
      console.log('🌍 Buscando horário local para aeroporto:', codigoIATA);
      
      // Buscar horário local via API AeroDataBox
      const url = `https://prod.api.market/api/v1/aedbx/aerodatabox/airports/iata/${codigoIATA}/time/local`;
      const response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'x-magicapi-key': 'cmca45tr70001kz04kep2i99c',
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Não foi possível obter horário local para ${codigoIATA}, usando fallback`);
        return null;
      }

      const dados = await response.json();
      console.log('📡 Dados de horário local da API AeroDataBox:', dados);
      
      // A API retorna localTime e utcTime, calcular offset
      if (dados.localTime && dados.utcTime) {
        const localTime = new Date(dados.localTime);
        const utcTime = new Date(dados.utcTime);
        const offsetHours = (localTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60);
        
        console.log('⏰ Offset calculado:', offsetHours, 'horas');
        
        return {
          timezone: dados.timezone || 'UTC',
          offsetHours: offsetHours
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Erro ao buscar horário local do aeroporto:', error);
      return null;
    }
  };

  const calcularDataCheckin = async (voo: Voo, opcaoCheckin: string): Promise<string | null> => {
    console.log('🔍 DEBUG calcularDataCheckin - INÍCIO:', {
      voo: { id: voo.id, origem: voo.origem, dataIda: voo.dataIda, horarioPartida: voo.horarioPartida },
      opcaoCheckin,
      embarqueData,
      embarqueHora
    });

    try {
      // Definir quantas horas antes
      let horasAntes = 0;
      if (opcaoCheckin.includes('48h')) horasAntes = 48;
      else if (opcaoCheckin.includes('24h')) horasAntes = 24;
      else return null;

      // Usar dados do formulário se os do voo estiverem vazios
      const dataVoo = voo.dataIda || embarqueData;
      const horarioVoo = voo.horarioPartida || embarqueHora;

      if (!dataVoo || !horarioVoo) {
        console.log('❌ Dados insuficientes:', { dataVoo, horarioVoo });
        return null;
      }

      // Normalizar horário para HH:MM (remover segundos se houver)
      const horarioLimpo = horarioVoo.replace(/:\d{2}$/, '');
      
      // Validar formato do horário
      const regexHorario = /^\d{2}:\d{2}(:\d{2})?$/;
      if (!regexHorario.test(horarioVoo)) {
        console.log('❌ DEBUG: Formato de horário inválido:', horarioVoo);
        return null;
      }

      console.log('📊 DEBUG: Dados validados:', { dataVoo, horarioLimpo, horasAntes });

      // 🎯 **SOLUÇÃO PRÁTICA - Usar UTC da API AeroDataBox**
      if (voo.companhia && voo.numeroVoo && dataVoo) {
        console.log('🔍 Buscando UTC da API AeroDataBox...');
        
        try {
          // Buscar código IATA da companhia no banco
          const ciaNome = voo.companhia;
          const cia = ciasAereas.find(c => c.nome === ciaNome);
          
          if (cia) {
            const { data: ciaDb } = await supabase
              .from('CiasAereas')
              .select('codigo_iata')
              .eq('id', cia.id)
              .single();
              
            if (ciaDb?.codigo_iata) {
              const numeroCompleto = `${ciaDb.codigo_iata}${voo.numeroVoo}`;
              const url = `https://prod.api.market/api/v1/aedbx/aerodatabox/flights/Number/${numeroCompleto}/${dataVoo}?dateLocalRole=Both&withAircraftImage=false&withLocation=false`;
              
              const resp = await fetch(url, {
                headers: {
                  'accept': 'application/json',
                  'x-magicapi-key': 'cmca45tr70001kz04kep2i99c',
                },
              });
              
              if (resp.ok) {
                const json = await resp.json();
                const vooApi = json?.[0];
                
                if (vooApi?.departure?.scheduledTime?.utc) {
                  console.log('✅ UTC encontrado na API:', vooApi.departure.scheduledTime.utc);
                  
                  // **USAR DIRETAMENTE O UTC DA API**
                  const vooUTC = new Date(vooApi.departure.scheduledTime.utc);
                  console.log('🕐 Voo UTC:', vooUTC.toISOString());
                  
                  // Subtrair horas de check-in direto do UTC
                  const checkinUTC = new Date(vooUTC.getTime() - (horasAntes * 60 * 60 * 1000));
                  console.log('⏰ Check-in UTC:', checkinUTC.toISOString());
                  
                  // Converter para Brasil (UTC-3)
                  const checkinBrasil = new Date(checkinUTC.getTime() - (3 * 60 * 60 * 1000));
                  console.log('🇧🇷 Check-in Brasil:', checkinBrasil.toISOString());
                  
                  // Formatar como timestamp simples YYYY-MM-DD HH:MM:SS
                  const resultado = checkinBrasil.toISOString().slice(0, 19).replace('T', ' ');
                  console.log('✅ Resultado final com UTC da API:', resultado);
                  return resultado;
                }
              }
            }
          }
        } catch (apiError) {
          console.log('⚠️ Erro na API, usando fallback:', apiError);
        }
      }

      // **FALLBACK SIMPLES**
      console.log('🔄 API não disponível, usando cálculo direto...');
      
      // Criar timestamp simples assumindo horário local
      const dataHoraLocal = new Date(`${dataVoo}T${horarioLimpo}:00`);
      
      // Subtrair horas de check-in diretamente
      const checkinLocal = new Date(dataHoraLocal.getTime() - (horasAntes * 60 * 60 * 1000));
      
      // Formatar como timestamp simples
      const resultado = checkinLocal.toISOString().slice(0, 19).replace('T', ' ');
      console.log('✅ Resultado fallback:', resultado);
      return resultado;

    } catch (error) {
      console.error('❌ Erro ao calcular check-in:', error);
      return null;
    }
  };



  // Adicione antes do renderModalContent:
  const atualizarVoo = (vooId: string, campo: keyof Voo, valor: any) => {
    setFormData(prev => ({
      ...prev,
      voos: prev.voos.map(voo => voo.id === vooId ? { ...voo, [campo]: valor } : voo)
    }));
  };

  // Renderizar conteúdo do modal baseado na etapa
  const renderModalContent = () => {
    if (formData.status === 'LEAD') {
      if (!clienteSelecionado) {
        return (
          <div className="p-8 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Lead</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={buscaCliente}
                  onChange={e => setBuscaCliente(e.target.value)}
                  placeholder="Buscar cliente por nome, e-mail ou telefone"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                />
                <button
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm"
                  onClick={() => setShowNovoClienteModal(true)}
                  type="button"
                >
                  Novo Lead
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto bg-white border border-gray-100 rounded-lg shadow-sm">
                {clientesFiltrados.length === 0 && (
                  <div className="p-3 text-gray-500 text-sm">Nenhum cliente encontrado</div>
                )}
                {clientesFiltrados.map(cliente => (
                  <div
                    key={cliente.id}
                    onClick={() => {
                      setClienteSelecionado(cliente);
                      // Salvar o ID do cliente no formData.cliente para compatibilidade com salvarCotacao
                      setFormData(prev => ({ ...prev, cliente: cliente.id.toString() }));
                    }}
                    className={`p-3 cursor-pointer hover:bg-emerald-50 rounded transition-colors ${
                      (clienteSelecionado as Cliente | null)?.id === cliente.id
                        ? 'bg-emerald-100 font-bold'
                        : ''
                    }`}
                  >
                    {formatarNomeParaLista(cliente)} <span className="text-xs text-gray-500">{cliente.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      // Após selecionar cliente
      return (
        <div className="p-8 max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Lead</h2>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-lg text-emerald-800">
                {formatarNomeParaLista(clienteSelecionado)}
              </span>
              <button className="ml-auto text-sm text-gray-500 hover:underline" onClick={() => setClienteSelecionado(null)}>Trocar Cliente</button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação sobre a viagem desejada</label>
            <textarea
              value={formData.observacoesRoteiro}
              onChange={e => setFormData(prev => ({ ...prev, observacoesRoteiro: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
              placeholder="Ex: Cliente deseja viajar em julho para Paris, lua de mel, etc."
            />
          </div>
          <div className="flex justify-end">
            <button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg text-lg"
              onClick={salvarCotacao}
              disabled={!formData.observacoesRoteiro}
            >
              Salvar Lead
            </button>
          </div>
        </div>
      );
    }
    if (currentStep === 1) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecionar Cliente</h2>
            <p className="text-gray-600">Escolha o cliente para esta cotação</p>
          </div>

          {/* Busca de clientes */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nome, email, telefone ou CPF..."
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Botão para criar novo cliente */}
            <div className="mt-3">
              <button
                onClick={() => setShowNovoClienteModal(true)}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              >
                <User className="h-4 w-4" />
                Criar Novo Cliente
              </button>
            </div>
          </div>

          {/* Lista de clientes */}
          <div className="max-h-96 overflow-y-auto">
            {loadingClientes ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando clientes...</p>
              </div>
            ) : !clientesFiltrados || clientesFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientesFiltrados.map((cliente: Cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => setClienteSelecionado(cliente)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      (clienteSelecionado as Cliente | null)?.id === cliente.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatarNomeParaLista(cliente, 30)}</h3>
                        <p className="text-sm text-gray-600">{cliente.email}</p>
                        <p className="text-sm text-gray-500">{cliente.telefone}</p>
                      </div>
                      {(clienteSelecionado as Cliente | null)?.id === cliente.id && (
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarCliente}
              disabled={!clienteSelecionado}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )
    }

    if (currentStep === 2) {
      return (
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleVoltarEtapa}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Nova Cotação</h2>
                <p className="text-gray-600">Cliente: {clienteSelecionado ? `${clienteSelecionado.nome}${clienteSelecionado.sobrenome ? ' ' + clienteSelecionado.sobrenome : ''}` : ''}</p>
              </div>
            </div>
          </div>

          {/* Abas */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'VOOS', label: 'Voos', icon: Plane },
                  { id: 'HOTEIS', label: 'Hotéis', icon: Building },
                  { id: 'SERVICOS', label: 'Serviços', icon: Route },
                  { id: 'PASSAGEIROS', label: 'Passageiros', icon: Users },
                  { id: 'VENDA', label: 'Venda', icon: DollarSign }
                ].map((aba) => (
                  <button
                    key={aba.id}
                    onClick={() => setAbaAtiva(aba.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      abaAtiva === aba.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <aba.icon className="h-4 w-4" />
                    {aba.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Conteúdo das abas */}
          <div className="min-h-96">
            {abaAtiva === 'VOOS' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Informações dos Voos</h3>
                  <p className="text-gray-600">Adicione os voos de Ida, Volta e Internos para esta cotação</p>
                </div>
                {/* Abas de voos */}
                <div className="flex gap-2 mb-6">
                  {['IDA', 'VOLTA', 'INTERNO'].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setAbaVooAtiva(tipo as 'IDA' | 'VOLTA' | 'INTERNO')}
                      className={`px-4 py-2 rounded-t-lg font-medium text-sm border-b-2 transition-colors ${
                        abaVooAtiva === tipo
                          ? 'border-blue-600 text-blue-700 bg-blue-50'
                          : 'border-transparent text-gray-500 bg-gray-100 hover:text-blue-700'
                      }`}
                    >
                      {tipo === 'IDA' && 'Voo de Ida'}
                      {tipo === 'VOLTA' && 'Voo de Volta'}
                      {tipo === 'INTERNO' && 'Voo Interno'}
                    </button>
                  ))}
                </div>
                {/* Lista de voos salvos do tipo */}
                <div className="mb-4">
                  {voosSalvos.filter(v => v.direcao === abaVooAtiva).length === 0 && (
                    <div className="text-center text-gray-500 py-4">Nenhum voo adicionado para este tipo</div>
                  )}
                  {voosSalvos.filter(v => v.direcao === abaVooAtiva).map((voo, idx) => (
                    <div key={voo.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 overflow-hidden">
                      {/* Cabeçalho do Card com gradiente */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                              </svg>
                            </div>
                      <div>
                              <h3 className="font-bold text-lg">{voo.companhia}</h3>
                              <p className="text-blue-100 text-sm">Voo {voo.numeroVoo}</p>
                      </div>
                          </div>
                          <div className="text-right">
                            <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                              {voo.direcao}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Principal */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Seção de Rota */}
                          <div className="lg:col-span-2">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{voo.origem}</div>
                                <div className="text-sm text-gray-500">Partida</div>
                                <div className="text-lg font-semibold text-blue-600">{formatarHorario(voo.horarioPartida)}</div>
                              </div>
                              
                              <div className="flex-1 mx-6 relative">
                                <div className="h-0.5 bg-gray-300 relative">
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                </div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-blue-500 rounded-full p-2">
                                  <svg className="w-4 h-4 text-blue-500 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                                  </svg>
                                </div>
                                <div className="text-center mt-2">
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    Voo Direto
                                  </span>
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">{voo.destino}</div>
                                <div className="text-sm text-gray-500">Chegada</div>
                                <div className="text-lg font-semibold text-green-600">{formatarHorario(voo.horarioChegada)}</div>
                              </div>
                            </div>

                            {/* Informações Adicionais */}
                            <div className="grid grid-cols-2 gap-4 mt-6">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-sm text-gray-500">Data do Voo</div>
                                <div className="font-semibold text-gray-900">
                                  {formatarDataSemTimezone(voo.dataIda)}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-sm text-gray-500">Classe</div>
                                <div className="font-semibold text-gray-900">{voo.classe}</div>
                              </div>
                            </div>
                          </div>

                          {/* Seção de Ações */}
                          <div className="flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-800">Status</span>
                                </div>
                                <div className="text-green-700 font-semibold">Confirmado</div>
                              </div>
                              
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="text-sm text-blue-600 mb-1">Bagagem</div>
                                <div className="flex space-x-2">
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">23kg</span>
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Mão</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col space-y-2 mt-4">
                              <button 
                                onClick={() => editarVooSalvo(voo)} 
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                              >
                                Editar Voo
                              </button>
                              <button 
                                onClick={async () => await removerVooSalvo(voo.id)} 
                                className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm border border-red-200"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Formulário de voo em edição */}
                {formData.voos.length > 0 && formData.voos[0].direcao === abaVooAtiva && (
                  <div className="border border-blue-300 rounded-xl p-8 bg-white mb-6 shadow-sm">
                    {/* Bloco: Dados principais */}
                    <h2 className="text-xl font-bold mb-4">Voo de {abaVooAtiva === 'IDA' ? 'Ida' : abaVooAtiva === 'VOLTA' ? 'Volta' : 'Interno'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº do Voo</label>
                        <input type="text" value={formData.voos[0].numeroVoo} onChange={e => atualizarVoo(formData.voos[0].id, 'numeroVoo', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Companhia</label>
                        <select value={formData.voos[0].companhia} onChange={e => atualizarVoo(formData.voos[0].id, 'companhia', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option value="">Selecione</option>
                          {ciasAereas.map(cia => (
                            <option key={cia.id} value={cia.nome}>{cia.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data do Voo</label>
                        <input type="date" value={formData.voos[0].dataIda} onChange={e => atualizarVoo(formData.voos[0].id, 'dataIda', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                      </div>
                    </div>
                    <div className="flex justify-end mb-6">
                      <button
                        className={`px-5 py-2 rounded-lg font-medium ${loadingBuscaVoo ? 'bg-gray-300 text-gray-500' : 'bg-gray-600 text-white hover:bg-gray-700'}`}
                        disabled={loadingBuscaVoo || !formData.voos[0].companhia || !formData.voos[0].numeroVoo || !formData.voos[0].dataIda}
                        onClick={buscarDadosVooAPI}
                      >
                        {loadingBuscaVoo ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>
                    {erroBuscaVoo && <div className="text-red-600 text-sm mt-2">{erroBuscaVoo}</div>}
                    <hr className="my-6" />
                    {/* Bloco: Origem/Destino */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Origem e Destino</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origem *</label>
                        <input type="text" value={formData.voos[0].origem} onChange={e => atualizarVoo(formData.voos[0].id, 'origem', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Digite ou selecione o aeroporto" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
                        <input type="text" value={formData.voos[0].destino} onChange={e => atualizarVoo(formData.voos[0].id, 'destino', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Digite ou selecione o aeroporto" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Embarque *</label>
                        <div className="flex gap-2">
                          <input type="date" value={embarqueData} onChange={e => setEmbarqueData(e.target.value)} className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg" />
                          <input type="time" value={embarqueHora} onChange={e => setEmbarqueHora(e.target.value)} className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chegada *</label>
                        <div className="flex gap-2">
                          <input type="date" value={chegadaData} onChange={e => setChegadaData(e.target.value)} className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg" />
                          <input type="time" value={chegadaHora} onChange={e => setChegadaHora(e.target.value)} className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                      </div>
                    </div>
                    <hr className="my-6" />
                    {/* Bloco: Detalhes do Voo */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Detalhes do Voo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                        <input type="text" value={duracaoVoo} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Localizador</label>
                        <input 
                          type="text" 
                          value={formData.voos[0]?.localizador || ''}
                          onChange={(e) => atualizarVoo(formData.voos[0]?.id, 'localizador', e.target.value)}
                          placeholder="Ex: ABC123"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº da Compra</label>
                        <input 
                          type="text" 
                          value={formData.voos[0]?.numeroCompra || ''}
                          onChange={(e) => atualizarVoo(formData.voos[0]?.id, 'numeroCompra', e.target.value)}
                          placeholder="Ex: 123456789"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                        <select value={formData.voos[0].classe} onChange={e => atualizarVoo(formData.voos[0].id, 'classe', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option value="Econômica">Econômica</option>
                          <option value="Premium Economy">Premium Economy</option>
                          <option value="Executiva">Executiva</option>
                          <option value="Primeira Classe">Primeira Classe</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conexões</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option>Voo direto</option>
                          <option>1 conexão</option>
                          <option>2 conexões</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notificação Check-in</label>
                        <select 
                          value={notificacaoCheckin}
                          onChange={(e) => setNotificacaoCheckin(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="Notificar Check-in 48h">Notificar Check-in 48h</option>
                          <option value="Notificar Check-in 24h">Notificar Check-in 24h</option>
                          <option value="Não notificar">Não notificar</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                      <input 
                        type="text" 
                        value={formData.voos[0]?.observacoes || ''}
                        onChange={(e) => atualizarVoo(formData.voos[0]?.id, 'observacoes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                      />
                    </div>
                    <hr className="my-6" />
                    {/* Bloco: Bagagens */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Bagagens</h3>
                    <div className="flex gap-6 items-center mb-6">
                      <div className="flex items-center gap-2">
                        <span role="img" aria-label="bagagem despachada">🧳</span>
                        <input 
                          type="number" 
                          min="0" 
                          value={bagagemDespachada}
                          onChange={(e) => setBagagemDespachada(e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg" 
                        />
                        <span className="text-xs text-gray-500">Despachada</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span role="img" aria-label="bagagem de mão">🧳</span>
                        <input 
                          type="number" 
                          min="0" 
                          value={bagagemMao}
                          onChange={(e) => setBagagemMao(e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-lg" 
                        />
                        <span className="text-xs text-gray-500">Mão</span>
                      </div>

                    </div>
                    {/* Rodapé */}
                    <div className="flex justify-end gap-2 mt-8">
                      <button onClick={() => removerVoo(formData.voos[0].id)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                      <button onClick={async () => await salvarVoo(formData.voos[0])} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Salvar</button>
                    </div>
                  </div>
                )}
                {/* Botão para adicionar novo voo */}
                <div className="flex justify-end mt-4">
                  <button onClick={async () => await adicionarNovoVoo(abaVooAtiva)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Adicionar Novo {abaVooAtiva === 'IDA' ? 'Voo de Ida' : abaVooAtiva === 'VOLTA' ? 'Voo de Volta' : 'Voo Interno'}</button>
                </div>
              </div>
            )}

            {abaAtiva === 'HOTEIS' && (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuração de Hotéis</h3>
                <p className="text-gray-600">Em breve: Formulário para configuração de hotéis</p>
              </div>
            )}

            {abaAtiva === 'SERVICOS' && (
              <div className="text-center py-12">
                <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Serviços Adicionais</h3>
                <p className="text-gray-600">Em breve: Configuração de serviços como traslados, passeios, etc.</p>
              </div>
            )}

            {abaAtiva === 'PASSAGEIROS' && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Informações dos Passageiros</h3>
                  <p className="text-gray-600">Configure a quantidade e dados dos passageiros para esta viagem</p>
                </div>

                {/* Quantidade de Passageiros */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Quantidade de Passageiros</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Adultos */}
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
                      <p className="text-xs text-gray-500 mt-1">12+ anos</p>
                    </div>
                    
                    {/* Crianças */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Crianças
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
                      <p className="text-xs text-gray-500 mt-1">2-11 anos</p>
                    </div>
                    
                    {/* Bebês */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bebês
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
                      <p className="text-xs text-gray-500 mt-1">0-2 anos</p>
                    </div>
                  </div>
                  
                  {/* Indicador do total de passageiros */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        Total de passageiros: {formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes}
                      </span>
                      {(formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes) > 9 && (
                        <span className="text-red-500 text-sm">⚠️ Máximo permitido: 9</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de Passageiros */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-gray-900">
                      Passageiros Adicionados ({formData.passageiros.length}/{formData.numeroAdultos + formData.numeroCriancas + formData.numeroBebes})
                    </h4>
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
                    {formData.passageiros.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Nenhum passageiro adicionado ainda</p>
                        <p className="text-sm">Clique em "Adicionar Passageiro" para começar</p>
                      </div>
                    ) : (
                      formData.passageiros.map((passageiro, index) => (
                        <div key={passageiro.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-medium text-gray-900">Passageiro {index + 1}</h5>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  passageiros: prev.passageiros.filter(p => p.id !== passageiro.id)
                                }))
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remover
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Nome */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo <span className="text-red-500">*</span>
                              </label>
                              <div className="flex gap-2">
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
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Nome completo"
                                />
                                <button
                                  type="button"
                                  onClick={() => abrirSelecaoCliente(passageiro)}
                                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  title="Selecionar cliente existente ou criar novo"
                                >
                                  <User className="h-4 w-4" />
                                </button>
                              </div>
                              {(clienteSelecionado as Cliente | null)?.id && (
                                <p className="text-xs text-green-600 mt-1">
                                  ✓ Cliente selecionado da base de dados
                                </p>
                              )}
                            </div>

                            {/* Tipo */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={passageiro.tipo}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    passageiros: prev.passageiros.map(p => 
                                      p.id === passageiro.id ? { ...p, tipo: e.target.value as 'adulto' | 'crianca' | 'bebe' } : p
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

                            {/* Data de Nascimento */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data de Nascimento
                              </label>
                              <input
                                type="date"
                                value={passageiro.dataNascimento || ''}
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

                            {/* Tipo de Documento */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
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

                            {/* Número do Documento */}
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número do {passageiro.tipoDocumento === 'cpf' ? 'CPF' : 'Passaporte'}
                              </label>
                              <input
                                type="text"
                                value={passageiro.documento || ''}
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
                      ))
                    )}
                  </div>

                  {/* Observações dos Passageiros */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações sobre os Passageiros
                    </label>
                    <textarea
                      value={formData.observacoesPassageiros}
                      onChange={(e) => setFormData(prev => ({ ...prev, observacoesPassageiros: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: Passageiros com necessidades especiais, restrições alimentares, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'VENDA' && (
              <>
                {(formData.status === 'COTAR' || formData.status === 'AGUARDANDO_CLIENTE') && (
                  // MODO SIMPLIFICADO
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-2">Valor de Custo (R$)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valorCustoSimples}
                            onChange={e => setValorCustoSimples(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-2xl font-bold text-red-600"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="block text-lg font-medium text-gray-700 mb-2">Valor de Venda (R$)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valorVendaSimples}
                            onChange={e => setValorVendaSimples(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold text-blue-600"
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="text-lg text-gray-600">Lucro</div>
                        <div className={`text-3xl font-bold ${parseFloat(valorVendaSimples || '0') - parseFloat(valorCustoSimples || '0') >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                            parseFloat(valorVendaSimples || '0') - parseFloat(valorCustoSimples || '0')
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {(formData.status === 'APROVADO' || normalizarStatus(formData.status) === 'LANCADO') && (
                  <div className="space-y-6">
                    {/* Cabeçalho da Venda */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data da Venda</label>
                      {normalizarStatus(formData.status) === 'LANCADO' ? (
                        <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700">
                          {(() => {
                            // Busca a data do primeiro item de venda, senão do primeiro custo
                            const dataVendaSalva = itensVenda[0]?.created_at || itensCusto[0]?.created_at;
                            if (!dataVendaSalva) return '-';
                            // Extrai só a data (YYYY-MM-DD) e formata para dd/mm/aaaa
                            const [ano, mes, dia] = dataVendaSalva.substring(0, 10).split('-');
                            return `${dia}/${mes}/${ano}`;
                          })()}
                        </div>
                      ) : (
                        <input 
                          type="date" 
                          value={dataVenda}
                          onChange={(e) => setDataVenda(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        />
                      )}
                    </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                            {normalizarStatus(formData.status) === 'LANCADO' ? (
                              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 min-h-[40px]">
                                {observacaoVenda || '-'}
                              </div>
                            ) : (
                              <textarea 
                                value={observacaoVenda}
                                onChange={(e) => setObservacaoVenda(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                                rows={2}
                                placeholder="Observações gerais da venda"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Lucro Total</div>
                              <div className={`text-3xl font-bold ${calcularLucro() >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatarMoeda(calcularLucro())}</div>
                            </div>
                            <button
                              className={`ml-4 px-5 py-2 text-white rounded-lg font-semibold shadow transition-colors ${
                                normalizarStatus(formData.status) === 'LANCADO' 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                              type="button"
                              onClick={normalizarStatus(formData.status) === 'LANCADO' ? excluirVenda : lancarVenda}
                            >
                              {normalizarStatus(formData.status) === 'LANCADO' ? 'Excluir Venda' : 'Lançar venda'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Total de Custos</div>
                        <div className="text-2xl font-bold text-red-600">{formatarMoeda(calcularTotalCusto())}</div>
                        <div className="text-xs text-gray-500 mt-1">{itensCusto.length} itens</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Total de Vendas</div>
                        <div className="text-2xl font-bold text-blue-600">{formatarMoeda(calcularTotalVenda())}</div>
                        <div className="text-xs text-gray-500 mt-1">{itensVenda.length} itens</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-1">Margem</div>
                        <div className={`text-2xl font-bold ${calcularLucro() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {calcularTotalVenda() > 0 ? `${((calcularLucro() / calcularTotalVenda()) * 100).toFixed(1)}%` : '0%'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">de lucro</div>
                      </div>
                    </div>

                {/* Valores de Custo */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Valores de Custo</h3>
                        {normalizarStatus(formData.status) !== 'LANCADO' && (
                          <button 
                            onClick={() => setShowModalCusto(true)}
                            className="bg-white text-red-600 px-4 py-1 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                          >
                            + Adicionar Custo
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                              {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th> */}
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcelas</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                              </tr>
                      </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {itensCusto.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                  Nenhum item de custo adicionado
                                      </td>
                                    </tr>
                            ) : (
                              itensCusto.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{getNomeFornecedor(item.fornecedor_id || item.fornecedor)}</td>
                                  {/* <td className="px-4 py-3 text-sm text-gray-900">{item.conta}</td> */}
                                  <td className="px-4 py-3 text-sm text-gray-900">{getNomeCategoria(item.categoria_id || item.categoria)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.descricao}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{getNomeFormaPagamento(item.forma_pagamento_id || item.forma)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.parcelas}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{formatarData(item.vencimento)}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-red-600">{formatarMoeda(item.valor)}</td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {normalizarStatus(formData.status) === 'LANCADO' ? (
                                        <button 
                                          onClick={() => visualizarConta(item, 'pagar')}
                                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                          title="Visualizar"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                      ) : (
                                        <>
                                          <button 
                                            onClick={() => editarItem(item, 'custo')}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </button>
                                          <button 
                                            onClick={() => removerItem(item)}
                                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                        </td>
                                      </tr>
                              ))
                            )}
                            {itensCusto.length > 0 && (
                              <tr className="bg-gray-50">
                                <td colSpan={7} className="px-4 py-3 text-sm font-medium text-gray-900">Total</td>
                                <td className="px-4 py-3 text-sm font-bold text-red-600">{formatarMoeda(calcularTotalCusto())}</td>
                          <td></td>
                              </tr>
                            )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Valores de Venda */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-lg">Valores de Venda</h3>
                        {normalizarStatus(formData.status) !== 'LANCADO' && (
                          <button 
                            onClick={() => setShowModalVenda(true)}
                            className="bg-white text-blue-600 px-4 py-1 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                          >
                            + Adicionar Venda
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th> */}
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcelas</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimento</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                              </tr>
                      </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {itensVenda.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                  Nenhum item de venda adicionado
                                </td>
                              </tr>
                            ) : (
                              itensVenda.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  {/* <td className="px-4 py-3 text-sm text-gray-900">{item.conta}</td> */}
                                  <td className="px-4 py-3 text-sm text-gray-900">{getNomeCliente(item.cliente_id || item.cliente)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{getNomeCategoria(item.categoria_id || item.categoria)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.descricao}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{getNomeFormaPagamento(item.forma_recebimento_id || item.forma)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.parcelas}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{formatarData(item.vencimento)}</td>
                                  <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">{formatarMoeda(item.valor)}</td>
                                  <td className="px-4 py-3 text-sm text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {normalizarStatus(formData.status) === 'LANCADO' ? (
                                        <button 
                                          onClick={() => visualizarConta(item, 'receber')}
                                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                                          title="Visualizar"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                      ) : (
                                        <>
                                          <button 
                                            onClick={() => editarItem(item, 'venda')}
                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                          </button>
                                          <button 
                                            onClick={() => removerItem(item)}
                                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                        </td>
                                      </tr>
                              ))
                            )}
                            {itensVenda.length > 0 && (
                              <tr className="bg-gray-50">
                                <td colSpan={7} className="px-4 py-3 text-sm font-medium text-gray-900">Total</td>
                                <td className="px-4 py-3 text-sm font-bold text-blue-600">{formatarMoeda(calcularTotalVenda())}</td>
                          <td></td>
                              </tr>
                            )}
                      </tbody>
                    </table>
                    </div>
                </div>
              </div>
                )}
              </>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            {normalizarStatus(formData.status) !== 'LANCADO' && (
            <button
              onClick={async () => await salvarCotacao()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Atualizar Cotação
            </button>
            )}
          </div>
        </div>
      )
    }
  }

  // Função para gerar código alfanumérico único de 6 dígitos
  const gerarCodigoUnico = async () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let tentativas = 0;
    const maxTentativas = 10;
    
    while (tentativas < maxTentativas) {
      let codigo = '';
      for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      
      // Verificar se o código já existe no banco
      const { data, error } = await supabase
        .from('cotacoes')
        .select('id')
        .eq('codigo', codigo)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Código não existe, pode usar
        return codigo;
      } else if (error) {
        console.error('Erro ao verificar código:', error);
        return codigo; // Em caso de erro, retorna o código gerado
      }
      
      // Código existe, tentar novamente
      tentativas++;
    }
    
    // Se chegou aqui, gerar código com timestamp para garantir unicidade
    const timestamp = Date.now().toString().slice(-3);
    const caracteresAleatorios = caracteres.charAt(Math.floor(Math.random() * caracteres.length)) + 
                                caracteres.charAt(Math.floor(Math.random() * caracteres.length)) + 
                                caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    return (caracteresAleatorios + timestamp).toUpperCase();
  }

  // Função utilitária para data local
  function getLocalDateString(date: Date | string) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Função para formatar data sem problemas de timezone
  const formatarDataSemTimezone = (dataString: string) => {
    if (!dataString) return '-';
    
    // Se a data já está no formato YYYY-MM-DD, usa diretamente
    if (dataString.includes('-')) {
      const [ano, mes, dia] = dataString.split('T')[0].split('-');
      const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      return data.toLocaleDateString('pt-BR', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short' 
      });
    }
    
    // Caso contrário, usa o método normal
    return new Date(dataString).toLocaleDateString('pt-BR', { 
      weekday: 'short', 
      day: '2-digit', 
      month: 'short' 
    });
  };

  // Função para formatar horário removendo segundos
  const formatarHorario = (horario: string) => {
    if (!horario) return '-';
    
    // Se o horário vem no formato HH:MM:SS, remove os segundos
    if (horario.length === 8 && horario.includes(':')) {
      return horario.substring(0, 5); // Pega apenas HH:MM
    }
    
    // Se já está no formato HH:MM, retorna como está
    return horario;
  };

  const salvarCotacao = async () => {
    console.log('🎯 INICIO: salvarCotacao chamada');
    
    try {
      console.log('🔄 PASSO 1: Verificando dados iniciais');
      console.log('📋 formData.cliente:', formData.cliente);
      console.log('📊 formData.status:', formData.status);
      console.log('🔧 editingCotacao:', editingCotacao?.id);
      
      // Validação básica
      if (!formData.cliente) {
        console.log('❌ ERRO: Cliente não selecionado');
        alert('Selecione um cliente para a cotação.');
        return null;
      }

      console.log('🔄 PASSO 2: Validação inicial OK');
      
      // Buscar cliente por nome (já que formData.cliente é o nome completo)
      console.log('🔍 PASSO 3: Buscando cliente pelo nome');
      console.log('👥 Array de clientes disponível:', clientes.length);
      
      // Buscar cliente tanto pelo nome quanto pelo nome completo
      const clienteObj = clientes.find(c => {
        const nomeCompleto = `${c.nome}${c.sobrenome ? ' ' + c.sobrenome : ''}`;
        return c.nome === formData.cliente || nomeCompleto === formData.cliente;
      });
      
        if (!clienteObj) {
        console.log('❌ ERRO: Cliente não encontrado no array');
        console.log('🔍 Procurando por:', formData.cliente);
        console.log('📝 Clientes disponíveis por nome:', clientes.map(c => c.nome));
        console.log('📝 Clientes disponíveis por nome completo:', clientes.map(c => `${c.nome}${c.sobrenome ? ' ' + c.sobrenome : ''}`));
          alert('Cliente não encontrado. Selecione um cliente válido.');
          return null;
      }
      
      console.log('✅ PASSO 4: Cliente encontrado:', clienteObj.nome, 'ID:', clienteObj.id);
      
      // Verificar empresa_id
      console.log('🔄 PASSO 5: Verificando empresa_id');
      const empresaId = user?.user_metadata?.empresa_id;
      if (!empresaId) {
        console.log('❌ ERRO: empresa_id não encontrado');
        alert('Erro: empresa_id não encontrado. Faça login novamente.');
        return null;
      }
      console.log('🏢 empresa_id encontrado:', empresaId);

      // Gerar código único apenas para novas cotações
      console.log('🔄 PASSO 6: Verificando código único');
      let codigoUnico = '';
      if (!editingCotacao?.id) {
        console.log('🆕 Gerando código para nova cotação');
        codigoUnico = await gerarCodigoUnico();
        console.log('🔤 Código gerado:', codigoUnico);
      } else {
        console.log('✏️ Editando cotação existente, não precisa de código');
      }

      // Preparar dados
      console.log('🔄 PASSO 7: Preparando dados da cotação');
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const titulo = `${clienteObj.nome} - ${dataAtual}`;

      const cotacaoData: any = {
        titulo: titulo,
        cliente: clienteObj.nome,
        cliente_id: Number(clienteObj.id),
        usuario_id: user.id,
        empresa_id: empresaId,
        status: formData.status,
        valor: formData.status === 'APROVADO' ? formData.valorTotal || 0 : parseFloat(valorVendaSimples) || 0,
        custo: formData.status === 'APROVADO' ? calcularTotalCusto() : parseFloat(valorCustoSimples) || 0,
        data_viagem: formData.diasViagem ? getLocalDateString(new Date()) : null,
        data_criacao: new Date().toISOString(),
        destino: '',
        observacoes: formData.observacoesRoteiro || null
      };

      if (codigoUnico) {
        cotacaoData.codigo = codigoUnico;
      }

      console.log('📦 PASSO 8: Dados preparados:', cotacaoData);

      // Salvar no banco
      console.log('🔄 PASSO 9: Salvando no banco');
      let cotacaoId;
      
      if (editingCotacao?.id) {
        console.log('✏️ Atualizando cotação ID:', editingCotacao.id);
        const { data, error } = await supabase
          .from('cotacoes')
          .update(cotacaoData)
          .eq('id', editingCotacao.id)
          .select('id');
        
        if (error) {
          console.error('❌ Erro no update:', error);
          throw error;
        }
        cotacaoId = editingCotacao.id;
        console.log('✅ Update realizado com sucesso');
      } else {
        console.log('🆕 Criando nova cotação');
        const { data, error } = await supabase
          .from('cotacoes')
          .insert([cotacaoData])
          .select('id')
          .single();
        
        if (error) {
          console.error('❌ Erro no insert:', error);
          throw error;
        }
        cotacaoId = data.id;
        console.log('✅ Insert realizado com sucesso, ID:', cotacaoId);
      }

      // Salvar passageiros
      console.log('🔄 PASSO 10: Verificando passageiros');
      if (formData.passageiros.length > 0) {
        console.log('👥 Salvando', formData.passageiros.length, 'passageiros');
        await salvarPassageiros(cotacaoId);
        console.log('✅ Passageiros salvos');
      } else {
        console.log('ℹ️ Nenhum passageiro para salvar');
      }

      console.log('🎉 SUCESSO: Cotação salva, ID:', cotacaoId);
      alert('Cotação salva com sucesso!');
      
      // Recarregar e fechar
      console.log('🔄 PASSO 11: Recarregando cotações');
      await carregarCotacoes();
      console.log('🔄 PASSO 12: Fechando modal');
      handleCloseModal();
      
      console.log('✅ FIM: Processo concluído com sucesso');
      return cotacaoId;
      
    } catch (err: any) {
      console.error('💥 ERRO CAPTURADO:', err);
      
      // Tratamento de erro mais detalhado
      let errorMessage = 'Erro desconhecido ao salvar cotação';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.details) {
        errorMessage = err.details;
      } else if (err.hint) {
        errorMessage = `${err.message || 'Erro'}: ${err.hint}`;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object') {
        errorMessage = JSON.stringify(err);
      }
      
      alert(`Erro ao salvar cotação: ${errorMessage}`);
      return null;
    }
  };

  // Função para salvar passageiros no banco
  const salvarPassageiros = async (cotacaoId: string) => {
    try {
      // Primeiro, remover passageiros existentes da cotação
      const { error: deleteError } = await supabase
        .from('cotacao_passageiros')
        .delete()
        .eq('cotacao_id', cotacaoId);
      
      if (deleteError) {
        console.error('Erro ao remover passageiros existentes:', deleteError);
      }

      // Preparar dados dos passageiros para inserção
      const passageirosData = formData.passageiros
        .filter(passageiro => passageiro.cliente_id) // Só salvar passageiros que têm cliente_id
        .map(passageiro => ({
          cotacao_id: cotacaoId,
          cliente_id: Number(passageiro.cliente_id),
          tipo: passageiro.tipo
        }));

      console.log('Dados dos passageiros a serem salvos:', passageirosData);

      // Inserir novos passageiros
      if (passageirosData.length > 0) {
        const { error: insertError } = await supabase
          .from('cotacao_passageiros')
          .insert(passageirosData);
        
        if (insertError) {
          console.error('Erro ao salvar passageiros:', insertError);
          throw new Error(`Erro ao salvar passageiros: ${insertError.message}`);
        }
      }

      console.log('Passageiros salvos com sucesso');
    } catch (error) {
      console.error('Erro ao salvar passageiros:', error);
      throw error;
    }
  };

  const adicionarNovoVoo = async (direcao: 'IDA' | 'VOLTA' | 'INTERNO') => {
    // Se há um voo sendo editado, salvá-lo primeiro
    if (formData.voos.length > 0) {
      const vooAtual = formData.voos[0];
      const salvou = await salvarVoo(vooAtual);
      if (!salvou) return;
    }
    
    // Limpar estado de edição quando adicionar novo voo
    setVooEditandoId(null);
    console.log('➕ Adicionando novo voo, limpando estado de edição');
    
    // Adicionar novo voo
    const novoVoo: Voo = {
      id: Date.now().toString(),
      direcao,
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
    };
    setFormData(prev => ({ ...prev, voos: [novoVoo] }));
  };

  const salvarVoo = async (voo: Voo) => {
    // Validação básica
    if (!voo.origem || !voo.destino || !voo.classe || !voo.companhia || !voo.numeroVoo || !voo.horarioPartida || !voo.horarioChegada || (voo.direcao === 'IDA' && !voo.dataIda) || (voo.direcao === 'INTERNO' && !voo.dataIda) || (voo.direcao === 'VOLTA' && !voo.dataVolta)) {
      alert('Preencha todos os campos obrigatórios do voo.');
      return false;
    }

    // Obter o id da cotação atual ou criar um temporário
    let cotacaoId = editingCotacao?.id;
    
    // Se não há cotação salva, salvar primeiro
    if (!cotacaoId) {
      const novoCotacaoId = await salvarCotacao();
      if (!novoCotacaoId) {
        return false;
      }
      cotacaoId = novoCotacaoId;
    }

    // Calcular data de abertura do check-in (agora usando API real)
    console.log('🔄 DEBUG salvarVoo - Antes de calcular check-in:', {
      voo: {
        id: voo.id,
        direcao: voo.direcao,
        origem: voo.origem,
        dataIda: voo.dataIda,
        dataVolta: voo.dataVolta,
        horarioPartida: voo.horarioPartida
      },
      notificacaoCheckin: notificacaoCheckin
    });

    const dataCheckin = await calcularDataCheckin(voo, notificacaoCheckin);
    
    console.log('📊 DEBUG salvarVoo - Resultado do cálculo:', {
      dataCheckin: dataCheckin,
      dataCheckinType: typeof dataCheckin,
      dataCheckinLength: dataCheckin?.length
    });

    // Converter bagagem para números inteiros
    const quantidadeDespachada = parseInt(bagagemDespachada) || 0;
    const quantidadeMao = parseInt(bagagemMao) || 0;

    // Persistir no Supabase
    try {
      const vooData = {
        cotacao_id: cotacaoId,
        direcao: voo.direcao,
        origem: voo.origem,
        destino: voo.destino,
        data_ida: voo.dataIda || null,
        data_volta: voo.dataVolta || null,
        classe: voo.classe,
        companhia: voo.companhia,
        numero_voo: voo.numeroVoo,
        horario_partida: voo.horarioPartida,
        horario_chegada: voo.horarioChegada,
        observacoes: voo.observacoes || null,
        // Novos campos
        localizador: voo.localizador || null,
        duracao: duracaoVoo || null,
        numero_compra: voo.numeroCompra || null,
        abertura_checkin: dataCheckin,
        bagagem_despachada: quantidadeDespachada,
        bagagem_mao: quantidadeMao
      };

      console.log('🛫 Dados do voo a serem salvos:', vooData);
      console.log('📅 Data de check-in calculada:', dataCheckin);
      console.log('🧳 Quantidades de bagagem:', { despachada: quantidadeDespachada, mao: quantidadeMao });
      console.log('🔧 ID de edição:', vooEditandoId);
      console.log('💾 DEBUG: Campo abertura_checkin no vooData:', {
        abertura_checkin: vooData.abertura_checkin,
        isNull: vooData.abertura_checkin === null,
        isUndefined: vooData.abertura_checkin === undefined,
        type: typeof vooData.abertura_checkin
      });

      let error;
      
      // Verificar se estamos editando um voo existente
      if (vooEditandoId) {
        console.log('📝 Atualizando voo existente ID:', vooEditandoId);
        const { error: updateError } = await supabase
          .from('voos')
          .update(vooData)
          .eq('id', vooEditandoId);
        error = updateError;
        
        // Resetar o ID de edição após salvar
        setVooEditandoId(null);
      } else {
        console.log('➕ Criando novo voo');
        const { error: insertError } = await supabase
          .from('voos')
          .insert([vooData]);
        error = insertError;
      }

      if (error) {
        console.error('Erro ao salvar voo:', error);
        alert('Erro ao salvar voo no banco: ' + error.message);
        return false;
      }
      
      setVoosSalvos(prev => {
        const vooExistente = prev.find(v => v.id === voo.id);
        if (vooExistente) {
          return prev.map(v => v.id === voo.id ? voo : v);
        } else {
          return [...prev, voo];
        }
      });
      setFormData(prev => ({ ...prev, voos: [] }));
      alert('Voo salvo com sucesso!');
      return true;
    } catch (err: any) {
      console.error('Erro inesperado ao salvar voo:', err);
      alert('Erro inesperado ao salvar voo: ' + (err.message || err));
      return false;
    }
  };

  const removerVoo = (vooId: string) => {
    setFormData(prev => ({ ...prev, voos: [] }));
  };

  const removerVooSalvo = async (vooId: string) => {
    // Remove do banco
    const { error } = await supabase.from('voos').delete().eq('id', vooId);
    if (error) {
      alert('Erro ao remover voo do banco: ' + error.message);
      return;
    }
    // Remove do estado local
    setVoosSalvos(prev => prev.filter(v => v.id !== vooId));
  };

  const editarVooSalvo = (voo: Voo) => {
    console.log('🔧 Iniciando edição do voo:', voo);
    
    // Definir que estamos editando este voo específico
    setVooEditandoId(voo.idBanco?.toString() || voo.id);
    
    // Preencher TODOS os campos do formulário com dados do voo
    setBagagemDespachada(voo.bagagemDespachada || '0');
    setBagagemMao(voo.bagagemMao || '0');
    setDuracaoVoo(voo.duracao || '');
    
    // ⚡ CORREÇÃO: Preencher campos de data e horário que estavam faltando
    if (voo.dataIda) {
      setEmbarqueData(voo.dataIda);
    }
    if (voo.dataVolta) {
      setChegadaData(voo.dataVolta);
    }
    if (voo.horarioPartida) {
      setEmbarqueHora(voo.horarioPartida);
    }
    if (voo.horarioChegada) {
      setChegadaHora(voo.horarioChegada);
    }
    
    // Preencher notificação de check-in baseada na presença do campo
    if (voo.aberturaCheckin) {
      // Tentar detectar se foi 24h ou 48h baseado na diferença
      setNotificacaoCheckin('Notificar Check-in 24h'); // Padrão
    }
    
    // Remover da lista de salvos temporariamente
    setVoosSalvos(prev => prev.filter(v => v.id !== voo.id));
    
    // Colocar no formulário para edição com TODOS os dados
    const vooCompleto = {
      ...voo,
      // Garantir que todos os campos estão preenchidos
      dataIda: voo.dataIda || '',
      dataVolta: voo.dataVolta || '',
      horarioPartida: voo.horarioPartida || '',
      horarioChegada: voo.horarioChegada || ''
    };
    
    setFormData(prev => ({ ...prev, voos: [vooCompleto] }));
    
    console.log('📝 Voo movido para edição com dados completos:', {
      id: voo.id,
      idBanco: voo.idBanco,
      dataIda: voo.dataIda,
      dataVolta: voo.dataVolta,
      horarioPartida: voo.horarioPartida,
      horarioChegada: voo.horarioChegada
    });
  };

  // Adicione o carregamento das cias aéreas:
  useEffect(() => {
    const fetchCias = async () => {
      const { data, error } = await supabase
        .from('CiasAereas')
        .select('id, nome')
        .order('nome');
      if (!error && data) setCiasAereas(data);
    }
    fetchCias();
  }, [showModal]);

  // Função para buscar dados do voo na API AeroDataBox
  const buscarDadosVooAPI = async () => {
    setLoadingBuscaVoo(true);
    setErroBuscaVoo(null);
    try {
      const voo = formData.voos[0];
      const cia = ciasAereas.find(c => c.nome === voo.companhia);
      if (!cia || !voo.numeroVoo || !voo.dataIda) {
        setErroBuscaVoo('Preencha companhia, número do voo e data.');
        setLoadingBuscaVoo(false);
        return;
      }
      // Buscar código IATA da cia
      const { data: ciaDb, error: errorCia } = await supabase
        .from('CiasAereas')
        .select('codigo_iata')
        .eq('id', cia.id)
        .single();
      if (errorCia || !ciaDb) {
        setErroBuscaVoo('Erro ao buscar código IATA da companhia.');
        setLoadingBuscaVoo(false);
        return;
      }
      const codigoIata = ciaDb.codigo_iata;
      const numeroCompleto = `${codigoIata}${voo.numeroVoo}`;
      const url = `https://prod.api.market/api/v1/aedbx/aerodatabox/flights/Number/${numeroCompleto}/${voo.dataIda}?dateLocalRole=Both&withAircraftImage=false&withLocation=false`;
      const resp = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'x-magicapi-key': 'cmca45tr70001kz04kep2i99c',
        },
      });
      if (!resp.ok) throw new Error('Voo não encontrado ou erro na API');
      const json = await resp.json();
      if (!json || !json[0]) throw new Error('Voo não encontrado');
      const vooApi = json[0];
      // Preencher campos do formulário
      atualizarVoo(voo.id, 'origem', vooApi.departure?.airport?.municipalityName ? `${vooApi.departure.airport.iata} - ${vooApi.departure.airport.municipalityName}` : '');
      atualizarVoo(voo.id, 'destino', vooApi.arrival?.airport?.municipalityName ? `${vooApi.arrival.airport.iata} - ${vooApi.arrival.airport.municipalityName}` : '');
      atualizarVoo(voo.id, 'horarioPartida', vooApi.departure?.scheduledTime?.local ? vooApi.departure.scheduledTime.local.substring(11, 16) : '');
      atualizarVoo(voo.id, 'horarioChegada', vooApi.arrival?.scheduledTime?.local ? vooApi.arrival.scheduledTime.local.substring(11, 16) : '');
      atualizarVoo(voo.id, 'classe', vooApi.cabinClass || 'Econômica');
      const embarqueLocal = vooApi.departure?.scheduledTime?.local;
      const chegadaLocal = vooApi.arrival?.scheduledTime?.local;
      if (embarqueLocal) {
        atualizarVoo(voo.id, 'dataIda', embarqueLocal.substring(0, 10));
        atualizarVoo(voo.id, 'horarioPartida', embarqueLocal.substring(11, 16));
        setEmbarqueData(embarqueLocal.substring(0, 10));
        setEmbarqueHora(embarqueLocal.substring(11, 16));
      }
      if (chegadaLocal) {
        atualizarVoo(voo.id, 'dataVolta', chegadaLocal.substring(0, 10));
        atualizarVoo(voo.id, 'horarioChegada', chegadaLocal.substring(11, 16));
        setChegadaData(chegadaLocal.substring(0, 10));
        setChegadaHora(chegadaLocal.substring(11, 16));
      }
      // Calcular duração
      if (embarqueLocal && chegadaLocal) {
        const d1 = new Date(embarqueLocal);
        const d2 = new Date(chegadaLocal);
        const diffMs = d2.getTime() - d1.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const horas = Math.floor(diffMin / 60);
        const minutos = diffMin % 60;
        const duracao = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        setDuracaoVoo(duracao);
      }
      setErroBuscaVoo(null);
    } catch (err: any) {
      setErroBuscaVoo(err.message || 'Erro ao buscar voo');
    } finally {
      setLoadingBuscaVoo(false);
    }
  };

  const carregarCotacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('cotacoes')
        .select(`
          *,
          clientes:cliente_id (
            id,
            nome,
            sobrenome,
            email
          )
        `)
        .order('data_criacao', { ascending: false });
      
      if (error) {
        console.error('Erro ao carregar cotações:', error);
        return;
      }
      
      console.log('Cotações carregadas do Supabase com clientes:', data);
      
      // Converter dados do Supabase para o formato esperado pelo componente
      const cotacoesFormatadas = data?.map(cotacao => {
        console.log('Cotação individual com cliente_id:', cotacao.cliente_id);
        
        // Buscar nome completo do cliente se cliente_id existir
        let nomeCompletoCliente = cotacao.cliente; // fallback para o campo texto
        if (cotacao.clientes && cotacao.clientes.nome) {
          nomeCompletoCliente = `${cotacao.clientes.nome}${cotacao.clientes.sobrenome ? ' ' + cotacao.clientes.sobrenome : ''}`;
        }
        
        return {
          id: cotacao.id.toString(),
          titulo: cotacao.titulo,
          cliente: nomeCompletoCliente, // Usar nome completo aqui
          cliente_id: cotacao.cliente_id?.toString(), // Incluir cliente_id
          codigo: cotacao.codigo || `COT${cotacao.id.toString().padStart(4, '0')}`, // Fallback se não existir
          valor: cotacao.valor || 0,
          dataViagem: cotacao.data_viagem || '',
          dataCriacao: cotacao.data_criacao,
          status: cotacao.status as 'LEAD' | 'COTAR' | 'AGUARDANDO_CLIENTE' | 'APROVADO' | 'REPROVADO' | 'LANÇADO',
          destino: cotacao.destino || '',
          observacoes: cotacao.observacoes || ''
        };
      }) || [];
      
      console.log('Cotações formatadas com nomes completos:', cotacoesFormatadas);
      setCotacoes(cotacoesFormatadas);
    } catch (err) {
      console.error('Erro inesperado ao carregar cotações:', err);
    }
  }

  // Funções para seleção de cliente para passageiro
  const abrirSelecaoCliente = (passageiro: Passageiro) => {
    setPassageiroEmEdicao(passageiro)
    setShowClienteModal(true)
    setModoCriacaoCliente(false)
    setBuscaClientePassageiro('')
    setClienteSelecionadoPassageiro(null)
  }

  const fecharModalCliente = () => {
    setShowClienteModal(false)
    setPassageiroEmEdicao(null)
    setModoCriacaoCliente(false)
    setBuscaClientePassageiro('')
    setClienteSelecionadoPassageiro(null)
  }

  const selecionarClienteParaPassageiro = (cliente: Cliente) => {
    setClienteSelecionadoPassageiro(cliente)
  }

  const confirmarClienteParaPassageiro = () => {
    if (!passageiroEmEdicao || !clienteSelecionadoPassageiro) {
      alert('Por favor, selecione um cliente')
      return
    }

    // Preencher campos do passageiro com dados do cliente
    setFormData(prev => ({
      ...prev,
      passageiros: prev.passageiros.map(p => 
        p.id === passageiroEmEdicao.id ? {
          ...p,
          nome: clienteSelecionadoPassageiro.nome,
          cliente_id: clienteSelecionadoPassageiro.id.toString(),
          isNovoCliente: false,
          dataNascimento: clienteSelecionadoPassageiro.data_nascimento || '',
          tipoDocumento: clienteSelecionadoPassageiro.passaporte ? 'passaporte' : 'cpf',
          documento: clienteSelecionadoPassageiro.passaporte || clienteSelecionadoPassageiro.cpf || clienteSelecionadoPassageiro.rg || '',
        } : p
      )
    }))

    fecharModalCliente()
  }

  const criarNovoClienteParaPassageiro = async () => {
    if (!novoClienteData.nome.trim() || !novoClienteData.email.trim() || !novoClienteData.telefone.trim()) {
      alert('Por favor, preencha nome, email e telefone')
      return
    }

    // Buscar empresa_id do usuário autenticado
    const empresaId = user?.user_metadata?.empresa_id;
    if (!empresaId) {
      alert('Erro: empresa_id não encontrado no usuário autenticado. Faça login novamente ou contate o suporte.')
      return
    }

    try {
      // Corrigir campos de data vazios para null
      const clientePayload = {
        ...novoClienteData,
        empresa_id: empresaId,
        data_nascimento: novoClienteData.data_nascimento || null,
        data_expedicao: novoClienteData.data_expedicao || null,
        data_expiracao: novoClienteData.data_expiracao || null,
        sobrenome: novoClienteData.sobrenome || '',
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert([clientePayload])
        .select('*')
        .single()

      if (error) {
        console.error('Erro ao criar cliente:', error)
        alert('Erro ao criar cliente: ' + error.message)
        return
      }

      // Atualizar o passageiro com os dados do novo cliente
      setFormData(prev => ({
        ...prev,
        passageiros: prev.passageiros.map(p => 
          p.id === passageiroEmEdicao?.id ? {
            ...p,
            nome: data.nome,
            cliente_id: data.id.toString(),
            isNovoCliente: true,
            dataNascimento: data.data_nascimento || '',
            tipoDocumento: data.passaporte ? 'passaporte' : 'cpf',
            documento: data.passaporte || data.cpf || data.rg || '',
          } : p
        )
      }))

      // Recarregar lista de clientes
      await carregarClientes()

      fecharModalCliente()
      alert('Cliente criado e associado ao passageiro com sucesso!')
    } catch (error) {
      console.error('Erro inesperado ao criar cliente:', error)
      alert('Erro inesperado ao criar cliente')
    }
  }

  const alternarModoCriacao = () => {
    setModoCriacaoCliente(!modoCriacaoCliente)
    setClienteSelecionadoPassageiro(null)
    setBuscaClientePassageiro('')
  }

  // Adicione antes do renderModalContent:
  const handleOpenModalFromColumn = (status: string) => {
    console.log('Abrindo modal para status:', status);
    if (status === 'LEAD') {
      // Abrir modal de criação de lead
      console.log('Abrindo modal de lead');
      handleOpenModalLead()
    } else {
      // Abrir modal de criação de cotação normal
      console.log('Abrindo modal de cotação');
      setFormData(prev => ({ ...prev, status: status as any }));
      setShowModal(true);
      setCurrentStep(1);
      setClienteSelecionado(null);
      setBuscaCliente('');
    }
  }

  // Após o useEffect que carrega os leads/cotações:
  useEffect(() => {
    // Cria o canal de escuta realtime
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          // Sempre que houver mudança, recarrega os leads
          carregarLeads()
        }
      )
      .subscribe()

    // Limpa o canal ao desmontar o componente
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Funções para gerenciar tarefas
  const carregarTarefas = async (leadId: number) => {
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao carregar tarefas:', error)
        return
      }
      
      setTarefas(data || [])
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error)
    }
  }

  const salvarTarefa = async () => {
    if (!leadSelecionado || !novaTarefa.titulo || !novaTarefa.data_vencimento || !novaTarefa.hora_vencimento || !novaTarefa.responsavel) {
      alert('Preencha todos os campos obrigatórios da tarefa')
      return
    }
    try {
      const { data, error } = await supabase
        .from('tarefas')
        .insert([{
          titulo: novaTarefa.titulo,
          descricao: novaTarefa.descricao,
          prioridade: novaTarefa.prioridade,
          status: novaTarefa.status,
          data_vencimento: novaTarefa.data_vencimento,
          hora_vencimento: novaTarefa.hora_vencimento,
          responsavel: novaTarefa.responsavel,
          categoria: novaTarefa.categoria,
          cliente: novaTarefa.cliente,
          lead_id: leadSelecionado.id,
          empresa_id: user?.user_metadata?.empresa_id // Adicionado para RLS
        }])
        .select()
        .single()
      if (error) {
        alert('Erro ao salvar tarefa: ' + error.message)
        return
      }
      setTarefas(prev => [data, ...prev])
      setNovaTarefa({
        titulo: '',
        descricao: '',
        prioridade: 'Média',
        status: 'pendente',
        data_vencimento: '',
        hora_vencimento: '',
        responsavel: '',
        categoria: 'vendas',
        cliente: leadSelecionado.cliente ? 
          `${leadSelecionado.cliente.nome}${leadSelecionado.cliente.sobrenome ? ' ' + leadSelecionado.cliente.sobrenome : ''}` : 
          ''
      })
      alert('Tarefa criada com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error)
      alert('Erro ao salvar tarefa')
    }
  }

  // Funções para gerenciar compromissos
  const carregarCompromissos = async (leadId: number) => {
    try {
      const { data, error } = await supabase
        .from('compromissos')
        .select('*')
        .eq('lead_id', leadId)
        .order('data_hora', { ascending: true })
      
      if (error) {
        console.error('Erro ao carregar compromissos:', error)
        return
      }
      
      setCompromissos(data || [])
    } catch (error) {
      console.error('Erro ao carregar compromissos:', error)
    }
  }

  const salvarCompromisso = async () => {
    if (!leadSelecionado || !novoCompromisso.titulo || !novoCompromisso.data_hora) {
      alert('Preencha título e data/hora do compromisso')
      return
    }

    try {
      const { data, error } = await supabase
        .from('compromissos')
        .insert([{
          ...novoCompromisso,
          lead_id: leadSelecionado.id
        }])
        .select()
        .single()

      if (error) {
        alert('Erro ao salvar compromisso: ' + error.message)
        return
      }

      setCompromissos(prev => [data, ...prev])
      setNovoCompromisso({
        titulo: '',
        descricao: '',
        data_hora: '',
        tipo: 'CALL',
        local: '',
        status: 'AGENDADO'
      })
      alert('Compromisso criado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar compromisso:', error)
      alert('Erro ao salvar compromisso')
    }
  }

  // 1. Ajustar o estado inicial de novaTarefa para já vir com categoria 'Comercial' e cliente do lead
  useEffect(() => {
    if (showModalTarefas && leadSelecionado) {
      setNovaTarefa(prev => ({
        ...prev,
        categoria: 'Comercial',
        cliente: leadSelecionado.cliente ? 
          `${leadSelecionado.cliente.nome}${leadSelecionado.cliente.sobrenome ? ' ' + leadSelecionado.cliente.sobrenome : ''}` : 
          ''
      }))
    }
  }, [showModalTarefas, leadSelecionado])

  // Funções para gerenciar itens de custo e venda
  const adicionarItemCusto = () => {
    // Validação robusta dos campos obrigatórios
    if (
      !formCusto.descricao.trim() ||
      !formCusto.valor || isNaN(Number(formCusto.valor)) || Number(formCusto.valor) <= 0 ||
      !formCusto.fornecedor ||
      !formCusto.categoria ||
      !formCusto.forma ||
      !formCusto.vencimento ||
      !formCusto.parcelas || isNaN(Number(formCusto.parcelas)) || Number(formCusto.parcelas) <= 0
    ) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const novoItem: ItemVenda = {
      id: Date.now().toString(),
      fornecedor: formCusto.fornecedor,
      conta: '',
      categoria: formCusto.categoria,
      descricao: formCusto.descricao,
      forma: formCusto.forma,
      parcelas: formCusto.parcelas,
      vencimento: formCusto.vencimento,
      valor: parseFloat(formCusto.valor)
    };

    if (editandoItem) {
      setItensCusto(itensCusto.map(item => item.id === editandoItem.id ? novoItem : item));
      setEditandoItem(null);
    } else {
      setItensCusto([...itensCusto, novoItem]);
    }

    limparFormularios();
    setShowModalCusto(false);
  }

  const adicionarItemVenda = () => {
    // Validação robusta dos campos obrigatórios
    if (
      !formVenda.descricao.trim() ||
      !formVenda.valor || isNaN(Number(formVenda.valor)) || Number(formVenda.valor) <= 0 ||
      !formVenda.cliente ||
      !formVenda.categoria ||
      !formVenda.forma ||
      !formVenda.vencimento ||
      !formVenda.parcelas || isNaN(Number(formVenda.parcelas)) || Number(formVenda.parcelas) <= 0
    ) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const novoItem: ItemVenda = {
      id: Date.now().toString(),
      conta: '',
      categoria: formVenda.categoria,
      descricao: formVenda.descricao,
      forma: formVenda.forma,
      parcelas: formVenda.parcelas,
      vencimento: formVenda.vencimento,
      valor: parseFloat(formVenda.valor),
      fornecedor: undefined,
      cliente: formVenda.cliente
    };

    if (editandoItem) {
      setItensVenda(itensVenda.map(item => item.id === editandoItem.id ? novoItem : item));
      setEditandoItem(null);
    } else {
      setItensVenda([...itensVenda, novoItem]);
    }

    limparFormularios();
    setShowModalVenda(false);
  }

  const limparFormularios = () => {
    setFormCusto({
      fornecedor: '',
      conta: '',
      categoria: '',
      descricao: '',
      forma: '',
      parcelas: '',
      vencimento: '',
      valor: '',
      formaRecebimento: ''
    })
    // Preservar o cliente se estivermos editando uma cotação
    const clienteAtual = formVenda.cliente;
    setFormVenda({
      conta: '',
      categoria: '',
      descricao: '',
      forma: '',
      parcelas: '',
      vencimento: '',
      valor: '',
      cliente: editingCotacao ? clienteAtual : '',
      formaRecebimento: ''
    })
  }

  const fecharModais = () => {
    setShowModalCusto(false)
    setShowModalVenda(false)
    setEditandoItem(null)
    limparFormularios()
  }

  // Estado para controlar abertura dos modais
  const [showModalNovoFornecedor, setShowModalNovoFornecedor] = useState(false);
  const [showModalNovaCategoria, setShowModalNovaCategoria] = useState(false);
  const [novoFornecedor, setNovoFornecedor] = useState({ nome: '', cnpj: '', telefone: '', email: '', observacoes: '' });
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', tipo: '', descricao: '' });

  // Adicione os estados para fornecedores e categorias
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // Função para carregar fornecedores do banco
  const carregarFornecedores = async () => {
    setLoadingFornecedores(true);
    try {
      // Primeiro busca fornecedores globais (user_id IS NULL)
      const { data: globais, error: errorGlobais } = await supabase
        .from('fornecedores')
        .select('*')
        .is('user_id', null)
        .order('nome');
      
      if (errorGlobais) throw errorGlobais;
      
      // Depois busca fornecedores do usuário
      const { data: proprios, error: errorProprios } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');
      
      if (errorProprios) throw errorProprios;
      
      // Combina os resultados
      const todosFornecedores = [...(globais || []), ...(proprios || [])];
      setFornecedores(todosFornecedores);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
    } finally {
      setLoadingFornecedores(false);
    }
  };

  // Função para carregar categorias do banco
  const carregarCategorias = async () => {
    setLoadingCategorias(true);
    try {
      // Primeiro busca categorias globais (user_id IS NULL)
      const { data: globais, error: errorGlobais } = await supabase
        .from('categorias')
        .select('*')
        .is('user_id', null)
        .order('nome');
      
      if (errorGlobais) throw errorGlobais;
      
      // Depois busca categorias do usuário
      const { data: proprias, error: errorProprias } = await supabase
        .from('categorias')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');
      
      if (errorProprias) throw errorProprias;
      
      // Combina os resultados
      const todasCategorias = [...(globais || []), ...(proprias || [])];
      setCategorias(todasCategorias);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Carregar fornecedores e categorias ao abrir modais de custo/venda
  useEffect(() => {
    if (showModalCusto || showModalVenda) {
      carregarFornecedores();
      carregarCategorias();
    }
  }, [showModalCusto, showModalVenda]);

  // Função para salvar novo fornecedor
  const salvarNovoFornecedor = async () => {
    if (!novoFornecedor.nome) {
      alert('Preencha o nome do fornecedor');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert([{ ...novoFornecedor, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      setFornecedores(prev => [...prev, data]);
      setFormCusto(prev => ({ ...prev, fornecedor: data.id }));
      setShowModalNovoFornecedor(false);
      setNovoFornecedor({ nome: '', cnpj: '', telefone: '', email: '', observacoes: '' });
    } catch (err) {
      alert('Erro ao salvar fornecedor');
      console.error(err);
    }
  };

  // Função para salvar nova categoria
  const salvarNovaCategoria = async () => {
    if (!novaCategoria.nome) {
      alert('Preencha o nome da categoria');
      return;
    }
    
    // Definir tipo automaticamente baseado no modal que está aberto
    const tipoCategoria = showModalCusto ? 'CUSTO' : 'VENDA';
    
    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([{ ...novaCategoria, tipo: tipoCategoria, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      setCategorias(prev => [...prev, data]);
      // Atualiza o campo correto do formulário
      if (showModalCusto) setFormCusto(prev => ({ ...prev, categoria: data.id }));
      if (showModalVenda) setFormVenda(prev => ({ ...prev, categoria: data.id }));
      setShowModalNovaCategoria(false);
      setNovaCategoria({ nome: '', tipo: '', descricao: '' });
    } catch (err) {
      alert('Erro ao salvar categoria');
      console.error(err);
    }
  };

  useEffect(() => {
    if (showModalVenda && editingCotacao && editingCotacao.id) {
      // Só preenche se realmente estiver editando uma cotação existente
      if (editingCotacao.cliente_id) {
        setFormVenda(prev => ({ ...prev, cliente: editingCotacao.cliente_id!.toString() }));
      } else {
        const clienteCotacao = clientes.find(cliente => cliente.nome === editingCotacao.cliente);
        if (clienteCotacao) {
          setFormVenda(prev => ({ ...prev, cliente: clienteCotacao.id.toString() }));
        }
      }
    }
  }, [showModalVenda, editingCotacao, clientes]);

  // Estado para formas de pagamento
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [loadingFormasPagamento, setLoadingFormasPagamento] = useState(false);

  // Função para carregar formas de pagamento do banco
  const carregarFormasPagamento = async () => {
    setLoadingFormasPagamento(true);
    try {
      // Busca globais e do usuário
      const { data: globais, error: errorGlobais } = await supabase
        .from('formas_pagamento')
        .select('*')
        .is('user_id', null)
        .order('nome');
      if (errorGlobais) throw errorGlobais;
      const { data: proprias, error: errorProprias } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');
      if (errorProprias) throw errorProprias;
      setFormasPagamento([...(globais || []), ...(proprias || [])]);
    } catch (err) {
      console.error('Erro ao carregar formas de pagamento:', err);
    } finally {
      setLoadingFormasPagamento(false);
    }
  };

  // Carregar formas de pagamento ao abrir modais de custo/venda
  useEffect(() => {
    if (showModalCusto || showModalVenda) {
      carregarFormasPagamento();
    }
  }, [showModalCusto, showModalVenda]);

  // Carregar fornecedores e categorias quando abrir cotação APROVADA ou LANÇADO
  useEffect(() => {
    if (editingCotacao?.id && (normalizarStatus(editingCotacao.status) === 'APROVADO' || normalizarStatus(editingCotacao.status) === 'LANCADO')) {
      carregarFornecedores();
      carregarCategorias();
      carregarFormasPagamento();
    }
  }, [editingCotacao]);

  // Função utilitária para buscar nome pelo ID
  const getNomeFornecedor = (id: string | undefined) => {
    if (!id) return '-'
    return fornecedores.find(f => f.id === id)?.nome || '-'
  }

  const getNomeCategoria = (id: string | undefined) => {
    if (!id) return '-'
    return categorias.find(c => c.id === id)?.nome || '-'
  }

  const getNomeCliente = (id: string | undefined) => {
    if (!id) return '-'
    return clientes.find(c => String(c.id) === String(id))?.nome || '-'
  }

  const getNomeCompletoCliente = (id: string | undefined) => {
    if (!id) return '-'
    const cliente = clientes.find(c => String(c.id) === String(id))
    if (!cliente) return '-'
    return `${cliente.nome}${cliente.sobrenome ? ' ' + cliente.sobrenome : ''}`
  }

  const formatarNomeParaCard = (id: string | undefined) => {
    if (!id) return '-'
    const cliente = clientes.find(c => String(c.id) === String(id))
    if (!cliente) return '-'
    
    const nome = cliente.nome
    const sobrenome = cliente.sobrenome
    
    if (!sobrenome) {
      return nome // Se não tem sobrenome, retorna só o nome
    }
    
    // Dividir sobrenome em partes para pegar apenas o último
    const parteSobrenome = sobrenome.trim().split(' ')
    const ultimoSobrenome = parteSobrenome[parteSobrenome.length - 1]
    
    return `${nome} ${ultimoSobrenome}`
  }

  const formatarNomeParaLista = (cliente: Cliente, limite: number = 25) => {
    const nomeCompleto = `${cliente.nome}${cliente.sobrenome ? ' ' + cliente.sobrenome : ''}`
    
    if (nomeCompleto.length <= limite) {
      return nomeCompleto
    }
    
    // Se passou do limite, truncar e adicionar "..."
    return nomeCompleto.substring(0, limite - 3) + '...'
  }

  const formatarData = (data: string) => {
    if (!data) return '-'
    try {
      const [ano, mes, dia] = data.split('-')
      return `${dia}/${mes}/${ano}`
    } catch {
      return data
    }
  }

  function getIdFormaPagamento(nome: string) {
    return formasPagamento.find(f => f.nome === nome)?.id
  }

  function getNomeFormaPagamento(id: string | undefined) {
    if (!id) return '-'
    return formasPagamento.find(f => f.id === id)?.nome || '-'
  }

  // Função para lançar contas a pagar e receber
  const lancarVenda = async () => {
    if (!dataVenda || !/^\d{4}-\d{2}-\d{2}$/.test(dataVenda)) {
      alert('Preencha a data da venda!');
      return;
    }
    
    // LOG DE DEBUG
    console.log('formVenda.cliente:', formVenda.cliente);
    console.log('editingCotacao:', editingCotacao);
    
    const dataCriacao = dataVenda;
    // Lançar contas a pagar (custos)
    for (const item of itensCusto) {
      await supabase.from('contas_pagar').insert({
        descricao: item.descricao,
        valor: item.valor,
        fornecedor_id: item.fornecedor || null,
        categoria_id: item.categoria || null,
        forma_pagamento_id: getIdFormaPagamento(item.forma) || null,
        parcelas: item.parcelas,
        vencimento: item.vencimento,
        status: 'PENDENTE',
        origem: 'COTACAO',
        origem_id: editingCotacao?.id || null,
        user_id: user.id,
        created_at: dataCriacao
      });
    }
    // Lançar contas a receber (vendas)
    for (const item of itensVenda) {
      const clienteIdToSave = formVenda.cliente ? Number(formVenda.cliente) : null;
      console.log('cliente_id sendo salvo:', clienteIdToSave);
      
      await supabase.from('contas_receber').insert({
        descricao: item.descricao,
        valor: item.valor,
        cliente_id: clienteIdToSave,
        categoria_id: item.categoria || null,
        forma_recebimento_id: getIdFormaPagamento(item.forma) || null,
        parcelas: item.parcelas,
        vencimento: item.vencimento,
        status: 'PENDENTE',
        origem: 'COTACAO',
        origem_id: editingCotacao?.id || null,
        user_id: user.id,
        created_at: dataCriacao
      });
    }

    // Calcular o total das vendas lançadas para esta cotação
    const totalVendas = itensVenda.reduce((acc, item) => acc + (item.valor || 0), 0);
    console.log('Total das vendas lançadas:', totalVendas);

    // Atualizar o campo valor da cotação no banco
    if (editingCotacao?.id) {
      const { error: errorUpdateValor } = await supabase
        .from('cotacoes')
        .update({ valor: totalVendas })
        .eq('id', editingCotacao.id);

      if (errorUpdateValor) {
        console.error('Erro ao atualizar valor da cotação:', errorUpdateValor);
        alert('Erro ao atualizar valor da cotação. Tente novamente.');
        return;
      }

      console.log('Valor da cotação atualizado com sucesso para:', totalVendas);
    }

    // Atualizar status da cotação para LANÇADO
    if (editingCotacao?.id) {
      await supabase.from('cotacoes').update({ status: 'LANÇADO' }).eq('id', editingCotacao.id);
      await carregarValoresCotacao(editingCotacao.id);
      // Atualizar estado local
      setCotacoes(prev => prev.map(c => c.id === editingCotacao.id ? { ...c, status: 'LANÇADO', valor: totalVendas } : c));
      setFormData(prev => ({ ...prev, status: 'LANÇADO' }));
    }
    alert('Contas lançadas com sucesso!');
    
    // Recarregar cotações para garantir que o valor atualizado seja exibido nos cards
    await carregarCotacoes();
  };

  // Função para excluir venda (deletar contas a pagar e receber)
  const excluirVenda = async () => {
    if (!editingCotacao?.id) return;
    
    // Salvar cópias temporárias dos itens atuais
    const itensCustoTemp = [...itensCusto];
    const itensVendaTemp = [...itensVenda];
    
    if (confirm('Tem certeza que deseja excluir esta venda? Isso irá deletar todas as contas a pagar e receber vinculadas a esta cotação, mas os dados serão mantidos para edição rápida.')) {
      try {
        // Deletar contas a pagar
        await supabase
          .from('contas_pagar')
          .delete()
          .eq('origem', 'COTACAO')
          .eq('origem_id', editingCotacao.id);

        // Deletar contas a receber
        await supabase
          .from('contas_receber')
          .delete()
          .eq('origem', 'COTACAO')
          .eq('origem_id', editingCotacao.id);

        // Resetar o campo valor da cotação para 0
        const { error: errorUpdateValor } = await supabase
          .from('cotacoes')
          .update({ valor: 0 })
          .eq('id', editingCotacao.id);

        if (errorUpdateValor) {
          console.error('Erro ao resetar valor da cotação:', errorUpdateValor);
        } else {
          console.log('Valor da cotação resetado para 0');
        }

        // Atualizar status da cotação para APROVADO
        await supabase.from('cotacoes').update({ status: 'APROVADO' }).eq('id', editingCotacao.id);
        
        // Restaurar os arrays locais com os dados temporários
        setItensCusto(itensCustoTemp);
        setItensVenda(itensVendaTemp);
        setRecemExcluido(true);
        
        // Atualizar estado local
        setCotacoes(prev => prev.map(c => c.id === editingCotacao.id ? { ...c, status: 'APROVADO', valor: 0 } : c));
        setFormData(prev => ({ ...prev, status: 'APROVADO' }));
        setEditingCotacao(prev => prev ? { ...prev, status: 'APROVADO' } : null);
        
        alert('Venda excluída! Os dados foram mantidos para edição rápida.');
        
        // Recarregar cotações para garantir que o valor resetado seja exibido nos cards
        await carregarCotacoes();
      } catch (error) {
        console.error('Erro ao excluir venda:', error);
        alert('Erro ao excluir venda. Tente novamente.');
      }
    }
  };

  // Função para total de vendas aprovadas
  const getTotalAprovado = () => {
    return itensVenda.reduce((total, item) => total + Number(item.valor), 0);
  };

  // Função para buscar valores de custo e venda lançados no banco
  const carregarValoresCotacao = async (cotacaoId: string) => {
    // Buscar custos
    const { data: custos } = await supabase
      .from('contas_pagar')
      .select('*')
      .eq('origem', 'COTACAO')
      .eq('origem_id', cotacaoId);

    // Buscar vendas
    const { data: vendas } = await supabase
      .from('contas_receber')
      .select('*')
      .eq('origem', 'COTACAO')
      .eq('origem_id', cotacaoId);

    setItensCusto(custos || []);
    setItensVenda(vendas || []);
  };

  // Chamar ao abrir cotação APROVADA ou LANÇADO
  useEffect(() => {
    if (editingCotacao?.id && (normalizarStatus(editingCotacao.status) === 'APROVADO' || normalizarStatus(editingCotacao.status) === 'LANCADO')) {
      if (!recemExcluido) {
        carregarValoresCotacao(editingCotacao.id);
      } else {
        setRecemExcluido(false);
      }
    }
  }, [editingCotacao]);

  // Chamar ao abrir cotação LANÇADO
  useEffect(() => {
    if (editingCotacao?.id && normalizarStatus(editingCotacao.status) === 'LANCADO') {
      carregarValoresCotacao(editingCotacao.id);
    }
  }, [editingCotacao]);

  // Função para abrir modal de visualização de conta
  const visualizarConta = (item: any, tipo: 'pagar' | 'receber') => {
    setContaVisualizando(item);
    setTipoContaVisualizando(tipo);
    setShowModalVisualizarConta(true);
  };

  // Estados para companhias aéreas e busca de voo
  const [ciasAereas, setCiasAereas] = useState<any[]>([])
  const [loadingBuscaVoo, setLoadingBuscaVoo] = useState(false)
  const [erroBuscaVoo, setErroBuscaVoo] = useState<string | null>(null)
  const [embarqueData, setEmbarqueData] = useState('')
  const [embarqueHora, setEmbarqueHora] = useState('')
  const [chegadaData, setChegadaData] = useState('')
  const [chegadaHora, setChegadaHora] = useState('')
  const [duracaoVoo, setDuracaoVoo] = useState('')
  const [vooEditandoId, setVooEditandoId] = useState<string | null>(null) // ID do banco do voo sendo editado
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotações</h1>
          <p className="text-gray-600 mt-1">Gerencie suas cotações de viagem</p>
        </div>
        
        {/* Botão único com dropdown */}
        <div className="relative dropdown-container">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Novo
            <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <button
                onClick={() => {
                  setShowDropdown(false)
                  handleOpenModalLead()
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
              >
                <User className="h-4 w-4 text-emerald-600" />
                Novo Lead
              </button>
              <button
                onClick={() => {
                  setShowDropdown(false)
                  handleOpenModal()
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-blue-600" />
                Nova Cotação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { value: 'total', label: 'Total' },
            { value: 'mes', label: 'Último Mês' },
            { value: '3meses', label: '3 Meses' },
            { value: '6meses', label: '6 Meses' },
            { value: 'ano', label: 'Último Ano' }
          ].map((filtro) => (
            <button
              key={filtro.value}
              onClick={() => setFiltroData(filtro.value as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                filtroData === filtro.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {colunas.map((coluna) => (
          <div
            key={coluna.id}
            className={`${coluna.cor} border rounded-lg overflow-hidden`}
            onDragOver={(e) => handleDragOver(e, coluna.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, coluna.id)}
          >
            {/* Header da coluna */}
            <div className={`${coluna.corHeader} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <coluna.icone className="h-5 w-5" />
                <h3 className="font-semibold">{coluna.titulo}</h3>
              </div>
              <span className="bg-white bg-opacity-50 px-2 py-1 rounded-full text-xs font-medium">
                {getCotacoesPorStatus(coluna.id).length}
              </span>
            </div>

            {/* Cards da coluna */}
            <div className="p-4 min-h-96">
              {getCotacoesPorStatus(coluna.id).map((cotacao) => (
                <CardCotacao
                  key={cotacao.id}
                  cotacao={cotacao}
                  draggable={true}
                  onDragStart={(e: React.DragEvent) => handleDragStart(e, cotacao.id)}
                  onDragEnd={handleDragEnd}
                  onView={() => handleViewCotacao(cotacao)}
                  onEdit={() => handleEditCotacao(cotacao)}
                  onDelete={() => handleDeleteCotacao(cotacao)}
                />
              ))}
            </div>

            {/* Total da coluna */}
            <div className="px-4 py-3 bg-white bg-opacity-50 border-t">
              <div className="text-sm font-medium text-gray-700">
                Total: {formatarMoedaTotal(getTotalPorStatus(coluna.id))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {renderModalContent()}
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {showViewModal && viewingCotacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{viewingCotacao.titulo}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); window.open(`/cotacao/${viewingCotacao.id}/print`, '_blank'); }}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
                    title="Imprimir cotação"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
              </div>

              {/* Cabeçalho Único - Replicando Design da Impressão */}
              <div 
                className="bg-white border-2 border-gray-300 rounded-lg mb-6 overflow-hidden"
                style={{
                  borderRadius: '8px',
                  margin: '15px 0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '2px solid #e5e7eb'
                }}
              >
                {/* Cabeçalho Principal */}
                <div 
                  className="p-3 bg-white border-b border-gray-200"
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
              <div>
                    <span 
                      className="text-gray-600 font-medium"
                      style={{ fontSize: '8px', color: '#6b7280', fontWeight: 'bold' }}
                    >
                      Reservado por:
                    </span>
                    <span 
                      className="text-gray-900 font-bold ml-2"
                      style={{ fontSize: '9px', color: '#111827', fontWeight: 'bold', marginLeft: '8px' }}
                    >
                      {viewingCotacao.cliente}
                    </span>
              </div>
                  <div 
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#1e40af',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '7px',
                      fontWeight: 'bold'
                    }}
                  >
                    {viewingCotacao.codigo}
                  </div>
                </div>

                {/* Seção de Passageiros */}
                <div 
                  className="p-3"
                  style={{ padding: '12px' }}
                >
                  <div 
                    className="text-gray-700 font-semibold mb-2"
                    style={{ fontSize: '7px', color: '#374151', fontWeight: 'bold', marginBottom: '6px' }}
                  >
                    Passageiros:
                  </div>
                  
                                     <div 
                     className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded"
                     style={{
                       backgroundColor: '#eff6ff',
                       borderLeft: '2px solid #60a5fa',
                       padding: '6px',
                       borderRadius: '4px'
                     }}
                   >
                     {formData.passageiros && formData.passageiros.length > 0 ? (
                       formData.passageiros.map((passageiro, index) => (
                         <div 
                           key={index}
                           className="grid grid-cols-3 gap-4 text-xs mb-2"
                           style={{ 
                             display: 'grid', 
                             gridTemplateColumns: '1fr 1fr 1fr', 
                             gap: '4px',
                             fontSize: '6px',
                             marginBottom: index < formData.passageiros.length - 1 ? '6px' : '0',
                             paddingBottom: index < formData.passageiros.length - 1 ? '6px' : '0',
                             borderBottom: index < formData.passageiros.length - 1 ? '1px solid #ddd' : 'none'
                           }}
                         >
              <div>
                             <div 
                               className="font-semibold text-gray-700"
                               style={{ fontWeight: 'bold', color: '#374151' }}
                             >
                               Nome
                             </div>
                             <div 
                               className="text-gray-900"
                               style={{ color: '#111827' }}
                             >
                               {passageiro.nome}
                             </div>
              </div>
              <div>
                             <div 
                               className="font-semibold text-gray-700"
                               style={{ fontWeight: 'bold', color: '#374151' }}
                             >
                               Documento
                             </div>
                             <div 
                               className="text-gray-900"
                               style={{ color: '#111827' }}
                             >
                               {passageiro.documento || 'Não informado'}
                             </div>
              </div>
              <div>
                             <div 
                               className="font-semibold text-gray-700"
                               style={{ fontWeight: 'bold', color: '#374151' }}
                             >
                               Data Nascimento
              </div>
                             <div 
                               className="text-gray-900"
                               style={{ color: '#111827' }}
                             >
                               {passageiro.dataNascimento || 'Não informado'}
                             </div>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div 
                         className="grid grid-cols-3 gap-4 text-xs"
                         style={{ 
                           display: 'grid', 
                           gridTemplateColumns: '1fr 1fr 1fr', 
                           gap: '4px',
                           fontSize: '6px'
                         }}
                       >
                <div>
                           <div 
                             className="font-semibold text-gray-700"
                             style={{ fontWeight: 'bold', color: '#374151' }}
                           >
                             Nome
                           </div>
                           <div 
                             className="text-gray-900"
                             style={{ color: '#111827' }}
                           >
                             {viewingCotacao.cliente}
                           </div>
                         </div>
                         <div>
                           <div 
                             className="font-semibold text-gray-700"
                             style={{ fontWeight: 'bold', color: '#374151' }}
                           >
                             CPF
                           </div>
                           <div 
                             className="text-gray-900"
                             style={{ color: '#111827' }}
                           >
                             ***.***.***-**
                           </div>
                         </div>
                         <div>
                           <div 
                             className="font-semibold text-gray-700"
                             style={{ fontWeight: 'bold', color: '#374151' }}
                           >
                             Data Nascimento
                           </div>
                           <div 
                             className="text-gray-900"
                             style={{ color: '#111827' }}
                           >
                             --/--/----
                           </div>
                         </div>
                       </div>
                     )}
                   </div>
                </div>

                {/* Seção de Status da Viagem */}
                <div 
                  className="bg-gray-50 px-3 py-2 border-t border-gray-200"
                  style={{
                    backgroundColor: '#f9fafb',
                    padding: '6px 12px',
                    borderTop: '1px solid #e5e7eb'
                  }}
                >
                  <div 
                    className="flex justify-between items-center"
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div 
                      className="flex items-center space-x-4"
                      style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                    >
                      <div className="flex items-center space-x-1">
                        <span 
                          className="text-gray-500 font-medium"
                          style={{ fontSize: '6px', color: '#6b7280', fontWeight: 'bold' }}
                        >
                          Destino:
                        </span>
                        <span 
                          className="text-gray-900 font-semibold"
                          style={{ fontSize: '6px', color: '#111827', fontWeight: 'bold' }}
                        >
                          {viewingCotacao.destino}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span 
                          className="text-gray-500 font-medium"
                          style={{ fontSize: '6px', color: '#6b7280', fontWeight: 'bold' }}
                        >
                          Status:
                        </span>
                        <span 
                          className="text-emerald-600 font-semibold"
                          style={{ fontSize: '6px', color: '#059669', fontWeight: 'bold' }}
                        >
                          {viewingCotacao.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div 
                        className="text-emerald-600 font-bold"
                        style={{ fontSize: '8px', color: '#059669', fontWeight: 'bold' }}
                      >
                        {viewingCotacao.valor ? formatarMoedaTotal(viewingCotacao.valor) : 'A cotar'}
                      </div>
                      <div 
                        className="text-gray-500"
                        style={{ fontSize: '5px', color: '#6b7280' }}
                      >
                        Valor total
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção de Voos - Replicando Design da Impressão */}
              {voosSalvos && voosSalvos.length > 0 && (
                <div className="mb-6">
                  {['IDA', 'VOLTA', 'INTERNO'].map(direcao => {
                    const voosDoTipo = voosSalvos.filter(voo => voo.direcao === direcao);
                    if (voosDoTipo.length === 0) return null;
                    
                    return (
                      <div key={direcao} className="mb-4">
                        <div 
                          className="bg-blue-600 text-white px-3 py-2 rounded-t-lg font-bold text-center"
                          style={{
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '3px 3px 0 0',
                            fontSize: '8px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}
                        >
                          VOOS DE {direcao}
                        </div>
                        
                        {voosDoTipo.map((voo, index) => (
                          <div 
                            key={index}
                            className="bg-white border border-gray-300 p-3"
                            style={{
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              padding: '6px 12px',
                              borderTop: 'none',
                              fontSize: '6px'
                            }}
                          >
                            <div 
                              className="grid grid-cols-4 gap-2 text-xs"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '60px 1fr 1fr 1fr',
                                gap: '4px',
                                minHeight: '20px',
                                alignItems: 'center'
                              }}
                            >
                              <div className="text-center">
                                <div 
                                  className="font-bold text-blue-600"
                                  style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '8px' }}
                                >
                                  {voo.origem}
                                </div>
                                <div 
                                  className="text-gray-500"
                                  style={{ color: '#6b7280', fontSize: '5px' }}
                                >
                                  ✈️
                                </div>
                                <div 
                                  className="font-bold text-blue-600"
                                  style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '8px' }}
                                >
                                  {voo.destino}
                                </div>
                              </div>
                              
                              <div>
                                <div 
                                  className="font-semibold text-gray-700"
                                  style={{ fontWeight: 'bold', color: '#374151' }}
                                >
                                  Companhia: {voo.companhia}
                                </div>
                                <div 
                                  className="text-gray-600"
                                  style={{ color: '#6b7280' }}
                                >
                                  Voo: {voo.numeroVoo}
                                </div>
                              </div>
                              
                              <div>
                                <div 
                                  className="font-semibold text-gray-700"
                                  style={{ fontWeight: 'bold', color: '#374151' }}
                                >
                                  Data: {voo.dataIda}
                                </div>
                                <div 
                                  className="text-gray-600"
                                  style={{ color: '#6b7280' }}
                                >
                                  Classe: {voo.classe}
                                </div>
                              </div>
                              
                              <div>
                                <div 
                                  className="font-semibold text-gray-700"
                                  style={{ fontWeight: 'bold', color: '#374151' }}
                                >
                                  Partida: {formatarHorario(voo.horarioPartida)}
                                </div>
                                <div 
                                  className="text-gray-600"
                                  style={{ color: '#6b7280' }}
                                >
                                  Chegada: {formatarHorario(voo.horarioChegada)}
                                </div>
                              </div>
                            </div>
                            
                            {voo.observacoes && (
                              <div 
                                className="mt-2 text-gray-600 italic"
                                style={{ marginTop: '4px', color: '#6b7280', fontStyle: 'italic' }}
                              >
                                Obs: {voo.observacoes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Informações adicionais */}
              {viewingCotacao.observacoes && (
                <div 
                  className="bg-gray-50 rounded-lg p-3"
                  style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    padding: '10px'
                  }}
                >
                  <h4 
                    className="font-semibold text-gray-900 mb-2"
                    style={{ fontSize: '8px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}
                  >
                    Observações:
                  </h4>
                  <p 
                    className="text-gray-700"
                    style={{ fontSize: '7px', color: '#374151' }}
                  >
                    {viewingCotacao.observacoes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção/Criação de Cliente para Passageiro */}
      {showClienteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {modoCriacaoCliente ? 'Criar Novo Cliente' : 'Selecionar Cliente'}
                </h2>
                <button
                  onClick={fecharModalCliente}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Botões de alternância */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setModoCriacaoCliente(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !modoCriacaoCliente
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Selecionar Existente
                </button>
                <button
                  onClick={() => setModoCriacaoCliente(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    modoCriacaoCliente
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Criar Novo
                </button>
              </div>

              {!modoCriacaoCliente ? (
                /* Modo Seleção de Cliente Existente */
                <div>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente por nome, email, telefone ou CPF..."
                        value={buscaClientePassageiro}
                        onChange={(e) => setBuscaClientePassageiro(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {loadingClientes ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Carregando clientes...</p>
                      </div>
                    ) : !clientesFiltrados || clientesFiltrados.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Nenhum cliente encontrado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clientesFiltrados.map((cliente: Cliente) => (
                          <div
                            key={cliente.id}
                            onClick={() => selecionarClienteParaPassageiro(cliente)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              clienteSelecionadoPassageiro?.id === cliente.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{cliente.nome}</h3>
                                <p className="text-sm text-gray-600">{cliente.email}</p>
                                <p className="text-sm text-gray-500">{cliente.telefone}</p>
                              </div>
                              {clienteSelecionadoPassageiro?.id === cliente.id && (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                      onClick={fecharModalCliente}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmarClienteParaPassageiro}
                      disabled={!clienteSelecionadoPassageiro}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar Seleção
                    </button>
                  </div>
                </div>
              ) : (
                /* Modo Criação de Novo Cliente */
                <div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                        <input
                          type="text"
                          value={novoClienteData.nome}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, nome: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Nome"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
                        <input
                          type="text"
                          value={novoClienteData.sobrenome}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, sobrenome: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="Sobrenome"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Nascimento
                        </label>
                        <input
                          type="date"
                          value={novoClienteData.data_nascimento}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nacionalidade
                        </label>
                        <input
                          type="text"
                          value={novoClienteData.nacionalidade}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, nacionalidade: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Brasileira"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={novoClienteData.email}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={novoClienteData.telefone}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, telefone: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CPF
                        </label>
                        <input
                          type="text"
                          value={novoClienteData.cpf}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, cpf: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RG
                        </label>
                        <input
                          type="text"
                          value={novoClienteData.rg}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, rg: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="RG"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passaporte
                        </label>
                        <input
                          type="text"
                          value={novoClienteData.passaporte}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, passaporte: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Número do passaporte"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Expedição
                        </label>
                        <input
                          type="date"
                          value={novoClienteData.data_expedicao}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, data_expedicao: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Expiração
                        </label>
                        <input
                          type="date"
                          value={novoClienteData.data_expiracao}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, data_expiracao: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rede Social
                        </label>
                        <input
                          type="text"
                          value={novoClienteData.rede_social}
                          onChange={(e) => setNovoClienteData(prev => ({ ...prev, rede_social: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="@usuario"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                      </label>
                      <textarea
                        value={novoClienteData.observacoes}
                        onChange={(e) => setNovoClienteData(prev => ({ ...prev, observacoes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Observações relevantes"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button
                      onClick={fecharModalCliente}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={criarNovoClienteParaPassageiro}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Criar Cliente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Novo Cliente */}
      {showNovoClienteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Criar Novo Cliente</h2>
                <button
                  onClick={() => setShowNovoClienteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={novoClienteData.nome}
                    onChange={(e) => setNovoClienteData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome *</label>
                  <input
                    type="text"
                    value={novoClienteData.sobrenome}
                    onChange={(e) => setNovoClienteData(prev => ({ ...prev, sobrenome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Sobrenome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                  <input 
                    type="email" 
                    placeholder="email@exemplo.com" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    value={novoClienteData.email} 
                    onChange={e => setNovoClienteData(prev => ({ ...prev, email: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                  <input 
                    type="text" 
                    placeholder="(11) 99999-9999" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    value={novoClienteData.telefone} 
                    onChange={e => setNovoClienteData(prev => ({ ...prev, telefone: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input 
                    type="text" 
                    placeholder="000.000.000-00" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    value={novoClienteData.cpf} 
                    onChange={e => setNovoClienteData(prev => ({ ...prev, cpf: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                  <input 
                    type="text" 
                    placeholder="00.000.000-0" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    value={novoClienteData.rg} 
                    onChange={e => setNovoClienteData(prev => ({ ...prev, rg: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passaporte</label>
                  <input 
                    type="text" 
                    placeholder="Número do passaporte" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    value={novoClienteData.passaporte} 
                    onChange={e => setNovoClienteData(prev => ({ ...prev, passaporte: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    value={novoClienteData.data_nascimento} 
                    onChange={e => setNovoClienteData(prev => ({ ...prev, data_nascimento: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidade</label>
                  <input 
                    type="text" 
                    placeholder="Brasileira" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    value={novoClienteData.nacionalidade} 
                    onChange={e => setNovoClienteData(prev => ({ ...prev, nacionalidade: e.target.value }))} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rede Social</label>
                  <input 
                    type="text" 
                    placeholder="@usuario" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    value={novoClienteData.rede_social} 
                    onChange={e => setNovoClienteData(prev => ({ ...prev, rede_social: e.target.value }))} 
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea 
                  placeholder="Informações adicionais sobre o cliente..." 
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                  value={novoClienteData.observacoes} 
                  onChange={e => setNovoClienteData(prev => ({ ...prev, observacoes: e.target.value }))} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50" 
                  onClick={() => setShowNovoClienteModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2" 
                  onClick={async () => {
                    // Validação
                    if (!novoClienteData.nome || !novoClienteData.sobrenome || !novoClienteData.email || !novoClienteData.telefone) { 
                      alert('Por favor, preencha nome, sobrenome, email e telefone'); 
                      return; 
                    }
                    
                    // Salvar cliente no banco
                    const empresaId = user?.user_metadata?.empresa_id;
                    const payload = {
                      nome: novoClienteData.nome,
                      sobrenome: novoClienteData.sobrenome,
                      email: novoClienteData.email,
                      telefone: novoClienteData.telefone,
                      cpf: novoClienteData.cpf || null,
                      rg: novoClienteData.rg || null,
                      passaporte: novoClienteData.passaporte || null,
                      data_nascimento: novoClienteData.data_nascimento || null,
                      data_expedicao: novoClienteData.data_expedicao || null,
                      data_expiracao: novoClienteData.data_expiracao || null,
                      nacionalidade: novoClienteData.nacionalidade || 'Brasileira',
                      rede_social: novoClienteData.rede_social || null,
                      observacoes: novoClienteData.observacoes || null,
                      empresa_id: empresaId,
                    };
                    
                    console.log('📤 Payload enviado para Supabase:', payload);
                    
                    const { data, error } = await supabase.from('clientes').insert([payload]).select('*').single();
                    if (error) { 
                      console.error('❌ Erro ao criar cliente:', error);
                      alert('Erro ao criar cliente: ' + error.message); 
                      return; 
                    }
                    
                    console.log('✅ Cliente criado com sucesso:', data);
                    
                    await carregarClientes();
                    setClienteSelecionado(data);
                    setFormData(prev => ({ ...prev, cliente: data.id.toString() }));
                    setShowNovoClienteModal(false);
                    alert('Cliente criado com sucesso!');
                  }}
                >
                  <User className="h-4 w-4" />
                  Salvar Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Lead */}
      {showModalLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Novo Lead</h2>
                <button
                  onClick={handleCloseModalLead}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {!clienteSelecionado ? (
                // Seleção de cliente
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecionar Cliente</h3>
                    <p className="text-gray-600">Escolha um cliente existente ou crie um novo</p>
                  </div>

                  {/* Busca de clientes */}
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente por nome, email, telefone ou CPF..."
                        value={buscaCliente}
                        onChange={(e) => setBuscaCliente(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {/* Botão para criar novo cliente */}
                    <div className="mt-3">
                      <button
                        onClick={() => setShowNovoClienteModal(true)}
                        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Criar Novo Cliente
                      </button>
                    </div>
                  </div>

                  {/* Lista de clientes */}
                  <div className="max-h-96 overflow-y-auto mb-6">
                    {loadingClientes ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Carregando clientes...</p>
                      </div>
                    ) : clientesFiltrados.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Nenhum cliente encontrado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {clientesFiltrados.map((cliente: Cliente) => (
                          <div
                            key={cliente.id}
                            onClick={() => setClienteSelecionado(cliente)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              (clienteSelecionado as Cliente | null)?.id === cliente.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">{formatarNomeParaLista(cliente)}</h3>
                                <p className="text-sm text-gray-600">{cliente.email}</p>
                                <p className="text-sm text-gray-500">{cliente.telefone}</p>
                              </div>
                              {(clienteSelecionado as Cliente | null)?.id === cliente.id && (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={handleCloseModalLead}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setClienteSelecionado(clientesFiltrados[0])}
                      disabled={!clienteSelecionado}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              ) : (
                // Observação do lead
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-lg text-blue-800">{formatarNomeParaLista(clienteSelecionado)}</span>
                      <button 
                        className="ml-auto text-sm text-gray-500 hover:underline" 
                        onClick={() => setClienteSelecionado(null)}
                      >
                        Trocar Cliente
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observação sobre a viagem desejada
                    </label>
                    <textarea
                      value={observacaoLead}
                      onChange={(e) => setObservacaoLead(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Cliente deseja viajar em julho para Paris, lua de mel, etc."
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={handleCloseModalLead}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={salvarLead}
                      disabled={!observacaoLead.trim() || loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Salvando...
                        </>
                      ) : (
                        'Salvar Lead'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Observação do Lead */}
      {showModalLead && leadSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Editar Observação do Lead</h2>
                <button
                  onClick={() => setShowModalLead(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                <textarea
                  value={observacaoLead}
                  onChange={e => setObservacaoLead(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Ex: Cliente deseja viajar em julho para Paris, lua de mel, etc."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowModalLead(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    // Atualizar observação do lead no banco
                    const { error } = await supabase
                      .from('leads')
                      .update({ observacao: observacaoLead })
                      .eq('id', leadSelecionado.id)
                    if (error) {
                      alert('Erro ao atualizar observação: ' + error.message)
                      return
                    }
                    setShowModalLead(false)
                    await carregarLeads()
                    alert('Observação atualizada com sucesso!')
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização do Lead */}
      {showModalVisualizarLead && leadSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header neutro */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Detalhes do Lead</h2>
                    <p className="text-gray-600 text-sm">
                      Criado em {new Date(leadSelecionado.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModalVisualizarLead(false)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              {/* Informações do Cliente */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Informações do Cliente</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Nome Completo</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {leadSelecionado.cliente?.nome} {leadSelecionado.cliente?.sobrenome || ''}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          📧 {leadSelecionado.cliente?.email || 'Não informado'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          📞 {leadSelecionado.cliente?.telefone || 'Não informado'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {leadSelecionado.cliente?.cpf && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">CPF</label>
                          <p className="text-gray-900">{leadSelecionado.cliente.cpf}</p>
                        </div>
                      )}
                      
                      {leadSelecionado.cliente?.data_nascimento && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Data de Nascimento</label>
                          <p className="text-gray-900">
                            {new Date(leadSelecionado.cliente.data_nascimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                      
                      {leadSelecionado.cliente?.endereco && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Endereço</label>
                          <p className="text-gray-900">{leadSelecionado.cliente.endereco}</p>
                          {leadSelecionado.cliente?.cidade && leadSelecionado.cliente?.estado && (
                            <p className="text-sm text-gray-600">
                              {leadSelecionado.cliente.cidade} - {leadSelecionado.cliente.estado}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Observações do Lead */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Observações da Viagem</h3>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <pre className="text-gray-800 leading-relaxed text-base whitespace-pre-wrap font-sans">
                    {leadSelecionado.observacao || 'Nenhuma observação registrada.'}
                  </pre>
                </div>
              </div>



              {/* Ações */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowModalVisualizarLead(false)
                    setObservacaoLead(leadSelecionado.observacao || '')
                    setShowModalLead(true)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Editar Observação
                </button>
                
                <button
                  onClick={() => {
                    setShowModalVisualizarLead(false)
                    setShowModalTarefas(true)
                    carregarTarefas(leadSelecionado.id)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  Gerenciar Tarefas
                </button>
                
                <button
                  onClick={() => {
                    setShowModalVisualizarLead(false)
                    converterLeadEmCotacao(leadSelecionado)
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                  Converter em Cotação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Tarefas */}
      {showModalTarefas && leadSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Tarefas do Lead</h2>
                <button onClick={() => setShowModalTarefas(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              {/* Formulário para nova tarefa */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nova Tarefa</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                    <input
                      type="text"
                      value={novaTarefa.titulo}
                      onChange={(e) => setNovaTarefa(prev => ({ ...prev, titulo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ex: Ligar para cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável *</label>
                    <input
                      type="text"
                      value={novaTarefa.responsavel}
                      onChange={e => setNovaTarefa(prev => ({ ...prev, responsavel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={novaTarefa.categoria}
                      onChange={e => setNovaTarefa(prev => ({ ...prev, categoria: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Comercial">Comercial</option>
                      <option value="Administrativo">Administrativo</option>
                      <option value="Financeiro">Financeiro</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <input
                      type="text"
                      value={novaTarefa.cliente}
                      onChange={e => setNovaTarefa(prev => ({ ...prev, cliente: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento *</label>
                    <input
                      type="date"
                      value={novaTarefa.data_vencimento}
                      onChange={e => setNovaTarefa(prev => ({ ...prev, data_vencimento: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Vencimento *</label>
                    <input
                      type="time"
                      value={novaTarefa.hora_vencimento}
                      onChange={e => setNovaTarefa(prev => ({ ...prev, hora_vencimento: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                    <select
                      value={novaTarefa.prioridade}
                      onChange={e => setNovaTarefa(prev => ({ ...prev, prioridade: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={novaTarefa.status}
                      onChange={e => setNovaTarefa(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em-andamento">Em Andamento</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={novaTarefa.descricao}
                    onChange={(e) => setNovaTarefa(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Detalhes da tarefa..."
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={salvarTarefa}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Criar Tarefa
                  </button>
                </div>
              </div>
              {/* Lista de tarefas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarefas Existentes</h3>
                <div className="space-y-3">
                  {tarefas.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhuma tarefa criada ainda</p>
                  ) : (
                    tarefas.map((tarefa) => (
                      <div key={tarefa.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{tarefa.titulo}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                tarefa.prioridade === 'ALTA' ? 'bg-red-100 text-red-800' :
                                tarefa.prioridade === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {tarefa.prioridade}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                tarefa.status === 'CONCLUIDA' ? 'bg-green-100 text-green-800' :
                                tarefa.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {tarefa.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{tarefa.descricao}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Tipo: {tarefa.tipo}</span>
                              <span>Vencimento: {tarefa.data_vencimento} {tarefa.hora_vencimento}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compromissos */}
      {showModalCompromissos && leadSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Compromissos do Lead</h2>
                <button onClick={() => setShowModalCompromissos(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              {/* Formulário para novo compromisso */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Compromisso</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                    <input
                      type="text"
                      value={novoCompromisso.titulo}
                      onChange={(e) => setNovoCompromisso(prev => ({ ...prev, titulo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ex: Reunião com cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                      value={novoCompromisso.tipo}
                      onChange={(e) => setNovoCompromisso(prev => ({ ...prev, tipo: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="REUNIAO">Reunião</option>
                      <option value="CALL">Call</option>
                      <option value="VISITA">Visita</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data/Hora *</label>
                    <input
                      type="datetime-local"
                      value={novoCompromisso.data_hora}
                      onChange={(e) => setNovoCompromisso(prev => ({ ...prev, data_hora: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                    <input
                      type="text"
                      value={novoCompromisso.local}
                      onChange={(e) => setNovoCompromisso(prev => ({ ...prev, local: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Endereço ou plataforma"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={novoCompromisso.status}
                      onChange={(e) => setNovoCompromisso(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="AGENDADO">Agendado</option>
                      <option value="CONCLUIDO">Concluído</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea
                    value={novoCompromisso.descricao}
                    onChange={(e) => setNovoCompromisso(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Detalhes do compromisso..."
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={salvarCompromisso}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Criar Compromisso
                  </button>
                </div>
              </div>
              {/* Lista de compromissos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compromissos Existentes</h3>
                <div className="space-y-3">
                  {compromissos.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum compromisso agendado ainda</p>
                  ) : (
                    compromissos.map((compromisso) => (
                      <div key={compromisso.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{compromisso.titulo}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                compromisso.status === 'CONCLUIDO' ? 'bg-green-100 text-green-800' :
                                compromisso.status === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {compromisso.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{compromisso.descricao}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Tipo: {compromisso.tipo}</span>
                              <span>Data/Hora: {new Date(compromisso.data_hora).toLocaleString('pt-BR')}</span>
                              {compromisso.local && <span>Local: {compromisso.local}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModalCusto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Informação dos Custos</h2>
              <button onClick={fecharModais} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-9">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-red-500">*</span></label>
                <input type="text" value={formCusto.descricao} onChange={e => setFormCusto(prev => ({ ...prev, descricao: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Descrição do custo" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={formCusto.valor} onChange={e => setFormCusto(prev => ({ ...prev, valor: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="0,00" />
              </div>
            </div>
            <div className="bg-red-500 text-white rounded-t-md px-4 py-2 font-semibold mb-2">Pagamento</div>
            <div className="bg-gray-50 rounded-b-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                    <select value={formCusto.fornecedor} onChange={e => setFormCusto(prev => ({ ...prev, fornecedor: e.target.value }))} className="w-full border rounded px-3 py-2">
                      <option value="">Selecione</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => setShowModalNovoFornecedor(true)} className="mb-1 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-xl font-bold flex items-center justify-center">+</button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select value={formCusto.categoria} onChange={e => setFormCusto(prev => ({ ...prev, categoria: e.target.value }))} className="w-full border rounded px-3 py-2">
                      <option value="">Selecione</option>
                      {categorias.filter(c => c.tipo === 'CUSTO').map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => setShowModalNovaCategoria(true)} className="mb-1 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-xl font-bold flex items-center justify-center">+</button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                  <input type="date" value={formCusto.vencimento} onChange={e => setFormCusto(prev => ({ ...prev, vencimento: e.target.value }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                  <select value={formCusto.forma} onChange={e => setFormCusto(prev => ({ ...prev, forma: e.target.value }))} className="w-full border rounded px-3 py-2">
                    <option value="">Selecione</option>
                    {formasPagamento.map(fp => (
                      <option key={fp.id} value={fp.nome}>{fp.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                  <input type="text" value={formCusto.parcelas} onChange={e => setFormCusto(prev => ({ ...prev, parcelas: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={fecharModais} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={adicionarItemCusto} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showModalVenda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Informação das Vendas</h2>
              <button onClick={fecharModais} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-9">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-red-500">*</span></label>
                <input type="text" value={formVenda.descricao} onChange={e => setFormVenda(prev => ({ ...prev, descricao: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="Descrição da venda" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={formVenda.valor} onChange={e => setFormVenda(prev => ({ ...prev, valor: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="0,00" />
              </div>
            </div>
            <div className="bg-blue-500 text-white px-6 py-2 font-semibold mb-2">Recebimento</div>
            <div className="bg-gray-50 rounded-b-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <select value={formVenda.cliente} onChange={e => setFormVenda(prev => ({ ...prev, cliente: e.target.value }))} className="w-full border rounded px-3 py-2">
                      <option value="">Selecione</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                      ))}
                    </select>
                  </div>
                  {/* Não precisa de botão + para cliente */}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select value={formVenda.categoria} onChange={e => setFormVenda(prev => ({ ...prev, categoria: e.target.value }))} className="w-full border rounded px-3 py-2">
                      <option value="">Selecione</option>
                      {categorias.filter(c => c.tipo === 'VENDA').map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => setShowModalNovaCategoria(true)} className="mb-1 px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-xl font-bold flex items-center justify-center">+</button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                  <input type="date" value={formVenda.vencimento} onChange={e => setFormVenda(prev => ({ ...prev, vencimento: e.target.value }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Recebimento</label>
                  <select value={formVenda.forma} onChange={e => setFormVenda(prev => ({ ...prev, forma: e.target.value }))} className="w-full border rounded px-3 py-2">
                    <option value="">Selecione</option>
                    {formasPagamento.map(fp => (
                      <option key={fp.id} value={fp.nome}>{fp.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                  <input type="text" value={formVenda.parcelas} onChange={e => setFormVenda(prev => ({ ...prev, parcelas: e.target.value }))} className="w-full border rounded px-3 py-2" placeholder="" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={fecharModais} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={adicionarItemVenda} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de novo fornecedor */}
      {showModalNovoFornecedor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Novo Fornecedor</h2>
              <button onClick={() => setShowModalNovoFornecedor(false)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nome *" value={novoFornecedor.nome} onChange={e => setNovoFornecedor(prev => ({ ...prev, nome: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input type="text" placeholder="CNPJ" value={novoFornecedor.cnpj} onChange={e => setNovoFornecedor(prev => ({ ...prev, cnpj: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input type="text" placeholder="Telefone" value={novoFornecedor.telefone} onChange={e => setNovoFornecedor(prev => ({ ...prev, telefone: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input type="email" placeholder="Email" value={novoFornecedor.email} onChange={e => setNovoFornecedor(prev => ({ ...prev, email: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <textarea placeholder="Observações" value={novoFornecedor.observacoes} onChange={e => setNovoFornecedor(prev => ({ ...prev, observacoes: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModalNovoFornecedor(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={salvarNovoFornecedor} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de nova categoria */}
      {showModalNovaCategoria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Nova Categoria de {showModalCusto ? 'CUSTO' : 'VENDA'}
              </h2>
              <button onClick={() => setShowModalNovaCategoria(false)} className="text-gray-400 hover:text-gray-700 text-2xl">×</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder="Nome *" value={novaCategoria.nome} onChange={e => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <textarea placeholder="Descrição" value={novaCategoria.descricao} onChange={e => setNovaCategoria(prev => ({ ...prev, descricao: e.target.value }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModalNovaCategoria(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={salvarNovaCategoria} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização de conta */}
      {showModalVisualizarConta && contaVisualizando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Visualizar {tipoContaVisualizando === 'pagar' ? 'Conta a Pagar' : 'Conta a Receber'}
              </h2>
              <button 
                onClick={() => setShowModalVisualizarConta(false)} 
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {contaVisualizando.descricao || '-'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-semibold">
                    {formatarMoeda(contaVisualizando.valor)}
                  </div>
                </div>

                {tipoContaVisualizando === 'pagar' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {getNomeFornecedor(contaVisualizando.fornecedor_id)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                      {getNomeCliente(contaVisualizando.cliente_id)}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {getNomeCategoria(contaVisualizando.categoria_id)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tipoContaVisualizando === 'pagar' ? 'Forma de Pagamento' : 'Forma de Recebimento'}
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {getNomeFormaPagamento(
                      tipoContaVisualizando === 'pagar' 
                        ? contaVisualizando.forma_pagamento_id 
                        : contaVisualizando.forma_recebimento_id
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {contaVisualizando.parcelas || '-'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {formatarData(contaVisualizando.vencimento)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contaVisualizando.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                      contaVisualizando.status === 'PAGO' ? 'bg-green-100 text-green-800' :
                      contaVisualizando.status === 'VENCIDO' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {contaVisualizando.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {contaVisualizando.created_at ? (() => {
                      // Extrai só a data (YYYY-MM-DD) e formata para dd/mm/aaaa
                      const dataStr = contaVisualizando.created_at.substring(0, 10);
                      const [ano, mes, dia] = dataStr.split('-');
                      return `${dia}/${mes}/${ano}`;
                    })() : '-'}
                  </div>
                </div>
              </div>

              {contaVisualizando.observacoes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {contaVisualizando.observacoes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button 
                onClick={() => setShowModalVisualizarConta(false)} 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cotacoes 
