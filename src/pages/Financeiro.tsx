import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  PiggyBank, 
  Receipt, 
  AlertTriangle,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  User,
  Building2,
  Check,
  X,
  Plus,
  Search,
  ArrowLeft,
  Trash2
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts'
import NotificationCenter from '../components/NotificationCenter'
import { financeiroService, type ContasPagar } from '../services/financeiroService'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email?: string
  empresa_id?: string
}

interface Transacao {
  id: string
  tipo: 'receita' | 'despesa'
  descricao: string
  categoria: string
  valor: number
  data: string
  status: 'pago' | 'pendente' | 'vencido'
  cliente?: string
  vencimento?: string
}

interface ContasReceber {
  id: string
  empresa_id?: string
  cliente_id?: string
  cliente_nome: string
  descricao: string
  servico: string
  valor: number
  vencimento: string
  status: 'recebida' | 'pendente' | 'vencida'
  recebido_em?: string
  forma_recebimento?: string
  observacoes?: string
  comprovante_url?: string
  created_at: string
  updated_at?: string
}

interface ResumoFinanceiro {
  saldoAtual: number
  receitasMes: number
  despesasMes: number
  lucroMes: number
  contasPagarTotal: number
  contasReceberTotal: number
}

const Financeiro = () => {
  const [viewMode, setViewMode] = useState<'geral' | 'contas-pagar' | 'contas-receber'>('geral')
  const [horaAtual, setHoraAtual] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  
  // Estados para dados
  const [resumoFinanceiro, setResumoFinanceiro] = useState<ResumoFinanceiro>({
    saldoAtual: 0,
    receitasMes: 0,
    despesasMes: 0,
    lucroMes: 0,
    contasPagarTotal: 0,
    contasReceberTotal: 0
  })
  
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [contasPagar, setContasPagar] = useState<ContasPagar[]>([])
  const [contasReceber, setContasReceber] = useState<ContasReceber[]>([])
  
  // Estados para categorias
  const [categoriasCusto, setCategoriasCusto] = useState<{ id: number; nome: string; tipo: string; descricao?: string }[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  
  // Estados para formas de pagamento
  const [formasPagamento, setFormasPagamento] = useState<{ id: number; nome: string; user_id?: string }[]>([])
  const [loadingFormasPagamento, setLoadingFormasPagamento] = useState(false)
  
  // Estados para fornecedores
  const [fornecedores, setFornecedores] = useState<{ id: number; nome: string; cnpj?: string; email?: string; telefone?: string; cidade?: string; estado?: string; user_id?: string; empresa_id?: string }[]>([])
  const [loadingFornecedores, setLoadingFornecedores] = useState(false)
  
  // Estados para filtros e busca
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [filtroData, setFiltroData] = useState<string>('')

  // Estados para modais
  const [modalNovaTransacao, setModalNovaTransacao] = useState(false)
  const [modalNovaContaPagar, setModalNovaContaPagar] = useState(false)
  const [modalNovaContaReceber, setModalNovaContaReceber] = useState(false)
  const [modalNovaCategoria, setModalNovaCategoria] = useState(false)
  const [modalNovaFormaPagamento, setModalNovaFormaPagamento] = useState(false)
  const [modalNovoFornecedor, setModalNovoFornecedor] = useState(false)
  const [modalVisualizarConta, setModalVisualizarConta] = useState(false)
  const [contaSelecionada, setContaSelecionada] = useState<ContasPagar | null>(null)
  const [modalConfirmarPagamento, setModalConfirmarPagamento] = useState(false)
  const [dataPagamento, setDataPagamento] = useState('')
  const [horaPagamento, setHoraPagamento] = useState('')
  const [salvandoPagamento, setSalvandoPagamento] = useState(false)
  
  // Estados para contas a receber
  const [modalVisualizarContaReceber, setModalVisualizarContaReceber] = useState(false)
  const [contaReceberSelecionada, setContaReceberSelecionada] = useState<ContasReceber | null>(null)
  const [modalConfirmarRecebimento, setModalConfirmarRecebimento] = useState(false)
  const [dataRecebimento, setDataRecebimento] = useState('')
  const [horaRecebimento, setHoraRecebimento] = useState('')
  const [salvandoRecebimento, setSalvandoRecebimento] = useState(false)
  
  // Estados para exclusão
  const [modalExcluirContaPagar, setModalExcluirContaPagar] = useState(false)
  const [modalExcluirContaReceber, setModalExcluirContaReceber] = useState(false)
  const [excluindoContaPagar, setExcluindoContaPagar] = useState(false)
  const [excluindoContaReceber, setExcluindoContaReceber] = useState(false)
  
  // Estados para formulário de nova conta a pagar
  const [novaContaPagar, setNovaContaPagar] = useState({
    categoria: '',
    fornecedor_id: null as number | null,
    forma_pagamento: '',
    valor: 0,
    parcelas: 1,
    vencimento: '',
    status: 'PENDENTE' as 'PENDENTE' | 'PAGA' | 'VENCIDA',
    observacoes: '',
    origem: 'MANUAL',
    origem_id: null
  })
  const [salvandoContaPagar, setSalvandoContaPagar] = useState(false)
  
  // Estados para formulário de nova conta a receber
  const [novaContaReceber, setNovaContaReceber] = useState({
    categoria: '',
    cliente_nome: '',
    descricao: '',
    servico: '',
    valor: 0,
    vencimento: '',
    status: 'pendente' as 'pendente' | 'recebida' | 'vencida',
    observacoes: ''
  })
  const [salvandoContaReceber, setSalvandoContaReceber] = useState(false)
  
  // Estados para formulários de nova categoria, forma de pagamento e fornecedor
  const [novaCategoria, setNovaCategoria] = useState({
    nome: '',
    descricao: '',
    tipo: 'CUSTO' as 'CUSTO' | 'VENDA'
  })

  const [novaFormaPagamento, setNovaFormaPagamento] = useState({
    nome: ''
  })
  const [novoFornecedor, setNovoFornecedor] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: ''
  })
  const [salvandoCategoria, setSalvandoCategoria] = useState(false)
  const [salvandoFormaPagamento, setSalvandoFormaPagamento] = useState(false)
  const [salvandoFornecedor, setSalvandoFornecedor] = useState(false)

  // Estados para dados dos gráficos
  const [dadosReceitasMensais, setDadosReceitasMensais] = useState<any[]>([])
  const [dadosPorCategoria, setDadosPorCategoria] = useState<any[]>([])

  // Estado para filtro de período
  const [filtroPeriodo, setFiltroPeriodo] = useState<'mes' | '3meses' | '6meses' | 'ano' | 'total' | 'personalizado'>('mes')
  const [dataInicioPersonalizado, setDataInicioPersonalizado] = useState<string>('')
  const [dataFimPersonalizado, setDataFimPersonalizado] = useState<string>('')

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date())
    }, 1000)
    
    // Carregar dados iniciais
    carregarDadosFinanceiros()
    
    return () => clearInterval(timer)
  }, [])

  const carregarDadosFinanceiros = async () => {
    setLoading(true)
    try {
      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await carregarContasPagar(user.id)
        await carregarCategoriasCusto(user.id)
        await carregarFormasPagamento(user.id)
        await carregarFornecedores(user.id)
        // Buscar empresa_id do usuário
        const { data: userEmpresa } = await supabase
          .from('usuarios_empresas')
          .select('empresa_id')
          .eq('usuario_id', user.id)
          .single()
        
        if (userEmpresa?.empresa_id) {
          await carregarContasReceber(userEmpresa.empresa_id)
        }
      }
      
      // Dados mockados para outras funcionalidades (serão atualizados com dados reais)
      setResumoFinanceiro({
        saldoAtual: 85420.75,
        receitasMes: 125340.50,
        despesasMes: 96590.25,
        lucroMes: 28750.25,
        contasPagarTotal: 0, // Será atualizado após carregar contas a pagar
        contasReceberTotal: 0 // Será atualizado após carregar contas a receber
      })
      
      setTransacoes([])
      
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarCategoriasCusto = async (userId: string) => {
    setLoadingCategorias(true)
    try {
      const categorias = await financeiroService.getCategoriasCusto(userId)
      setCategoriasCusto(categorias)
    } catch (error) {
      console.error('Erro ao carregar categorias de custo:', error)
    } finally {
      setLoadingCategorias(false)
    }
  }

  const carregarFormasPagamento = async (userId: string) => {
    setLoadingFormasPagamento(true)
    try {
      console.log('Carregando formas de pagamento para usuário:', userId)
      const formas = await financeiroService.getFormasPagamento(userId)
      console.log('Formas de pagamento carregadas:', formas)
      setFormasPagamento(formas)
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error)
    } finally {
      setLoadingFormasPagamento(false)
    }
  }

  const carregarFornecedores = async (userId: string) => {
    setLoadingFornecedores(true)
    try {
      console.log('Carregando fornecedores para usuário:', userId, 'empresa:', user?.empresa_id)
      const fornecedores = await financeiroService.getFornecedores(userId)
      console.log('Fornecedores carregados no frontend:', fornecedores)
      console.log('Quantidade de fornecedores:', fornecedores.length)
      setFornecedores(fornecedores)
      console.log('Estado fornecedores atualizado com:', fornecedores.length, 'fornecedores')
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
      // Em caso de erro, definir array vazio para evitar problemas
      setFornecedores([])
    } finally {
      setLoadingFornecedores(false)
    }
  }

  const carregarContasPagar = async (userId: string) => {
    try {
      const contas = await financeiroService.getContasPagar(userId)
      setContasPagar(contas)
      // Atualizar resumo com dados reais
      setResumoFinanceiro(prev => ({
        ...prev,
        contasPagarTotal: contas.length
      }))
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error)
    }
  }

  const carregarContasReceber = async (empresaId: string) => {
    try {
      console.log('Carregando contas a receber para empresa:', empresaId);
      const contas = await financeiroService.getContasReceber(empresaId);
      console.log('Contas a receber carregadas:', contas);
      console.log('Detalhes das contas:', contas.map(c => ({
        id: c.id,
        cliente_nome: c.cliente_nome,
        descricao: c.descricao,
        valor: c.valor,
        empresa_id: c.empresa_id
      })));
      setContasReceber(contas);
      
      // Atualizar resumo com dados reais
      const totalContasReceber = contas.reduce((total, conta) => total + (conta.valor || 0), 0);
      setResumoFinanceiro(prev => ({
        ...prev,
        contasReceberTotal: totalContasReceber
      }));
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarDataLocal = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  }

  const getStatusColor = (status: string, tipo: 'conta' | 'transacao' = 'conta') => {
    if (tipo === 'transacao') {
      switch (status) {
        case 'pago': return 'text-green-600 bg-green-50 border-green-200'
        case 'pendente': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'vencido': return 'text-red-600 bg-red-50 border-red-200'
        default: return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    } else {
      switch (status) {
        case 'PAGA': case 'recebida': return 'text-green-600 bg-green-50 border-green-200'
        case 'PENDENTE': case 'pendente': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'VENCIDA': case 'vencida': return 'text-red-600 bg-red-50 border-red-200'
        default: return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    }
  }

  const handleNovaTransacao = () => {
    setModalNovaTransacao(true)
  }

  const handleNovaContaPagar = () => {
    setModalNovaContaPagar(true)
  }

  const handleNovaContaReceber = () => {
    setModalNovaContaReceber(true)
  }

  const handleSalvarContaPagar = async () => {
    if (!user) return
    
    console.log('Iniciando salvamento de conta a pagar:', novaContaPagar)
    
    // Validação básica
    if (!novaContaPagar.categoria || !novaContaPagar.forma_pagamento || !novaContaPagar.vencimento || novaContaPagar.valor <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios (categoria, forma de pagamento, valor e vencimento).')
      return
    }
    
    setSalvandoContaPagar(true)
    try {
      const dadosConta = {
        categoria: novaContaPagar.categoria,
        fornecedor_id: novaContaPagar.fornecedor_id || undefined,
        forma_pagamento: novaContaPagar.forma_pagamento,
        valor: novaContaPagar.valor,
        parcelas: novaContaPagar.parcelas.toString(),
        vencimento: novaContaPagar.vencimento,
        status: novaContaPagar.status,
        observacoes: novaContaPagar.observacoes,
        origem: novaContaPagar.origem,
        origem_id: novaContaPagar.origem_id || undefined
      }
      
      console.log('Dados da conta a ser salva:', dadosConta)
      
      await financeiroService.criarContaPagar(user.id, dadosConta)
      
      console.log('Conta a pagar salva com sucesso, recarregando dados...')
      
      // Recarregar dados
      await carregarContasPagar(user.id)
      
      // Limpar formulário e fechar modal
      setNovaContaPagar({
        categoria: '',
        fornecedor_id: null,
        forma_pagamento: '',
        valor: 0,
        parcelas: 1,
        vencimento: '',
        status: 'PENDENTE',
        observacoes: '',
        origem: 'MANUAL',
        origem_id: null
      })
      setModalNovaContaPagar(false)
    } catch (error) {
      console.error('Erro ao salvar conta a pagar:', error)
      const errorMessage = error instanceof Error ? error.message : 'Tente novamente.'
      alert(`Erro ao salvar conta a pagar: ${errorMessage}`)
    } finally {
      setSalvandoContaPagar(false)
    }
  }

  const handleCancelarContaPagar = () => {
    setNovaContaPagar({
      categoria: '',
      fornecedor_id: null,
      forma_pagamento: '',
      valor: 0,
      parcelas: 1,
      vencimento: '',
      status: 'PENDENTE',
      observacoes: '',
      origem: 'MANUAL',
      origem_id: null
    })
    setModalNovaContaPagar(false)
  }

  const handleCancelarContaReceber = () => {
    setNovaContaReceber({
      categoria: '',
      cliente_nome: '',
      descricao: '',
      servico: '',
      valor: 0,
      vencimento: '',
      status: 'pendente',
      observacoes: ''
    })
    setModalNovaContaReceber(false)
  }

  const handleSalvarNovaCategoria = async () => {
    if (!user || !novaCategoria.nome.trim()) return
    
    setSalvandoCategoria(true)
    try {
      const { data, error } = await supabase
        .from('categorias')
        .insert([{ 
          nome: novaCategoria.nome.trim(), 
          descricao: novaCategoria.descricao.trim(),
          tipo: novaCategoria.tipo,
          user_id: user.id 
        }])
        .select()
        .single()
      
      if (error) throw error
      
      // Recarregar categorias
      await carregarCategoriasCusto(user.id)
      
      // Limpar formulário e fechar modal
      setNovaCategoria({ nome: '', descricao: '', tipo: 'CUSTO' })
      setModalNovaCategoria(false)
    } catch (error) {
      console.error('Erro ao salvar categoria:', error)
      alert('Erro ao salvar categoria. Tente novamente.')
    } finally {
      setSalvandoCategoria(false)
    }
  }

  const handleSalvarNovaFormaPagamento = async () => {
    if (!user || !novaFormaPagamento.nome.trim()) return
    
    setSalvandoFormaPagamento(true)
    try {
      console.log('Tentando salvar forma de pagamento:', {
        nome: novaFormaPagamento.nome.trim(),
        user_id: user.id
      })
      
      // Usar o método do serviço
      await financeiroService.adicionarFormaPagamento(novaFormaPagamento.nome.trim(), user.id)
      
      // Recarregar formas de pagamento
      await carregarFormasPagamento(user.id)
      
      // Limpar formulário e fechar modal
      setNovaFormaPagamento({ nome: '' })
      setModalNovaFormaPagamento(false)
    } catch (error) {
      console.error('Erro ao salvar forma de pagamento:', error)
      const errorMessage = error instanceof Error ? error.message : 'Tente novamente.'
      alert(`Erro ao salvar forma de pagamento: ${errorMessage}`)
    } finally {
      setSalvandoFormaPagamento(false)
    }
  }

  const handleSalvarNovoFornecedor = async () => {
    if (!user || !novoFornecedor.nome.trim()) return
    
    setSalvandoFornecedor(true)
    try {
      console.log('Tentando salvar fornecedor:', {
        ...novoFornecedor,
        user_id: user.id
      })
      
      // Usar o método do serviço
      await financeiroService.adicionarFornecedor(novoFornecedor, user.id)
      
      // Recarregar fornecedores
      await carregarFornecedores(user.id)
      
      // Limpar formulário e fechar modal
      setNovoFornecedor({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        observacoes: ''
      })
      setModalNovoFornecedor(false)
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      const errorMessage = error instanceof Error ? error.message : 'Tente novamente.'
      alert(`Erro ao salvar fornecedor: ${errorMessage}`)
    } finally {
      setSalvandoFornecedor(false)
    }
  }

  const contasPagarVencidas = contasPagar.filter(c => c.status === 'VENCIDA').length
  const contasReceberVencidas = contasReceber.filter(c => c.status === 'vencida').length

  // [1] Adicione estados para modal de visualização e confirmação de pagamento
  const handleVisualizarConta = (conta: ContasPagar) => {
    setContaSelecionada(conta);
    setModalVisualizarConta(true);
  };

  // [3] Função para abrir modal de confirmação de pagamento
  const handleConfirmarPagamento = (conta: ContasPagar) => {
    setContaSelecionada(conta);
    setDataPagamento('');
    setHoraPagamento('');
    setModalConfirmarPagamento(true);
  };

  // [4] Função para salvar confirmação de pagamento
  const salvarPagamentoConta = async () => {
    if (!contaSelecionada || !dataPagamento || !horaPagamento) {
      alert('Preencha data e hora do pagamento!');
      return;
    }
    setSalvandoPagamento(true);
    try {
      const pago_em = `${dataPagamento}T${horaPagamento}:00`;
      await supabase
        .from('contas_pagar')
        .update({ status: 'PAGO', pago_em })
        .eq('id', contaSelecionada.id);
      setModalConfirmarPagamento(false);
      setContaSelecionada(null);
      // Recarregar contas
      if (user) await carregarContasPagar(user.id);
    } catch (err) {
      alert('Erro ao salvar pagamento!');
    } finally {
      setSalvandoPagamento(false);
    }
  };

  // Após carregar contasPagar e antes do return:
  const contasPagarOrdenadas = [
    ...contasPagar
      .filter(c => c.status === 'VENCIDA')
      .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()),
    ...contasPagar
      .filter(c => c.status === 'PENDENTE')
      .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()),
    ...contasPagar
      .filter(c => c.status === 'PAGO')
  ];

  // Função utilitária para verificar se a data está no mês atual
  function isDataNoMesAtual(dateString: string) {
    if (!dateString) return false;
    const [ano, mes] = dateString.split('T')[0].split('-');
    const hoje = new Date();
    return (
      parseInt(ano) === hoje.getFullYear() &&
      parseInt(mes) === hoje.getMonth() + 1
    );
  }

  // Função para salvar nova conta a receber
  const handleSalvarContaReceber = async () => {
    if (!user) {
      alert('Usuário não autenticado!');
      return;
    }
    
    // Validação básica
    if (!novaContaReceber.categoria || !novaContaReceber.cliente_nome || !novaContaReceber.servico || !novaContaReceber.valor || !novaContaReceber.vencimento) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    setSalvandoContaReceber(true);
    try {
      // Buscar empresa_id do usuário logado
      const { data: userEmpresa, error: errorEmpresa } = await supabase
        .from('usuarios_empresas')
        .select('empresa_id')
        .eq('usuario_id', user.id)
        .single();
      if (errorEmpresa || !userEmpresa?.empresa_id) {
        alert('Não foi possível identificar a empresa do usuário.');
        return;
      }
      
      // Montar objeto para inserir
      const novaConta = {
        categoria: novaContaReceber.categoria,
        cliente_nome: novaContaReceber.cliente_nome,
        descricao: novaContaReceber.descricao || novaContaReceber.servico, // Usar serviço como descrição se não houver descrição
        servico: novaContaReceber.servico,
        valor: novaContaReceber.valor,
        vencimento: novaContaReceber.vencimento,
        status: novaContaReceber.status,
        observacoes: novaContaReceber.observacoes,
        empresa_id: userEmpresa.empresa_id,
      };
      
      // Inserir no banco
      const { error } = await supabase
        .from('contas_receber')
        .insert([novaConta]);
      if (error) {
        alert('Erro ao salvar conta a receber: ' + error.message);
        return;
      }
      
      // Recarregar contas a receber
      await carregarContasReceber(userEmpresa.empresa_id);
      
      // Limpar formulário e fechar modal
      setNovaContaReceber({
        categoria: '',
        cliente_nome: '',
        descricao: '',
        servico: '',
        valor: 0,
        vencimento: '',
        status: 'pendente',
        observacoes: ''
      });
      setModalNovaContaReceber(false);
      
      alert('Conta a receber salva com sucesso!');
    } catch (err) {
      alert('Erro inesperado ao salvar conta a receber.');
      console.error(err);
    } finally {
      setSalvandoContaReceber(false);
    }
  };

  // Exemplo de uso (para quando o modal estiver pronto):
  // handleSalvarContaReceber({
  //   cliente_id: '...',
  //   cliente_nome: 'Nome do Cliente',
  //   descricao: 'Descrição',
  //   servico: 'Serviço',
  //   valor: 1000,
  //   vencimento: '2024-08-01',
  //   status: 'pendente',
  //   observacoes: '',
  //   comprovante_url: ''
  // });

  // Funções para contas a receber
  const handleVisualizarContaReceber = (conta: ContasReceber) => {
    setContaReceberSelecionada(conta);
    setModalVisualizarContaReceber(true);
  };

  const handleConfirmarRecebimento = (conta: ContasReceber) => {
    setContaReceberSelecionada(conta);
    setDataRecebimento('');
    setHoraRecebimento('');
    setModalConfirmarRecebimento(true);
  };

  const salvarRecebimentoConta = async () => {
    if (!contaReceberSelecionada || !dataRecebimento || !horaRecebimento) {
      alert('Preencha data e hora do recebimento!');
      return;
    }
    setSalvandoRecebimento(true);
    try {
      const recebido_em = `${dataRecebimento}T${horaRecebimento}:00`;
      await supabase
        .from('contas_receber')
        .update({ status: 'recebida', recebido_em })
        .eq('id', contaReceberSelecionada.id);
      setModalConfirmarRecebimento(false);
      setContaReceberSelecionada(null);
      // Recarregar contas
      if (user) {
        const { data: userEmpresa } = await supabase
          .from('usuarios_empresas')
          .select('empresa_id')
          .eq('usuario_id', user.id)
          .single();
        if (userEmpresa?.empresa_id) {
          await carregarContasReceber(userEmpresa.empresa_id);
        }
      }
    } catch (err) {
      alert('Erro ao salvar recebimento!');
    } finally {
      setSalvandoRecebimento(false);
    }
  };

  const handleDesfazerRecebimento = async (conta: ContasReceber) => {
    if (!confirm('Tem certeza que deseja desfazer o recebimento desta conta?')) return;
    
    try {
      await supabase
        .from('contas_receber')
        .update({ status: 'pendente', recebido_em: null })
        .eq('id', conta.id);
      
      // Recarregar contas
      if (user) await carregarContasReceber(user.empresa_id || '');
    } catch (err) {
      alert('Erro ao desfazer recebimento!');
    }
  };

  // Após carregar contasReceber e antes do return:
  const contasReceberOrdenadas = [
    ...contasReceber
      .filter(c => c.status?.toLowerCase() === 'vencida')
      .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()),
    ...contasReceber
      .filter(c => c.status?.toLowerCase() === 'pendente')
      .sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()),
    ...contasReceber
      .filter(c => c.status?.toLowerCase() === 'recebida')
  ];

  // Funções de exclusão
  const handleExcluirContaPagar = (conta: ContasPagar) => {
    setContaSelecionada(conta);
    setModalExcluirContaPagar(true);
  };

  const handleExcluirContaReceber = (conta: ContasReceber) => {
    setContaReceberSelecionada(conta);
    setModalExcluirContaReceber(true);
  };

  const confirmarExcluirContaPagar = async () => {
    if (!contaSelecionada) return;
    
    setExcluindoContaPagar(true);
    try {
      const { error } = await supabase
        .from('contas_pagar')
        .delete()
        .eq('id', contaSelecionada.id);
      
      if (error) throw error;
      
      setModalExcluirContaPagar(false);
      setContaSelecionada(null);
      
      // Recarregar contas
      if (user) await carregarContasPagar(user.id);
      
      alert('Conta a pagar excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir conta a pagar:', error);
      alert('Erro ao excluir conta a pagar. Tente novamente.');
    } finally {
      setExcluindoContaPagar(false);
    }
  };

  const confirmarExcluirContaReceber = async () => {
    if (!contaReceberSelecionada) return;
    
    setExcluindoContaReceber(true);
    try {
      const { error } = await supabase
        .from('contas_receber')
        .delete()
        .eq('id', contaReceberSelecionada.id);
      
      if (error) throw error;
      
      setModalExcluirContaReceber(false);
      setContaReceberSelecionada(null);
      
      // Recarregar contas
      if (user) await carregarContasReceber(user.empresa_id || '');
      
      alert('Conta a receber excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir conta a receber:', error);
      alert('Erro ao excluir conta a receber. Tente novamente.');
    } finally {
      setExcluindoContaReceber(false);
    }
  };

  // Função utilitária para filtrar por período
  function filtrarPorPeriodo<T extends { vencimento: string }>(lista: T[]): T[] {
    const hoje = new Date();
    let dataInicio: Date | null = null;
    let dataFim: Date | null = null;
    
    if (filtroPeriodo === 'mes') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    } else if (filtroPeriodo === '3meses') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    } else if (filtroPeriodo === '6meses') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    } else if (filtroPeriodo === 'ano') {
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      dataFim = new Date(hoje.getFullYear(), 11, 31);
    } else if (filtroPeriodo === 'total') {
      // Para "total", retornar todas as contas sem filtrar
      return lista;
    } else if (filtroPeriodo === 'personalizado') {
      // Para "personalizado", usar as datas selecionadas
      if (dataInicioPersonalizado) dataInicio = new Date(dataInicioPersonalizado);
      if (dataFimPersonalizado) dataFim = new Date(dataFimPersonalizado);
      
      // Se nenhuma data foi selecionada, retornar lista vazia
      if (!dataInicio && !dataFim) return [];
    }
    
    // Se não há datas definidas, retornar lista original
    if (!dataInicio && !dataFim) return lista;
    
    return lista.filter(item => {
      const data = new Date(item.vencimento);
      if (dataInicio && data < dataInicio) return false;
      if (dataFim && data > dataFim) return false;
      return true;
    });
  }

  // Aplicar filtro nas contas exibidas
  const contasReceberFiltradas = filtrarPorPeriodo(contasReceber);
  const contasPagarFiltradas = filtrarPorPeriodo(contasPagar);

  // Usar contasReceberFiltradas e contasPagarFiltradas nos cálculos e tabelas

  // Cálculo dinâmico do lucro do mês
  const receitasMes = contasReceberFiltradas.reduce((total, c) => total + (c.valor || 0), 0)
  const despesasMes = contasPagarFiltradas.reduce((total, c) => total + (c.valor || 0), 0)
  const lucroMes = receitasMes - despesasMes

  // Funções para gerar dados dos gráficos
  const gerarDadosReceitasMensais = () => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const hoje = new Date();
    const dados = [];
    
    // Gerar dados dos últimos 7 meses
    for (let i = 6; i >= 0; i--) {
      const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesIndex = mes.getMonth();
      const mesNome = meses[mesIndex];
      
      // Simular dados baseados no período atual
      let valor = 0;
      if (i === 0) {
        // Mês atual - usar dados reais
        valor = receitasMes;
      } else {
        // Meses anteriores - simular dados
        valor = Math.floor(Math.random() * 150000) + 50000; // Entre 50k e 200k
      }
      
      dados.push({
        mes: mesNome,
        receitas: valor,
        ano: mes.getFullYear()
      });
    }
    
    return dados;
  };

  const gerarDadosPorCategoria = () => {
    const categorias = [
      { nome: 'Passagens Aéreas', valor: Math.floor(Math.random() * 80000) + 40000, cor: '#3B82F6' },
      { nome: 'Hotéis', valor: Math.floor(Math.random() * 60000) + 30000, cor: '#10B981' },
      { nome: 'Pacotes Turísticos', valor: Math.floor(Math.random() * 50000) + 25000, cor: '#F59E0B' },
      { nome: 'Seguros', valor: Math.floor(Math.random() * 20000) + 10000, cor: '#EF4444' },
      { nome: 'Outros Serviços', valor: Math.floor(Math.random() * 30000) + 15000, cor: '#8B5CF6' }
    ];
    
    // Se temos dados reais de contas a receber, usar eles
    if (contasReceberFiltradas.length > 0) {
      const categoriasReais = contasReceberFiltradas.reduce((acc, conta) => {
        const categoria = conta.servico || 'Outros';
        acc[categoria] = (acc[categoria] || 0) + (conta.valor || 0);
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(categoriasReais).map(([nome, valor], index) => ({
        nome,
        valor,
        cor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'][index % 7]
      }));
    }
    
    return categorias;
  };

  // Atualizar dados dos gráficos quando as contas mudarem
  useEffect(() => {
    setDadosReceitasMensais(gerarDadosReceitasMensais());
    setDadosPorCategoria(gerarDadosPorCategoria());
  }, [contasReceberFiltradas, contasPagarFiltradas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados financeiros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestão Financeira</h1>
              <p className="text-gray-600">Controle completo das finanças da agência</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notification Center */}
              <NotificationCenter />
              
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-gray-900">
                  {horaAtual.toLocaleTimeString('pt-BR')}
                </div>
                <div className="text-sm text-gray-500">
                  {horaAtual.toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </div>
              </div>
              
              {/* Navegação por abas */}
              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('geral')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'geral' 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Geral
                </button>
                <button
                  onClick={() => setViewMode('contas-pagar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'contas-pagar' 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Contas à Pagar
                </button>
                <button
                  onClick={() => setViewMode('contas-receber')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'contas-receber' 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Contas à Receber
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* Filtro de Período */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <label className="font-medium text-gray-700">Período:</label>
          <select
            value={filtroPeriodo}
            onChange={e => setFiltroPeriodo(e.target.value as any)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="mes">Mês Atual</option>
            <option value="3meses">3 meses</option>
            <option value="6meses">6 meses</option>
            <option value="ano">Ano</option>
            <option value="total">Total</option>
            <option value="personalizado">Personalizado</option>
          </select>
          {filtroPeriodo === 'personalizado' && (
            <>
              <input
                type="date"
                value={dataInicioPersonalizado}
                onChange={e => setDataInicioPersonalizado(e.target.value)}
                className="px-3 py-2 border rounded-lg"
                placeholder="Data início"
              />
              <span className="mx-1">até</span>
              <input
                type="date"
                value={dataFimPersonalizado}
                onChange={e => setDataFimPersonalizado(e.target.value)}
                className="px-3 py-2 border rounded-lg"
                placeholder="Data fim"
              />
            </>
          )}
        </div>

        {/* Cards Principais - Sempre Visíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
       
          {/* Receitas do Mês */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receitas do Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(receitasMes)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <ArrowUpCircle className="h-4 w-4 inline mr-1" />
                  Entradas do período
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Despesas do Mês */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Despesas do Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(despesasMes)}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  <ArrowDownCircle className="h-4 w-4 inline mr-1" />
                  Saídas do período
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Lucro do Mês */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lucro do Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(lucroMes)}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  <PiggyBank className="h-4 w-4 inline mr-1" />
                  Resultado líquido
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo por View Mode */}
        {viewMode === 'geral' && (
          <div className="space-y-6">
            {/* Gráficos e Análises */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Gráfico Receitas Mensais */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Receitas Mensais</h3>
                    <p className="text-sm text-gray-600">Evolução dos últimos 7 meses</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosReceitasMensais}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="mes" 
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`R$ ${formatarMoeda(value)}`, 'Receitas']}
                        labelFormatter={(label) => `${label} ${dadosReceitasMensais.find(d => d.mes === label)?.ano || ''}`}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="receitas" 
                        fill="#3B82F6" 
                        radius={[4, 4, 0, 0]}
                        name="Receitas"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Receitas por Categoria */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Por Categoria</h3>
                    <p className="text-sm text-gray-600">Este mês</p>
                  </div>
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={dadosPorCategoria}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {dadosPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.cor} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`R$ ${formatarMoeda(value)}`, 'Valor']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span style={{ color: '#374151', fontSize: '12px' }}>{value}</span>}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Transações Recentes */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Transações Recentes</h3>
                  <p className="text-sm text-gray-600">Últimas movimentações financeiras</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleNovaTransacao}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Transação
                  </button>
                </div>
              </div>

              {transacoes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
                  <p>Adicione sua primeira transação para começar</p>
                  <button 
                    onClick={handleNovaTransacao}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Adicionar Transação
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Categoria</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Valor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacoes.map((transacao) => (
                        <tr key={transacao.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {transacao.tipo === 'receita' ? (
                                <ArrowUpCircle className="h-5 w-5 text-green-600 mr-2" />
                              ) : (
                                <ArrowDownCircle className="h-5 w-5 text-red-600 mr-2" />
                              )}
                              <span className={`text-sm font-medium ${
                                transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{transacao.descricao}</div>
                              {transacao.cliente && (
                                <div className="text-sm text-gray-500">{transacao.cliente}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{transacao.categoria}</td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${
                              transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transacao.tipo === 'receita' ? '+' : '-'}{formatarMoeda(transacao.valor)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{formatarData(transacao.data)}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(transacao.status, 'transacao')}`}>
                              {transacao.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                              <Eye className="h-4 w-4" />
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

        {viewMode === 'contas-pagar' && (
          <div className="space-y-6">
            {/* Alertas */}
            {contasPagarVencidas > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">
                    Atenção: {contasPagarVencidas} conta(s) vencida(s) requer(em) ação imediata
                  </span>
                </div>
              </div>
            )}

            {/* Cards Resumo Contas a Pagar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total a Pagar</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatarMoeda(contasPagar.filter(c => c.status === 'PENDENTE' || c.status === 'VENCIDA').reduce((total, c) => total + (c.valor || 0), 0))}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contas Vencidas</p>
                    <p className="text-2xl font-bold text-red-600">{contasPagarVencidas}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contas Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {contasPagar.filter(c => c.status === 'PENDENTE').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Tabela Contas a Pagar */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Contas a Pagar</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleNovaContaPagar}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Conta
                  </button>
                </div>
              </div>

              {contasPagar.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma conta a pagar</h3>
                  <p>Adicione suas contas a pagar para começar</p>
                  <button 
                    onClick={handleNovaContaPagar}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Adicionar Conta
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Forma Pagamento</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Vencimento</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Valor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contasPagarOrdenadas.map((conta) => {
                        console.log('FormasPagamento:', formasPagamento, 'conta.forma_pagamento:', conta.forma_pagamento);
                        return (
                          <tr key={conta.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">{conta.categoria || '-'}</td>
                            <td className="py-3 px-4 text-gray-600">{
                              (() => {
                                const idForma = conta.forma_pagamento ? String(conta.forma_pagamento) : '';
                                const forma = formasPagamento.find(f => String(f.id) === idForma);
                                return forma ? forma.nome : '-';
                              })()
                            }</td>
                            <td className="py-3 px-4 text-gray-600">{formatarDataLocal(conta.vencimento)}</td>
                            <td className="py-3 px-4 font-semibold text-red-600">{formatarMoeda(conta.valor)}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(conta.status)}`}>
                                {conta.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                {conta.status === 'PAGO' ? (
                                  <button className="p-1 text-yellow-600 hover:text-yellow-800 rounded" onClick={async () => {
                                    if (window.confirm('Tem certeza que deseja desfazer o pagamento desta conta?')) {
                                      await supabase
                                        .from('contas_pagar')
                                        .update({ status: 'PENDENTE', pago_em: null })
                                        .eq('id', conta.id);
                                      if (user) await carregarContasPagar(user.id);
                                    }
                                  }} title="Desfazer pagamento">
                                    <ArrowLeft className="h-4 w-4" />
                                  </button>
                                ) : conta.status !== 'PAGA' && (
                                  <button className="p-1 text-green-600 hover:text-green-800 rounded" onClick={() => handleConfirmarPagamento(conta)}>
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                <button className="p-1 text-gray-400 hover:text-gray-600 rounded" onClick={() => handleVisualizarConta(conta)} title="Visualizar detalhes">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="p-1 text-red-600 hover:text-red-800 rounded" onClick={() => handleExcluirContaPagar(conta)} title="Excluir conta">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'contas-receber' && (
          <div className="space-y-6">
            {/* Alertas */}
            {contasReceberVencidas > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    {contasReceberVencidas} conta(s) a receber vencida(s) - Follow-up necessário
                  </span>
                </div>
              </div>
            )}

            {/* Cards Resumo Contas a Receber */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total a Receber</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatarMoeda(contasReceberOrdenadas.filter(c => c.status?.toLowerCase() === 'pendente' || c.status?.toLowerCase() === 'vencida').reduce((total, c) => total + (c.valor || 0), 0))}
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contas Vencidas</p>
                    <p className="text-2xl font-bold text-red-600">{contasReceberVencidas}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contas Recebidas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {contasReceberFiltradas.filter(c => c.status === 'recebida').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Tabela Contas a Receber */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Contas a Receber</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleNovaContaReceber}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cobrança
                  </button>
                </div>
              </div>

              {contasReceberFiltradas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma conta a receber</h3>
                  <p>Adicione suas contas a receber para começar</p>
                  <button 
                    onClick={handleNovaContaReceber}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Adicionar Cobrança
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Serviço</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Valor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Vencimento</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrarPorPeriodo(contasReceberOrdenadas).map((conta) => (
                        <tr key={conta.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{conta.cliente_nome}</td>
                          <td className="py-3 px-4 text-gray-600">{conta.descricao}</td>
                          <td className="py-3 px-4 text-gray-600">{conta.servico}</td>
                          <td className="py-3 px-4 font-semibold text-green-600">
                            {formatarMoeda(conta.valor)}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{formatarDataLocal(conta.vencimento)}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(conta.status)}`}>
                              {conta.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              {conta.status === 'recebida' ? (
                                <button className="p-1 text-yellow-600 hover:text-yellow-800 rounded" onClick={() => handleDesfazerRecebimento(conta)} title="Desfazer recebimento">
                                  <ArrowLeft className="h-4 w-4" />
                                </button>
                              ) : (
                                <button className="p-1 text-green-600 hover:text-green-800 rounded" onClick={() => handleConfirmarRecebimento(conta)} title="Confirmar recebimento">
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button className="p-1 text-gray-400 hover:text-gray-600 rounded" onClick={() => handleVisualizarContaReceber(conta)} title="Visualizar detalhes">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-red-600 hover:text-red-800 rounded" onClick={() => handleExcluirContaReceber(conta)} title="Excluir conta">
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
          </div>
        )}



        {/* Modais (serão implementados posteriormente) */}
        {modalNovaTransacao && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Nova Transação</h3>
              <p className="text-gray-600 mb-4">Modal será implementado em breve</p>
              <button 
                onClick={() => setModalNovaTransacao(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {modalNovaContaPagar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
              {/* Header com gradiente */}
              <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 p-6 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Nova Conta a Pagar</h3>
                      <p className="text-red-100 text-sm">Adicione uma nova despesa ao sistema</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCancelarContaPagar}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
                  >
                    <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Conteúdo do formulário */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Grid de 2 colunas para campos principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categoria */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        {loadingCategorias ? (
                          <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                            <span className="ml-2 text-gray-500">Carregando categorias...</span>
                          </div>
                        ) : (
                          <select
                            value={novaContaPagar.categoria}
                            onChange={(e) => setNovaContaPagar(prev => ({ ...prev, categoria: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
                            required
                          >
                            <option value="">Selecione uma categoria</option>
                            {categoriasCusto
                              .filter(categoria => categoria.tipo === 'CUSTO')
                              .map((categoria) => (
                                <option key={categoria.id} value={categoria.nome}>
                                  📋 {categoria.nome}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalNovaCategoria(true)}
                        className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
                        title="Adicionar nova categoria"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Fornecedor */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Fornecedor
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        {loadingFornecedores ? (
                          <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                            <span className="ml-2 text-gray-500">Carregando fornecedores...</span>
                          </div>
                        ) : (
                          <select
                            value={novaContaPagar.fornecedor_id || ''}
                            onChange={(e) => setNovaContaPagar(prev => ({ ...prev, fornecedor_id: e.target.value ? parseInt(e.target.value) : null }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
                            onFocus={() => console.log('Select de fornecedores focado. Estado atual:', fornecedores.length, 'fornecedores')}
                          >
                            <option value="">Selecione um fornecedor (opcional)</option>
                            {fornecedores.map((fornecedor) => {
                              // Determinar a origem do fornecedor
                              let origem = '🌐 Global'
                              if (fornecedor.user_id) {
                                origem = '👤 Usuário'
                              } else if (fornecedor.empresa_id) {
                                origem = '🏢 Empresa'
                              }
                              
                              return (
                                <option key={fornecedor.id} value={fornecedor.id}>
                                  {origem} - {fornecedor.nome} {fornecedor.cidade && `- ${fornecedor.cidade}/${fornecedor.estado}`}
                                </option>
                              )
                            })}
                            {fornecedores.length === 0 && (
                              <option value="" disabled>
                                Nenhum fornecedor encontrado
                              </option>
                            )}
                          </select>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalNovoFornecedor(true)}
                        className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 flex items-center justify-center"
                        title="Adicionar novo fornecedor"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Valor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        <span className="text-lg">R$</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={novaContaPagar.valor}
                        onChange={(e) => setNovaContaPagar(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
                        placeholder="0,00"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Valor total da conta a pagar
                    </p>
                  </div>
                </div>

                {/* Grid de 2 colunas para campos secundários */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Forma de Pagamento */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Forma de Pagamento <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        {loadingFormasPagamento ? (
                          <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                            <span className="ml-2 text-gray-500">Carregando formas de pagamento...</span>
                          </div>
                        ) : (
                          <select
                            value={novaContaPagar.forma_pagamento}
                            onChange={(e) => setNovaContaPagar(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
                            required
                          >
                            <option value="">Selecione a forma de pagamento</option>
                            {formasPagamento.map((forma) => (
                              <option key={forma.id} value={forma.id}>
                                💳 {forma.nome}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalNovaFormaPagamento(true)}
                        className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 flex items-center justify-center"
                        title="Adicionar nova forma de pagamento"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Parcelas */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Número de Parcelas
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={novaContaPagar.parcelas}
                        onChange={(e) => setNovaContaPagar(prev => ({ ...prev, parcelas: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <span className="text-sm">x</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Número de parcelas para pagamento
                    </p>
                  </div>

                  {/* Data de Vencimento */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Data de Vencimento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={novaContaPagar.vencimento}
                        onChange={(e) => setNovaContaPagar(prev => ({ ...prev, vencimento: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300"
                        required
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setNovaContaPagar(prev => ({ ...prev, status: 'PENDENTE' }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                        novaContaPagar.status === 'PENDENTE'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Pendente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovaContaPagar(prev => ({ ...prev, status: 'PAGA' }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                        novaContaPagar.status === 'PAGA'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Paga</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovaContaPagar(prev => ({ ...prev, status: 'VENCIDA' }))}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center space-x-2 ${
                        novaContaPagar.status === 'VENCIDA'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">Vencida</span>
                    </button>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Observações
                  </label>
                  <textarea
                    value={novaContaPagar.observacoes}
                    onChange={(e) => setNovaContaPagar(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white hover:border-gray-300 resize-none"
                    placeholder="Observações adicionais sobre a conta..."
                  />
                </div>
              </div>

              {/* Footer com botões */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    <span className="text-red-500">*</span> Campos obrigatórios
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelarContaPagar}
                      className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                      disabled={salvandoContaPagar}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSalvarContaPagar}
                      disabled={!novaContaPagar.categoria || !novaContaPagar.forma_pagamento || !novaContaPagar.vencimento || novaContaPagar.valor <= 0 || salvandoContaPagar}
                      className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {salvandoContaPagar ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Salvando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Salvar Conta</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalNovaContaReceber && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
              {/* Header com gradiente */}
              <div className="relative bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Nova Conta a Receber</h3>
                      <p className="text-green-100 text-sm">Adicione uma nova receita ao sistema</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCancelarContaReceber}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
                  >
                    <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Conteúdo do formulário */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Grid de 2 colunas para campos principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categoria */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        {loadingCategorias ? (
                          <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                            <span className="ml-2 text-gray-500">Carregando categorias...</span>
                          </div>
                        ) : (
                          <select
                            value={novaContaReceber.categoria || ''}
                            onChange={(e) => setNovaContaReceber(prev => ({ ...prev, categoria: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
                            required
                          >
                            <option value="">Selecione uma categoria</option>
                            {categoriasCusto
                              .filter(categoria => categoria.tipo === 'VENDA')
                              .map((categoria) => (
                                <option key={categoria.id} value={categoria.nome}>
                                  📋 {categoria.nome}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalNovaCategoria(true)}
                        className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center"
                        title="Adicionar nova categoria"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={novaContaReceber.cliente_nome || ''}
                      onChange={(e) => setNovaContaReceber(prev => ({ ...prev, cliente_nome: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="Nome do cliente"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Serviço */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Serviço <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={novaContaReceber.servico || ''}
                      onChange={(e) => setNovaContaReceber(prev => ({ ...prev, servico: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
                      placeholder="Descrição do serviço"
                      required
                    />
                  </div>

                  {/* Valor */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Valor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={novaContaReceber.valor || ''}
                        onChange={(e) => setNovaContaReceber(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
                        placeholder="0,00"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data de Vencimento */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Data de Vencimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={novaContaReceber.vencimento || ''}
                      onChange={(e) => setNovaContaReceber(prev => ({ ...prev, vencimento: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
                      required
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Status
                    </label>
                    <select
                      value={novaContaReceber.status || 'pendente'}
                      onChange={(e) => setNovaContaReceber(prev => ({ ...prev, status: e.target.value as 'pendente' | 'recebida' | 'vencida' }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="recebida">Recebida</option>
                      <option value="vencida">Vencida</option>
                    </select>
                  </div>
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Observações
                  </label>
                  <textarea
                    value={novaContaReceber.observacoes || ''}
                    onChange={(e) => setNovaContaReceber(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white hover:border-gray-300 resize-none"
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelarContaReceber}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                    disabled={salvandoContaReceber}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarContaReceber}
                    disabled={!novaContaReceber.categoria || !novaContaReceber.cliente_nome || !novaContaReceber.servico || !novaContaReceber.valor || !novaContaReceber.vencimento || salvandoContaReceber}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {salvandoContaReceber ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Salvar Conta a Receber</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nova Categoria */}
        {modalNovaCategoria && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-in slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 p-6 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Nova Categoria</h3>
                      <p className="text-blue-100 text-sm">Adicione uma nova categoria</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setModalNovaCategoria(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
                  >
                    <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nome da Categoria <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novaCategoria.nome}
                    onChange={(e) => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ex: Marketing Digital"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={novaCategoria.tipo}
                    onChange={(e) => setNovaCategoria(prev => ({ ...prev, tipo: e.target.value as 'CUSTO' | 'VENDA' }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    required
                  >
                    <option value="CUSTO">Custo</option>
                    <option value="VENDA">Venda</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    value={novaCategoria.descricao}
                    onChange={(e) => setNovaCategoria(prev => ({ ...prev, descricao: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="Descrição opcional da categoria..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setModalNovaCategoria(false)}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                    disabled={salvandoCategoria}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarNovaCategoria}
                    disabled={!novaCategoria.nome.trim() || salvandoCategoria}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {salvandoCategoria ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Salvar Categoria</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nova Forma de Pagamento */}
        {modalNovaFormaPagamento && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform animate-in slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-green-500 via-green-600 to-green-700 p-6 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Nova Forma de Pagamento</h3>
                      <p className="text-green-100 text-sm">Adicione uma nova forma de pagamento</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setModalNovaFormaPagamento(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
                  >
                    <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Nome da Forma de Pagamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={novaFormaPagamento.nome}
                    onChange={(e) => setNovaFormaPagamento(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Ex: Cartão de Crédito 12x"
                    required
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setModalNovaFormaPagamento(false)}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                    disabled={salvandoFormaPagamento}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarNovaFormaPagamento}
                    disabled={!novaFormaPagamento.nome.trim() || salvandoFormaPagamento}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {salvandoFormaPagamento ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Salvar Forma de Pagamento</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalVisualizarConta && contaSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Detalhes da Conta</h3>
              <div className="mb-2"><b>Descrição:</b> {contaSelecionada.categoria}</div>
              <div className="mb-2"><b>Valor:</b> {formatarMoeda(contaSelecionada.valor)}</div>
              <div className="mb-2"><b>Vencimento:</b> {formatarDataLocal(contaSelecionada.vencimento)}</div>
              <div className="mb-2"><b>Status:</b> {contaSelecionada.status}</div>
              <div className="mb-2"><b>Observações:</b> {contaSelecionada.observacoes || '-'}</div>
              <button onClick={() => setModalVisualizarConta(false)} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Fechar</button>
            </div>
          </div>
        )}
        {modalConfirmarPagamento && contaSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Confirmar Pagamento</h3>
              <div className="mb-4">Informe a data e hora do pagamento realizado:</div>
              <div className="flex gap-2 mb-4">
                <input type="date" value={dataPagamento} onChange={e => setDataPagamento(e.target.value)} className="border rounded px-3 py-2 w-1/2" />
                <input type="time" value={horaPagamento} onChange={e => setHoraPagamento(e.target.value)} className="border rounded px-3 py-2 w-1/2" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setModalConfirmarPagamento(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                <button onClick={salvarPagamentoConta} disabled={salvandoPagamento} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                  {salvandoPagamento ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
        {modalVisualizarContaReceber && contaReceberSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Detalhes da Conta</h3>
              <div className="mb-2"><b>Descrição:</b> {contaReceberSelecionada.descricao}</div>
              <div className="mb-2"><b>Serviço:</b> {contaReceberSelecionada.servico}</div>
              <div className="mb-2"><b>Valor:</b> {formatarMoeda(contaReceberSelecionada.valor)}</div>
              <div className="mb-2"><b>Vencimento:</b> {formatarDataLocal(contaReceberSelecionada.vencimento)}</div>
              <div className="mb-2"><b>Status:</b> {contaReceberSelecionada.status}</div>
               <div className="mb-2"><b>Data de Recebimento:</b> {contaReceberSelecionada.recebido_em ? formatarDataLocal(contaReceberSelecionada.recebido_em) : '-'}</div>
              <div className="mb-2"><b>Forma de Recebimento:</b> {contaReceberSelecionada.forma_recebimento}</div>
              <div className="mb-2"><b>Observações:</b> {contaReceberSelecionada.observacoes || '-'}</div>
              <div className="mb-2"><b>Comprovante URL:</b> {contaReceberSelecionada.comprovante_url || '-'}</div>
              <button onClick={() => setModalVisualizarContaReceber(false)} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Fechar</button>
            </div>
          </div>
        )}
        {modalConfirmarRecebimento && contaReceberSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Confirmar Recebimento</h3>
              <div className="mb-4">Informe a data e hora do recebimento realizado:</div>
              <div className="flex gap-2 mb-4">
                <input type="date" value={dataRecebimento} onChange={e => setDataRecebimento(e.target.value)} className="border rounded px-3 py-2 w-1/2" />
                <input type="time" value={horaRecebimento} onChange={e => setHoraRecebimento(e.target.value)} className="border rounded px-3 py-2 w-1/2" />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setModalConfirmarRecebimento(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
                <button onClick={salvarRecebimentoConta} disabled={salvandoRecebimento} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                  {salvandoRecebimento ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Novo Fornecedor */}
        {modalNovoFornecedor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform animate-in slide-in-from-bottom-4 duration-300">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 p-6 text-white">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Novo Fornecedor</h3>
                      <p className="text-purple-100 text-sm">Adicione um novo fornecedor</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setModalNovoFornecedor(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 group"
                  >
                    <X className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-6 space-y-6">
                {/* Informação sobre salvamento */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Fornecedor Pessoal</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Este fornecedor ficará disponível apenas para você. 
                    A funcionalidade de fornecedores da empresa será implementada em breve.
                  </p>
                </div>

                {/* Grid de 2 colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Nome do Fornecedor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={novoFornecedor.nome}
                      onChange={(e) => setNovoFornecedor(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      placeholder="Nome da empresa fornecedora"
                      required
                    />
                  </div>

                  {/* CNPJ */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={novoFornecedor.cnpj}
                      onChange={(e) => setNovoFornecedor(prev => ({ ...prev, cnpj: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={novoFornecedor.email}
                      onChange={(e) => setNovoFornecedor(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      placeholder="contato@fornecedor.com"
                    />
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={novoFornecedor.telefone}
                      onChange={(e) => setNovoFornecedor(prev => ({ ...prev, telefone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  {/* Cidade */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={novoFornecedor.cidade}
                      onChange={(e) => setNovoFornecedor(prev => ({ ...prev, cidade: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      placeholder="São Paulo"
                    />
                  </div>

                  {/* Estado */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={novoFornecedor.estado}
                      onChange={(e) => setNovoFornecedor(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                      placeholder="SP"
                    />
                  </div>
                </div>

                {/* CEP */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.cep}
                    onChange={(e) => setNovoFornecedor(prev => ({ ...prev, cep: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="00000-000"
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={novoFornecedor.endereco}
                    onChange={(e) => setNovoFornecedor(prev => ({ ...prev, endereco: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    placeholder="Rua, número, bairro, complemento"
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Observações
                  </label>
                  <textarea
                    value={novoFornecedor.observacoes}
                    onChange={(e) => setNovoFornecedor(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
                    placeholder="Observações adicionais sobre o fornecedor..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setModalNovoFornecedor(false)}
                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                    disabled={salvandoFornecedor}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarNovoFornecedor}
                    disabled={!novoFornecedor.nome.trim() || salvandoFornecedor}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {salvandoFornecedor ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Salvar Fornecedor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão - Contas a Pagar */}
        {modalExcluirContaPagar && contaSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-full mr-3">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-red-600">Confirmar Exclusão</h3>
              </div>
              <div className="mb-4">
                <p className="text-gray-700 mb-2">Tem certeza que deseja excluir esta conta a pagar?</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{contaSelecionada.categoria}</p>
                  <p className="text-sm text-gray-600">{formatarMoeda(contaSelecionada.valor)} - Vencimento: {formatarDataLocal(contaSelecionada.vencimento)}</p>
                </div>
                <p className="text-sm text-red-600 mt-2 font-medium">⚠️ Esta ação não pode ser desfeita!</p>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setModalExcluirContaPagar(false)} 
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  disabled={excluindoContaPagar}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarExcluirContaPagar} 
                  disabled={excluindoContaPagar}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {excluindoContaPagar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Excluir Conta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão - Contas a Receber */}
        {modalExcluirContaReceber && contaReceberSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-red-100 rounded-full mr-3">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-red-600">Confirmar Exclusão</h3>
              </div>
              <div className="mb-4">
                <p className="text-gray-700 mb-2">Tem certeza que deseja excluir esta conta a receber?</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{contaReceberSelecionada.descricao}</p>
                  <p className="text-sm text-gray-600">Cliente: {contaReceberSelecionada.cliente_nome}</p>
                  <p className="text-sm text-gray-600">{formatarMoeda(contaReceberSelecionada.valor)} - Vencimento: {formatarDataLocal(contaReceberSelecionada.vencimento)}</p>
                </div>
                <p className="text-sm text-red-600 mt-2 font-medium">⚠️ Esta ação não pode ser desfeita!</p>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setModalExcluirContaReceber(false)} 
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                  disabled={excluindoContaReceber}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarExcluirContaReceber} 
                  disabled={excluindoContaReceber}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {excluindoContaReceber ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Excluir Conta
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Financeiro 