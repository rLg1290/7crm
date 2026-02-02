import React from 'react'
import { createPortal } from 'react-dom'
import { X, Plane, Check, Calendar, Clock, MapPin, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FlightConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  ida: any | null
  volta: any | null
  getLogo: (cia: string) => string | null
}

const FlightConfirmationModal: React.FC<FlightConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ida,
  volta,
  getLogo
}) => {
  if (!isOpen) return null

  const total = (ida?.total || 0) + (volta?.total || 0)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl m-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-teal-600" />
              Confirmar Seleção
            </h2>
            <p className="text-sm text-gray-500">Verifique os voos selecionados antes de adicionar à cotação</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Ida */}
          {ida && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-blue-50 px-4 py-2 flex items-center justify-between border-b border-blue-100">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <Plane className="h-3 w-3" />
                  Voo de Ida
                </span>
                <span className="text-sm font-semibold text-blue-900">
                  R$ {ida.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center p-2 border border-gray-100">
                    {getLogo(ida.cia) ? (
                      <img src={getLogo(ida.cia)!} alt={ida.cia} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">{ida.cia.substring(0, 2)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{ida.cia}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Voo {ida.numero}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Data</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {format(new Date(ida.partida), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Horário</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {format(new Date(ida.partida), 'HH:mm')} - {format(new Date(ida.chegada), 'HH:mm')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Rota</span>
                        </div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {ida.origem} <span className="text-gray-400">→</span> {ida.destino}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Volta */}
          {volta && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-orange-50 px-4 py-2 flex items-center justify-between border-b border-orange-100">
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1">
                  <Plane className="h-3 w-3 transform rotate-180" />
                  Voo de Volta
                </span>
                <span className="text-sm font-semibold text-orange-900">
                  R$ {volta.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center p-2 border border-gray-100">
                    {getLogo(volta.cia) ? (
                      <img src={getLogo(volta.cia)!} alt={volta.cia} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">{volta.cia.substring(0, 2)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{volta.cia}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Voo {volta.numero}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Data</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {format(new Date(volta.partida), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Horário</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {format(new Date(volta.partida), 'HH:mm')} - {format(new Date(volta.chegada), 'HH:mm')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Rota</span>
                        </div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {volta.origem} <span className="text-gray-400">→</span> {volta.destino}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-semibold">Valor Total</span>
                <span className="text-2xl font-bold text-teal-700">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={onConfirm}
                    className="px-6 py-2 rounded-lg bg-teal-600 text-white font-bold shadow-md hover:bg-teal-700 hover:shadow-lg transition-all flex items-center gap-2"
                >
                    <Check className="h-5 w-5" />
                    Adicionar à Cotação
                </button>
            </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default FlightConfirmationModal
