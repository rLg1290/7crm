import React, { useEffect, useRef, useState } from 'react'
import { Plane, Search, Minus, Plus, Calendar, MapPin, Users, Settings, Luggage, Ban, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { MOCK_FLIGHTS } from '../data/mockFlights'
import { Flight } from '../types/flight'
import { useNavigate } from 'react-router-dom'

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
  const [scope, setScope] = useState<'domestico'|'internacional'>('internacional')
  const [currentPageIda, setCurrentPageIda] = useState(1)
  const [currentPageVolta, setCurrentPageVolta] = useState(1)
  const [airlineLogos, setAirlineLogos] = useState<Record<string, string>>({})
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const itemsPerPage = 10
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
      // Validate required fields
      if (!r.Embarque || !r.Desembarque) {
        console.warn('Voo ignorado por falta de dados de data:', r)
        return
      }

      // Grouping key: Airline + Origin + Destination + Departure Time + Arrival Time
      const key = `${r.CompanhiaAparente}|${r.Origem}|${r.Destino}|${r.Embarque}|${r.Desembarque}`
      
      // Using AdultoF as requested. Fallback to AdultoR if needed (though AdultoF exists in mock)
      // Assuming CriancaF and BebeF follow same pattern, otherwise fallback to R
      const adultoVal = r.AdultoF || r.AdultoR || 0
      const criancaVal = (r as any).CriancaF || r.CriancaR || 0
      const bebeVal = (r as any).BebeF || r.BebeR || 0

      const variante = {
        id: r.id,
        tarifa: r.Tarifa,
        bag_mao_qty: 1, 
        bag_23_qty: r.BagagemDespachada,
        adulto: adultoVal,
        crianca: criancaVal,
        bebe: bebeVal,
        taxa: r.TaxaEmbarque,
        total_unitario: adultoVal + r.TaxaEmbarque, // Just for sorting/reference
        original: r
      }
      
      if (!map.has(key)) {
        // Calculate arrival ISO
        let arrivalISO = ''
        try {
          if (r.Desembarque && typeof r.Desembarque === 'string') {
            const parts = r.Desembarque.split('/')
            if (parts.length >= 3) {
              const [d, m, y_time] = parts
              const timeParts = y_time.trim().split(' ')
              if (timeParts.length >= 2) {
                const [y, time] = timeParts
                arrivalISO = `${y}-${m}-${d}T${time}:00`
              }
            }
          }
        } catch (e) {
          console.error('Erro ao processar data:', r.Desembarque)
        }

        if (!arrivalISO) {
           // Fallback if parsing fails, try to use Data if available or current date
           arrivalISO = r.Data || new Date().toISOString()
        }

        map.set(key, {
          cia: r.CompanhiaAparente,
          // Remove first 3 chars for display ID as requested
          numero: r.id && r.id.length > 3 ? r.id.substring(3) : r.id, 
          origem: r.Origem,
          destino: r.Destino,
          partida: r.Data, 
          chegada: arrivalISO,
          partida_fmt: r.Embarque,
          chegada_fmt: r.Desembarque,
          duracao: r.Duracao || '00:00',
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
    { id: 'SSA', iata_code: 'SSA', name: 'Salvador', municipality: 'Salvador', iso_country: 'BR' },
    { id: 'MIA', iata_code: 'MIA', name: 'Miami', municipality: 'Miami', iso_country: 'US' },
    { id: 'JFK', iata_code: 'JFK', name: 'New York JFK', municipality: 'New York', iso_country: 'US' },
    { id: 'LIS', iata_code: 'LIS', name: 'Lisbon', municipality: 'Lisbon', iso_country: 'PT' },
    { id: 'CDG', iata_code: 'CDG', name: 'Paris Charles de Gaulle', municipality: 'Paris', iso_country: 'FR' }
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

    try {
      // Logic to determine 'codigo' for International
      // Assuming INTERNACIONAL_NORMAL for now based on user pattern for domestico
      let codigo = 'INTERNACIONAL_NORMAL'
      
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

      console.log('Enviando Payload (Inter):', JSON.stringify(payload, null, 2))

      const response = await fetch('/api/7capi/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('Status da Resposta:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Corpo do Erro:', errorText)
        throw new Error(`Erro na API: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Dados Recebidos:', data)
      
      // The API returns { status: "success", data: [...], meta: {...} }
      // We need to pass data.data to mergeVoos
      if (data && Array.isArray(data.data)) {
        const merged = mergeVoos(data.data)
        resultadosStoreRef.current.internacional = merged
        setResultados(merged)
      } else if (Array.isArray(data)) {
        // Fallback in case API returns direct array
        const merged = mergeVoos(data)
        resultadosStoreRef.current.internacional = merged
        setResultados(merged)
      } else {
        console.error('Formato de resposta inesperado:', data)
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

        // Get Current User Company ID
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('empresa_id')
            .eq('id', user.id)
            .single()
          
          if (profile && profile.empresa_id) {
            setEmpresaId(profile.empresa_id)
          }
        }
      }
    }
    loadLogos()
  }, [])

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
        items = error ? [] : (data || [])
      }
      if (!items.length) {
        items = fallbackAirports.filter(a => (
          a.iata_code.toLowerCase().includes(term.toLowerCase()) ||
          a.name.toLowerCase().includes(term.toLowerCase()) ||
          (a.municipality || '').toLowerCase().includes(term.toLowerCase())
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
        items = error ? [] : (data || [])
      }
      if (!items.length) {
        items = fallbackAirports.filter(a => (
          a.iata_code.toLowerCase().includes(term.toLowerCase()) ||
          a.name.toLowerCase().includes(term.toLowerCase()) ||
          (a.municipality || '').toLowerCase().includes(term.toLowerCase())
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
    if (uniqueCias.length > 0 && selectedCias.length === 0) {
      setSelectedCias(uniqueCias)
    }
  }, [uniqueCias])

  const linhas = React.useMemo(() => {
    const list: any[] = []
    resultados.forEach((r) => {
      // Filter by Airline (Multiple Selection)
      if (selectedCias.length > 0 && !selectedCias.includes(r.cia)) return

      // Iterate over ALL variants to display them as separate rows
      const variantes = (r as any).variantes || []
      
      variantes.forEach((v: any) => {
        // Bag logic based on Tariff
        const hasBag = v.tarifa === 'Standard'

        // Filter by Baggage (Only Bag)
        if (onlyBag && !hasBag) return

        // Calculate Total based on user formula:
        const numAdultos = formData.adultos
        const numCriancas = formData.criancas
        const numBebes = formData.bebes
        const numTotal = numAdultos + numCriancas + numBebes
        
        const totalPreco = 
          (v.adulto * numAdultos) + 
          (v.crianca * numCriancas) + 
          (v.bebe * numBebes) + 
          (v.taxa * numTotal)

        // Check if connection details exist
        const hasConexoes = r.escala > 0 && r.detalhesConexoes && r.detalhesConexoes.length > 0
        const conexoes = hasConexoes ? r.detalhesConexoes : []

        list.push({
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
          if (!a.duracao || !b.duracao) return 0
          try {
            const [hA, mA] = a.duracao.split(':').map(Number)
            const [hB, mB] = b.duracao.split(':').map(Number)
            return (hA * 60 + mA) - (hB * 60 + mB)
          } catch (e) { return 0 }
        }
        case 'duration_desc': {
          if (!a.duracao || !b.duracao) return 0
          try {
            const [hA, mA] = a.duracao.split(':').map(Number)
            const [hB, mB] = b.duracao.split(':').map(Number)
            return (hB * 60 + mB) - (hA * 60 + mA)
          } catch (e) { return 0 }
        }
        default:
          return a.total - b.total
      }
    })
  }, [resultados, formData, selectedCias, onlyBag, sortOrder])

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

    // Fallback to static URLs if not found in DB
    if (upperCia.includes('GOL')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Gol_Transportes_A%C3%A9reos_-_Logo.svg/2560px-Gol_Transportes_A%C3%A9reos_-_Logo.svg.png'
    if (upperCia.includes('AZUL')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Azul_Linhas_Aereas_Brasileiras_logo.svg/2560px-Azul_Linhas_Aereas_Brasileiras_logo.svg.png'
    if (upperCia.includes('LATAM')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Latam-logo_-v_%28Indigo%29.svg/2560px-Latam-logo_-v_%28Indigo%29.svg.png'
    if (upperCia.includes('AVIANCA')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Avianca_logo.svg/2560px-Avianca_logo.svg.png'
    if (upperCia.includes('COPA')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Copa_Airlines_Logo.svg/2560px-Copa_Airlines_Logo.svg.png'
    
    return null
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
                  <h1 className="text-2xl font-bold text-gray-900">Aéreo • Internacional</h1>
                </div>
                <p className="text-sm text-gray-500">Busque e compare passagens aéreas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full border border-green-500 overflow-hidden text-xs bg-white p-0.5">
                <button type="button" className="px-4 py-1.5 rounded-full text-gray-700" onClick={() => navigate('/aereodomestico')}>Doméstico</button>
                <button type="button" className="px-4 py-1.5 rounded-full bg-green-500 text-white">Internacional</button>
              </div>
            </div>
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
            {/* Ida */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                name="dataIda"
                value={formData.dataIda}
                onChange={handleInputChange}
                className="bg-transparent text-sm focus:outline-none text-gray-600"
              />
            </div>
            {/* Volta + Somente ida */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                name="dataVolta"
                value={formData.dataVolta}
                onChange={handleInputChange}
                disabled={formData.somenteIda}
                className={`bg-transparent text-sm focus:outline-none text-gray-600 ${formData.somenteIda ? 'opacity-40 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <input
                type="checkbox"
                checked={formData.somenteIda}
                onChange={(e) => setFormData(prev => ({...prev, somenteIda: e.target.checked, dataVolta: e.target.checked ? prev.dataVolta : ''}))}
                className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-600">Somente ida</span>
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
                        <button type="button" onClick={() => setShowClassDropdown(v => !v)} className="w-full text-left px-3 py-2 border border-gray-300 rounded-md text-sm">
                          {formData.classe === 'EXECUTIVA' ? 'Classe: Executiva' : 'Classe: Econômica'}
                        </button>
                        {showClassDropdown && (
                          <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow p-2">
                            <button type="button" onClick={() => { setFormData(prev => ({...prev, classe: 'ECONÔMICA'})); setShowClassDropdown(false)}} className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm">Econômica</button>
                            <button type="button" onClick={() => { setFormData(prev => ({...prev, classe: 'EXECUTIVA'})); setShowClassDropdown(false)}} className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm">Executiva</button>
                          </div>
                        )}
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
                    {/* Airline Filter */}
                    <div className="relative group">
                      <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white flex items-center gap-2">
                        <span>Cias Aéreas ({selectedCias.length})</span>
                      </button>
                      <div className="absolute top-full left-0 pt-2 w-48 z-20 hidden group-hover:block">
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
                                <th className="py-3 pl-2 pr-4 text-right">total</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {paginatedIda.map((l, i) => {
                                if (l.conexoes && l.conexoes.length > 0) {
                                  return (
                                    <React.Fragment key={`${l.numero}-${l.tarifa}-${i}`}>
                                      {l.conexoes.map((c: any, cIdx: number) => {
                                        const partC = c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                        const chegC = c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                        return (
                                          <tr key={`${i}-${cIdx}`} className={`group bg-gray-50/50 ${cIdx === l.conexoes.length - 1 ? 'border-b border-gray-400' : ''}`}>
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
                                                <td className="py-3 pl-2 pr-4 text-right align-middle" rowSpan={l.conexoes.length}>
                                                  <div className="flex items-center justify-end gap-2">
                                                    <span className="font-bold text-gray-900 text-base">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                                    <button className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-100 transition-colors"><Search className="h-4 w-4 transform rotate-90" /></button>
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
                                    <tr key={`${l.numero}-${l.tarifa}-${i}`} className="hover:bg-purple-50 transition-colors group border-b border-gray-400">
                                      <td className="py-3 pl-4 pr-2">
                                        {getAirlineLogo(l.cia) ? <img src={getAirlineLogo(l.cia)!} alt={l.cia} className="h-5 w-auto object-contain" /> : <span className="font-semibold text-gray-700">{l.cia}</span>}
                                      </td>
                                      <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{l.numero}</div></td>
                                      <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{part.toLocaleDateString('pt-BR')} - {part.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                      <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{cheg.toLocaleDateString('pt-BR')} - {cheg.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                      <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={l.origem}>{l.origem}</td>
                                      <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={l.destino}>{l.destino}</td>
                                      <td className="py-3 px-2 text-center text-gray-600 uppercase font-medium text-xs">{l.tarifa}</td>
                                      <td className="py-3 px-2 text-center">
                                        {l.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                      </td>
                                      <td className="py-3 pl-2 pr-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="font-bold text-gray-900 text-base">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                          <button className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-100 transition-colors"><Search className="h-4 w-4 transform rotate-90" /></button>
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
                      <div className="mt-8 border-t-4 border-gray-100 pt-8">
                        <div className="px-6 pb-4">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-50">
                              <Plane className="h-6 w-6 text-orange-600 transform -rotate-135" />
                            </div>
                            Voos de Volta
                          </h3>
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
                                if (l.conexoes && l.conexoes.length > 0) {
                                  return (
                                    <React.Fragment key={`${l.numero}-${l.tarifa}-${i}`}>
                                      {l.conexoes.map((c: any, cIdx: number) => {
                                        const partC = c.EmbarqueCompleto ? new Date(c.EmbarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                        const chegC = c.DesembarqueCompleto ? new Date(c.DesembarqueCompleto.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')) : new Date()
                                        return (
                                          <tr key={`${i}-${cIdx}`} className={`group bg-gray-50/50 ${cIdx === l.conexoes.length - 1 ? 'border-b border-gray-400' : ''}`}>
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
                                                <td className="py-3 pl-2 pr-4 text-right align-middle" rowSpan={l.conexoes.length}>
                                                  <div className="flex items-center justify-end gap-2">
                                                    <span className="font-bold text-gray-900 text-base">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                                    <button className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-100 transition-colors"><Search className="h-4 w-4 transform rotate-90" /></button>
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
                                    <tr key={`${l.numero}-${l.tarifa}-${i}`} className="hover:bg-purple-50 transition-colors group border-b border-gray-400">
                                      <td className="py-3 pl-4 pr-2">
                                        {getAirlineLogo(l.cia) ? <img src={getAirlineLogo(l.cia)!} alt={l.cia} className="h-5 w-auto object-contain" /> : <span className="font-semibold text-gray-700">{l.cia}</span>}
                                      </td>
                                      <td className="py-3 px-2 text-gray-600 font-medium"><div className="flex items-center gap-1">{l.numero}</div></td>
                                      <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{part.toLocaleDateString('pt-BR')} - {part.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                      <td className="py-3 px-2 text-gray-900 whitespace-nowrap">{cheg.toLocaleDateString('pt-BR')} - {cheg.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                      <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]" title={l.origem}>{l.origem}</td>
                                      <td className="py-3 px-2 text-gray-600 truncate max-w-[200px]" title={l.destino}>{l.destino}</td>
                                      <td className="py-3 px-2 text-center text-gray-600 uppercase font-medium text-xs">{l.tarifa}</td>
                                      <td className="py-3 px-2 text-center">
                                        {l.hasBag ? <div className="flex items-center justify-center text-purple-700" title="Bagagem Inclusa"><Luggage className="h-5 w-5" /></div> : <div className="flex items-center justify-center text-red-400" title="Sem Bagagem"><Ban className="h-5 w-5" /></div>}
                                      </td>
                                      <td className="py-3 pl-2 pr-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="font-bold text-gray-900 text-base">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                          <button className="text-purple-600 hover:text-purple-800 p-1 rounded-full hover:bg-purple-100 transition-colors"><Search className="h-4 w-4 transform rotate-90" /></button>
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
      </div>
    </div>
  )
}

export default AereoInter
