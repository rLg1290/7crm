import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'warning' | 'info' | 'urgent'
  duration?: number
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

const ToastNotification: React.FC<ToastProps> = ({ 
  message, 
  type, 
  duration = 5000, 
  onClose,
  action 
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          classes: 'bg-green-50 border-green-200 text-green-800',
          iconClasses: 'text-green-600'
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          classes: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          iconClasses: 'text-yellow-600'
        }
      case 'urgent':
        return {
          icon: <Clock className="h-5 w-5" />,
          classes: 'bg-red-50 border-red-200 text-red-800',
          iconClasses: 'text-red-600'
        }
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          classes: 'bg-blue-50 border-blue-200 text-blue-800',
          iconClasses: 'text-blue-600'
        }
    }
  }

  if (!isVisible) return null

  const config = getToastConfig()

  return (
    <div className={`rounded-lg border p-4 shadow-lg ${config.classes} animate-in slide-in-from-top-5 duration-300`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${config.iconClasses}`}>
          {config.icon}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="flex items-center space-x-2">
          {action && (
            <button
              onClick={action.onClick}
              className="text-sm font-medium underline hover:no-underline"
            >
              {action.label}
            </button>
          )}
          <button
            onClick={() => {
              setIsVisible(false)
              onClose?.()
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Container para múltiplas notificações
interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

export default ToastNotification 