import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  X, 
  Clock, 
  AlertTriangle, 
  Calendar as CalendarIcon,
  CheckCircle,
  User,
  Plane,
  Hotel,
  ChevronRight,
  RefreshCw,
  Eye
} from 'lucide-react'
import { Notificacao } from '../services/notificationService'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  
  // 🔔 USAR HOOK PERSONALIZADO
  const {
    notificacoes,
    loading,
    error,
    naoLidas,
    estatisticas,
    refresh,
    marcarComoLida,
    marcarTodasComoLidas,
    remover
  } = useNotifications()

  const getIconeNotificacao = (tipo: string) => {
    switch (tipo) {
      case 'tarefa_urgente':
      case 'tarefa_vencida':
        return <AlertTriangle className="h-4 w-4" />
      case 'compromisso_proximo':
      case 'reuniao_hoje':
      case 'compromisso_hoje':
        return <CalendarIcon className="h-4 w-4" />
      case 'tarefa_hoje':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getCorNotificacao = (tipo: string, prioridade: string) => {
    if (prioridade === 'alta') {
      return 'text-red-600 bg-red-100'
    }
    
    switch (tipo) {
      case 'tarefa_urgente':
      case 'tarefa_vencida':
        return 'text-red-600 bg-red-100'
      case 'compromisso_proximo':
        return 'text-orange-600 bg-orange-100'
      case 'reuniao_hoje':
      case 'compromisso_hoje':
        return 'text-blue-600 bg-blue-100'
      case 'tarefa_hoje':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const navegarParaItem = (notificacao: Notificacao) => {
    // Marcar como lida
    marcarComoLida(notificacao.id)
    
    // Fechar painel
    setIsOpen(false)
    
    // Navegar para a página
    if (notificacao.acao?.link) {
      navigate(notificacao.acao.link)
    }
  }

  const formatarTempo = (tempo: string) => {
    if (tempo === 'agora') return '⚡ Agora'
    if (tempo === 'hoje') return '📅 Hoje'
    if (tempo.includes('d')) return `⏰ ${tempo} atrás`
    if (tempo.includes('h') || tempo.includes('min')) return `⏱️ Em ${tempo}`
    if (tempo.match(/^\d{2}:\d{2}$/)) return `🕐 ${tempo}`
    return tempo
  }

  return (
    <div className="relative">
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">🔔 Notificações</h3>
                  <p className="text-sm text-gray-600">
                    {naoLidas} não lida{naoLidas !== 1 ? 's' : ''} • {notificacoes.length} total
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={refresh}
                    disabled={loading}
                    className="p-1 text-blue-600 hover:text-blue-700 rounded disabled:opacity-50"
                    title="Atualizar"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  
                  {naoLidas > 0 && (
                    <button
                      onClick={marcarTodasComoLidas}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Marcar todas
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 text-gray-300 animate-spin" />
                  <p className="font-medium">Carregando notificações...</p>
                  <p className="text-xs mt-1">Conectando ao banco de dados...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
                  <p className="font-medium">Erro ao carregar</p>
                  <p className="text-xs mt-1">{error}</p>
                  <button
                    onClick={refresh}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Nenhuma notificação</p>
                  <p className="text-sm">Você está em dia! 🎉</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificacoes.map((notificacao) => (
                    <div
                      key={notificacao.id}
                      className={`group p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notificacao.lida ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                      }`}
                      onClick={() => navegarParaItem(notificacao)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${getCorNotificacao(notificacao.tipo, notificacao.prioridade)}`}>
                          {getIconeNotificacao(notificacao.tipo)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-medium ${
                              !notificacao.lida ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notificacao.titulo}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatarTempo(notificacao.tempo)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  remover(notificacao.id)
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remover"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notificacao.descricao}
                          </p>

                          <div className="flex items-center justify-between">
                            {notificacao.acao && (
                              <div className="flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium">
                                <Eye className="h-3 w-3 mr-1" />
                                {notificacao.acao.texto}
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </div>
                            )}
                            
                            {!notificacao.lida && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  marcarComoLida(notificacao.id)
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 ml-auto"
                              >
                                ✓ Marcar como lida
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notificacoes.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>🔄 Atualização automática a cada 2min</span>
                  <span>
                    📊 {estatisticas.porPrioridade.alta} urgentes • {estatisticas.porTipo.vencidas} vencidas
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationCenter 