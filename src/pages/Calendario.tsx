import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Check, X, Edit, Trash2, AlertCircle, CheckCircle, Undo2, Filter, Bell, ChevronLeft, ChevronRight, TrendingUp, Users, FileText, AlertTriangle, CalendarDays } from 'lucide-react'
import { CalendarioService, Tarefa, Compromisso } from '../services/calendarioService'
import { logger } from '../utils/logger'

interface ModalData {
  tipo: 'tarefa' | 'compromisso'
  modo: 'criar' | 'editar' | 'visualizar'
  item?: Tarefa | Compromisso
}

interface EventoCalendario {
  id: string
  titulo: string
  data: string
  hora?: string
  tipo: 'tarefa' | 'compromisso'
  status: string
  prioridade?: string
  item: Tarefa | Compromisso
}

interface Estatisticas {
  tarefasPendentes: number
  tarefasEmAtraso: number
  compromissosHoje: number
  tarefasUrgentes: number
  proximosEventos: EventoCalendario[]
  tarefasAtrasadas: EventoCalendario[]
  concluidosRecentemente: EventoCalendario[]
}

// 🔧 FUNÇÕES UTILITÁRIAS PARA CORREÇÃO DE TIMEZONE
const obterDataHojeString = (): string => {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

const obterDataAmanha = (): Date => {
  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  return amanha
}

const obterDataAmanhaSemana = (dias: number): Date => {
  const futuro = new Date()
  futuro.setDate(futuro.getDate() + dias)
  return futuro
}

const compararDatas = (data1: string, data2: string): boolean => {
  // Comparação de strings YYYY-MM-DD diretamente (mais seguro)
  return data1 === data2
}

const compararDataComHoje = (dataString: string): 'passado' | 'hoje' | 'futuro' => {
  const hoje = obterDataHojeString()
  if (dataString < hoje) return 'passado'
  if (dataString === hoje) return 'hoje'
  return 'futuro'
}

const estaDentroDoIntervalo = (dataString: string, dataInicio: string, dataFim: string): boolean => {
  return dataString >= dataInicio && dataString <= dataFim
}

// 🔄 FUNÇÕES PARA DESFAZER CONCLUSÃO
const calcularTempoRestante = (dataConclusao: string): { horas: number, minutos: number, expirado: boolean } => {
  const agora = new Date()
  const conclusao = new Date(dataConclusao)
  const limiteExclusao = new Date(conclusao.getTime() + (5 * 60 * 60 * 1000)) // 5 horas depois
  
  const diferenca = limiteExclusao.getTime() - agora.getTime()
  
  if (diferenca <= 0) {
    return { horas: 0, minutos: 0, expirado: true }
  }
  
  const horas = Math.floor(diferenca / (1000 * 60 * 60))
  const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60))
  
  return { horas, minutos, expirado: false }
}

const formatarTempoRestante = (tempo: { horas: number, minutos: number, expirado: boolean }): string => {
  if (tempo.expirado) return 'Expirado'
  if (tempo.horas > 0) return `${tempo.horas}h ${tempo.minutos}m`
  return `${tempo.minutos}m`
}

export default function Calendario() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState<ModalData | null>(null)
  const [dataAtual, setDataAtual] = useState(new Date())
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    tarefasPendentes: 0,
    tarefasEmAtraso: 0,
    compromissosHoje: 0,
    tarefasUrgentes: 0,
    proximosEventos: [],
    tarefasAtrasadas: [],
    concluidosRecentemente: []
  })

  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [eventosDoDia, setEventosDoDia] = useState<EventoCalendario[]>([]);

  // Form states
  const [formTarefa, setFormTarefa] = useState<Omit<Tarefa, 'id' | 'created_at' | 'updated_at'>>({
    titulo: '',
    descricao: '',
    prioridade: 'media',
    status: 'pendente',
    data_vencimento: obterDataHojeString(),
    hora_vencimento: '09:00',
    responsavel: '',
    categoria: 'administrativo',
    cliente: '',
    notificacoes: true
  })

  const [formCompromisso, setFormCompromisso] = useState<Omit<Compromisso, 'id' | 'created_at' | 'updated_at'>>({
    titulo: '',
    tipo: 'reuniao',
    data: obterDataHojeString(),
    hora_inicio: '09:00',
    hora_fim: '10:00',
    local: '',
    participantes: [],
    descricao: '',
    status: 'agendado',
    cliente: ''
  })

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados()
    const intervalLimpeza = setInterval(async () => {
      const resultado = await CalendarioService.limparConcluidos()
      if (resultado.tarefasRemovidas > 0 || resultado.compromissosRemovidos > 0) {
        carregarDados()
      }
    }, 60 * 60 * 1000)
    return () => clearInterval(intervalLimpeza)
  }, [])

  // Atualizar estatísticas quando dados mudarem
  useEffect(() => {
    calcularEstatisticas()
  }, [tarefas, compromissos])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [tarefasData, compromissosData] = await Promise.all([
        CalendarioService.listarTarefas(),
        CalendarioService.listarCompromissos()
      ])
      setTarefas(tarefasData)
      setCompromissos(compromissosData)
    } catch (error) {
      logger.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEstatisticas = () => {
    const hoje = obterDataHojeString()
    const proximos7DiasData = obterDataAmanhaSemana(7)
    const proximos7DiasString = `${proximos7DiasData.getFullYear()}-${String(proximos7DiasData.getMonth() + 1).padStart(2, '0')}-${String(proximos7DiasData.getDate()).padStart(2, '0')}`
    
    logger.debug('📅 Calculando estatísticas...', { hoje, totalTarefas: tarefas.length, totalCompromissos: compromissos.length })

    // Calcular estatísticas
    const tarefasPendentes = tarefas.filter(t => t.status !== 'concluida' && t.status !== 'cancelada').length
    
    const tarefasEmAtraso = tarefas.filter(t => {
      const comparacao = compararDataComHoje(t.data_vencimento)
      return t.status !== 'concluida' && comparacao === 'passado'
    }).length
    
    const compromissosHoje = compromissos.filter(c => {
      const comparacao = compararDataComHoje(c.data)
      return c.status !== 'realizado' && comparacao === 'hoje'
    }).length
    
    const tarefasUrgentes = tarefas.filter(t => 
      t.prioridade === 'alta' && t.status !== 'concluida'
    ).length

    logger.debug('📊 Estatísticas calculadas', { tarefasPendentes, tarefasEmAtraso, compromissosHoje, tarefasUrgentes })

    // Próximos eventos (próximos 7 dias)
    const proximosEventos: EventoCalendario[] = []
    
    tarefas.forEach(tarefa => {
      const comparacao = compararDataComHoje(tarefa.data_vencimento)
      const dentroDoIntervalo = estaDentroDoIntervalo(tarefa.data_vencimento, hoje, proximos7DiasString)
      
      if (tarefa.status !== 'concluida' && (comparacao === 'hoje' || comparacao === 'futuro') && dentroDoIntervalo) {
        proximosEventos.push({
          id: tarefa.id!,
          titulo: tarefa.titulo,
          data: tarefa.data_vencimento,
          hora: tarefa.hora_vencimento,
          tipo: 'tarefa',
          status: tarefa.status,
          prioridade: tarefa.prioridade,
          item: tarefa
        })
      }
    })

    compromissos.forEach(compromisso => {
      const comparacao = compararDataComHoje(compromisso.data)
      const dentroDoIntervalo = estaDentroDoIntervalo(compromisso.data, hoje, proximos7DiasString)
      
      if (compromisso.status !== 'realizado' && (comparacao === 'hoje' || comparacao === 'futuro') && dentroDoIntervalo) {
        proximosEventos.push({
          id: compromisso.id!,
          titulo: compromisso.titulo,
          data: compromisso.data,
          hora: compromisso.hora_inicio,
          tipo: 'compromisso',
          status: compromisso.status,
          item: compromisso
        })
      }
    })

    // Tarefas atrasadas
    const tarefasAtrasadas: EventoCalendario[] = tarefas
      .filter(t => {
        const comparacao = compararDataComHoje(t.data_vencimento)
        return t.status !== 'concluida' && comparacao === 'passado'
      })
      .map(tarefa => ({
        id: tarefa.id!,
        titulo: tarefa.titulo,
        data: tarefa.data_vencimento,
        hora: tarefa.hora_vencimento,
        tipo: 'tarefa' as const,
        status: tarefa.status,
        prioridade: tarefa.prioridade,
        item: tarefa
      }))

    // Ordenar eventos por data
    proximosEventos.sort((a, b) => a.data.localeCompare(b.data))
    tarefasAtrasadas.sort((a, b) => b.data.localeCompare(a.data))

    // 🔄 CONCLUÍDOS RECENTEMENTE (últimas 5 horas para permitir desfazer)
    const agora = new Date()
    const limite5Horas = new Date(agora.getTime() - (5 * 60 * 60 * 1000))
    
    const concluidosRecentemente: EventoCalendario[] = []
    
    // Tarefas concluídas recentemente
    tarefas.forEach(tarefa => {
      if (tarefa.status === 'concluida' && tarefa.data_conclusao) {
        const dataConclusao = new Date(tarefa.data_conclusao)
        if (dataConclusao > limite5Horas) {
          concluidosRecentemente.push({
            id: tarefa.id!,
            titulo: tarefa.titulo,
            data: tarefa.data_vencimento,
            hora: tarefa.hora_vencimento,
            tipo: 'tarefa',
            status: tarefa.status,
            prioridade: tarefa.prioridade,
            item: tarefa
          })
        }
      }
    })
    
    // Compromissos realizados recentemente
    compromissos.forEach(compromisso => {
      if (compromisso.status === 'realizado' && compromisso.data_conclusao) {
        const dataConclusao = new Date(compromisso.data_conclusao)
        if (dataConclusao > limite5Horas) {
          concluidosRecentemente.push({
            id: compromisso.id!,
            titulo: compromisso.titulo,
            data: compromisso.data,
            hora: compromisso.hora_inicio,
            tipo: 'compromisso',
            status: compromisso.status,
            item: compromisso
          })
        }
      }
    })
    
    // Ordenar por data de conclusão (mais recentes primeiro)
    concluidosRecentemente.sort((a, b) => {
      const dataA = (a.item as any).data_conclusao || ''
      const dataB = (b.item as any).data_conclusao || ''
      return dataB.localeCompare(dataA)
    })

    logger.debug('📋 Resumo eventos', { proximosEventos: proximosEventos.length, tarefasAtrasadas: tarefasAtrasadas.length, concluidosRecentemente: concluidosRecentemente.length })

    setEstatisticas({
      tarefasPendentes,
      tarefasEmAtraso,
      compromissosHoje,
      tarefasUrgentes,
      proximosEventos: proximosEventos.slice(0, 5),
      tarefasAtrasadas: tarefasAtrasadas.slice(0, 5),
      concluidosRecentemente: concluidosRecentemente.slice(0, 5)
    })
  }

  // Funções do calendário mini
  const obterDiasDoMes = (data: Date) => {
    const ano = data.getFullYear()
    const mes = data.getMonth()
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    const diasAnteriores = primeiroDia.getDay()
    const diasNoMes = ultimoDia.getDate()
    
    const dias = []
    
    // Dias do mês anterior
    for (let i = diasAnteriores - 1; i >= 0; i--) {
      const dia = new Date(ano, mes, -i)
      dias.push({ data: dia, dentroMes: false })
    }
    
    // Dias do mês atual
    for (let i = 1; i <= diasNoMes; i++) {
      const dia = new Date(ano, mes, i)
      dias.push({ data: dia, dentroMes: true })
    }
    
    // Completar a grade
    const diasRestantes = 42 - dias.length
    for (let i = 1; i <= diasRestantes; i++) {
      const dia = new Date(ano, mes + 1, i)
      dias.push({ data: dia, dentroMes: false })
    }
    
    return dias
  }

  const temEventosNoDia = (data: Date): boolean => {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    const dataStr = `${ano}-${mes}-${dia}`
    
    return tarefas.some(t => compararDatas(t.data_vencimento, dataStr)) || 
           compromissos.some(c => compararDatas(c.data, dataStr))
  }

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novaData = new Date(dataAtual)
    if (direcao === 'anterior') {
      novaData.setMonth(novaData.getMonth() - 1)
    } else {
      novaData.setMonth(novaData.getMonth() + 1)
    }
    setDataAtual(novaData)
  }

  const abrirModal = (tipo: 'tarefa' | 'compromisso', modo: 'criar' | 'editar' | 'visualizar', item?: Tarefa | Compromisso) => {
    setModalData({ tipo, modo, item })
    
    if (modo === 'editar' && item) {
      if (tipo === 'tarefa') {
        setFormTarefa(item as Tarefa)
      } else {
        setFormCompromisso(item as Compromisso)
      }
    } else if (modo === 'criar') {
      setFormTarefa({
        titulo: '',
        descricao: '',
        prioridade: 'media',
        status: 'pendente',
        data_vencimento: obterDataHojeString(),
        hora_vencimento: '09:00',
        responsavel: '',
        categoria: 'administrativo',
        cliente: '',
        notificacoes: true
      })
      
      setFormCompromisso({
        titulo: '',
        tipo: 'reuniao',
        data: obterDataHojeString(),
        hora_inicio: '09:00',
        hora_fim: '10:00',
        local: '',
        participantes: [],
        descricao: '',
        status: 'agendado',
        cliente: ''
      })
    }
    
    setShowModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setModalData(null)
  }

  const salvarItem = async () => {
    try {
      if (!modalData) return

      if (modalData.tipo === 'tarefa') {
        if (modalData.modo === 'criar') {
          await CalendarioService.criarTarefa(formTarefa)
        } else if (modalData.modo === 'editar' && modalData.item?.id) {
          await CalendarioService.atualizarTarefa(modalData.item.id, formTarefa)
        }
      } else {
        if (modalData.modo === 'criar') {
          await CalendarioService.criarCompromisso(formCompromisso)
        } else if (modalData.modo === 'editar' && modalData.item?.id) {
          await CalendarioService.atualizarCompromisso(modalData.item.id, formCompromisso)
        }
      }

      fecharModal()
      carregarDados()
    } catch (error) {
      logger.error('Erro ao salvar:', error)
      alert('Erro ao salvar item')
    }
  }

  const toggleConclusao = async (evento: EventoCalendario) => {
    try {
      if (evento.tipo === 'tarefa') {
        const tarefa = evento.item as Tarefa
        const novoStatus = tarefa.status === 'concluida' ? 'pendente' : 'concluida'
        
        // Log para debug
        if (tarefa.status === 'concluida') {
          logger.debug('🔄 Desfazendo conclusão da tarefa', { titulo: tarefa.titulo })
          alert('✅ Conclusão desfeita! A tarefa foi marcada como pendente.')
        } else {
          logger.debug('✅ Marcando tarefa como concluída', { titulo: tarefa.titulo })
        }
        
        await CalendarioService.atualizarTarefa(tarefa.id!, { status: novoStatus })
      } else {
        const compromisso = evento.item as Compromisso
        const novoStatus = compromisso.status === 'realizado' ? 'agendado' : 'realizado'
        
        // Log para debug
        if (compromisso.status === 'realizado') {
          logger.debug('🔄 Desfazendo realização do compromisso', { titulo: compromisso.titulo })
          alert('✅ Realização desfeita! O compromisso foi marcado como agendado.')
        } else {
          logger.debug('✅ Marcando compromisso como realizado', { titulo: compromisso.titulo })
        }
        
        await CalendarioService.atualizarCompromisso(compromisso.id!, { status: novoStatus })
      }
      carregarDados()
    } catch (error) {
      logger.error('Erro ao alterar status:', error)
      alert('❌ Erro ao alterar status do item')
    }
  }

  const excluirItem = async (evento: EventoCalendario) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return

    try {
      if (evento.tipo === 'tarefa') {
        await CalendarioService.excluirTarefa(evento.id)
      } else {
        await CalendarioService.excluirCompromisso(evento.id)
      }
      carregarDados()
    } catch (error) {
      logger.error('Erro ao excluir:', error)
    }
  }

  const getPrioridadeColor = (prioridade?: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-500'
      case 'media': return 'bg-yellow-500'
      case 'baixa': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getDiasAtraso = (data: string): number => {
    const hoje = obterDataHojeString()
    const dataHoje = new Date(hoje + 'T00:00:00')
    const dataVencimento = new Date(data + 'T00:00:00')
    
    const diffTime = dataHoje.getTime() - dataVencimento.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays > 0 ? diffDays : 0
  }

  const getStatusColor = (status: string, tipo: 'tarefa' | 'compromisso') => {
    if (tipo === 'tarefa') {
      switch (status) {
        case 'concluida': return 'bg-green-500 text-white'
        case 'em-andamento': return 'bg-blue-500 text-white'
        case 'pendente': return 'bg-orange-500 text-white'
        case 'cancelada': return 'bg-red-500 text-white'
        default: return 'bg-gray-500 text-white'
      }
    } else {
      switch (status) {
        case 'realizado': return 'bg-green-500 text-white'
        case 'confirmado': return 'bg-blue-500 text-white'
        case 'agendado': return 'bg-orange-500 text-white'
        case 'cancelado': return 'bg-red-500 text-white'
        default: return 'bg-gray-500 text-white'
      }
    }
  }

  // Função para buscar todos os eventos de um dia
  const buscarEventosDoDia = (data: Date) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const diaNum = String(data.getDate()).padStart(2, '0');
    const dataStr = `${ano}-${mes}-${diaNum}`;
    const eventos: EventoCalendario[] = [];
    tarefas.forEach(t => {
      if (compararDatas(t.data_vencimento, dataStr)) {
        eventos.push({
          id: t.id!,
          titulo: t.titulo,
          data: t.data_vencimento,
          hora: t.hora_vencimento,
          tipo: 'tarefa',
          status: t.status,
          prioridade: t.prioridade,
          item: t
        });
      }
    });
    compromissos.forEach(c => {
      if (compararDatas(c.data, dataStr)) {
        eventos.push({
          id: c.id!,
          titulo: c.titulo,
          data: c.data,
          hora: c.hora_inicio,
          tipo: 'compromisso',
          status: c.status,
          item: c
        });
      }
    });
    return eventos;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Centro de Controle</h1>
            <p className="text-gray-500">Gerencie suas tarefas e compromissos</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => abrirModal('tarefa', 'criar')}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Tarefa</span>
          </button>
          
          <button
            onClick={() => abrirModal('compromisso', 'criar')}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Compromisso</span>
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarefas Pendentes */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Tarefas Pendentes</p>
              <p className="text-3xl font-bold text-gray-900">{estatisticas.tarefasPendentes}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Tarefas em Atraso */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Em Atraso</p>
              <p className="text-3xl font-bold text-red-600">{estatisticas.tarefasEmAtraso}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Compromissos Hoje */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Compromissos Hoje</p>
              <p className="text-3xl font-bold text-green-600">{estatisticas.compromissosHoje}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tarefas Urgentes */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Alta Prioridade</p>
              <p className="text-3xl font-bold text-orange-600">{estatisticas.tarefasUrgentes}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Alertas e Listas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarefas Atrasadas - ALERTA */}
          {estatisticas.tarefasAtrasadas.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-800">⚠️ Tarefas em Atraso</h3>
              </div>
              <div className="space-y-3">
                {estatisticas.tarefasAtrasadas.map((evento) => (
                  <div key={evento.id} className="bg-white rounded-lg p-4 border border-red-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getPrioridadeColor(evento.prioridade)}`}></div>
                          <h4 className="font-semibold text-gray-900">{evento.titulo}</h4>
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            {getDiasAtraso(evento.data)} dia(s) atrasado
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500 flex items-center space-x-4">
                          <span>📅 {new Date(evento.data).toLocaleDateString('pt-BR')}</span>
                          {evento.hora && <span>🕐 {evento.hora}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleConclusao(evento)}
                          className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                          title="Marcar como concluída"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => abrirModal(evento.tipo, 'editar', evento.item)}
                          className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximos Eventos */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                📋 Próximos 7 Dias
              </h3>
            </div>
            
            {estatisticas.proximosEventos.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum evento próximo</p>
                <p className="text-sm text-gray-400">Você está em dia! 🎉</p>
              </div>
            ) : (
              <div className="space-y-4">
                {estatisticas.proximosEventos.map((evento) => {
                  const hoje = obterDataHojeString()
                  const amanha = obterDataAmanhaSemana(1)
                  const amanhaString = `${amanha.getFullYear()}-${String(amanha.getMonth() + 1).padStart(2, '0')}-${String(amanha.getDate()).padStart(2, '0')}`
                  
                  const isHoje = compararDatas(evento.data, hoje)
                  const isAmanha = compararDatas(evento.data, amanhaString)
                  
                  return (
                    <div key={evento.id} className={`p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer ${
                      isHoje ? 'border-blue-200 bg-blue-50' : 
                      isAmanha ? 'border-yellow-200 bg-yellow-50' : 
                      'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => abrirModal(evento.tipo, 'visualizar', evento.item)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              evento.tipo === 'tarefa' ? getPrioridadeColor(evento.prioridade) : 'bg-green-500'
                            }`}></div>
                            <h4 className="font-semibold text-gray-900">{evento.titulo}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              evento.tipo === 'tarefa' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {evento.tipo === 'tarefa' ? '📋 Tarefa' : '📅 Compromisso'}
                            </span>
                            {isHoje && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                HOJE
                              </span>
                            )}
                            {isAmanha && (
                              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                                AMANHÃ
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 flex items-center space-x-4">
                            <span>📅 {new Date(evento.data).toLocaleDateString('pt-BR')}</span>
                            {evento.hora && <span>🕐 {evento.hora}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleConclusao(evento)
                            }}
                            className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                            title="Marcar como concluído"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              abrirModal(evento.tipo, 'editar', evento.item)
                            }}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              excluirItem(evento)
                            }}
                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 🔄 Concluídos Recentemente - SEÇÃO PARA DESFAZER */}
          {estatisticas.concluidosRecentemente.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-bold text-green-800">✅ Concluídos Recentemente</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Clique em 🔄 para desfazer
                </span>
              </div>
              <div className="space-y-3">
                {estatisticas.concluidosRecentemente.map((evento) => {
                  const item = evento.item as (Tarefa | Compromisso)
                  const dataConclusao = (item as any).data_conclusao
                  const tempoRestante = dataConclusao ? calcularTempoRestante(dataConclusao) : { horas: 0, minutos: 0, expirado: true }
                  
                  return (
                    <div key={evento.id} className="bg-white rounded-lg p-4 border border-green-200 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <h4 className="font-semibold text-gray-900">{evento.titulo}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              evento.tipo === 'tarefa' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {evento.tipo === 'tarefa' ? '📋 Tarefa' : '📅 Compromisso'}
                            </span>
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✅ CONCLUÍDO
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600 flex items-center space-x-4">
                            <span>📅 {new Date(evento.data).toLocaleDateString('pt-BR')}</span>
                            {evento.hora && <span>🕐 {evento.hora}</span>}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tempoRestante.expirado ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              ⏱️ {tempoRestante.expirado ? 'Expirado' : `${formatarTempoRestante(tempoRestante)} restante`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleConclusao(evento)}
                            className="p-2 bg-yellow-100 text-yellow-600 hover:bg-yellow-200 rounded-lg transition-colors"
                            title="Desfazer conclusão"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => abrirModal(evento.tipo, 'visualizar', evento.item)}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                            title="Visualizar"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => excluirItem(evento)}
                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                            title="Excluir permanentemente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-xs text-green-700">
                    <p className="font-medium">💡 Dica:</p>
                    <p>Itens concluídos são mantidos por 5 horas para permitir correções. Após esse período, serão removidos automaticamente.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita - Calendário Compacto */}
        <div className="space-y-6">
          {/* Mini Calendário */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {mesesNomes[dataAtual.getMonth()]} {dataAtual.getFullYear()}
              </h3>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navegarMes('anterior')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDataAtual(new Date())}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={() => navegarMes('proximo')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendário Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Cabeçalho dos dias */}
              {diasSemana.map((dia, idx) => (
                <div key={`dow-${idx}`} className="p-2 text-center text-xs font-medium text-gray-500">
                  {dia}
                </div>
              ))}
              
              {/* Dias do calendário */}
              {obterDiasDoMes(dataAtual).map((dia, index) => {
                const hoje = obterDataHojeString()
                const ano = dia.data.getFullYear()
                const mes = String(dia.data.getMonth() + 1).padStart(2, '0')
                const diaDia = String(dia.data.getDate()).padStart(2, '0')
                const dataString = `${ano}-${mes}-${diaDia}`
                
                const isHoje = compararDatas(dataString, hoje)
                const temEventos = temEventosNoDia(dia.data)
                
                return (
                  <div
                    key={index}
                    className={`aspect-square p-1 text-center text-sm rounded-lg relative cursor-pointer transition-all ${
                      dia.dentroMes ? 'text-gray-900 hover:bg-blue-50' : 'text-gray-400'
                    } ${isHoje ? 'bg-blue-500 text-white font-bold' : ''}
                    ${temEventos && !isHoje ? 'bg-green-100 text-green-800 font-medium' : ''}`}
                    onClick={() => {
                      setDiaSelecionado(dia.data);
                      setEventosDoDia(buscarEventosDoDia(dia.data));
                    }}
                  >
                    {dia.data.getDate()}
                    {temEventos && (
                      <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
                        isHoje ? 'bg-white' : 'bg-blue-500'
                      }`}></div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Legenda */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Hoje</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Com eventos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo Rápido */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-4">📊 Resumo</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Total de Tarefas:</span>
                <span className="font-bold">{tarefas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Total de Compromissos:</span>
                <span className="font-bold">{compromissos.length}</span>
              </div>
              <div className="h-px bg-blue-400 my-3"></div>
              <div className="flex items-center justify-between">
                <span className="text-blue-100">Produtividade:</span>
                <span className="font-bold">
                  {tarefas.length > 0 ? Math.round((tarefas.filter(t => t.status === 'concluida').length / tarefas.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modalData.modo === 'criar' && `Criar ${modalData.tipo === 'tarefa' ? 'Tarefa' : 'Compromisso'}`}
                {modalData.modo === 'editar' && `Editar ${modalData.tipo === 'tarefa' ? 'Tarefa' : 'Compromisso'}`}
                {modalData.modo === 'visualizar' && `Ver ${modalData.tipo === 'tarefa' ? 'Tarefa' : 'Compromisso'}`}
              </h3>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalData.tipo === 'tarefa' ? (
              <div className="space-y-4">
                {modalData.modo === 'visualizar' && modalData.item ? (
                  // Visualização da Tarefa
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                      <p className="text-gray-900">{(modalData.item as Tarefa).titulo}</p>
                    </div>
                    
                    {(modalData.item as Tarefa).descricao && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <p className="text-gray-900">{(modalData.item as Tarefa).descricao}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPrioridadeColor((modalData.item as Tarefa).prioridade)}`}>
                          {(modalData.item as Tarefa).prioridade?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor((modalData.item as Tarefa).status, 'tarefa')}`}>
                          {(modalData.item as Tarefa).status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                      {modalData.item && typeof (modalData.item as Tarefa).data_vencimento === 'string' && (
                        <p className="text-gray-900">
                          {(() => {
                            const dataStr = (modalData.item as Tarefa).data_vencimento;
                            let dataFormatada = dataStr;
                            if (!isNaN(Date.parse(dataStr))) {
                              dataFormatada = new Date(dataStr).toLocaleDateString('pt-BR');
                            }
                            const horaStr = (modalData.item as Tarefa).hora_vencimento;
                            let horaFormatada = '';
                            if (typeof horaStr === 'string' && horaStr) {
                              horaFormatada = horaStr.length > 5 ? horaStr.slice(0,5) : horaStr;
                            }
                            return `${dataFormatada}${horaFormatada ? ` às ${horaFormatada}` : ''}`;
                          })()}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                      <p className="text-gray-900">{(modalData.item as Tarefa).responsavel}</p>
                    </div>
                    
                    {(modalData.item as Tarefa).cliente && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                        <p className="text-gray-900">{(modalData.item as Tarefa).cliente}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Formulário da Tarefa
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
                      <input
                        type="text"
                        value={formTarefa.titulo}
                        onChange={(e) => setFormTarefa(prev => ({ ...prev, titulo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <textarea
                        value={formTarefa.descricao}
                        onChange={(e) => setFormTarefa(prev => ({ ...prev, descricao: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                        <select
                          value={formTarefa.prioridade}
                          onChange={(e) => setFormTarefa(prev => ({ ...prev, prioridade: e.target.value as 'alta' | 'media' | 'baixa' }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={modalData.modo === 'visualizar'}
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Média</option>
                          <option value="baixa">Baixa</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={formTarefa.status}
                          onChange={(e) => setFormTarefa(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={modalData.modo === 'visualizar'}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="em-andamento">Em Andamento</option>
                          <option value="concluida">Concluída</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento*</label>
                        <input
                          type="date"
                          value={formTarefa.data_vencimento}
                          onChange={(e) => setFormTarefa(prev => ({ ...prev, data_vencimento: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={modalData.modo === 'visualizar'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                        <input
                          type="time"
                          value={formTarefa.hora_vencimento}
                          onChange={(e) => setFormTarefa(prev => ({ ...prev, hora_vencimento: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={modalData.modo === 'visualizar'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Responsável*</label>
                      <input
                        type="text"
                        value={formTarefa.responsavel}
                        onChange={(e) => setFormTarefa(prev => ({ ...prev, responsavel: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <select
                        value={formTarefa.categoria}
                        onChange={(e) => setFormTarefa(prev => ({ ...prev, categoria: e.target.value as any }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      >
                        <option value="vendas">Vendas</option>
                        <option value="atendimento">Atendimento</option>
                        <option value="administrativo">Administrativo</option>
                        <option value="reuniao">Reunião</option>
                        <option value="viagem">Viagem</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      <input
                        type="text"
                        value={formTarefa.cliente}
                        onChange={(e) => setFormTarefa(prev => ({ ...prev, cliente: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Compromisso
              <div className="space-y-4">
                {modalData.modo === 'visualizar' && modalData.item ? (
                  // Visualização do Compromisso
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                      <p className="text-gray-900">{(modalData.item as Compromisso).titulo}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <p className="text-gray-900">{(modalData.item as Compromisso).tipo}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data e Horário</label>
                      <p className="text-gray-900">
                        {new Date((modalData.item as Compromisso).data).toLocaleDateString('pt-BR')} 
                        das {(modalData.item as Compromisso).hora_inicio} às {(modalData.item as Compromisso).hora_fim}
                      </p>
                    </div>
                    
                    {(modalData.item as Compromisso).local && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                        <p className="text-gray-900">{(modalData.item as Compromisso).local}</p>
                      </div>
                    )}
                    
                    {(modalData.item as Compromisso).descricao && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <p className="text-gray-900">{(modalData.item as Compromisso).descricao}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor((modalData.item as Compromisso).status, 'compromisso')}`}>
                        {(modalData.item as Compromisso).status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Formulário do Compromisso
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Título*</label>
                      <input
                        type="text"
                        value={formCompromisso.titulo}
                        onChange={(e) => setFormCompromisso(prev => ({ ...prev, titulo: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select
                        value={formCompromisso.tipo}
                        onChange={(e) => setFormCompromisso(prev => ({ ...prev, tipo: e.target.value as any }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      >
                        <option value="reuniao">Reunião</option>
                        <option value="ligacao">Ligação</option>
                        <option value="atendimento">Atendimento</option>
                        <option value="viagem">Viagem</option>
                        <option value="evento">Evento</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data*</label>
                        <input
                          type="date"
                          value={formCompromisso.data}
                          onChange={(e) => setFormCompromisso(prev => ({ ...prev, data: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={modalData.modo === 'visualizar'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Início*</label>
                        <input
                          type="time"
                          value={formCompromisso.hora_inicio}
                          onChange={(e) => setFormCompromisso(prev => ({ ...prev, hora_inicio: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={modalData.modo === 'visualizar'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fim*</label>
                        <input
                          type="time"
                          value={formCompromisso.hora_fim}
                          onChange={(e) => setFormCompromisso(prev => ({ ...prev, hora_fim: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={modalData.modo === 'visualizar'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                      <input
                        type="text"
                        value={formCompromisso.local}
                        onChange={(e) => setFormCompromisso(prev => ({ ...prev, local: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <textarea
                        value={formCompromisso.descricao}
                        onChange={(e) => setFormCompromisso(prev => ({ ...prev, descricao: e.target.value }))}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formCompromisso.status}
                        onChange={(e) => setFormCompromisso(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      >
                        <option value="agendado">Agendado</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="realizado">Realizado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      <input
                        type="text"
                        value={formCompromisso.cliente}
                        onChange={(e) => setFormCompromisso(prev => ({ ...prev, cliente: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={modalData.modo === 'visualizar'}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {modalData.modo !== 'visualizar' && (
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={fecharModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {modalData.modo === 'criar' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de eventos do dia */}
      {diaSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Eventos do dia {diaSelecionado.toLocaleDateString('pt-BR')}
              </h3>
              <button onClick={() => setDiaSelecionado(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {eventosDoDia.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Nenhuma tarefa ou compromisso para este dia.
              </div>
            ) : (
              <div className="space-y-4">
                {eventosDoDia.map((evento) => (
                  <div key={evento.id} className="p-4 rounded-lg border bg-gray-50">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className={`w-3 h-3 rounded-full ${evento.tipo === 'tarefa' ? getPrioridadeColor(evento.prioridade) : 'bg-green-500'}`}></div>
                      <span className="font-semibold text-gray-900">{evento.titulo}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${evento.tipo === 'tarefa' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{evento.tipo === 'tarefa' ? 'Tarefa' : 'Compromisso'}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {evento.hora && <span>🕐 {evento.hora}</span>}
                    </div>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => { abrirModal(evento.tipo, 'visualizar', evento.item); setDiaSelecionado(null); }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                      >Ver detalhes</button>
                      <button
                        onClick={() => { abrirModal(evento.tipo, 'editar', evento.item); setDiaSelecionado(null); }}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs"
                      >Editar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}