import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plane, Search, Minus, Plus, Calendar as CalendarIcon, MapPin, Users, Settings, Luggage, Ban, ChevronLeft, ChevronRight, FileText, Check, Trash2, Info } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { MOCK_FLIGHTS } from '../data/mockFlights'
import { Flight } from '../types/flight'
import { useNavigate } from 'react-router-dom'
import { useSearchCache } from '../hooks/useSearchCache'
import SearchTimer from '../components/SearchTimer'
import { useCotacao } from '../contexts/CotacaoContext'
import { getAirlineLogoUrl } from '../utils/airlineLogos'
import { Calendar } from '../components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import TariffRulesModal from '../components/TariffRulesModal'

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
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={() => setOpen(false)} onClick={(e) => e.stopPropagation()}>
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

const AereoDomestico = () => {
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
  const [showClassDropdown, setShowClassDropdown] = useState(false)
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
  const [scope, setScope] = useState<'domestico'|'internacional'>('domestico')
  const [currentPageIda, setCurrentPageIda] = useState(1)
  const [currentPageVolta, setCurrentPageVolta] = useState(1)
  const [airlineLogos, setAirlineLogos] = useState<Record<string, string>>({})
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [defaultDuRate, setDefaultDuRate] = useState<number>(0)
  const itemsPerPage = 10
  const { expiresAt, saveCache, loadCache, clearCache } = useSearchCache('flight_search_domestico')
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
  const [searchParams, setSearchParams] = useState<BuscaPassagem | null>(null)

  const processFlights = (flights: Flight[], date: string) => {
    if (!date) return []
    const [year, month, day] = date.split('-')
    const newDateBr = `${day}/${month}/${year}`

    return flights.map(f => {
      const [origDate, origTime] = f.Embarque.split(' ')
      
      // Calculate arrival date based on duration
      const [durH, durM] = f.Duracao.split(':').map(Number)
      const startDate = new Date(Number(year), Number(month)-1, Number(day), ...origTime.split(':').map(Number))
      const endDate = new Date(startDate.getTime() + (durH * 60 + durM) * 60000)
      
      const endDay = String(endDate.getDate()).padStart(2, '0')
      const endMonth = String(endDate.getMonth() + 1).padStart(2, '0')
      const endYear = endDate.getFullYear()
      const endHour = String(endDate.getHours()).padStart(2, '0')
      const endMin = String(endDate.getMinutes()).padStart(2, '0')
      
      const newEmbarque = `${newDateBr} ${origTime}`
      const newDesembarque = `${endDay}/${endMonth}/${endYear} ${endHour}:${endMin}`
      
      return {
        ...f,
        Embarque: newEmbarque,
        Desembarque: newDesembarque,
        Data: `${year}-${month}-${day}T${origTime}:00`
      }
    })
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
    { id: 'GIG', iata_code: 'GIG', name: 'Rio de Janeiro', municipality: 'Rio de Janeiro', iso_country: 'BR' },
    { id: 'GRU', iata_code: 'GRU', name: 'São Paulo/Guarulhos', municipality: 'Guarulhos', iso_country: 'BR' },
    { id: 'CGH', iata_code: 'CGH', name: 'São Paulo/Congonhas', municipality: 'São Paulo', iso_country: 'BR' },
    { id: 'SDU', iata_code: 'SDU', name: 'Rio de Janeiro/Santos Dumont', municipality: 'Rio de Janeiro', iso_country: 'BR' },
    { id: 'BSB', iata_code: 'BSB', name: 'Brasília', municipality: 'Brasília', iso_country: 'BR' },
    { id: 'CNF', iata_code: 'CNF', name: 'Belo Horizonte/Confins', municipality: 'Confins', iso_country: 'BR' },
    { id: 'REC', iata_code: 'REC', name: 'Recife', municipality: 'Recife', iso_country: 'BR' },
    { id: 'SSA', iata_code: 'SSA', name: 'Salvador', municipality: 'Salvador', iso_country: 'BR' }
  ]
  const [origemSelecionada, setOrigemSelecionada] = useState<any | null>(null)
  const [destinoSelecionada, setDestinoSelecionada] = useState<any | null>(null)
  const origemInputRef = useRef<HTMLInputElement>(null)
  const destinoInputRef = useRef<HTMLInputElement>(null)

  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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
      
      // Validar limite mínimo de adultos
      if (tipo === 'adultos' && novoValor < 1) {
        return prev
      }
      
      // Validar limite total de passageiros
      const total = (tipo === 'adultos' ? novoValor : prev.adultos) + 
                   (tipo === 'criancas' ? novoValor : prev.criancas) + 
                   (tipo === 'bebes' ? novoValor : prev.bebes)
      
      if (total > 9) {
        return prev
      }
      
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
      // Fallback or alert? For now using the user provided example ID if state is empty, or better: warn user
      // alert('Erro: Usuário não vinculado a uma empresa.')
      // return
    }
    
    setLoading(true)
    setSearched(true)
    setCollapsed(true)
    setResultados([])
    setSearchParams({ ...formData })
    clearCache()

    try {
      // Logic to determine 'codigo'
      let codigo = 'DOMESTICO_NORMAL'
      const today = new Date()
      const tripDate = new Date(formData.dataIda)
      const diffTime = Math.abs(tripDate.getTime() - today.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
      
      if (diffDays > 4) {
        codigo = 'DOMESTICO_NORMAL'
      } else {
        // Fallback or other code
        codigo = 'DOMESTICO_NORMAL' 
      }

      // Date Formatting (YYYY-MM-DD -> DD/MM/YYYY)
      const formatDate = (dateStr: string) => {
        if (!dateStr) return ''
        const [y, m, d] = dateStr.split('-')
        return `${d}/${m}/${y}`
      }

      const payload = {
        codigo: codigo,
        auth: empresaId || "8e23591e-e0af-42f8-a002-6df935bab14a", // Fallback for dev/testing if needed
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

      // Solução Definitiva: Usando Proxy PHP Local
      // Isso evita o CORS pois a requisição é feita do Frontend -> Mesmo Servidor (proxy.php) -> API Externa
      // O arquivo proxy.php deve estar na pasta public/ do projeto
      
      const isDev = import.meta.env.DEV;
      // Em dev usa o proxy do vite, em prod usa o script PHP
      const endpoint = isDev ? '/api/7capi/search' : '/proxy.php';

      console.log('✈️ Buscando voos via:', endpoint);
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
      
      // The API returns { status: "success", data: [...], meta: {...} }
      // We need to pass data.data to mergeVoos
      if (data && Array.isArray(data.data)) {
        const merged = mergeVoos(data.data)
        resultadosStoreRef.current.domestico = merged
        setResultados(merged)
        
        // Save full results including 'original' to ensure we have the complete API response
        saveCache({ ...formData, origemSelecionada, destinoSelecionada }, merged, 'domestico')
      } else if (Array.isArray(data)) {
        // Fallback in case API returns direct array (though logs show it returns object with data property)
        const merged = mergeVoos(data)
        resultadosStoreRef.current.domestico = merged
        setResultados(merged)

        // Save full results including 'original'
        saveCache({ ...formData, origemSelecionada, destinoSelecionada }, merged, 'domestico')
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
      if (cached && cached.type === 'domestico') {
        setFormData(cached.formData)
        setSearchParams(cached.formData)
        setResultados(cached.results)
        resultadosStoreRef.current.domestico = cached.results
        setSearched(true)
        setCollapsed(true)
      }
    }
    fetchCache()
  }, [loadCache])

  useEffect(() => {
    // Carrega todos os voos mockados ao iniciar a página, sem filtrar por origem/destino
    // Usamos os dados diretos do mock pois já estão formatados corretamente (2026)
    // const flights = MOCK_FLIGHTS
    // const merged = mergeVoos(flights)
    
    // resultadosStoreRef.current.domestico = merged
    // resultadosStoreRef.current.internacional = merged
    
    // setResultados(merged)
    // setSearched(true)
    // setCollapsed(true)
    // setLoading(false)
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
        // Client-side filter as backup if RPC is not updated yet
        items = error ? [] : (data || []).filter((a: any) => a.iso_country === 'BR')
      }
      if (!items.length) {
        items = fallbackAirports.filter(a => (
          (a.iata_code.toLowerCase().includes(term.toLowerCase()) ||
          a.name.toLowerCase().includes(term.toLowerCase()) ||
          (a.municipality || '').toLowerCase().includes(term.toLowerCase())) &&
          a.iso_country === 'BR'
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
        // Client-side filter as backup if RPC is not updated yet
        items = error ? [] : (data || []).filter((a: any) => a.iso_country === 'BR')
      }
      if (!items.length) {
        items = fallbackAirports.filter(a => (
          (a.iata_code.toLowerCase().includes(term.toLowerCase()) ||
          a.name.toLowerCase().includes(term.toLowerCase()) ||
          (a.municipality || '').toLowerCase().includes(term.toLowerCase())) &&
          a.iso_country === 'BR'
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

  // Initialize selectedCias with all available airlines when results change
  useEffect(() => {
    if (uniqueCias.length > 0) {
      setSelectedCias(uniqueCias)
    }
  }, [uniqueCias])

  const [selectedIda, setSelectedIda] = useState<any | null>(null)
  const [selectedVolta, setSelectedVolta] = useState<any | null>(null)

  const [modalRules, setModalRules] = useState<{isOpen: boolean, cia: string, tipoTarifa: string}>({
    isOpen: false,
    cia: '',
    tipoTarifa: ''
  })

  const openRules = (cia: string, tipoTarifa: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setModalRules({
        isOpen: true,
        cia,
        tipoTarifa
    })
  }

  const handleSelectFlight = (flight: any, type: 'ida' | 'volta') => {
    // Normalizar objeto se for uma variante ou voo completo
    const flightData = { ...flight }
    
    // Garantir que conexões sejam preservadas corretamente
    if (flight.conexoes && Array.isArray(flight.conexoes)) {
        flightData.conexoes = [...flight.conexoes]
    }

    if (type === 'ida') {
      if (selectedIda?.uniqueId === flightData.uniqueId) {
        setSelectedIda(null)
        // If unselecting Ida, clear Volta as well to reset state
        setSelectedVolta(null)
      } else {
        setSelectedIda(flightData)
        // Se já tiver volta selecionada e for de cia diferente, limpa a volta
        if (selectedVolta && selectedVolta.cia !== flightData.cia) {
          setSelectedVolta(null)
        }
      }
    } else {
      if (!selectedIda) {
        alert('Por favor, selecione o voo de ida primeiro.')
        return
      }
      if (selectedVolta?.uniqueId === flightData.uniqueId) {
        setSelectedVolta(null)
      } else {
        setSelectedVolta(flightData)
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
      // Pequeno delay para garantir IDs diferentes se necessário, ou apenas sufixo
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

    // Limpar seleção após adicionar
    setSelectedIda(null)
    setSelectedVolta(null)
    alert('Voos selecionados adicionados ao orçamento!')
  }

  const handleEmitir = () => {
    navigate('/emissao-aereo', { 
        state: { 
            ida: selectedIda, 
            volta: selectedVolta,
            searchParams: searchParams || formData
        } 
    })
  }

  const linhas = React.useMemo(() => {
    const list: any[] = []
    // Use searchParams if available to ensure prices match the search query, not the current form state
    const params = searchParams || formData
    
    resultados.forEach((r) => {
      // Filter by Airline (Multiple Selection)
      if (selectedCias.length > 0 && !selectedCias.includes(r.cia)) return

      // Filter by Selected Outbound Airline (prevent mixing airlines)
      if (selectedIda && r.cia !== selectedIda.cia) return

      // Iterate over ALL variants to display them as separate rows
      const variantes = (r as any).variantes || []
      
      variantes.forEach((v: any, vIdx: number) => {
        // Bag logic based on Tariff
        const hasBag = v.bag_23_qty > 0

        // Filter by Baggage (Only Bag)
        if (onlyBag && !hasBag) return

        // Calculate Total based on user formula:
        const numAdultos = params.adultos
        const numCriancas = params.criancas
        const numBebes = params.bebes
        const numTotal = numAdultos + numCriancas + numBebes
        
        const totalSemDu = 
          (v.adulto * numAdultos) + 
          (v.crianca * numCriancas) + 
          (v.bebe * numBebes) + 
          (v.taxa * numTotal)
        
        const duValue = totalSemDu * (defaultDuRate / 100)
        const totalPreco = totalSemDu + duValue

        // Check if connection details exist
        const hasConexoes = r.escala > 0 && r.detalhesConexoes && r.detalhesConexoes.length > 0
        const conexoes = hasConexoes ? r.detalhesConexoes : []
        
        // Generate unique ID for this list item
        const uniqueId = `${r.numero}-${v.tarifa}-${totalPreco.toFixed(2)}-${vIdx}`

        list.push({
          uniqueId, // Add unique ID
          cia: r.cia,
          numero: r.numero, // Already processed in mergeVoos (id minus 3 chars)
          partida: r.partida,
          chegada: r.chegada,
          origem: r.origem,
          destino: r.destino,
          escala: r.escala,
          conexoes: conexoes,
          // Bag column logic
          hasBag: hasBag,
          tarifa: v.tarifa,
          classe: v.tarifa, // Using tarifa as class for now as per previous, or mapped
          total: totalPreco,
          dados_voo: v.original, // Preserve the full API object
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

    // Sorting Logic
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
  }, [resultados, formData, searchParams, selectedCias, onlyBag, sortOrder, defaultDuRate, selectedIda])

  const linhasIda = React.useMemo(() => linhas.filter(l => !l.sentido || l.sentido === 'ida'), [linhas])
  const linhasVolta = React.useMemo(() => linhas.filter(l => l.sentido === 'volta'), [linhas])

  // Pagination Logic
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

  // Reset page when results change or filter changes
  useEffect(() => {
    setCurrentPageIda(1)
  }, [linhasIda.length])

  useEffect(() => {
    setCurrentPageVolta(1)
  }, [linhasVolta.length])

  const getAirlineLogo = (cia: string) => {
    // Try to find exact match or partial match in loaded logos
    const upperCia = cia.trim().toUpperCase()
    
    // Direct match check from Supabase data
    for (const [key, url] of Object.entries(airlineLogos)) {
      if (upperCia.includes(key)) return url
    }

    // Fallback to static reliable URLs
    const staticUrl = getAirlineLogoUrl(upperCia)
    if (staticUrl) return staticUrl

    // Legacy Fallback (just in case)
    if (upperCia.includes('GOL')) return 'https://pics.avs.io/200/200/G3.png'
    
    return null
  }

  const handleResetSearch = () => {
    setSearched(false)
    setResultados([])
    setCollapsed(false)
    setSelectedCias([])
    clearCache()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1920px] mx-auto bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Cabeçalho + Barra compacta (pill) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white shadow-sm border border-gray-100">
                <Plane className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">Aéreo • Doméstico</h1>
                </div>
                <p className="text-sm text-gray-500">Busque e compare passagens aéreas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full border border-green-500 overflow-hidden text-xs bg-white p-0.5">
                <button type="button" className="px-4 py-1.5 rounded-full bg-green-500 text-white">Doméstico</button>
                <button type="button" className="px-4 py-1.5 rounded-full text-gray-700" onClick={() => navigate('/aereointer')}>Internacional</button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setFormData(prev => ({ ...prev, somenteIda: false }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!formData.somenteIda ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
                Ida e Volta
            </button>
            <button 
                onClick={() => setFormData(prev => ({ ...prev, somenteIda: true, dataVolta: '' }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${formData.somenteIda ? 'bg-teal-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
                Somente Ida
            </button>
          </div>
          <div className="bg-white border-0 rounded-xl shadow-sm px-4 py-3 flex items-center gap-4">
            {/* Origem */}
            <div className="relative flex items-center gap-2 flex-1 bg-gray-100 rounded-lg px-3 py-2">
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
            <div className="relative flex items-center gap-2 flex-1 bg-gray-100 rounded-lg px-3 py-2">
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
            {/* Datas */}
            <div className="relative" ref={calendarRef}>
                <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 min-w-[240px] h-full hover:bg-gray-200 transition-colors"
                >
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] text-gray-500 font-bold uppercase leading-tight tracking-wide">
                            {formData.somenteIda ? 'Data da Viagem' : 'Ida e Volta'}
                        </span>
                        <span className="text-sm text-gray-900 font-semibold leading-tight mt-0.5">
                            {formData.dataIda ? format(new Date(formData.dataIda + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                            {!formData.somenteIda && (
                                <>
                                    {' - '}
                                    {formData.dataVolta ? format(new Date(formData.dataVolta + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : 'Volta'}
                                </>
                            )}
                        </span>
                    </div>
                </button>

                {showCalendar && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in duration-200">
                         <Calendar
                            {...{
                                mode: formData.somenteIda ? "single" : "range",
                                selected: formData.somenteIda 
                                ? (formData.dataIda ? new Date(formData.dataIda + 'T12:00:00') : undefined)
                                : {
                                    from: formData.dataIda ? new Date(formData.dataIda + 'T12:00:00') : undefined,
                                    to: formData.dataVolta ? new Date(formData.dataVolta + 'T12:00:00') : undefined
                                },
                                onSelect: (val: any) => {
                                    if (formData.somenteIda) {
                                        const date = val as Date | undefined;
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            dataIda: date ? format(date, 'yyyy-MM-dd') : '',
                                            dataVolta: ''
                                        }));
                                        setShowCalendar(false);
                                    } else {
                                         const range = val as { from: Date; to?: Date } | undefined;
                                         setFormData(prev => ({
                                             ...prev,
                                             dataIda: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
                                             dataVolta: range?.to ? format(range.to, 'yyyy-MM-dd') : ''
                                         }));
                                    }
                                },
                                disabled: { before: new Date() },
                                numberOfMonths: 2,
                                locale: ptBR,
                                pagedNavigation: true
                            } as any}
                         />
                    </div>
                )}
            </div>
            {/* Passageiros • Classe */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPaxDropdown(v => !v)}
                className="px-3 py-2 rounded-lg text-sm focus:outline-none flex items-center gap-2 hover:bg-gray-200 bg-gray-100 text-gray-700"
                title="Selecionar passageiros e classe"
              >
                <Users className="h-4 w-4 text-gray-500" />
                <span>{`${totalPassageiros} pax • ${formData.classe === 'EXECUTIVA' ? 'Executiva' : 'Econômica'}`}</span>
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
            <button onClick={handlePesquisar} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-6 rounded-full text-sm flex items-center shadow transition-colors">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </button>
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
                <div className="mt-4 text-gray-700 font-medium">Buscando voos...</div>
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
                      onExpire={handleResetSearch} 
                    />
                    <button
                      onClick={handleResetSearch}
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
                             <div className="h-6 w-6 bg-white rounded-full flex items-center justify-center">
                               <Check className="h-4 w-4 text-blue-700" strokeWidth={3} />
                             </div>
                             Voos Selecionados
                           </h3>
                           <div className="text-right">
                              <span className="text-blue-100 text-xs block">Total da Seleção</span>
                              <span className="font-bold text-xl">R$ {((selectedIda?.total || 0) + (selectedVolta?.total || 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                           </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                             <thead className="bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                                <tr>
                                   <th className="py-3 pl-4 pr-2 text-left w-20">TIPO</th>
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
                             <tbody className="divide-y divide-gray-200 bg-white">
                                {[
                                  { flight: selectedIda, type: 'IDA', color: 'bg-blue-600' },
                                  { flight: selectedVolta, type: 'VOLTA', color: 'bg-orange-500' }
                                ].map(({ flight, type, color }) => {
                                  if (!flight) return null;
                                  
                                  if (flight.conexoes && flight.conexoes.length > 0) {
                                     return flight.conexoes.map((c: any, cIdx: number) => {
                                       const partC = c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                       const chegC = c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                       
                                       return (
                                         <tr 
                                            key={`${flight.uniqueId}-${cIdx}`} 
                                            className={`bg-white ${cIdx === flight.conexoes.length - 1 ? '' : 'border-b-0'} hover:bg-red-50 cursor-pointer transition-colors group`}
                                            onClick={() => type === 'IDA' ? setSelectedIda(null) : setSelectedVolta(null)}
                                            title="Clique para remover este voo da seleção"
                                         >
                                           {cIdx === 0 && (
                                             <td className="py-3 pl-4 pr-2 align-middle border-r border-gray-100" rowSpan={flight.conexoes.length}>
                                               <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${color} text-white uppercase tracking-wide`}>
                                                 {type}
                                               </span>
                                             </td>
                                           )}
                                           {cIdx === 0 && (
                                             <td className="py-3 pl-4 pr-2 align-middle" rowSpan={flight.conexoes.length}>
                                                {getAirlineLogo(flight.cia) ? (
                                                  <img src={getAirlineLogo(flight.cia)!} alt={flight.cia} className="h-5 w-auto object-contain" />
                                                ) : (
                                                  <span className="font-semibold text-gray-700">{flight.cia}</span>
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
                                               <td className="py-3 px-2 text-center align-middle" rowSpan={flight.conexoes.length}>
                                                  <button
                                                     onClick={(e) => openRules(flight.cia, flight.tarifa, e)}
                                                     className="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-blue-700 transition-colors gap-1 text-xs uppercase font-medium"
                                                     title="Ver regras da tarifa"
                                                  >
                                                     {flight.tarifa}
                                                     <Info className="h-3 w-3" />
                                                  </button>
                                               </td>
                                               <td className="py-3 px-2 text-center align-middle" rowSpan={flight.conexoes.length}>
                                                 {flight.hasBag ? <div className="flex items-center justify-center text-teal-600" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                               </td>
                                               <td className="py-3 pl-2 pr-4 text-right align-middle" rowSpan={flight.conexoes.length}>
                                                  <span className="font-bold text-gray-900 text-base">R$ {Number(flight.total).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits: 2})}</span>
                                               </td>
                                             </>
                                           )}
                                         </tr>
                                       )
                                     })
                                  } else {
                                     const part = new Date(flight.partida)
                                     const cheg = new Date(flight.chegada)
                                     return (
                                       <tr 
                                         key={flight.uniqueId} 
                                         className="bg-white hover:bg-red-50 cursor-pointer transition-colors"
                                         onClick={() => type === 'IDA' ? setSelectedIda(null) : setSelectedVolta(null)}
                                         title="Clique para remover este voo da seleção"
                                       >
                                          <td className="py-3 pl-4 pr-2 align-middle border-r border-gray-100">
                                             <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${color} text-white uppercase tracking-wide`}>
                                               {type}
                                             </span>
                                          </td>
                                          <td className="py-3 pl-4 pr-2">
                                             {getAirlineLogo(flight.cia) ? <img src={getAirlineLogo(flight.cia)!} alt={flight.cia} className="h-5 w-auto object-contain" /> : <span className="font-semibold text-gray-700">{flight.cia}</span>}
                                          </td>
                                          <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{flight.numero}</div></td>
                                          <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{part.toLocaleDateString('pt-BR')} - {part.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                          <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{cheg.toLocaleDateString('pt-BR')} - {cheg.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                          <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={flight.origem}>{flight.origem}</td>
                                          <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={flight.destino}>{flight.destino}</td>
                                          <td className="py-3 px-2 text-center">
                                             <button
                                                onClick={(e) => openRules(flight.cia, flight.tarifa, e)}
                                                className="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-blue-700 transition-colors gap-1 text-xs uppercase font-medium"
                                                title="Ver regras da tarifa"
                                             >
                                                {flight.tarifa}
                                                <Info className="h-3 w-3" />
                                             </button>
                                          </td>
                                          <td className="py-3 px-2 text-center">
                                             {flight.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                          </td>
                                          <td className="py-3 pl-2 pr-4 text-right">
                                             <span className="font-bold text-gray-900 text-base">R$ {Number(flight.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                          </td>
                                       </tr>
                                     )
                                  }
                                })}
                             </tbody>
                          </table>
                        </div>
                        
                        <div className="bg-white px-6 py-4 flex items-center justify-end">
                          <button
                            onClick={handleEmitir}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Emitir
                          </button>
                        </div>
                      </div>
                    )}

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
                            {paginatedIda.map((l, i) => {
                              const isSelected = selectedIda?.uniqueId === l.uniqueId
                              const isInQuote = voosSelecionados.some(v => 
                                v.numero === l.numero && 
                                v.tarifa === l.tarifa && 
                                v.partida === l.partida && 
                                v.sentido === 'ida'
                              )
                              return (
                                <tbody 
                                  key={`${l.numero}-${l.tarifa}-${i}`}
                                  onClick={() => handleSelectFlight(l, 'ida')}
                                  className={`cursor-pointer transition-all border-b border-gray-200 hover:bg-blue-50/30 ${isSelected ? 'bg-blue-50 !border-2 !border-blue-600 relative z-10 shadow-lg' : 'bg-white'}`}
                                >
                                  {l.conexoes && l.conexoes.length > 0 ? (
                                    <>
                                      {l.conexoes.map((c: any, cIdx: number) => {
                                        const partC = c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                        const chegC = c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                        return (
                                          <tr key={`${i}-${cIdx}`} className={`${cIdx === l.conexoes.length - 1 ? '' : ''}`}>
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
                                            <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                               <button
                                                  onClick={(e) => openRules(l.cia, l.tarifa, e)}
                                                  className="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-blue-700 transition-colors gap-1 text-xs uppercase font-medium"
                                                  title="Ver regras da tarifa"
                                               >
                                                  {l.tarifa}
                                                  <Info className="h-3 w-3" />
                                               </button>
                                            </td>
                                                <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                                  {l.hasBag ? <div className="flex items-center justify-center text-teal-600" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                                </td>
                                                <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                                  <AddToQuoteButton 
                                                    voo={l}
                                                    isSelected={isInQuote}
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
                                                    breakdown: l.breakdown,
                                                    dados_voo: l.dados_voo
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
                                    </>
                                  ) : (
                                    <tr className="">
                                      {(() => {
                                        const part = new Date(l.partida)
                                        const cheg = new Date(l.chegada)
                                        return (
                                          <>
                                            <td className="py-3 pl-4 pr-2">
                                              {getAirlineLogo(l.cia) ? <img src={getAirlineLogo(l.cia)!} alt={l.cia} className="h-5 w-auto object-contain" /> : <span className="font-semibold text-gray-700">{l.cia}</span>}
                                            </td>
                                            <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{l.numero}</div></td>
                                            <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{part.toLocaleDateString('pt-BR')} - {part.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                            <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{cheg.toLocaleDateString('pt-BR')} - {cheg.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={l.origem}>{l.origem}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={l.destino}>{l.destino}</td>
                                            <td className="py-3 px-2 text-center">
                                              <button
                                                onClick={(e) => openRules(l.cia, l.tarifa, e)}
                                                className="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-blue-700 transition-colors gap-1 text-xs uppercase font-medium"
                                                title="Ver regras da tarifa"
                                              >
                                                {l.tarifa}
                                                <Info className="h-3 w-3" />
                                              </button>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                              {l.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                              <AddToQuoteButton 
                                                voo={l}
                                                isSelected={isInQuote}
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
                                          </>
                                        )
                                      })()}
                                    </tr>
                                  )}
                                </tbody>
                              )
                            })}
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
                            {paginatedVolta.map((l, i) => {
                              const isSelected = selectedVolta?.uniqueId === l.uniqueId
                              const isInQuote = voosSelecionados.some(v => 
                                v.numero === l.numero && 
                                v.tarifa === l.tarifa && 
                                v.partida === l.partida && 
                                v.sentido === 'volta'
                              )
                              return (
                                <tbody 
                                  key={`${l.numero}-${l.tarifa}-${i}`}
                                  onClick={() => handleSelectFlight(l, 'volta')}
                                  className={`cursor-pointer transition-all border-b border-gray-200 hover:bg-blue-50/30 ${isSelected ? 'bg-blue-50 !border-2 !border-blue-600 relative z-10 shadow-lg' : 'bg-white'}`}
                                >
                                  {l.conexoes && l.conexoes.length > 0 ? (
                                    <>
                                      {l.conexoes.map((c: any, cIdx: number) => {
                                        const partC = c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                        const chegC = c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                        return (
                                          <tr key={`${i}-${cIdx}`} className={`${cIdx === l.conexoes.length - 1 ? '' : ''}`}>
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
                                                <td className="py-3 px-2 text-center text-gray-600 uppercase font-medium text-xs align-middle" rowSpan={l.conexoes.length}>{l.tarifa}</td>
                                                <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                                  {l.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                                </td>
                                                <td className="py-3 px-2 text-center align-middle" rowSpan={l.conexoes.length}>
                                                  <AddToQuoteButton 
                                                    voo={l}
                                                    isSelected={isInQuote}
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
                                    </>
                                  ) : (
                                    <tr className="">
                                      {(() => {
                                        const part = new Date(l.partida)
                                        const cheg = new Date(l.chegada)
                                        return (
                                          <>
                                            <td className="py-3 pl-4 pr-2">
                                              {getAirlineLogo(l.cia) ? <img src={getAirlineLogo(l.cia)!} alt={l.cia} className="h-5 w-auto object-contain" /> : <span className="font-semibold text-gray-700">{l.cia}</span>}
                                            </td>
                                            <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{l.numero}</div></td>
                                            <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{part.toLocaleDateString('pt-BR')} - {part.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                            <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{cheg.toLocaleDateString('pt-BR')} - {cheg.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={l.origem}>{l.origem}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={l.destino}>{l.destino}</td>
                                            <td className="py-3 px-2 text-center">
                                               <button
                                                  onClick={(e) => openRules(l.cia, l.tarifa, e)}
                                                  className="inline-flex items-center px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-blue-700 transition-colors gap-1 text-xs uppercase font-medium"
                                                  title="Ver regras da tarifa"
                                               >
                                                  {l.tarifa}
                                                  <Info className="h-3 w-3" />
                                               </button>
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                              {l.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                            </td>
                                            <td className="py-3 px-2 text-center">
                                              <AddToQuoteButton 
                                                voo={l}
                                                isSelected={isInQuote}
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
                                          </>
                                        )
                                      })()}
                                    </tr>
                                  )}
                                </tbody>
                              )
                            })}
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
      </div>
      <TariffRulesModal
        isOpen={modalRules.isOpen}
        onClose={() => setModalRules(prev => ({ ...prev, isOpen: false }))}
        cia={modalRules.cia}
        tipoTarifa={modalRules.tipoTarifa}
      />
    </div>
  )
}

export default AereoDomestico
