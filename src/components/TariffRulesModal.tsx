import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Info, Check, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface TariffRulesModalProps {
  isOpen: boolean
  onClose: () => void
  cia: string
  tipoTarifa: string
}

interface RegraTarifa {
  bagagem_mao: string
  bagagem_despachada: string
  marcacao_assento: string
  alteracao: string
  cancelamento: string
  no_show: string
}

const TariffRulesModal: React.FC<TariffRulesModalProps> = ({
  isOpen,
  onClose,
  cia,
  tipoTarifa
}) => {
  const [loading, setLoading] = useState(true)
  const [regras, setRegras] = useState<RegraTarifa | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (cia && tipoTarifa) {
        fetchRules()
      } else {
        setLoading(false)
        setError('Informações da tarifa incompletas.')
      }
    }
  }, [isOpen, cia, tipoTarifa])

  const fetchRules = async () => {
    setLoading(true)
    setError(null)
    try {
      // Simplificar a busca: usar apenas o nome principal da Cia
      const ciaPrincipal = cia.split(' ')[0].trim();
      
      const { data, error } = await supabase
        .from('regras_tarifas')
        .select('regras')
        .ilike('cia', `%${ciaPrincipal}%`)
        .ilike('tipo_tarifa', `%${tipoTarifa}%`)
        .maybeSingle() // Use maybeSingle to avoid error if no rows found

      if (error) throw error
      
      if (data && data.regras) {
        setRegras(data.regras as RegraTarifa)
      } else {
        setRegras(null)
        setError(`Regras não cadastradas para ${ciaPrincipal} - ${tipoTarifa}`)
      }
    } catch (err) {
      console.error('Erro ao buscar regras:', err)
      setError('Não foi possível carregar as regras da tarifa.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Regras da Tarifa
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-gray-700 bg-gray-200 px-2 py-0.5 rounded">{cia}</span>
                <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded uppercase">{tipoTarifa}</span>
            </div>
        </div>

        <div className="p-6">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-500" />
                    <p className="text-sm">Carregando regras...</p>
                </div>
            ) : error ? (
                <div className="text-center py-8">
                    <AlertCircle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button onClick={onClose} className="text-blue-600 hover:underline text-sm">Fechar</button>
                </div>
            ) : regras ? (
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 20h0a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h0"/><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14"/></svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Bagagem de Mão</p>
                            <p className="text-sm text-gray-900 font-medium">{regras.bagagem_mao}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><circle cx="12" cy="12" r="2"/></svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Bagagem Despachada</p>
                            <p className="text-sm text-gray-900 font-medium">{regras.bagagem_despachada}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Marcação de Assento</p>
                            <p className="text-sm text-gray-900 font-medium">{regras.marcacao_assento}</p>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 my-2"></div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Alteração</p>
                            <p className="text-sm text-gray-900 font-medium">{regras.alteracao}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Cancelamento / Reembolso</p>
                            <p className="text-sm text-gray-900 font-medium">{regras.cancelamento}</p>
                        </div>
                    </div>
                    
                     <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-600 mt-0.5">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">No Show</p>
                            <p className="text-sm text-gray-900 font-medium">{regras.no_show}</p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-center">
            <button 
                onClick={onClose}
                className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
                Entendi
            </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default TariffRulesModal