import { CalendarioService } from './calendarioService'

export interface Notificacao {
  id: string
  tipo: 'tarefa_urgente' | 'compromisso_proximo' | 'tarefa_vencida' | 'reuniao_hoje' | 'compromisso_hoje' | 'tarefa_hoje'
  titulo: string
  descricao: string
  tempo: string
  lida: boolean
  prioridade: 'alta' | 'media' | 'baixa'
  data_criacao: string
  acao?: {
    texto: string
    link: string
  }
  item_id?: string
  item_tipo?: 'tarefa' | 'compromisso'
}

export class NotificationService {
  // 🔍 GERAR NOTIFICAÇÕES EM TEMPO REAL
  static async gerarNotificacoes(): Promise<Notificacao[]> {
    try {
      console.log('🔔 Gerando notificações em tempo real...')
      
      const [tarefas, compromissos] = await Promise.all([
        CalendarioService.listarTarefas(),
        CalendarioService.listarCompromissos()
      ])

      const notificacoes: Notificacao[] = []
      const agora = new Date()
      const hoje = agora.toISOString().split('T')[0]

      // 🔥 TAREFAS VENCIDAS (Alta prioridade)
      const tarefasVencidas = tarefas.filter(t => {
        const vencimento = new Date(t.data_vencimento + 'T00:00:00')
        return t.status !== 'concluida' && vencimento < agora && vencimento.toISOString().split('T')[0] !== hoje
      })

      tarefasVencidas.forEach(tarefa => {
        const diasAtraso = Math.floor((agora.getTime() - new Date(tarefa.data_vencimento + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
        
        notificacoes.push({
          id: `tarefa-vencida-${tarefa.id}`,
          tipo: 'tarefa_vencida',
          titulo: 'Tarefa Vencida',
          descricao: `${tarefa.titulo} - ${diasAtraso} dia(s) em atraso`,
          tempo: `${diasAtraso}d`,
          lida: false,
          prioridade: 'alta',
          data_criacao: agora.toISOString(),
          acao: {
            texto: 'Ver Tarefa',
            link: '/calendario'
          },
          item_id: tarefa.id,
          item_tipo: 'tarefa'
        })
      })

      // ⚡ TAREFAS URGENTES VENCENDO HOJE
      const tarefasHoje = tarefas.filter(t => {
        return t.status !== 'concluida' && 
               t.data_vencimento === hoje && 
               t.prioridade === 'alta'
      })

      tarefasHoje.forEach(tarefa => {
        const horaVencimento = tarefa.hora_vencimento ? new Date(`${hoje}T${tarefa.hora_vencimento}`) : null
        let tempoRestante = ''
        
        if (horaVencimento) {
          const diffMs = horaVencimento.getTime() - agora.getTime()
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
          
          if (diffHours > 0) {
            tempoRestante = `${diffHours}h`
          } else if (diffMinutes > 0) {
            tempoRestante = `${diffMinutes}min`
          } else {
            tempoRestante = 'agora'
          }
        } else {
          tempoRestante = 'hoje'
        }

        notificacoes.push({
          id: `tarefa-urgente-${tarefa.id}`,
          tipo: 'tarefa_urgente',
          titulo: 'Tarefa Urgente Hoje',
          descricao: `${tarefa.titulo} - Alta prioridade`,
          tempo: tempoRestante,
          lida: false,
          prioridade: 'alta',
          data_criacao: agora.toISOString(),
          acao: {
            texto: 'Ver Tarefa',
            link: '/calendario'
          },
          item_id: tarefa.id,
          item_tipo: 'tarefa'
        })
      })

      // 📅 COMPROMISSOS PRÓXIMOS (próximas 2 horas)
      const compromissosProximos = compromissos.filter(c => {
        if (c.status === 'realizado' || c.data !== hoje) return false
        
        const inicioCompromisso = new Date(`${c.data}T${c.hora_inicio}`)
        const diffMs = inicioCompromisso.getTime() - agora.getTime()
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        
        return diffMinutes > 0 && diffMinutes <= 120 // Próximas 2 horas
      })

      compromissosProximos.forEach(compromisso => {
        const inicioCompromisso = new Date(`${compromisso.data}T${compromisso.hora_inicio}`)
        const diffMs = inicioCompromisso.getTime() - agora.getTime()
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        
        let tempoRestante = ''
        if (diffMinutes >= 60) {
          const horas = Math.floor(diffMinutes / 60)
          tempoRestante = `${horas}h`
        } else {
          tempoRestante = `${diffMinutes}min`
        }

        notificacoes.push({
          id: `compromisso-proximo-${compromisso.id}`,
          tipo: 'compromisso_proximo',
          titulo: 'Compromisso Próximo',
          descricao: `${compromisso.titulo} às ${compromisso.hora_inicio}`,
          tempo: tempoRestante,
          lida: false,
          prioridade: diffMinutes <= 30 ? 'alta' : 'media',
          data_criacao: agora.toISOString(),
          acao: {
            texto: 'Ver Compromisso',
            link: '/calendario'
          },
          item_id: compromisso.id,
          item_tipo: 'compromisso'
        })
      })

      // 📋 COMPROMISSOS HOJE (não próximos, mas do dia)
      const compromissosHoje = compromissos.filter(c => {
        if (c.status === 'realizado' || c.data !== hoje) return false
        
        const inicioCompromisso = new Date(`${c.data}T${c.hora_inicio}`)
        const diffMs = inicioCompromisso.getTime() - agora.getTime()
        const diffMinutes = Math.floor(diffMs / (1000 * 60))
        
        return diffMinutes > 120 // Mais de 2 horas (não próximos)
      })

      compromissosHoje.forEach(compromisso => {
        notificacoes.push({
          id: `compromisso-hoje-${compromisso.id}`,
          tipo: 'compromisso_hoje',
          titulo: 'Compromisso Hoje',
          descricao: `${compromisso.titulo} às ${compromisso.hora_inicio}`,
          tempo: compromisso.hora_inicio,
          lida: false,
          prioridade: 'baixa',
          data_criacao: agora.toISOString(),
          acao: {
            texto: 'Ver Agenda',
            link: '/calendario'
          },
          item_id: compromisso.id,
          item_tipo: 'compromisso'
        })
      })

      // 🎯 TAREFAS DO DIA (não urgentes)
      const tarefasNormaisHoje = tarefas.filter(t => {
        return t.status !== 'concluida' && 
               t.data_vencimento === hoje && 
               t.prioridade !== 'alta'
      })

      tarefasNormaisHoje.forEach(tarefa => {
        notificacoes.push({
          id: `tarefa-hoje-${tarefa.id}`,
          tipo: 'tarefa_hoje',
          titulo: 'Tarefa para Hoje',
          descricao: `${tarefa.titulo} - ${tarefa.prioridade} prioridade`,
          tempo: tarefa.hora_vencimento || 'hoje',
          lida: false,
          prioridade: tarefa.prioridade as 'alta' | 'media' | 'baixa',
          data_criacao: agora.toISOString(),
          acao: {
            texto: 'Ver Tarefa',
            link: '/calendario'
          },
          item_id: tarefa.id,
          item_tipo: 'tarefa'
        })
      })

      // 📊 ORDENAR POR PRIORIDADE E TEMPO
      notificacoes.sort((a, b) => {
        // Primeiro por prioridade
        const prioridadeOrder = { 'alta': 3, 'media': 2, 'baixa': 1 }
        const prioridadeDiff = prioridadeOrder[b.prioridade] - prioridadeOrder[a.prioridade]
        if (prioridadeDiff !== 0) return prioridadeDiff
        
        // Depois por tipo (urgência)
        const tipoOrder = {
          'tarefa_vencida': 6,
          'tarefa_urgente': 5,
          'compromisso_proximo': 4,
          'reuniao_hoje': 3,
          'compromisso_hoje': 2,
          'tarefa_hoje': 1
        }
        return tipoOrder[b.tipo] - tipoOrder[a.tipo]
      })

      console.log(`🔔 ${notificacoes.length} notificações geradas`)
      console.log('📊 Breakdown:', {
        vencidas: tarefasVencidas.length,
        urgentes: tarefasHoje.length,
        proximosCompromissos: compromissosProximos.length,
        compromissosHoje: compromissosHoje.length,
        tarefasHoje: tarefasNormaisHoje.length
      })

      return notificacoes

    } catch (error) {
      console.error('❌ Erro ao gerar notificações:', error)
      return []
    }
  }

  // 💾 SALVAR NOTIFICAÇÕES NO STORAGE LOCAL
  static salvarNotificacoes(notificacoes: Notificacao[]) {
    try {
      localStorage.setItem('crm_notifications', JSON.stringify(notificacoes))
      localStorage.setItem('crm_notifications_timestamp', Date.now().toString())
    } catch (error) {
      console.error('❌ Erro ao salvar notificações:', error)
    }
  }

  // 📖 CARREGAR NOTIFICAÇÕES DO STORAGE LOCAL
  static carregarNotificacoes(): Notificacao[] {
    try {
      const stored = localStorage.getItem('crm_notifications')
      const timestamp = localStorage.getItem('crm_notifications_timestamp')
      
      if (!stored || !timestamp) return []
      
      // Verificar se as notificações são recentes (últimos 5 minutos)
      const agora = Date.now()
      const timestampSalvo = parseInt(timestamp)
      const cincoMinutos = 5 * 60 * 1000
      
      if (agora - timestampSalvo > cincoMinutos) {
        console.log('🔄 Notificações expiradas, buscando novas...')
        return []
      }
      
      return JSON.parse(stored)
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error)
      return []
    }
  }

  // ✅ MARCAR NOTIFICAÇÃO COMO LIDA
  static marcarComoLida(notificacaoId: string) {
    try {
      const notificacoes = this.carregarNotificacoes()
      const notificacoesAtualizadas = notificacoes.map(n => 
        n.id === notificacaoId ? { ...n, lida: true } : n
      )
      this.salvarNotificacoes(notificacoesAtualizadas)
      return notificacoesAtualizadas
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error)
      return []
    }
  }

  // ✅ MARCAR TODAS COMO LIDAS
  static marcarTodasComoLidas() {
    try {
      const notificacoes = this.carregarNotificacoes()
      const notificacoesAtualizadas = notificacoes.map(n => ({ ...n, lida: true }))
      this.salvarNotificacoes(notificacoesAtualizadas)
      return notificacoesAtualizadas
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error)
      return []
    }
  }

  // 🗑️ REMOVER NOTIFICAÇÃO
  static removerNotificacao(notificacaoId: string) {
    try {
      const notificacoes = this.carregarNotificacoes()
      const notificacoesAtualizadas = notificacoes.filter(n => n.id !== notificacaoId)
      this.salvarNotificacoes(notificacoesAtualizadas)
      return notificacoesAtualizadas
    } catch (error) {
      console.error('❌ Erro ao remover notificação:', error)
      return []
    }
  }

  // 🔄 ATUALIZAR NOTIFICAÇÕES (FORÇA REFRESH)
  static async atualizarNotificacoes(): Promise<Notificacao[]> {
    console.log('🔄 Forçando atualização de notificações...')
    const novasNotificacoes = await this.gerarNotificacoes()
    this.salvarNotificacoes(novasNotificacoes)
    return novasNotificacoes
  }

  // 📊 OBTER ESTATÍSTICAS DE NOTIFICAÇÕES
  static obterEstatisticas(notificacoes: Notificacao[]) {
    return {
      total: notificacoes.length,
      naoLidas: notificacoes.filter(n => !n.lida).length,
      porTipo: {
        vencidas: notificacoes.filter(n => n.tipo === 'tarefa_vencida').length,
        urgentes: notificacoes.filter(n => n.tipo === 'tarefa_urgente').length,
        proximasReunions: notificacoes.filter(n => n.tipo === 'compromisso_proximo').length,
        hoje: notificacoes.filter(n => ['compromisso_hoje', 'tarefa_hoje'].includes(n.tipo)).length
      },
      porPrioridade: {
        alta: notificacoes.filter(n => n.prioridade === 'alta').length,
        media: notificacoes.filter(n => n.prioridade === 'media').length,
        baixa: notificacoes.filter(n => n.prioridade === 'baixa').length
      }
    }
  }
} 