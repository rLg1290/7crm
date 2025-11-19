import { useState, useEffect, useCallback } from 'react'
import { NotificationService, Notificacao } from '../services/notificationService'
import { logger } from '../utils/logger'

interface UseNotificationsReturn {
  notificacoes: Notificacao[]
  loading: boolean
  error: string | null
  naoLidas: number
  estatisticas: ReturnType<typeof NotificationService.obterEstatisticas>
  refresh: () => Promise<void>
  marcarComoLida: (id: string) => void
  marcarTodasComoLidas: () => void
  remover: (id: string) => void
}

export const useNotifications = (autoRefreshInterval = 2 * 60 * 1000): UseNotificationsReturn => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 🔄 FUNÇÃO PARA CARREGAR NOTIFICAÇÕES
  const carregarNotificacoes = useCallback(async (forcarRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      let notificacoesCarregadas: Notificacao[] = []
      
      if (forcarRefresh) {
        // Forçar busca no banco de dados
        logger.debug('🔄 Forçando refresh das notificações...')
        notificacoesCarregadas = await NotificationService.atualizarNotificacoes()
      } else {
        // Tentar carregar do cache primeiro
        notificacoesCarregadas = NotificationService.carregarNotificacoes()
        
        // Se não houver cache, buscar do banco
        if (notificacoesCarregadas.length === 0) {
          logger.debug('📱 Cache vazio, buscando notificações do banco...')
          notificacoesCarregadas = await NotificationService.gerarNotificacoes()
          NotificationService.salvarNotificacoes(notificacoesCarregadas)
        } else {
          logger.debug('📱 Carregando notificações do cache...')
        }
      }
      
      setNotificacoes(notificacoesCarregadas)
      
    } catch (error) {
      logger.error('❌ Erro ao carregar notificações:', error)
      setError('Erro ao carregar notificações')
      setNotificacoes([])
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔄 CARREGAR INICIALMENTE
  useEffect(() => {
    carregarNotificacoes()
  }, [carregarNotificacoes])

  // 🔄 AUTO-REFRESH
  useEffect(() => {
    if (!autoRefreshInterval) return

    const interval = setInterval(() => {
      logger.debug('🔄 Auto-refresh das notificações...')
      carregarNotificacoes()
    }, autoRefreshInterval)

    return () => clearInterval(interval)
  }, [autoRefreshInterval, carregarNotificacoes])

  // 🎯 FUNÇÕES DE MANIPULAÇÃO
  const marcarComoLida = useCallback((id: string) => {
    logger.debug('✅ Marcando notificação como lida', { id })
    const notificacoesAtualizadas = NotificationService.marcarComoLida(id)
    setNotificacoes(notificacoesAtualizadas)
  }, [])

  const marcarTodasComoLidas = useCallback(() => {
    logger.debug('✅ Marcando todas as notificações como lidas')
    const notificacoesAtualizadas = NotificationService.marcarTodasComoLidas()
    setNotificacoes(notificacoesAtualizadas)
  }, [])

  const remover = useCallback((id: string) => {
    logger.debug('🗑️ Removendo notificação', { id })
    const notificacoesAtualizadas = NotificationService.removerNotificacao(id)
    setNotificacoes(notificacoesAtualizadas)
  }, [])

  const refresh = useCallback(async () => {
    await carregarNotificacoes(true)
  }, [carregarNotificacoes])

  // 📊 CALCULAR ESTATÍSTICAS
  const naoLidas = notificacoes.filter(n => !n.lida).length
  const estatisticas = NotificationService.obterEstatisticas(notificacoes)

  return {
    notificacoes,
    loading,
    error,
    naoLidas,
    estatisticas,
    refresh,
    marcarComoLida,
    marcarTodasComoLidas,
    remover
  }
}