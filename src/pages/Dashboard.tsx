import { useState, useEffect } from 'react'
import { 
  TrendingUp,
  Users, 
  DollarSign, 
  Clock,
  Plane,
  Hotel,
  FileText,
  CheckCircle,
  Target,
  PieChart,
  PiggyBank,
  AlertTriangle,
  CreditCard,
  Receipt,
  Wallet,
  Activity,
  BarChart3,
  CheckSquare
} from 'lucide-react'
import NotificationCenter from '../components/NotificationCenter'
import { ToastContainer } from '../components/ToastNotification'

interface VooProximo {
  numero: string
  cliente: string
  destino: string
  checkin: string
  status: 'urgente' | 'atencao' | 'normal'
}

interface Tarefa {
  id: string
  titulo: string
  prioridade: 'alta' | 'media' | 'baixa'
  prazo: string
  concluida: boolean
}

const Dashboard = () => {
  const [horaAtual, setHoraAtual] = useState(new Date())
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'warning' | 'info' | 'urgent'
    action?: { label: string; onClick: () => void }
  }>>([
    {
      id: '1',
      message: 'Tarefa urgente: Follow-up família Oliveira vence em 2 horas',
      type: 'urgent',
      action: {
        label: 'Ver Tarefa',
        onClick: () => console.log('Navegar para tarefa')
      }
    },
    {
      id: '2',
      message: 'Check-in Hotel Copacabana disponível para Roberto Silva',
      type: 'info',
      action: {
        label: 'Fazer Check-in',
        onClick: () => console.log('Navegar para hotelaria')
      }
    }
  ])
  
  // Dados financeiros simulados (em tempo real)
  const [dadosFinanceiros] = useState({
    faturamentoMes: 125340.50,
    lucroMes: 28750.30,
    contasPagar: 15420.00,
    valoresReceber: 42180.75,
    ticketMedio: 1850.25,
    vendasHoje: 8450.00
  })

  // Voos com check-in próximo
  const [voosProximos] = useState<VooProximo[]>([
    {
      numero: 'LA 1265',
      cliente: 'Maria Silva',
      destino: 'São Paulo',
      checkin: '2h 30min',
      status: 'urgente'
    },
    {
      numero: 'GL 1262',
      cliente: 'João Santos',
      destino: 'Guarulhos',
      checkin: '4h 15min',
      status: 'atencao'
    },
    {
      numero: 'AZ 4651',
      cliente: 'Ana Costa',
      destino: 'Maceió',
      checkin: '6h 45min',
      status: 'normal'
    },
    {
      numero: 'TP 2236',
      cliente: 'Carlos Lima',
      destino: 'Lisboa',
      checkin: '8h 20min',
      status: 'normal'
    }
  ])

  // Tarefas do dia
  const [tarefas] = useState<Tarefa[]>([
    {
      id: '1',
      titulo: 'Confirmar reserva Hotel Copacabana - Cliente: Roberto',
      prioridade: 'alta',
      prazo: '10:00',
      concluida: false
    },
    {
      id: '2',
      titulo: 'Enviar vouchers voo Miami - Maria Silva',
      prioridade: 'alta',
      prazo: '11:30',
      concluida: true
    },
    {
      id: '3',
      titulo: 'Follow-up proposta família Oliveira',
      prioridade: 'media',
      prazo: '14:00',
      concluida: false
    },
    {
      id: '4',
      titulo: 'Reunião equipe vendas',
      prioridade: 'media',
      prazo: '15:30',
      concluida: false
    },
    {
      id: '5',
      titulo: 'Relatório financeiro semanal',
      prioridade: 'baixa',
      prazo: '17:00',
      concluida: false
    }
  ])

  // Dados para gráficos (simulados)
  const [vendaSemanais] = useState([
    { dia: 'Seg', valor: 15420 },
    { dia: 'Ter', valor: 22180 },
    { dia: 'Qua', valor: 18750 },
    { dia: 'Qui', valor: 28340 },
    { dia: 'Sex', valor: 25670 },
    { dia: 'Sáb', valor: 31250 },
    { dia: 'Dom', valor: 19850 }
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraAtual(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getStatusVooColor = (status: string) => {
    switch (status) {
      case 'urgente': return 'text-red-600 bg-red-50 border-red-200'
      case 'atencao': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'normal': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'text-red-600 bg-red-100'
      case 'media': return 'text-yellow-600 bg-yellow-100'
      case 'baixa': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatarHora = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatarData = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const tarefasPendentes = tarefas.filter(t => !t.concluida)
  const tarefasConcluidas = tarefas.filter(t => t.concluida)
  const maxVenda = Math.max(...vendaSemanais.map(v => v.valor))

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600">Visão geral das operações da agência</p>
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
            </div>
          </div>
        </div>

        {/* Cards Financeiros Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Faturamento do Mês */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento do Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(dadosFinanceiros.faturamentoMes)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  +12.5% vs mês anterior
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Lucro do Mês */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lucro do Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(dadosFinanceiros.lucroMes)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  +8.3% vs mês anterior
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <PiggyBank className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Contas a Pagar */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contas a Pagar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(dadosFinanceiros.contasPagar)}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  5 vencendo esta semana
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Valores a Receber */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valores a Receber</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(dadosFinanceiros.valoresReceber)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  <Receipt className="h-4 w-4 inline mr-1" />
                  12 faturas em aberto
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Wallet className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Segunda linha de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Vendas de Hoje */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(dadosFinanceiros.vendasHoje)}
                </p>
              </div>
              <Activity className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(dadosFinanceiros.ticketMedio)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          {/* Clientes Ativos */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">342</p>
              </div>
              <Users className="h-8 w-8 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Seção Principal com Gráfico e Informações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Vendas Semanais */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vendas da Semana</h3>
                <p className="text-sm text-gray-600">Faturamento diário em R$</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            
            <div className="h-64 flex items-end justify-between space-x-2">
              {vendaSemanais.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500"
                    style={{ 
                      height: `${(item.valor / maxVenda) * 200}px`,
                      minHeight: '20px'
                    }}
                  ></div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-900">{item.dia}</div>
                    <div className="text-xs text-gray-600">
                      {formatarMoeda(item.valor)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voos com Check-in Próximo */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Check-ins Próximos</h3>
              <Plane className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="space-y-3">
              {voosProximos.map((voo, index) => (
                <div key={index} className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{voo.numero}</div>
                      <div className="text-sm text-gray-600">{voo.cliente}</div>
                      <div className="text-sm text-gray-500">{voo.destino}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusVooColor(voo.status)}`}>
                        {voo.checkin}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tarefas do Dia */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckSquare className="h-6 w-6 text-indigo-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tarefas do Dia</h3>
                <p className="text-sm text-gray-600">
                  {tarefasConcluidas.length} de {tarefas.length} concluídas
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">
                {Math.round((tarefasConcluidas.length / tarefas.length) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Progresso</div>
            </div>
          </div>

          <div className="space-y-3">
            {tarefas.map((tarefa) => (
              <div 
                key={tarefa.id} 
                className={`p-4 rounded-lg border transition-all ${
                  tarefa.concluida 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      tarefa.concluida 
                        ? 'bg-green-600 border-green-600' 
                        : 'border-gray-300'
                    }`}>
                      {tarefa.concluida && (
                        <CheckSquare className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        tarefa.concluida ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {tarefa.titulo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPrioridadeColor(tarefa.prioridade)}`}>
                      {tarefa.prioridade}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {tarefa.prazo}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default Dashboard 