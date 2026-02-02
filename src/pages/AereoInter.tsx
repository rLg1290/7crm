import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plane, Search, Minus, Plus, Calendar as CalendarIcon, MapPin, Users, Luggage, Ban, ChevronLeft, ChevronRight, Check, ChevronDown, Info } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Flight } from '../types/flight'
import { useNavigate } from 'react-router-dom'
import { useSearchCache } from '../hooks/useSearchCache'
import SearchTimer from '../components/SearchTimer'
import { useCotacao } from '../contexts/CotacaoContext'
import { getAirlineLogoUrl } from '../utils/airlineLogos'
import FlightConfirmationModal from '../components/FlightConfirmationModal'
import TariffRulesModal from '../components/TariffRulesModal'
import { Calendar } from '../components/ui/calendar'
import { ptBR } from 'date-fns/locale'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '../lib/utils'

interface BuscaPassagem {
  origem: string
  destino: string
  dataIda: string
  dataVolta: string
  somenteIda: boolean
  adultos: number
  criancas: number
  bebes: number
  classe: string
}

const PriceTooltip = ({ breakdown, total }: { breakdown: any, total: number }) => {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const newStyle: React.CSSProperties = {}
      
      // Vertical Positioning
      // Check space above (prefer above if it fits, or if more space than below)
      // We assume tooltip height approx 300px
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom
      
      if (spaceAbove > 320 || spaceAbove > spaceBelow) {
        // Place above
        newStyle.bottom = window.innerHeight - rect.top + 10
        newStyle.top = 'auto'
      } else {
        // Place below
        newStyle.top = rect.bottom + 10
        newStyle.bottom = 'auto'
      }

      // Horizontal Positioning
      // Default: Align right edges (tooltip grows left) because button is usually on the right
      const spaceLeft = rect.right
      if (spaceLeft > 300) {
         newStyle.right = window.innerWidth - rect.right
         newStyle.left = 'auto'
      } else {
         newStyle.left = rect.left
         newStyle.right = 'auto'
      }

      setStyle(newStyle)
    }
    setOpen(true)
  }

  if (!breakdown) return null

  return (
    <>
      <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={() => setOpen(false)}>
        <button ref={buttonRef} className="text-teal-600 hover:text-teal-800 p-1 rounded-full hover:bg-teal-100 transition-colors cursor-help">
          <Search className="h-4 w-4 transform rotate-90" />
        </button>
      </div>
      
      {open && createPortal(
        <div 
          className="fixed w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] text-sm pointer-events-none"
          style={style}
        >
          <div className="p-4 space-y-2 text-gray-700">
            <div className="font-semibold border-b pb-2 mb-2 text-gray-900">Detalhamento do Preço</div>
            
            <div className="flex justify-between">
              <span>Adultos ({breakdown.numAdultos}):</span>
              <span>R$ {breakdown.adultoUnit.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            {breakdown.numCriancas > 0 && (
              <div className="flex justify-between">
                <span>Crianças ({breakdown.numCriancas}):</span>
                <span>R$ {breakdown.criancaUnit.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
            
            {breakdown.numBebes > 0 && (
              <div className="flex justify-between">
                <span>Bebês ({breakdown.numBebes}):</span>
                <span>R$ {breakdown.bebeUnit.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            )}
            
            <div className="flex justify-between text-gray-600">
              <span>Taxa de Embarque (por pax):</span>
              <span>R$ {breakdown.taxaUnit.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            <div className="border-t my-2 border-dashed border-gray-300"></div>
            
            <div className="flex justify-between font-medium">
              <span>Total Tarifa:</span>
              <span>R$ {breakdown.totalTarifa.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            <div className="flex justify-between font-medium">
              <span>Total Taxa de Embarque:</span>
              <span>R$ {breakdown.totalTaxa.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            <div className="flex justify-between font-medium text-gray-500">
              <span>DU:</span>
              <span>R$ {breakdown.du.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            
            <div className="border-t my-2 border-gray-300"></div>
            
            <div className="flex justify-between font-bold text-lg text-teal-700">
              <span>Total:</span>
              <span>R$ {total.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

const AddToQuoteButton = ({ voo, isSelected, onAdd }: { voo: any, isSelected: boolean, onAdd: (sentido: 'ida'|'volta'|'interno') => void }) => {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const newStyle: React.CSSProperties = {}
      
      // Horizontal: Place to the left of the button, slightly overlapping
      newStyle.right = window.innerWidth - rect.left - 10
      newStyle.left = 'auto'
      
      // Vertical: Center roughly
      newStyle.top = rect.top - 50 
      
      // Adjust if it goes off screen
      if (newStyle.top < 10) newStyle.top = 10
      
      setStyle(newStyle)
    }
    setOpen(true)
  }

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={() => setOpen(false)}>
      <button
        ref={buttonRef}
        disabled={isSelected}
        className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
        title={isSelected ? "Adicionado à cotação" : "Adicionar à cotação"}
      >
        {isSelected ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>

      {/* Invisible bridge to prevent mouse leave when moving to popover */}
      {open && !isSelected && (
        <div 
          className="fixed z-[9998]"
          style={{
            top: style.top,
            right: window.innerWidth - (buttonRef.current?.getBoundingClientRect().right || 0),
            width: 50, // Bridge width
            height: 140, // Height enough to cover the menu
          }}
          onMouseEnter={() => setOpen(true)}
        />
      )}

      {open && !isSelected && createPortal(
        <div 
          className="fixed bg-white rounded-xl shadow-xl border border-gray-200 z-[9999] overflow-hidden animate-in fade-in zoom-in duration-200 w-40"
          style={style}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="p-1 flex flex-col">
            <button 
              onClick={() => { onAdd('ida'); setOpen(false) }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors text-left"
            >
              <div className="p-1.5 bg-teal-100 rounded-md text-teal-600">
                <Plane className="h-3 w-3 transform rotate-45" />
              </div>
              <span className="font-medium">Voo de Ida</span>
            </button>
            
            <button 
              onClick={() => { onAdd('interno'); setOpen(false) }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors text-left"
            >
              <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                <Plane className="h-3 w-3 transform rotate-90" />
              </div>
              <span className="font-medium">Voo Interno</span>
            </button>

            <button 
              onClick={() => { onAdd('volta'); setOpen(false) }}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors text-left"
            >
              <div className="p-1.5 bg-orange-100 rounded-md text-orange-600">
                <Plane className="h-3 w-3 transform -rotate-135" />
              </div>
              <span className="font-medium">Voo de Volta</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const AereoInter = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<BuscaPassagem>({
    origem: '',
    destino: '',
    dataIda: '',
    dataVolta: '',
    somenteIda: false,
    adultos: 1,
    criancas: 0,
    bebes: 0,
    classe: 'ECONÔMICA'
  })

  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [showPaxDropdown, setShowPaxDropdown] = useState(false)
  const [resultados, setResultados] = useState<any[]>([])
  const [origemSugestoes, setOrigemSugestoes] = useState<any[]>([])
  const [destinoSugestoes, setDestinoSugestoes] = useState<any[]>([])
  const [showOrigemSugestoes, setShowOrigemSugestoes] = useState(false)
  const [showDestinoSugestoes, setShowDestinoSugestoes] = useState(false)
  const [variantSelected, setVariantSelected] = useState<Record<string, number>>({})
  const [viewMode, setViewMode] = useState<'cards'|'table'>('table')
  const [selectedCias, setSelectedCias] = useState<string[]>([])
  const [onlyBag, setOnlyBag] = useState(false)
  const [sortOrder, setSortOrder] = useState<string>('price_asc')
  const [scope, setScope] = useState<'domestico'|'internacional'>('internacional')
  const [currentPageIda, setCurrentPageIda] = useState(1)
  const [currentPageVolta, setCurrentPageVolta] = useState(1)
  const [airlineLogos, setAirlineLogos] = useState<Record<string, string>>({})
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [defaultDuRate, setDefaultDuRate] = useState<number>(0)
  const itemsPerPage = 10
  const { expiresAt, saveCache, loadCache, clearCache } = useSearchCache('flight_search_inter')
  const { adicionarVoo, voosSelecionados } = useCotacao()
  const resultadosStoreRef = useRef<{domestico:any[], internacional:any[]}>({domestico:[], internacional:[]})
  const variantStoreRef = useRef<{domestico:Record<string,number>, internacional:Record<string,number>}>({domestico:{}, internacional:{}})
  const formStoreRef = useRef<{domestico:BuscaPassagem, internacional:BuscaPassagem}>({
    domestico: {
      origem: '', destino: '', dataIda: '', dataVolta: '', somenteIda: false, adultos: 1, criancas: 0, bebes: 0, classe: 'ECONÔMICA'
    },
    internacional: {
      origem: '', destino: '', dataIda: '', dataVolta: '', somenteIda: false, adultos: 1, criancas: 0, bebes: 0, classe: 'ECONÔMICA'
    }
  })

  const [showRulesModal, setShowRulesModal] = useState(false)
  const [selectedRuleCia, setSelectedRuleCia] = useState('')
  const [selectedRuleTariff, setSelectedRuleTariff] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const parseDate = (str: string) => {
    if (!str) return undefined
    const [y, m, d] = str.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const selectedDate = React.useMemo(() => {
    if (formData.somenteIda) {
        return parseDate(formData.dataIda)
    } else {
        return {
            from: parseDate(formData.dataIda),
            to: parseDate(formData.dataVolta)
        } as DateRange
    }
  }, [formData.dataIda, formData.dataVolta, formData.somenteIda])

  const onDateSelect = (val: any) => {
    if (formData.somenteIda) {
        const date = val as Date | undefined
        setFormData(prev => ({
            ...prev,
            dataIda: date ? format(date, 'yyyy-MM-dd') : '',
            dataVolta: ''
        }))
        // Mantém aberto para confirmação manual
    } else {
        const range = val as DateRange | undefined
        setFormData(prev => ({
            ...prev,
            dataIda: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
            dataVolta: range?.to ? format(range.to, 'yyyy-MM-dd') : ''
        }))
        // Não fecha automaticamente mais
    }
  }

  const mergeVoos = (items: any[]) => {
    const map = new Map<string, any>()
    
    items.forEach((r) => {
      // Grouping key: Airline + Origin + Destination + Departure Time + Arrival Time
      const key = `${r.CompanhiaAparente}|${r.Origem}|${r.Destino}|${r.Embarque}|${r.Desembarque}`
      
      // Using AdultoF as requested. Fallback to AdultoR if needed (though AdultoF exists in mock)
      // Assuming CriancaF and BebeF follow same pattern, otherwise fallback to R
      const adultoVal = r.AdultoF || r.AdultoR || 0
      const criancaVal = (r as any).CriancaF || r.CriancaR || 0
      const bebeVal = (r as any).BebeF || r.BebeR || 0

      const variante = {
        id: r.id,
        tipotarifario: r.tipotarifario,
        tarifa: r.Tarifa || (r.BagagemDespachada > 0 ? 'Standard' : 'Light'),
        bag_mao_qty: 1, 
        bag_23_qty: r.BagagemDespachada,
        adulto: adultoVal,
        crianca: criancaVal,
        bebe: bebeVal,
        taxa: r.TaxaEmbarque || 0,
        total_unitario: adultoVal + (r.TaxaEmbarque || 0), // Just for sorting/reference
        original: r
      }
      
      if (!map.has(key)) {
        // Calculate arrival ISO
        let arrivalISO = ''
        if (r.Desembarque && r.Desembarque.includes('/')) {
            const parts = r.Desembarque.split('/')
            if (parts.length >= 3) {
                const [d, m, y_time] = parts
                const timeParts = y_time.split(' ')
                if (timeParts.length >= 2) {
                    const [y, time] = timeParts
                    arrivalISO = `${y}-${m}-${d}T${time}:00`
                }
            }
        }
        
        // Fallback if parsing failed
        if (!arrivalISO) {
             // Try to construct from Data + Duration if available
             if (r.Data && r.Duracao) {
                try {
                    const [durH, durM] = r.Duracao.split(':').map(Number)
                    const startDate = new Date(r.Data)
                    const endDate = new Date(startDate.getTime() + (durH * 60 + durM) * 60000)
                    arrivalISO = endDate.toISOString().slice(0, 19)
                } catch (e) {
                    arrivalISO = r.Data // Last resort
                }
             } else {
                 arrivalISO = r.Data || new Date().toISOString()
             }
        }

        map.set(key, {
          cia: r.CompanhiaAparente,
          // Remove first 3 chars for display ID as requested
          numero: r.id.length > 3 ? r.id.substring(3) : r.id, 
          origem: r.Origem,
          destino: r.Destino,
          partida: r.Data, 
          chegada: arrivalISO,
          partida_fmt: r.Embarque,
          chegada_fmt: r.Desembarque,
          duracao: r.Duracao,
          escala: r.NumeroConexoes,
          detalhesConexoes: r.DetalhesConexoes,
          sentido: r.Sentido,
          variantes: [variante]
        })
      } else {
        const group = map.get(key)
        group.variantes.push(variante)
      }
    })
    
    const merged = Array.from(map.values())
    merged.forEach(m => m.variantes.sort((a: any, b: any) => a.total_unitario - b.total_unitario))
    return merged
  }

  const fallbackAirports = [
    { id: 'MIA', iata_code: 'MIA', name: 'Miami International', municipality: 'Miami', iso_country: 'US' },
    { id: 'JFK', iata_code: 'JFK', name: 'John F. Kennedy', municipality: 'New York', iso_country: 'US' },
    { id: 'LIS', iata_code: 'LIS', name: 'Lisbon Portela', municipality: 'Lisbon', iso_country: 'PT' },
    { id: 'CDG', iata_code: 'CDG', name: 'Charles de Gaulle', municipality: 'Paris', iso_country: 'FR' },
    { id: 'LHR', iata_code: 'LHR', name: 'Heathrow', municipality: 'London', iso_country: 'GB' },
    { id: 'MAD', iata_code: 'MAD', name: 'Adolfo Suárez Madrid–Barajas', municipality: 'Madrid', iso_country: 'ES' },
    { id: 'FCO', iata_code: 'FCO', name: 'Leonardo da Vinci–Fiumicino', municipality: 'Rome', iso_country: 'IT' },
    { id: 'EZE', iata_code: 'EZE', name: 'Ezeiza', municipality: 'Buenos Aires', iso_country: 'AR' }
  ]
  const [origemSelecionada, setOrigemSelecionada] = useState<any | null>(null)
  const [destinoSelecionada, setDestinoSelecionada] = useState<any | null>(null)
  const origemInputRef = useRef<HTMLInputElement>(null)
  const destinoInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
      formStoreRef.current[scope] = { ...formStoreRef.current[scope], [name]: checked } as BuscaPassagem
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
      formStoreRef.current[scope] = { ...formStoreRef.current[scope], [name]: value } as BuscaPassagem
    }
  }

  const ajustarPassageiros = (tipo: 'adultos' | 'criancas' | 'bebes', operacao: 'incrementar' | 'decrementar') => {
    setFormData(prev => {
      const novoValor = operacao === 'incrementar' ? prev[tipo] + 1 : Math.max(0, prev[tipo] - 1)
      
      if (tipo === 'adultos' && novoValor < 1) return prev
      
      const total = (tipo === 'adultos' ? novoValor : prev.adultos) + 
                   (tipo === 'criancas' ? novoValor : prev.criancas) + 
                   (tipo === 'bebes' ? novoValor : prev.bebes)
      
      if (total > 9) return prev
      
      return {
        ...prev,
        [tipo]: novoValor
      }
    })
  }

  const handlePesquisar = async () => {
    if (!formData.origem || !formData.destino || !formData.dataIda) {
      alert('Por favor, preencha origem, destino e data de ida.')
      return
    }

    if (!empresaId) {
      console.warn('ID da empresa não encontrado. Usando ID de fallback para teste.')
    }
    
    setLoading(true)
    setSearched(true)
    setCollapsed(true)
    setResultados([])
    setSelectedCias([])
    clearCache()

    try {
      // Logic to determine 'codigo' for International
      let codigo = 'INTERNACIONAL_NORMAL' // Changed from DOMESTICO_NORMAL
      
      // Date Formatting (YYYY-MM-DD -> DD/MM/YYYY)
      const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const [y, m, d] = dateStr.split('-')
        return `${d}/${m}/${y}`
      }

      const payload = {
        codigo: codigo,
        auth: empresaId || "8e23591e-e0af-42f8-a002-6df935bab14a", 
        origem: formData.origem,
        destino: formData.destino,
        tipoViagem: formData.somenteIda ? "IDA" : "IDA_VOLTA",
        dataIda: formatDate(formData.dataIda),
        dataVolta: formData.somenteIda ? null : formatDate(formData.dataVolta),
        classe: formData.classe === 'EXECUTIVA' ? 'executiva' : 'economica',
        adulto: formData.adultos,
        crianca: formData.criancas,
        bebe: formData.bebes
      }

      const isDev = import.meta.env.DEV;
      const endpoint = isDev ? '/api/7capi/search' : '/proxy.php';

      console.log('✈️ Buscando voos internacionais via:', endpoint);
      console.log('📤 Payload enviado:', JSON.stringify(payload, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na API:', response.status, errorText)
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      console.log('📥 Resposta da API:', JSON.stringify(data, null, 2));
      
      if (data && Array.isArray(data.data)) {
        const merged = mergeVoos(data.data)
        resultadosStoreRef.current.internacional = merged
        setResultados(merged)
        
        const cleanResults = merged.map((r: any) => ({
          ...r,
          variantes: r.variantes ? r.variantes.map((v: any) => {
            const { original, ...rest } = v
            return rest
          }) : []
        }))
        saveCache({ ...formData, origemSelecionada, destinoSelecionada }, cleanResults, 'internacional')
      } else if (Array.isArray(data)) {
        const merged = mergeVoos(data)
        resultadosStoreRef.current.internacional = merged
        setResultados(merged)

        const cleanResults = merged.map((r: any) => ({
          ...r,
          variantes: r.variantes ? r.variantes.map((v: any) => {
            const { original, ...rest } = v
            return rest
          }) : []
        }))
        saveCache({ ...formData, origemSelecionada, destinoSelecionada }, cleanResults, 'internacional')
      } else {
        console.error('Formato de resposta inesperado')
        setResultados([])
      }

    } catch (error) {
      console.error('Erro ao buscar voos:', error)
      alert('Erro ao buscar voos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const totalPassageiros = formData.adultos + formData.criancas + formData.bebes

  useEffect(() => {
    const fetchCache = async () => {
      const cached = await loadCache()
      if (cached && cached.type === 'internacional') {
        setFormData(cached.formData)
        setResultados(cached.results)
        resultadosStoreRef.current.internacional = cached.results
        setSearched(true)
        setCollapsed(true)
      }
    }
    fetchCache()
  }, [loadCache])

  useEffect(() => {
    setLoading(false)

    // Load Airline Logos from Supabase
    const loadLogos = async () => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('CiasAereas')
          .select('NomeBuscador, nome, logo_url')
        
        if (data && !error) {
          const logoMap: Record<string, string> = {}
          data.forEach((item: any) => {
            const key = item.NomeBuscador || item.nome
            if (key && item.logo_url) {
              logoMap[key.trim().toUpperCase()] = item.logo_url
            }
          })
          setAirlineLogos(logoMap)
        }

        // Get Current User Company ID and Default DU
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('empresa_id, default_du_rate')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            if (profile.empresa_id) setEmpresaId(profile.empresa_id)
            if (profile.default_du_rate) setDefaultDuRate(Number(profile.default_du_rate))
          }
        }
      }
    }
    loadLogos()
  }, [])

  // Check Aereo Permission
  useEffect(() => {
    const checkPermission = async () => {
      if (empresaId) {
        const { data, error } = await supabase
          .from('empresas')
          .select('aereo_enabled')
          .eq('id', empresaId)
          .single()
        
        if (data && data.aereo_enabled === false) {
          navigate('/dashboard')
        }
      }
    }
    checkPermission()
  }, [empresaId, navigate])

  useEffect(() => {
    const term = formData.origem.trim()
    if (term.length < 2) {
      setOrigemSugestoes([])
      return
    }
    const handler = setTimeout(async () => {
      let items: any[] = []
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.rpc('search_airports', { term, limit_rows: 8 })
        // Removed BR filter for International
        items = error ? [] : (data || [])
      }
      if (!items.length) {
        items = fallbackAirports.filter(a => (
          (a.iata_code.toLowerCase().includes(term.toLowerCase()) ||
          a.name.toLowerCase().includes(term.toLowerCase()) ||
          (a.municipality || '').toLowerCase().includes(term.toLowerCase()))
        ))
      }
      setOrigemSugestoes(items)
      setShowOrigemSugestoes(!origemSelecionada)
    }, 250)
    return () => clearTimeout(handler)
  }, [formData.origem, origemSelecionada])

  useEffect(() => {
    variantStoreRef.current[scope] = variantSelected
  }, [variantSelected, scope])

  useEffect(() => {
    const term = formData.destino.trim()
    if (term.length < 2) {
      setDestinoSugestoes([])
      return
    }
    const handler = setTimeout(async () => {
      let items: any[] = []
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.rpc('search_airports', { term, limit_rows: 8 })
        // Removed BR filter for International
        items = error ? [] : (data || [])
      }
      if (!items.length) {
        items = fallbackAirports.filter(a => (
          (a.iata_code.toLowerCase().includes(term.toLowerCase()) ||
          a.name.toLowerCase().includes(term.toLowerCase()) ||
          (a.municipality || '').toLowerCase().includes(term.toLowerCase()))
        ))
      }
      setDestinoSugestoes(items)
      setShowDestinoSugestoes(!destinoSelecionada)
    }, 250)
    return () => clearTimeout(handler)
  }, [formData.destino, destinoSelecionada])

  const grupos = React.useMemo(() => {
    const map: Record<string, any> = {}
    resultados.forEach((r) => {
      const v = (r as any).variantes?.[0] || {}
      const adultoVal = v.adulto || 0
      const taxaVal = v.taxa || 0
      const key = `${r.origem}-${r.destino}-${Number(adultoVal).toFixed(2)}`
      if (!map[key]) {
        map[key] = {
          origem: r.origem,
          destino: r.destino,
          adulto: Number(adultoVal),
          taxa: Number(taxaVal),
          voos: [] as any[]
        }
      }
      map[key].voos.push(r)
    })
    return Object.values(map)
  }, [resultados])

  const uniqueCias = React.useMemo(() => {
    const cias = new Set(resultados.map(r => r.cia))
    return Array.from(cias).sort()
  }, [resultados])

  useEffect(() => {
    if (uniqueCias.length > 0) {
      setSelectedCias(uniqueCias)
    }
  }, [uniqueCias])

  const parseConnectionDate = (dateStr: string) => {
    if (!dateStr) return new Date()
    
    // Tenta extrair data e hora no formato "dd/MM/yyyy HH:mm"
    // Isso resolve o caso onde a string vem duplicada ex: "20/03/2026 05:25 05:25"
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2})/)
    if (match) {
        const [_, day, month, year, time] = match
        return new Date(`${year}-${month}-${day}T${time}:00`)
    }
    
    // Fallback para conversão simples se não casar com regex acima
    try {
        const isoLike = dateStr.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')
        const d = new Date(isoLike)
        return isNaN(d.getTime()) ? new Date() : d
    } catch (e) {
        return new Date()
    }
  }

  const [selectedIda, setSelectedIda] = useState<any | null>(null)
  const [selectedVolta, setSelectedVolta] = useState<any | null>(null)

  const handleSelectFlight = (flight: any, type: 'ida' | 'volta') => {
    if (type === 'ida') {
      if (selectedIda?.uniqueId === flight.uniqueId) {
        setSelectedIda(null)
        // If unselecting Ida, clear Volta as well to reset state
        setSelectedVolta(null)
      } else {
        setSelectedIda(flight)
        if (selectedVolta && selectedVolta.cia !== flight.cia) {
          setSelectedVolta(null)
        }
      }
    } else {
      if (!selectedIda) {
        alert('Por favor, selecione o voo de ida primeiro.')
        return
      }
      if (selectedVolta?.uniqueId === flight.uniqueId) {
        setSelectedVolta(null)
      } else {
        setSelectedVolta(flight)
      }
    }
  }

  const handleAddSelectedToQuote = () => {
    if (selectedIda) {
      adicionarVoo({
        id: `${selectedIda.numero}-${Date.now()}-ida`,
        cia: selectedIda.cia,
        numero: selectedIda.numero,
        partida: selectedIda.partida,
        chegada: selectedIda.chegada,
        origem: selectedIda.origem,
        destino: selectedIda.destino,
        duracao: selectedIda.duracao,
        tarifa: selectedIda.tarifa,
        hasBag: selectedIda.hasBag,
        total: selectedIda.total,
        sentido: 'ida',
        conexoes: selectedIda.conexoes,
        breakdown: selectedIda.breakdown
      })
    }
    
    if (selectedVolta) {
      setTimeout(() => {
        adicionarVoo({
          id: `${selectedVolta.numero}-${Date.now()}-volta`,
          cia: selectedVolta.cia,
          numero: selectedVolta.numero,
          partida: selectedVolta.partida,
          chegada: selectedVolta.chegada,
          origem: selectedVolta.origem,
          destino: selectedVolta.destino,
          duracao: selectedVolta.duracao,
          tarifa: selectedVolta.tarifa,
          hasBag: selectedVolta.hasBag,
          total: selectedVolta.total,
          sentido: 'volta',
          conexoes: selectedVolta.conexoes,
          breakdown: selectedVolta.breakdown
        })
      }, 50)
    }

    setSelectedIda(null)
    setSelectedVolta(null)
    alert('Voos selecionados adicionados ao orçamento!')
  }

  const linhas = React.useMemo(() => {
    const list: any[] = []
    resultados.forEach((r) => {
      if (selectedCias.length > 0 && !selectedCias.includes(r.cia)) return

      // Filter by Selected Outbound Airline (prevent mixing airlines)
      if (selectedIda && r.cia !== selectedIda.cia) return

      const variantes = (r as any).variantes || []
      
      variantes.forEach((v: any, vIdx: number) => {
        const hasBag = v.bag_23_qty > 0

        if (onlyBag && !hasBag) return

        const numAdultos = formData.adultos
        const numCriancas = formData.criancas
        const numBebes = formData.bebes
        const numTotal = numAdultos + numCriancas + numBebes
        
        const totalSemDu = 
          (v.adulto * numAdultos) + 
          (v.crianca * numCriancas) + 
          (v.bebe * numBebes) + 
          (v.taxa * numTotal)
        
        const duValue = totalSemDu * (defaultDuRate / 100)
        const totalPreco = totalSemDu + duValue

        const hasConexoes = r.escala > 0 && r.detalhesConexoes && r.detalhesConexoes.length > 0
        const conexoes = hasConexoes ? r.detalhesConexoes : []
        
        const uniqueId = `${r.numero}-${v.tarifa}-${totalPreco.toFixed(2)}-${vIdx}`

        list.push({
          uniqueId,
          cia: r.cia,
          numero: r.numero, 
          partida: r.partida,
          chegada: r.chegada,
          origem: r.origem,
          destino: r.destino,
          escala: r.escala,
          conexoes: conexoes,
          hasBag: hasBag,
          tarifa: v.tarifa,
          classe: v.tarifa, 
          total: totalPreco,
          breakdown: {
            adultoUnit: v.adulto,
            criancaUnit: v.crianca,
            bebeUnit: v.bebe,
            taxaUnit: v.taxa,
            numAdultos,
            numCriancas,
            numBebes,
            totalTarifa: (v.adulto * numAdultos) + (v.crianca * numCriancas) + (v.bebe * numBebes),
            totalTaxa: (v.taxa * numTotal),
            du: duValue
          },
          duracao: r.duracao,
          sentido: r.sentido
        })
      })
    })

    return list.sort((a, b) => {
      switch (sortOrder) {
        case 'price_asc':
          return a.total - b.total
        case 'price_desc':
          return b.total - a.total
        case 'departure_asc':
          return new Date(a.partida).getTime() - new Date(b.partida).getTime()
        case 'departure_desc':
          return new Date(b.partida).getTime() - new Date(a.partida).getTime()
        case 'arrival_asc':
          return new Date(a.chegada).getTime() - new Date(b.chegada).getTime()
        case 'arrival_desc':
          return new Date(b.chegada).getTime() - new Date(a.chegada).getTime()
        case 'duration_asc': {
          const [hA, mA] = a.duracao.split(':').map(Number)
          const [hB, mB] = b.duracao.split(':').map(Number)
          return (hA * 60 + mA) - (hB * 60 + mB)
        }
        case 'duration_desc': {
          const [hA, mA] = a.duracao.split(':').map(Number)
          const [hB, mB] = b.duracao.split(':').map(Number)
          return (hB * 60 + mB) - (hA * 60 + mA)
        }
        default:
          return a.total - b.total
      }
    })
  }, [resultados, formData, selectedCias, onlyBag, sortOrder, defaultDuRate, selectedIda])

  const linhasIda = React.useMemo(() => linhas.filter(l => !l.sentido || l.sentido === 'ida'), [linhas])
  const linhasVolta = React.useMemo(() => linhas.filter(l => l.sentido === 'volta'), [linhas])

  const totalPagesIda = Math.ceil(linhasIda.length / itemsPerPage)
  const totalPagesVolta = Math.ceil(linhasVolta.length / itemsPerPage)
  
  const paginatedIda = React.useMemo(() => {
    const start = (currentPageIda - 1) * itemsPerPage
    return linhasIda.slice(start, start + itemsPerPage)
  }, [currentPageIda, linhasIda])

  const paginatedVolta = React.useMemo(() => {
    const start = (currentPageVolta - 1) * itemsPerPage
    return linhasVolta.slice(start, start + itemsPerPage)
  }, [currentPageVolta, linhasVolta])

  useEffect(() => {
    setCurrentPageIda(1)
  }, [linhasIda.length])

  useEffect(() => {
    setCurrentPageVolta(1)
  }, [linhasVolta.length])

  const getAirlineLogo = (cia: string) => {
    const upperCia = cia.trim().toUpperCase()
    
    for (const [key, url] of Object.entries(airlineLogos)) {
      if (upperCia.includes(key)) return url
    }

    const staticUrl = getAirlineLogoUrl(upperCia)
    if (staticUrl) return staticUrl

    if (upperCia.includes('GOL')) return 'https://pics.avs.io/200/200/G3.png'
    
    return null
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1920px] mx-auto bg-gray-50 min-h-screen">
      <div className="w-full">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white shadow-sm border border-gray-100">
                <Plane className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">Aéreo • Internacional</h1>
                </div>
                <p className="text-sm text-gray-500">Busque e compare passagens aéreas internacionais</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full border border-green-500 overflow-hidden text-xs bg-white p-0.5">
                <button type="button" className="px-4 py-1.5 rounded-full text-gray-700" onClick={() => navigate('/aereodomestico')}>Doméstico</button>
                <button type="button" className="px-4 py-1.5 rounded-full bg-green-500 text-white">Internacional</button>
              </div>
            </div>
          </div>
          <div className="bg-white border-0 rounded-xl shadow-sm p-4">
             {/* Trip Type Dropdown */}
             <div className="flex items-center gap-6 mb-4 border-b border-gray-100 pb-4 relative">
                <button
                  type="button"
                  onClick={() => setShowTripTypeDropdown(!showTripTypeDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${formData.somenteIda ? 'bg-teal-600' : 'bg-blue-600'}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {formData.somenteIda ? 'Somente Ida' : 'Ida e Volta'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {showTripTypeDropdown && (
                  <div className="absolute top-12 left-0 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(p => ({...p, somenteIda: true, dataVolta: ''}))
                        setShowTripTypeDropdown(false)
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.somenteIda ? 'border-teal-600' : 'border-gray-300'}`}>
                        {formData.somenteIda && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Somente Ida</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(p => ({...p, somenteIda: false}))
                        setShowTripTypeDropdown(false)
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!formData.somenteIda ? 'border-blue-600' : 'border-gray-300'}`}>
                        {!formData.somenteIda && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">Ida e Volta</span>
                    </button>
                  </div>
                )}
             </div>

             <div className="flex items-center gap-4">
            {/* Origem */}
            <div className="relative flex items-center gap-2 flex-1 bg-gray-100 rounded-lg px-3 py-2 h-[52px]">
              <MapPin className="h-4 w-4 text-gray-400" />
              {origemSelecionada ? (
                <button
                  type="button"
                  className="bg-transparent text-sm text-gray-900 font-medium focus:outline-none w-full text-left"
                  onClick={() => {
                    setOrigemSelecionada(null)
                    setShowOrigemSugestoes(true)
                    setTimeout(() => origemInputRef.current?.focus(), 0)
                  }}
                >
                  {origemSelecionada.iata_code} - {origemSelecionada.municipality || origemSelecionada.name}
                </button>
              ) : (
                <input
                  ref={origemInputRef}
                  type="text"
                  name="origem"
                  value={formData.origem}
                  onChange={handleInputChange}
                  placeholder="Origem"
                  className="w-full bg-transparent text-sm placeholder-gray-500 focus:outline-none"
                  onFocus={() => setShowOrigemSugestoes(true)}
                  onBlur={() => setTimeout(() => setShowOrigemSugestoes(false), 150)}
                />
              )}
              {showOrigemSugestoes && origemSugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20">
                  <ul className="max-h-64 overflow-auto">
                    {origemSugestoes.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                          onMouseDown={() => {
                            setFormData(prev => ({ ...prev, origem: a.iata_code }))
                            setOrigemSugestoes([])
                            setShowOrigemSugestoes(false)
                            setOrigemSelecionada(a)
                          }}
                        >
                          <span className="text-sm font-medium text-gray-900">{a.iata_code} - {a.name}</span>
                          <span className="text-xs text-gray-500">{a.municipality}{a.iso_country ? `, ${a.iso_country}` : ''}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Destino */}
            <div className="relative flex items-center gap-2 flex-1 bg-gray-100 rounded-lg px-3 py-2 h-[52px]">
              <MapPin className="h-4 w-4 text-gray-400" />
              {destinoSelecionada ? (
                <button
                  type="button"
                  className="bg-transparent text-sm text-gray-900 font-medium focus:outline-none w-full text-left"
                  onClick={() => {
                    setDestinoSelecionada(null)
                    setShowDestinoSugestoes(true)
                    setTimeout(() => destinoInputRef.current?.focus(), 0)
                  }}
                >
                  {destinoSelecionada.iata_code} - {destinoSelecionada.municipality || destinoSelecionada.name}
                </button>
              ) : (
                <input
                  ref={destinoInputRef}
                  type="text"
                  name="destino"
                  value={formData.destino}
                  onChange={handleInputChange}
                  placeholder="Destino"
                  className="w-full bg-transparent text-sm placeholder-gray-500 focus:outline-none"
                  onFocus={() => setShowDestinoSugestoes(true)}
                  onBlur={() => setTimeout(() => setShowDestinoSugestoes(false), 150)}
                />
              )}
              {showDestinoSugestoes && destinoSugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20">
                  <ul className="max-h-64 overflow-auto">
                    {destinoSugestoes.map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                          onMouseDown={() => {
                            setFormData(prev => ({ ...prev, destino: a.iata_code }))
                            setDestinoSugestoes([])
                            setShowDestinoSugestoes(false)
                            setDestinoSelecionada(a)
                          }}
                        >
                          <span className="text-sm font-medium text-gray-900">{a.iata_code} - {a.name}</span>
                          <span className="text-xs text-gray-500">{a.municipality}{a.iso_country ? `, ${a.iso_country}` : ''}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Calendar Trigger */}
            <div className="relative" ref={calendarRef}>
             <button 
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className={cn(
                  "flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-[280px] text-left transition-colors hover:bg-gray-200 h-[52px]",
                  showCalendar && "ring-2 ring-teal-500 bg-white"
                )}
             >
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <div className="flex flex-col flex-1">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Data da Viagem</span>
                   <span className="text-sm text-gray-900 font-semibold truncate">
                      {formData.dataIda ? (
                        <>
                           {format(parseDate(formData.dataIda)!, 'dd/MM/yyyy')}
                           {!formData.somenteIda && formData.dataVolta ? ` - ${format(parseDate(formData.dataVolta)!, 'dd/MM/yyyy')}` : (!formData.somenteIda ? ' - Volta' : '')}
                        </>
                      ) : (
                        "Selecionar datas"
                      )}
                   </span>
                </div>
             </button>

             {showCalendar && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                   <Calendar
                      mode={formData.somenteIda ? "single" : "range"}
                      selected={selectedDate}
                      onSelect={onDateSelect}
                      disabled={{ before: new Date() }}
                      defaultMonth={selectedDate instanceof Date ? selectedDate : (selectedDate as DateRange)?.from || new Date()}
                      numberOfMonths={2}
                      locale={ptBR}
                      className="rounded-md border-0"
                      classNames={{
                         head_cell: "text-gray-500 font-normal text-[0.8rem]",
                         day_selected: "!bg-teal-600 !text-white hover:!bg-teal-700 focus:!bg-teal-700",
                         day_today: "bg-gray-100 text-gray-900 font-bold",
                         outside: "text-gray-300 opacity-40 hover:bg-transparent pointer-events-none",
                         range_middle: "!bg-teal-100 !text-teal-900 rounded-none",
                         range_start: "!bg-teal-600 !text-white rounded-l-md rounded-r-none",
                         range_end: "!bg-teal-600 !text-white rounded-r-md rounded-l-none",
                      }}
                   />
                </div>
             )}
            </div>

            {/* Passageiros • Classe */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPaxDropdown(v => !v)}
                className="px-3 py-2 rounded-lg text-sm focus:outline-none flex items-center gap-2 hover:bg-gray-200 bg-gray-100 text-gray-700 h-[52px]"
                title="Selecionar passageiros e classe"
              >
                <Users className="h-4 w-4 text-gray-500" />
                <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Passageiros</span>
                    <span className="font-semibold text-gray-900">{`${totalPassageiros} pax • ${formData.classe === 'EXECUTIVA' ? 'Exec.' : 'Eco.'}`}</span>
                </div>
              </button>
              {showPaxDropdown && (
                <div className="absolute z-10 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3 right-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Adultos</div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => ajustarPassageiros('adultos','decrementar')} disabled={formData.adultos <= 1 && (formData.criancas + formData.bebes) === 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50">
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-6 text-center text-sm font-semibold">{formData.adultos}</div>
                        <button type="button" onClick={() => ajustarPassageiros('adultos','incrementar')} disabled={totalPassageiros >= 9} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Crianças</div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => ajustarPassageiros('criancas','decrementar')} disabled={totalPassageiros <= 1 && formData.criancas > 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50">
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-6 text-center text-sm font-semibold">{formData.criancas}</div>
                        <button type="button" onClick={() => ajustarPassageiros('criancas','incrementar')} disabled={totalPassageiros >= 9} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Bebês</div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => ajustarPassageiros('bebes','decrementar')} disabled={totalPassageiros <= 1 && formData.bebes > 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50">
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-6 text-center text-sm font-semibold">{formData.bebes}</div>
                        <button type="button" onClick={() => ajustarPassageiros('bebes','incrementar')} disabled={totalPassageiros >= 9} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="relative">
                        <div className="w-full text-left px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-500 cursor-not-allowed">
                          Classe: Econômica
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setShowPaxDropdown(false)} className="px-3 py-2 text-sm rounded-md bg-teal-600 text-white">Concluir</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Botão Pesquisar */}
            <button onClick={handlePesquisar} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-full text-sm flex items-center shadow transition-colors h-[52px]">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </button>
          </div>
          </div>
        </div>

        {/* Interface de Busca com colapso */}
        <div className="hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="sr-only">Encontrar Passagem</h2>
              {!collapsed && <p className="sr-only">Preencha os dados da sua viagem para buscar as melhores opções</p>}
            </div>
            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                title="Editar busca"
              >
                Editar busca
              </button>
            )}
          </div>
          {/* Formulário */}
          <div className={`${collapsed ? 'max-h-0 p-0' : 'max-h-[2000px] p-8'} transition-all duration-300 ease-in-out overflow-hidden`}>
            {!collapsed && (
            <>
            {/* ... (Hidden form fields - same as before) ... */}
            </>
            )}
          </div>
        </div>

        {/* Estado: Loading / Resultados */}
        {searched && (
          <div className="mt-8">
            {loading ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 flex flex-col items-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
                  <Plane className="absolute inset-0 m-auto h-8 w-8 text-teal-600 animate-bounce" />
                </div>
                <div className="mt-4 text-gray-700 font-medium">Buscando voos internacionais...</div>
                <div className="mt-2 w-full max-w-md">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 bg-teal-600 animate-[loading_1.8s_ease_infinite]" style={{ width: '40%' }}></div>
                  </div>
                </div>
                <style>{`@keyframes loading {0%{transform: translateX(-100%)}50%{transform: translateX(10%)}100%{transform: translateX(120%)}}`}</style>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Resultados da Busca</h2>
                    <p className="text-sm text-gray-600">{viewMode==='table' ? `${linhas.length} voos` : `${grupos.length} grupos por valor`}</p>
                    {collapsed && (
                      <p className="text-xs text-gray-500 mt-1">
                        {`${formData.origem || 'Origem'} → ${formData.destino || 'Destino'}`} • {formData.dataIda || 'Ida'}{!formData.somenteIda ? ` • ${formData.dataVolta || 'Volta'}` : ''} • {totalPassageiros} pax • {formData.classe === 'EXECUTIVA' ? 'Executiva' : 'Econômica'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <SearchTimer 
                      expiresAt={expiresAt} 
                      onExpire={() => { 
                        setSearched(false)
                        setResultados([])
                        setCollapsed(false)
                        clearCache()
                      }} 
                    />
                    <button
                      onClick={() => {
                        setSearched(false)
                        setResultados([])
                        setCollapsed(false)
                        setSelectedCias([])
                        clearCache()
                      }}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Nova Busca"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    {/* Airline Filter */}
                    <div className="relative group">
                      <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white flex items-center gap-2">
                        <span>Cias Aéreas ({selectedCias.length})</span>
                      </button>
                      <div className="absolute top-full left-0 pt-2 w-48 z-[100] hidden group-hover:block">
                        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-2">
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => setSelectedCias(selectedCias.length === uniqueCias.length ? [] : uniqueCias)}
                              className="w-full text-left px-2 py-1 text-xs font-semibold text-teal-600 hover:bg-teal-50 rounded"
                            >
                              {selectedCias.length === uniqueCias.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                            </button>
                            {uniqueCias.map(cia => (
                              <label key={cia} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedCias.includes(cia)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCias([...selectedCias, cia])
                                    } else {
                                      setSelectedCias(selectedCias.filter(c => c !== cia))
                                    }
                                  }}
                                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                                />
                                <span className="text-sm text-gray-700">{cia}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Baggage Filter */}
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlyBag}
                        onChange={(e) => setOnlyBag(e.target.checked)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                      />
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <Luggage className="h-4 w-4" />
                        Com Bagagem
                      </span>
                    </label>

                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="price_asc">Menor Preço</option>
                      <option value="price_desc">Maior Preço</option>
                      <option value="departure_asc">Saída (Cedo → Tarde)</option>
                      <option value="departure_desc">Saída (Tarde → Cedo)</option>
                      <option value="arrival_asc">Chegada (Cedo → Tarde)</option>
                      <option value="arrival_desc">Chegada (Tarde → Cedo)</option>
                      <option value="duration_asc">Menor Duração</option>
                      <option value="duration_desc">Maior Duração</option>
                    </select>
                    {collapsed && (
                      <button
                        type="button"
                        onClick={() => setCollapsed(false)}
                        className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
                        title="Editar busca"
                      >
                        Editar busca
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-0 border border-gray-200 rounded-lg shadow-sm bg-white">
                  {/* Tabela de Resultados */}
                    <>
                    {/* Resumo da Seleção */}
                    {(selectedIda || selectedVolta) && (
                      <div className="mb-8 sticky top-0 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-5 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between text-white">
                           <h3 className="text-lg font-bold flex items-center gap-2">
                             <Check className="h-5 w-5 bg-white text-blue-600 rounded-full p-1" />
                             Voos Selecionados
                           </h3>
                           <div className="text-right">
                              <span className="text-blue-100 text-sm block">Total da Seleção</span>
                              <span className="font-bold text-xl">R$ {((selectedIda?.total || 0) + (selectedVolta?.total || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                           </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                             <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                <tr>
                                   <th className="py-3 px-4 text-left w-20">Tipo</th>
                                   <th className="py-3 px-4 text-left">Companhia</th>
                                   <th className="py-3 px-4 text-left">Voo</th>
                                   <th className="py-3 px-4 text-left">Horários</th>
                                   <th className="py-3 px-4 text-left">Rota</th>
                                   <th className="py-3 px-4 text-center">Tarifa</th>
                                   <th className="py-3 px-4 text-right">Valor</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                {selectedIda && (
                                   <tr 
                                      className="hover:bg-red-50 transition-colors cursor-pointer" 
                                      onClick={() => handleSelectFlight(selectedIda, 'ida')}
                                      title="Clique para remover este voo"
                                   >
                                      <td className="py-3 px-4">
                                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            IDA
                                         </span>
                                      </td>
                                      <td className="py-3 px-4">
                                         <div className="flex items-center gap-3">
                                            {getAirlineLogo(selectedIda.cia) && (
                                               <img src={getAirlineLogo(selectedIda.cia)!} alt={selectedIda.cia} className="h-6 w-auto object-contain" />
                                            )}
                                            <span className="font-medium text-gray-900">{selectedIda.cia}</span>
                                         </div>
                                      </td>
                                      <td className="py-3 px-4 text-gray-600">{selectedIda.numero}</td>
                                      <td className="py-3 px-4">
                                         <div className="flex flex-col text-xs">
                                            <span className="font-medium text-gray-900">
                                               {new Date(selectedIda.partida).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                            <span className="text-gray-500">
                                               {new Date(selectedIda.partida).toLocaleDateString('pt-BR')}
                                            </span>
                                         </div>
                                      </td>
                                      <td className="py-3 px-4">
                                         <div className="flex items-center gap-1 text-gray-700 font-medium">
                                            {selectedIda.origem} <ChevronRight className="h-3 w-3 text-gray-400" /> {selectedIda.destino}
                                         </div>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                         <span className="text-xs uppercase bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                                            {selectedIda.tarifa}
                                         </span>
                                      </td>
                                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                                         R$ {selectedIda.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                      </td>
                                   </tr>
                                )}
                                {selectedVolta && (
                                   <tr 
                                      className="hover:bg-red-50 transition-colors cursor-pointer" 
                                      onClick={() => handleSelectFlight(selectedVolta, 'volta')}
                                      title="Clique para remover este voo"
                                   >
                                      <td className="py-3 px-4">
                                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            VOLTA
                                         </span>
                                      </td>
                                      <td className="py-3 px-4">
                                         <div className="flex items-center gap-3">
                                            {getAirlineLogo(selectedVolta.cia) && (
                                               <img src={getAirlineLogo(selectedVolta.cia)!} alt={selectedVolta.cia} className="h-6 w-auto object-contain" />
                                            )}
                                            <span className="font-medium text-gray-900">{selectedVolta.cia}</span>
                                         </div>
                                      </td>
                                      <td className="py-3 px-4 text-gray-600">{selectedVolta.numero}</td>
                                      <td className="py-3 px-4">
                                         <div className="flex flex-col text-xs">
                                            <span className="font-medium text-gray-900">
                                               {new Date(selectedVolta.partida).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                            <span className="text-gray-500">
                                               {new Date(selectedVolta.partida).toLocaleDateString('pt-BR')}
                                            </span>
                                         </div>
                                      </td>
                                      <td className="py-3 px-4">
                                         <div className="flex items-center gap-1 text-gray-700 font-medium">
                                            {selectedVolta.origem} <ChevronRight className="h-3 w-3 text-gray-400" /> {selectedVolta.destino}
                                         </div>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                         <span className="text-xs uppercase bg-gray-100 px-2 py-1 rounded text-gray-600 font-medium">
                                            {selectedVolta.tarifa}
                                         </span>
                                      </td>
                                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                                         R$ {selectedVolta.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                      </td>
                                   </tr>
                                )}
                             </tbody>
                          </table>
                        </div>
                        
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end border-t border-gray-200 gap-3">
                          <button
                            onClick={() => setShowConfirmationModal(true)}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
                          >
                            <Plus className="h-5 w-5" />
                            Adicionar à Cotação
                          </button>
                          <button
                            onClick={handleEmitir}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 transform active:scale-95"
                          >
                            <FileText className="h-5 w-5" />
                            Emitir
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <FlightConfirmationModal
                      isOpen={showConfirmationModal}
                      onClose={() => setShowConfirmationModal(false)}
                      onConfirm={handleAddSelectedToQuote}
                      ida={selectedIda}
                      volta={selectedVolta}
                      getLogo={getAirlineLogo}
                    />

                    {/* Tabela de Ida */}
                    {linhasIda.length > 0 && (
                      <div className="mb-12">
                        {linhasVolta.length > 0 && (
                          <div className="px-6 pb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-teal-50">
                                <Plane className="h-6 w-6 text-teal-600 transform rotate-45" />
                              </div>
                              Voos de Ida
                            </h3>
                          </div>
                        )}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                                <th className="py-3 pl-4 pr-2 text-left">cia</th>
                                <th className="py-3 px-2 text-left">voo</th>
                                <th className="py-3 px-2 text-left">saída</th>
                                <th className="py-3 px-2 text-left">chegada</th>
                                <th className="py-3 px-2 text-left">origem</th>
                                <th className="py-3 px-2 text-left">destino(s)</th>
                                <th className="py-3 px-2 text-center">tarifa</th>
                                <th className="py-3 px-2 text-center">bag.</th>
                                <th className="py-3 px-2 text-center">ação</th>
                                <th className="py-3 pl-2 pr-4 text-right">total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {paginatedIda.map((l, i) => {
                                const isSelected = voosSelecionados.some(v => 
                                  v.numero === l.numero && 
                                  v.tarifa === l.tarifa && 
                                  v.partida === l.partida && 
                                  v.sentido === 'ida'
                                )
                                if (l.conexoes && l.conexoes.length > 0) {
                                  return (
                                    <React.Fragment key={`${l.numero}-${l.tarifa}-${i}`}>
                                      {l.conexoes.map((c: any, cIdx: number) => {
                                        const partC = parseConnectionDate(c.EmbarqueCompleto || c.DataEmbarque)
                                        const chegC = parseConnectionDate(c.DesembarqueCompleto || c.DataDesembarque)
                                        return (
                                          <tr key={`${i}-${cIdx}`} onClick={() => handleSelectFlight(l, 'ida')} className={`cursor-pointer group ${selectedIda?.uniqueId === l.uniqueId ? 'bg-blue-50' : 'bg-gray-50/50'} ${cIdx === l.conexoes.length - 1 ? 'border-b border-gray-400' : ''}`}>
                                            {cIdx === 0 && (
                                              <td className="py-3 pl-4 pr-2 align-middle" rowSpan={l.conexoes.length}>
                                                {getAirlineLogo(l.cia) ? (
                                                  <img src={getAirlineLogo(l.cia)!} alt={l.cia} className="h-5 w-auto object-contain" />
                                                ) : (
                                                  <span className="font-semibold text-gray-700">{l.cia}</span>
                                                )}
                                              </td>
                                            )}
                                            <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{c.NumeroVoo}</div></td>
                                            <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{partC.toLocaleDateString('pt-BR')} - {partC.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                            <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{chegC.toLocaleDateString('pt-BR')} - {chegC.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={c.Origem}>{c.Origem}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={c.Destino}>{c.Destino}</td>
                                            {cIdx === 0 && (
                                              <>
                                                <td className="py-3 px-2 text-center text-gray-600 uppercase font-medium text-xs align-middle" rowSpan={l.conexoes.length}>
                                                  <div className="flex items-center justify-center gap-1">
                                                    {l.tarifa}
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedRuleCia(l.cia)
                                                        setSelectedRuleTariff(l.tarifa)
                                                        setShowRulesModal(true)
                                                      }}
                                                      className="text-blue-500 hover:text-blue-700 transition-colors"
                                                      title="Ver regras da tarifa"
                                                    >
                                                      <Info className="h-4 w-4" />
                                                    </button>
                                                  </div>
                                                </td>
                                                <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                                  {l.hasBag ? <div className="flex items-center justify-center text-teal-600" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                                </td>
                                                <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                                  <AddToQuoteButton 
                                                    voo={l}
                                                    isSelected={isSelected}
                                                    onAdd={(sentido) => {
                                                      adicionarVoo({
                                                        id: `${l.numero}-${Date.now()}`,
                                                        cia: l.cia,
                                                        numero: l.numero,
                                                        partida: l.partida,
                                                        chegada: l.chegada,
                                                        origem: l.origem,
                                                        destino: l.destino,
                                                        duracao: l.duracao,
                                                        tarifa: l.tarifa,
                                                        hasBag: l.hasBag,
                                                        total: l.total,
                                                        sentido: sentido,
                                                        conexoes: l.conexoes,
                                                        breakdown: l.breakdown
                                                      })
                                                    }}
                                                  />
                                                </td>
                                                <td className="py-3 pl-2 pr-4 text-right align-middle" rowSpan={l.conexoes.length}>
                                                  <div className="flex items-center justify-end gap-2">
                                                    <span className="font-bold text-gray-900 text-base">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits: 2})}</span>
                                                    <PriceTooltip breakdown={l.breakdown} total={l.total} />
                                                  </div>
                                                </td>
                                              </>
                                            )}
                                          </tr>
                                        )
                                      })}
                                    </React.Fragment>
                                  )
                                } else {
                                  const part = new Date(l.partida)
                                  const cheg = new Date(l.chegada)
                                  return (
                                    <tr key={`${l.numero}-${l.tarifa}-${i}`} onClick={() => handleSelectFlight(l, 'ida')} className={`cursor-pointer hover:bg-teal-50 transition-colors group border-b border-gray-400 ${selectedIda?.uniqueId === l.uniqueId ? 'bg-blue-50 ring-2 ring-blue-500' : ''}`}>
                                      <td className="py-3 pl-4 pr-2">
                                        {getAirlineLogo(l.cia) ? <img src={getAirlineLogo(l.cia)!} alt={l.cia} className="h-5 w-auto object-contain" /> : <span className="font-semibold text-gray-700">{l.cia}</span>}
                                      </td>
                                      <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{l.numero}</div></td>
                                      <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{part.toLocaleDateString('pt-BR')} - {part.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                      <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{cheg.toLocaleDateString('pt-BR')} - {cheg.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                      <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={l.origem}>{l.origem}</td>
                                      <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={l.destino}>{l.destino}</td>
                                          <td className="py-3 px-2 text-center text-gray-600 uppercase font-medium text-xs">
                                            <div className="flex items-center justify-center gap-1">
                                              {l.tarifa}
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setSelectedRuleCia(l.cia)
                                                  setSelectedRuleTariff(l.tarifa)
                                                  setShowRulesModal(true)
                                                }}
                                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                                title="Ver regras da tarifa"
                                              >
                                                <Info className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </td>
                                      <td className="py-3 px-2 text-center">
                                        {l.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                      </td>
                                      <td className="py-3 px-2 text-center">
                                        <AddToQuoteButton 
                                          voo={l}
                                          isSelected={isSelected}
                                          onAdd={(sentido) => {
                                            adicionarVoo({
                                              id: `${l.numero}-${Date.now()}`,
                                              cia: l.cia,
                                              numero: l.numero,
                                              partida: l.partida,
                                              chegada: l.chegada,
                                              origem: l.origem,
                                              destino: l.destino,
                                              duracao: l.duracao,
                                              tarifa: l.tarifa,
                                              hasBag: l.hasBag,
                                              total: l.total,
                                              sentido: sentido,
                                              conexoes: [],
                                              breakdown: l.breakdown
                                            })
                                          }}
                                        />
                                      </td>
                                      <td className="py-3 pl-2 pr-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="font-bold text-gray-900 text-base">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                          <PriceTooltip breakdown={l.breakdown} total={l.total} />
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                }
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg">
                          <div className="text-sm text-gray-500">
                            Mostrando <span className="font-medium">{(currentPageIda - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPageIda * itemsPerPage, linhasIda.length)}</span> de <span className="font-medium">{linhasIda.length}</span> resultados
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPageIda(p => Math.max(1, p - 1))}
                              disabled={currentPageIda === 1 || totalPagesIda === 0}
                              className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-gray-700">Página {currentPageIda} de {totalPagesIda}</span>
                            <button
                              onClick={() => setCurrentPageIda(p => Math.min(totalPagesIda, p + 1))}
                              disabled={currentPageIda >= totalPagesIda}
                              className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tabela de Volta */}
                    {linhasVolta.length > 0 && (
                      <div className={`mt-8 border-t-4 border-gray-100 pt-8 ${!selectedIda ? 'opacity-50 pointer-events-none filter grayscale' : ''}`}>
                        <div className="px-6 pb-4 flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-50">
                              <Plane className="h-6 w-6 text-orange-600 transform -rotate-135" />
                            </div>
                            Voos de Volta
                          </h3>
                          {!selectedIda && (
                            <span className="text-sm text-red-500 font-medium bg-red-50 px-3 py-1 rounded-full border border-red-100">
                              Selecione a ida primeiro
                            </span>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                                <th className="py-3 pl-4 pr-2 text-left">cia</th>
                                <th className="py-3 px-2 text-left">voo</th>
                                <th className="py-3 px-2 text-left">saída</th>
                                <th className="py-3 px-2 text-left">chegada</th>
                                <th className="py-3 px-2 text-left">origem</th>
                                <th className="py-3 px-2 text-left">destino(s)</th>
                                <th className="py-3 px-2 text-center">tarifa</th>
                                <th className="py-3 px-2 text-center">bag.</th>
                                <th className="py-3 pl-2 pr-4 text-right">total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {paginatedVolta.map((l, i) => {
                                const isSelected = voosSelecionados.some(v => 
                                  v.numero === l.numero && 
                                  v.tarifa === l.tarifa && 
                                  v.partida === l.partida && 
                                  v.sentido === 'volta'
                                )
                                if (l.conexoes && l.conexoes.length > 0) {
                                  return (
                                    <React.Fragment key={`${l.numero}-${l.tarifa}-${i}`}>
                                      {l.conexoes.map((c: any, cIdx: number) => {
                                        const partC = parseConnectionDate(c.EmbarqueCompleto || c.DataEmbarque)
                                        const chegC = parseConnectionDate(c.DesembarqueCompleto || c.DataDesembarque)
                                        return (
                                          <tr key={`${i}-${cIdx}`} onClick={() => handleSelectFlight(l, 'volta')} className={`cursor-pointer group ${selectedVolta?.uniqueId === l.uniqueId ? 'bg-blue-50' : 'bg-gray-50/50'} ${cIdx === l.conexoes.length - 1 ? 'border-b border-gray-400' : ''}`}>
                                            {cIdx === 0 && (
                                              <td className="py-3 pl-4 pr-2 align-middle" rowSpan={l.conexoes.length}>
                                                {getAirlineLogo(l.cia) ? (
                                                  <img src={getAirlineLogo(l.cia)!} alt={l.cia} className="h-5 w-auto object-contain" />
                                                ) : (
                                                  <span className="font-semibold text-gray-700">{l.cia}</span>
                                                )}
                                              </td>
                                            )}
                                            <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{c.NumeroVoo}</div></td>
                                            <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{partC.toLocaleDateString('pt-BR')} - {partC.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                            <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{chegC.toLocaleDateString('pt-BR')} - {chegC.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={c.Origem}>{c.Origem}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={c.Destino}>{c.Destino}</td>
                                            {cIdx === 0 && (
                                              <>
                                                <td className="py-3 px-2 text-center text-gray-600 uppercase font-medium text-xs align-middle" rowSpan={l.conexoes.length}>
                                                  <div className="flex items-center justify-center gap-1">
                                                    {l.tarifa}
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedRuleCia(l.cia)
                                                        setSelectedRuleTariff(l.tarifa)
                                                        setShowRulesModal(true)
                                                      }}
                                                      className="text-blue-500 hover:text-blue-700 transition-colors"
                                                      title="Ver regras da tarifa"
                                                    >
                                                      <Info className="h-4 w-4" />
                                                    </button>
                                                  </div>
                                                </td>
                                                <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                                  {l.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                                </td>
                                                <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                                  <AddToQuoteButton 
                                                    voo={l}
                                                    isSelected={isSelected}
                                                    onAdd={(sentido) => {
                                                      adicionarVoo({
                                                        id: `${l.numero}-${Date.now()}`,
                                                        cia: l.cia,
                                                        numero: l.numero,
                                                        partida: l.partida,
                                                        chegada: l.chegada,
                                                        origem: l.origem,
                                                        destino: l.destino,
                                                        duracao: l.duracao,
                                                        tarifa: l.tarifa,
                                                        hasBag: l.hasBag,
                                                        total: l.total,
                                                        sentido: sentido,
                                                        conexoes: l.conexoes,
                                                        breakdown: l.breakdown
                                                      })
                                                    }}
                                                  />
                                                </td>
                                                <td className="py-3 pl-2 pr-4 text-right align-middle" rowSpan={l.conexoes.length}>
                                                  <div className="flex items-center justify-end gap-2">
                                                    <span className="font-bold text-gray-900 text-base">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                                    <PriceTooltip breakdown={l.breakdown} total={l.total} />
                                                  </div>
                                                </td>
                                              </>
                                            )}
                                          </tr>
                                        )
                                      })}
                                    </React.Fragment>
                                  )
                                } else {
                                  const part = new Date(l.partida)
                                  const cheg = new Date(l.chegada)
                                  return (
                                    <tr key={`${l.numero}-${l.tarifa}-${i}`} onClick={() => handleSelectFlight(l, 'volta')} className={`cursor-pointer hover:bg-purple-50 transition-colors group border-b border-gray-400 ${selectedVolta?.uniqueId === l.uniqueId ? 'bg-blue-50 ring-2 ring-blue-500' : ''}`}>
                                      <td className="py-3 pl-4 pr-2">
                                        {getAirlineLogo(l.cia) ? <img src={getAirlineLogo(l.cia)!} alt={l.cia} className="h-5 w-auto object-contain" /> : <span className="font-semibold text-gray-700">{l.cia}</span>}
                                      </td>
                                      <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{l.numero}</div></td>
                                      <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{part.toLocaleDateString('pt-BR')} - {part.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                      <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{cheg.toLocaleDateString('pt-BR')} - {cheg.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                      <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={l.origem}>{l.origem}</td>
                                      <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={l.destino}>{l.destino}</td>
                                          <td className="py-3 px-2 text-center text-gray-600 uppercase font-medium text-xs">
                                            <div className="flex items-center justify-center gap-1">
                                              {l.tarifa}
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setSelectedRuleCia(l.cia)
                                                  setSelectedRuleTariff(l.tarifa)
                                                  setShowRulesModal(true)
                                                }}
                                                className="text-blue-500 hover:text-blue-700 transition-colors"
                                                title="Ver regras da tarifa"
                                              >
                                                <Info className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </td>
                                      <td className="py-3 px-2 text-center">
                                        {l.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                      </td>
                                      <td className="py-3 px-2 text-center">
                                        <AddToQuoteButton 
                                          voo={l}
                                          isSelected={isSelected}
                                          onAdd={(sentido) => {
                                            adicionarVoo({
                                              id: `${l.numero}-${Date.now()}`,
                                              cia: l.cia,
                                              numero: l.numero,
                                              partida: l.partida,
                                              chegada: l.chegada,
                                              origem: l.origem,
                                              destino: l.destino,
                                              duracao: l.duracao,
                                              tarifa: l.tarifa,
                                              hasBag: l.hasBag,
                                              total: l.total,
                                              sentido: sentido,
                                              conexoes: [],
                                              breakdown: l.breakdown
                                            })
                                          }}
                                        />
                                      </td>
                                      <td className="py-3 pl-2 pr-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="font-bold text-gray-900 text-base">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                          <PriceTooltip breakdown={l.breakdown} total={l.total} />
                                        </div>
                                      </td>
                                    </tr>
                                  )
                                }
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg">
                          <div className="text-sm text-gray-500">
                            Mostrando <span className="font-medium">{(currentPageVolta - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPageVolta * itemsPerPage, linhasVolta.length)}</span> de <span className="font-medium">{linhasVolta.length}</span> resultados
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentPageVolta(p => Math.max(1, p - 1))}
                              disabled={currentPageVolta === 1 || totalPagesVolta === 0}
                              className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-gray-700">Página {currentPageVolta} de {totalPagesVolta}</span>
                            <button
                              onClick={() => setCurrentPageVolta(p => Math.min(totalPagesVolta, p + 1))}
                              disabled={currentPageVolta >= totalPagesVolta}
                              className="p-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    </>
                </div>
              </div>
            )}
          </div>
        )}

      <TariffRulesModal 
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        cia={selectedRuleCia}
        tipoTarifa={selectedRuleTariff}
      />
    </div>
    </div>
  )
}

export default AereoInter
