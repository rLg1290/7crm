import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  CreditCard, 
  Wallet, 
  Receipt, 
  AlertTriangle,
  Activity,
  BarChart3,
  Users,
  X,
  CheckCircle,
  Clock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { financeiroService } from '../services/financeiroService'
import type { ContasPagar, ContasReceber } from '../services/financeiroService'
import { CalendarioService } from '../services/calendarioService'
import NotificationCenter from '../components/NotificationCenter'
import { ToastContainer } from '../components/ToastNotification'
import logger from '../utils/logger'



interface Tarefa {
  id: string
  titulo: string
  descricao?: string
  prioridade: 'alta' | 'media' | 'baixa'
  data_vencimento: string
  hora_vencimento: string
  status: 'pendente' | 'concluida' | 'cancelada'
  categoria?: string
  cliente?: string
  empresa_id?: string
  usuario_id?: string
  created_at?: string
  data_conclusao?: string
}



const Dashboard = () => {
  const [horaAtual, setHoraAtual] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'success' | 'warning' | 'info' | 'urgent'
    action?: { label: string; onClick: () => void }
  }>>([])
  
  // Estados para dados financeiros reais
  const [contasReceber, setContasReceber] = useState<ContasReceber[]>([])
  const [contasPagar, setContasPagar] = useState<ContasPagar[]>([])
  const [clientesAtivos, setClientesAtivos] = useState(0)
  const [checkinsProximos, setCheckinsProximos] = useState<any[]>([])
  const [tarefaVisualizando, setTarefaVisualizando] = useState<Tarefa | null>(null)
  const [showModalTarefa, setShowModalTarefa] = useState(false)
  const [cotacoesEmitidas, setCotacoesEmitidas] = useState<any[]>([])
  const [vendasSemanais, setVendasSemanais] = useState<any[]>([])
  const [dadosFinanceiros, setDadosFinanceiros] = useState({
    faturamentoMes: 0,
    lucroMes: 0,
    contasPagar: 0,
    valoresReceber: 0,
    ticketMedio: 0,
    vendasHoje: 0,
    faturamentoMesAnterior: 0,
    lucroMesAnterior: 0
  })



  // Tarefas do dia (reais)
  const [tarefas, setTarefas] = useState<Tarefa[]>([])

  // Carregar cotações emitidas e calcular vendas
  const carregarCotacoesEmitidas = async (empresaId: string) => {
    try {
      const { data: cotacoes, error } = await supabase
        .from('cotacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'EMITIDO')
        .order('data_criacao', { ascending: false })

      if (error) {
        logger.error('Erro ao carregar cotações emitidas:', error)
        return
      }

      logger.debug('Cotações emitidas retornadas', {
        empresaId: empresaId,
        totalRetornadas: cotacoes?.length || 0
      })

      setCotacoesEmitidas(cotacoes || [])

      // Calcular vendas de hoje
      const hoje = new Date()
      const hojeStr = hoje.toISOString().split('T')[0]
      
      const cotacoesHoje = cotacoes?.filter(cotacao => {
        if (!cotacao.data_criacao) return false
        
        const dataCriacao = new Date(cotacao.data_criacao)
        
        // Converter para fuso horário local
        const dataCriacaoLocal = new Date(dataCriacao.getTime() - (dataCriacao.getTimezoneOffset() * 60000))
        const dataCriacaoLocalStr = dataCriacaoLocal.toISOString().split('T')[0]
        
        // Comparar apenas a data (sem hora) no fuso horário local
        return dataCriacaoLocalStr === hojeStr
      }) || []
      
      const vendasHoje = cotacoesHoje.reduce((total, cotacao) => total + (cotacao.valor || 0), 0)
      
      logger.debug('Resumo vendas de hoje', {
        dataHoje: hojeStr,
        totalCotacoes: cotacoes?.length || 0,
        cotacoesHoje: cotacoesHoje.length,
        vendasHoje
      })

      // Calcular vendas da semana
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - hoje.getDay())
      inicioSemana.setHours(0, 0, 0, 0)

      const vendasPorDia = []
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

      for (let i = 0; i < 7; i++) {
        const data = new Date(inicioSemana)
        data.setDate(inicioSemana.getDate() + i)
        const dataStr = data.toISOString().split('T')[0]

        const vendasDia = cotacoes?.filter(cotacao => {
          const dataCriacao = new Date(cotacao.data_criacao)
          // Converter para fuso horário local
          const dataCriacaoLocal = new Date(dataCriacao.getTime() - (dataCriacao.getTimezoneOffset() * 60000))
          const dataCriacaoLocalStr = dataCriacaoLocal.toISOString().split('T')[0]
          return dataCriacaoLocalStr === dataStr
        }).reduce((total, cotacao) => total + (cotacao.valor || 0), 0) || 0

        vendasPorDia.push({
          dia: diasSemana[i],
          valor: vendasDia
        })
      }

      setVendasSemanais(vendasPorDia)

      // Calcular ticket médio apenas com cotações emitidas
      const ticketMedio = cotacoes && cotacoes.length > 0 
        ? cotacoes.reduce((total, cotacao) => total + (cotacao.valor || 0), 0) / cotacoes.length 
        : 0
      
      logger.debug('Ticket médio calculado', {
        totalCotacoesEmitidas: cotacoes?.length || 0,
        valorTotal: cotacoes?.reduce((total, cotacao) => total + (cotacao.valor || 0), 0) || 0,
        ticketMedio: ticketMedio
      })

      // Atualizar dados financeiros
      setDadosFinanceiros(prev => {
        const novosDados = {
          ...prev,
          vendasHoje,
          ticketMedio
        }
        logger.debug('Dados financeiros atualizados', {
          vendasHoje: novosDados.vendasHoje,
          ticketMedio: novosDados.ticketMedio
        })
        return novosDados
      })

    } catch (error) {
      logger.error('Erro ao carregar cotações emitidas:', error)
    }
  }

  // Atualizar check-ins, notificações, tarefas e vendas a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.user_metadata?.empresa_id) {
        carregarCheckinsProximos(user.user_metadata.empresa_id)
        gerarNotificacoesReais(user.user_metadata.empresa_id)
        carregarTarefasDoDia(user.user_metadata.empresa_id)
        carregarCotacoesEmitidas(user.user_metadata.empresa_id)
      }
    }, 5 * 60 * 1000) // 5 minutos

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        setUser(userData.user)

        if (userData.user) {
          // Fetch contas a pagar
          const contasPagarData = await financeiroService.getContasPagar(userData.user.id)
          setContasPagar(contasPagarData)

          // Fetch contas a receber (need to get empresa_id first)
          const { data: userEmpresaRows } = await supabase
            .from('usuarios_empresas')
            .select('empresa_id')
            .eq('usuario_id', userData.user.id)
            .limit(1)
          
          let contasReceberData: ContasReceber[] = []
          const empresaId = Array.isArray(userEmpresaRows) && userEmpresaRows.length ? (userEmpresaRows[0] as any).empresa_id : null
          
          if (empresaId) {
            contasReceberData = await financeiroService.getContasReceber(empresaId)
            setContasReceber(contasReceberData)
            
            // Buscar clientes ativos da empresa
            const { data: clientesData, error: clientesError } = await supabase
              .from('clientes')
              .select('id')
              .eq('empresa_id', empresaId)
            
            if (!clientesError && clientesData) {
              setClientesAtivos(clientesData.length)
            }
            
            // Buscar tarefas de check-in próximas
            await carregarCheckinsProximos(empresaId)
            
            // Gerar notificações reais
            await gerarNotificacoesReais(empresaId)
            
            // Carregar tarefas do dia
            await carregarTarefasDoDia(empresaId)
            
            // Carregar cotações emitidas para vendas
            await carregarCotacoesEmitidas(empresaId)
          }

          // Calculate financial data
          const hoje = new Date()
          const mesAtual = hoje.getMonth() + 1
          const anoAtual = hoje.getFullYear()
          
          // Calculate previous month
          const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1
          const anoAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual
          
          // Filter contas for current month
          const contasReceberMes = contasReceberData.filter((conta: ContasReceber) => {
            const dataVencimento = new Date(conta.vencimento)
            return dataVencimento.getMonth() + 1 === mesAtual && 
                   dataVencimento.getFullYear() === anoAtual
          })

          const contasPagarMes = contasPagarData.filter((conta: ContasPagar) => {
            const dataVencimento = new Date(conta.vencimento)
            return dataVencimento.getMonth() + 1 === mesAtual && 
                   dataVencimento.getFullYear() === anoAtual
          })

          // Filter contas for previous month
          const contasReceberMesAnterior = contasReceberData.filter((conta: ContasReceber) => {
            const dataVencimento = new Date(conta.vencimento)
            return dataVencimento.getMonth() + 1 === mesAnterior && 
                   dataVencimento.getFullYear() === anoAnterior
          })

          const contasPagarMesAnterior = contasPagarData.filter((conta: ContasPagar) => {
            const dataVencimento = new Date(conta.vencimento)
            return dataVencimento.getMonth() + 1 === mesAnterior && 
                   dataVencimento.getFullYear() === anoAnterior
          })

          // Calculate totals
          const faturamentoMes = contasReceberMes.reduce((total: number, conta: ContasReceber) => total + (conta.valor || 0), 0)
          const despesasMes = contasPagarMes.reduce((total: number, conta: ContasPagar) => total + (conta.valor || 0), 0)
          const lucroMes = faturamentoMes - despesasMes
          
          const faturamentoMesAnterior = contasReceberMesAnterior.reduce((total: number, conta: ContasReceber) => total + (conta.valor || 0), 0)
          const despesasMesAnterior = contasPagarMesAnterior.reduce((total: number, conta: ContasPagar) => total + (conta.valor || 0), 0)
          const lucroMesAnterior = faturamentoMesAnterior - despesasMesAnterior
          
          const contasPagarTotal = contasPagarData.reduce((total: number, conta: ContasPagar) => total + (conta.valor || 0), 0)
          const valoresReceberTotal = contasReceberData.reduce((total: number, conta: ContasReceber) => total + (conta.valor || 0), 0)

          setDadosFinanceiros(prev => ({
            faturamentoMes,
            lucroMes,
            contasPagar: contasPagarTotal,
            valoresReceber: valoresReceberTotal,
            ticketMedio: prev.ticketMedio, // Preservar valor calculado por carregarCotacoesEmitidas
            vendasHoje: prev.vendasHoje, // Preservar valor calculado por carregarCotacoesEmitidas
            faturamentoMesAnterior,
            lucroMesAnterior
          }))
        }

      } catch (error) {
        logger.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  const gerarNotificacoesReais = async (empresaId: string) => {
    try {
      const notificacoes: Array<{
        id: string
        message: string
        type: 'success' | 'warning' | 'info' | 'urgent'
        action?: { label: string; onClick: () => void }
      }> = []

      // Buscar tarefas urgentes das próximas 4 horas
      const agora = new Date()
      const proximas4Horas = new Date(agora.getTime() + 4 * 60 * 60 * 1000)
      
      const { data: tarefasUrgentes, error: tarefasError } = await supabase
        .from('tarefas')
        .select(`
          id,
          titulo,
          descricao,
          data_vencimento,
          hora_vencimento,
          cliente,
          categoria,
          prioridade
        `)
        .eq('empresa_id', empresaId)
        .eq('status', 'pendente')
        .gte('data_vencimento', agora.toISOString().split('T')[0])
        .lte('data_vencimento', proximas4Horas.toISOString().split('T')[0])
        .order('data_vencimento', { ascending: true })
        .order('hora_vencimento', { ascending: true })

      if (!tarefasError && tarefasUrgentes) {
        tarefasUrgentes.forEach((tarefa, index) => {
          const dataVencimento = new Date(`${tarefa.data_vencimento}T${tarefa.hora_vencimento}`)
          const tempoRestante = dataVencimento.getTime() - agora.getTime()
          const horasRestantes = Math.floor(tempoRestante / (1000 * 60 * 60))
          const minutosRestantes = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60))

          // Determinar tipo de notificação baseado na categoria e urgência
          let tipo: 'urgent' | 'warning' | 'info' = 'info'
          if (horasRestantes < 2) {
            tipo = 'urgent'
          } else if (horasRestantes < 4) {
            tipo = 'warning'
          }

          // Criar mensagem baseada na categoria
          let mensagem = ''
          let acaoLabel = 'Ver Tarefa'
          
          if (tarefa.categoria === 'checkin') {
            const matchVoo = tarefa.titulo.match(/CHECK-IN\s+([A-Z0-9\s]+)/)
            const numeroVoo = matchVoo ? matchVoo[1].trim() : 'Voo'
            mensagem = `Check-in ${numeroVoo} para ${tarefa.cliente || 'cliente'} vence em ${horasRestantes}h ${minutosRestantes}min`
            acaoLabel = 'Fazer Check-in'
          } else {
            mensagem = `Tarefa ${tarefa.prioridade === 'alta' ? 'urgente' : ''}: ${tarefa.titulo} vence em ${horasRestantes}h ${minutosRestantes}min`
            acaoLabel = 'Ver Tarefa'
          }

          notificacoes.push({
            id: `tarefa-${tarefa.id}`,
            message: mensagem,
            type: tipo,
            action: {
              label: acaoLabel,
              onClick: () => {
                // Aqui você pode implementar a navegação para a tarefa específica
                logger.info('Navegar para tarefa', { tarefaId: tarefa.id })
                // Por exemplo: window.location.href = `/tarefas/${tarefa.id}`
              }
            }
          })
        })
      }

      // Buscar check-ins muito próximos (menos de 1 hora)
      const { data: checkinsMuitoProximos, error: checkinsError } = await supabase
        .from('tarefas')
        .select(`
          id,
          titulo,
          descricao,
          data_vencimento,
          hora_vencimento,
          cliente
        `)
        .eq('categoria', 'checkin')
        .eq('empresa_id', empresaId)
        .eq('status', 'pendente')
        .gte('data_vencimento', agora.toISOString().split('T')[0])
        .lte('data_vencimento', proximas4Horas.toISOString().split('T')[0])

      if (!checkinsError && checkinsMuitoProximos) {
        checkinsMuitoProximos.forEach((checkin) => {
          const dataVencimento = new Date(`${checkin.data_vencimento}T${checkin.hora_vencimento}`)
          const tempoRestante = dataVencimento.getTime() - agora.getTime()
          const horasRestantes = Math.floor(tempoRestante / (1000 * 60 * 60))
          const minutosRestantes = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60))

          // Só adicionar se for muito próximo (menos de 1 hora)
          if (horasRestantes < 1) {
            const matchVoo = checkin.titulo.match(/CHECK-IN\s+([A-Z0-9\s]+)/)
            const numeroVoo = matchVoo ? matchVoo[1].trim() : 'Voo'
            
            notificacoes.push({
              id: `checkin-${checkin.id}`,
              message: `Check-in ${numeroVoo} para ${checkin.cliente || 'cliente'} vence em ${minutosRestantes}min`,
              type: 'urgent',
              action: {
                label: 'Fazer Check-in',
                onClick: () => {
                  logger.info('Navegar para check-in', { checkinId: checkin.id })
                }
              }
            })
          }
        })
      }

      // Ordenar notificações por urgência
      notificacoes.sort((a, b) => {
        const prioridade: { [key: string]: number } = { urgent: 3, warning: 2, info: 1, success: 0 }
        return (prioridade[b.type] || 0) - (prioridade[a.type] || 0)
      })

      // Limitar a 5 notificações
      setToasts(notificacoes.slice(0, 5))

    } catch (error) {
      logger.error('Erro ao gerar notificações reais:', error)
    }
  }

  const carregarTarefasDoDia = async (empresaId: string) => {
    try {
      const hoje = new Date().toISOString().split('T')[0]
      
      const { data: tarefasData, error: tarefasError } = await supabase
        .from('tarefas')
        .select(`
          id,
          titulo,
          descricao,
          data_vencimento,
          hora_vencimento,
          status,
          prioridade,
          categoria,
          cliente,
          empresa_id,
          usuario_id,
          created_at,
          data_conclusao
        `)
        .eq('empresa_id', empresaId)
        .eq('data_vencimento', hoje)
        .in('status', ['pendente', 'concluida'])
        .order('hora_vencimento', { ascending: true })

      if (tarefasError) {
        logger.error('Erro ao buscar tarefas do dia:', tarefasError)
        return
      }

      if (tarefasData) {
        setTarefas(tarefasData)
        logger.info('Tarefas do dia carregadas', { count: tarefasData.length })
      }
    } catch (error) {
      logger.error('Erro ao carregar tarefas do dia:', error)
    }
  }

  const carregarCheckinsProximos = async (empresaId: string) => {
    try {
      // Buscar tarefas de check-in das próximas 24 horas
      const agora = new Date()
      const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000)
      // Evitar uso de toISOString (UTC) para não deslocar a data; usar data local
      const toLocalDateStr = (d: Date) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      const hojeStr = toLocalDateStr(agora)
      const amanhaStr = toLocalDateStr(amanha)
      
      const { data: tarefasCheckin, error: tarefasError } = await supabase
        .from('tarefas')
        .select(`
          id,
          titulo,
          descricao,
          data_vencimento,
          hora_vencimento,
          cliente,
          empresa_id,
          status
        `)
        .eq('categoria', 'checkin')
        .eq('empresa_id', empresaId)
        .gte('data_vencimento', hojeStr)
        .lte('data_vencimento', amanhaStr)
        .eq('status', 'pendente')
        .order('data_vencimento', { ascending: true })
        .order('hora_vencimento', { ascending: true })

      if (tarefasError) {
        logger.error('Erro ao buscar tarefas de check-in:', tarefasError)
        return
      }

      if (tarefasCheckin && tarefasCheckin.length > 0) {
        // Processar cada tarefa para extrair informações do voo
        const checkinsProcessados = tarefasCheckin.map(tarefa => {
          // Extrair número do voo do título (formato: "CHECK-IN LA 1265")
          const matchVoo = tarefa.titulo.match(/CHECK-IN\s+([A-Z0-9\s]+)/)
          const numeroVoo = matchVoo ? matchVoo[1].trim() : 'Voo'
          
          // Extrair origem e destino da descrição (formato: "Realizar check-in do voo LA 1265 (GRU → SSA)")
          const matchRota = tarefa.descricao.match(/\(([A-Z]+)\s*→\s*([A-Z]+)\)/)
          const origem = matchRota ? matchRota[1] : ''
          const destino = matchRota ? matchRota[2] : ''
          
          // Calcular tempo restante
          const dataVencimento = new Date(`${tarefa.data_vencimento}T${tarefa.hora_vencimento}`)
          const tempoRestante = dataVencimento.getTime() - agora.getTime()
          const horasRestantes = Math.floor(tempoRestante / (1000 * 60 * 60))
          const minutosRestantes = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60))
          
          // Determinar status baseado no tempo restante
          let status: 'urgente' | 'atencao' | 'normal' = 'normal'
          if (horasRestantes < 3) {
            status = 'urgente'
          } else if (horasRestantes < 6) {
            status = 'atencao'
          }
          
          return {
            id: tarefa.id,
            numero: numeroVoo,
            cliente: tarefa.cliente || 'Cliente não informado',
            origem,
            destino,
            dataVencimento: tarefa.data_vencimento,
            horaVencimento: tarefa.hora_vencimento,
            tempoRestante: `${horasRestantes}h ${minutosRestantes}min`,
            status,
            horasRestantes
          }
        })
        
        // Ordenar por urgência (urgente primeiro, depois por tempo restante)
        checkinsProcessados.sort((a, b) => {
          if (a.status === 'urgente' && b.status !== 'urgente') return -1
          if (b.status === 'urgente' && a.status !== 'urgente') return 1
          return a.horasRestantes - b.horasRestantes
        })
        
        setCheckinsProximos(checkinsProcessados)
      } else {
        setCheckinsProximos([])
      }
    } catch (error) {
      logger.error('Erro ao carregar check-ins próximos:', error)
    }
  }

  const calcularVariacaoPercentual = (valorAtual: number, valorAnterior: number): { texto: string; cor: string; icone: React.ReactNode } => {
    if (valorAnterior === 0) {
      return {
        texto: valorAtual > 0 ? '+100%' : '0%',
        cor: valorAtual > 0 ? 'text-green-600' : 'text-gray-600',
        icone: valorAtual > 0 ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />
      }
    }
    
    const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100
    const sinal = variacao >= 0 ? '+' : ''
    const texto = `${sinal}${variacao.toFixed(1)}%`
    const cor = variacao >= 0 ? 'text-green-600' : 'text-red-600'
    const icone = variacao >= 0 ? <TrendingUp className="h-4 w-4 inline mr-1" /> : <TrendingDown className="h-4 w-4 inline mr-1" />
    
    return { texto, cor, icone }
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

  const tarefasPendentes = tarefas.filter(t => t.status === 'pendente')
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida')
  const maxVenda = vendasSemanais.length > 0 ? Math.max(...vendasSemanais.map((v: any) => v.valor)) : 1

  const toggleTarefaStatus = async (tarefaId: string, novoStatus: 'pendente' | 'concluida') => {
    try {
      // Usar CalendarioService para garantir que data_conclusao seja salva corretamente
      await CalendarioService.atualizarTarefa(tarefaId, { status: novoStatus })

      // Atualizar estado local
      setTarefas(prev => prev.map(tarefa => 
        tarefa.id === tarefaId 
          ? { ...tarefa, status: novoStatus }
          : tarefa
      ))

      // Recarregar tarefas para garantir sincronização
      if (user?.user_metadata?.empresa_id) {
        await carregarTarefasDoDia(user.user_metadata.empresa_id)
      }

      // Log para debug
      if (novoStatus === 'concluida') {
        logger.info('✅ Tarefa marcada como concluída no dashboard:', tarefaId)
        logger.info('📅 Agora aparecerá na seção "Concluídos Recentemente" do calendário')
      } else {
        logger.info('🔄 Tarefa marcada como pendente no dashboard:', tarefaId)
      }
    } catch (error) {
      logger.error('Erro ao alternar status da tarefa:', error)
    }
  }

  const visualizarTarefa = (tarefa: Tarefa) => {
    setTarefaVisualizando(tarefa)
    setShowModalTarefa(true)
  }

  const fecharModalTarefa = () => {
    setTarefaVisualizando(null)
    setShowModalTarefa(false)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  if (loading) {
    return <div className="text-center py-8">Carregando dados...</div>
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
                <p className="text-sm font-medium text-gray-600">Receitas do Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatarMoeda(dadosFinanceiros.faturamentoMes)}
                </p>
                {(() => {
                  const variacao = calcularVariacaoPercentual(dadosFinanceiros.faturamentoMes, dadosFinanceiros.faturamentoMesAnterior)
                  return (
                    <p className={`text-sm mt-1 ${variacao.cor}`}>
                      {variacao.icone}
                      {variacao.texto} vs mês anterior
                    </p>
                  )
                })()}
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
                {(() => {
                  const variacao = calcularVariacaoPercentual(dadosFinanceiros.lucroMes, dadosFinanceiros.lucroMesAnterior)
                  return (
                    <p className={`text-sm mt-1 ${variacao.cor}`}>
                      {variacao.icone}
                      {variacao.texto} vs mês anterior
                    </p>
                  )
                })()}
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
                  {contasPagar.filter(conta => conta.status === 'vencida').length} vencidas
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
                  {contasReceber.filter(conta => conta.status === 'pendente' || conta.status === 'vencida').length} faturas em aberto
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
                <p className="text-2xl font-bold text-gray-900">
                  {clientesAtivos === 0 ? '0' : clientesAtivos.toLocaleString('pt-BR')}
                </p>
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
              {vendasSemanais.map((item: any, index: number) => (
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
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="space-y-3">
              {checkinsProximos.length > 0 ? (
                checkinsProximos.map((checkin, index) => (
                  <div key={checkin.id} className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{checkin.numero}</div>
                        <div className="text-sm text-gray-600">{checkin.cliente}</div>
                        <div className="text-sm text-gray-500">
                          {checkin.origem && checkin.destino ? `${checkin.origem} → ${checkin.destino}` : 'Rota não informada'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusVooColor(checkin.status)}`}>
                          {checkin.tempoRestante}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhum check-in próximo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tarefas do Dia */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-indigo-600" />
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
            {tarefas.length > 0 ? (
              tarefas.map((tarefa) => (
                <div 
                  key={tarefa.id} 
                  className={`p-4 rounded-lg border transition-all ${
                    tarefa.status === 'concluida' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${
                          tarefa.status === 'concluida' 
                            ? 'bg-green-600 border-green-600' 
                            : 'border-gray-300'
                        }`}
                        onClick={() => toggleTarefaStatus(tarefa.id, tarefa.status === 'concluida' ? 'pendente' : 'concluida')}
                      >
                        {tarefa.status === 'concluida' && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          tarefa.status === 'concluida' ? 'text-gray-500 line-through' : 'text-gray-900'
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
                        {tarefa.hora_vencimento}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          visualizarTarefa(tarefa)
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Visualizar detalhes"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhuma tarefa para hoje</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Visualização da Tarefa */}
      {showModalTarefa && tarefaVisualizando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes da Tarefa</h3>
                <button
                  onClick={fecharModalTarefa}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <p className="text-gray-900 font-medium">{tarefaVisualizando.titulo}</p>
                </div>

                {/* Descrição */}
                {tarefaVisualizando.descricao && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <p className="text-gray-600 text-sm">{tarefaVisualizando.descricao}</p>
                  </div>
                )}

                {/* Cliente */}
                {tarefaVisualizando.cliente && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <p className="text-gray-600">{tarefaVisualizando.cliente}</p>
                  </div>
                )}

                {/* Categoria */}
                {tarefaVisualizando.categoria && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {tarefaVisualizando.categoria}
                    </span>
                  </div>
                )}

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPrioridadeColor(tarefaVisualizando.prioridade)}`}>
                    {tarefaVisualizando.prioridade}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    tarefaVisualizando.status === 'concluida' 
                      ? 'bg-green-100 text-green-800' 
                      : tarefaVisualizando.status === 'cancelada'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {tarefaVisualizando.status === 'concluida' ? 'Concluída' : 
                     tarefaVisualizando.status === 'cancelada' ? 'Cancelada' : 'Pendente'}
                  </span>
                </div>

                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento</label>
                    <p className="text-gray-600">{formatarData(new Date(tarefaVisualizando.data_vencimento))}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Vencimento</label>
                    <p className="text-gray-600">{tarefaVisualizando.hora_vencimento}</p>
                  </div>
                </div>

                {/* Data de Criação */}
                {tarefaVisualizando.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Criada em</label>
                    <p className="text-gray-600 text-sm">{formatarData(new Date(tarefaVisualizando.created_at))}</p>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={fecharModalTarefa}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    toggleTarefaStatus(tarefaVisualizando.id, tarefaVisualizando.status === 'concluida' ? 'pendente' : 'concluida')
                    fecharModalTarefa()
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    tarefaVisualizando.status === 'concluida'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {tarefaVisualizando.status === 'concluida' ? 'Marcar como Pendente' : 'Marcar como Concluída'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default Dashboard