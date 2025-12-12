import React, { useEffect, useRef, useState } from 'react'
import { Plane, Search, Minus, Plus, Calendar, MapPin, Users, Settings } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

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

const Aereo = () => {
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
  const [scope, setScope] = useState<'domestico'|'internacional'>('domestico')
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
  const exemploVoosRaw = [
    {
      cia_aparente: 'GOL LINHAS AEREAS',
      numero_voo: 'G3-1381',
      origem: 'GIG',
      destino: 'GRU',
      embarque: '06/06/2026 06:15',
      desembarque: '06/06/2026 07:30',
      duracao: '01:15',
      numero_conexoes: 0,
      adulto: 608.09,
      taxa_embarque: 34.11,
      adicionais: 0,
      bagagem_despachada_23kg: 0,
      bagagem_mao_10kg: 1
    },
    {
      cia_aparente: 'GOL LINHAS AEREAS',
      numero_voo: 'G3-1375',
      origem: 'GIG',
      destino: 'GRU',
      embarque: '06/06/2026 11:10',
      desembarque: '06/06/2026 12:25',
      duracao: '01:15',
      numero_conexoes: 0,
      adulto: 608.09,
      taxa_embarque: 34.11,
      adicionais: 0,
      bagagem_despachada_23kg: 0,
      bagagem_mao_10kg: 1
    },
    {
      cia_aparente: 'GOL LINHAS AEREAS',
      numero_voo: 'G3-1377',
      origem: 'GIG',
      destino: 'GRU',
      embarque: '06/06/2026 15:15',
      desembarque: '06/06/2026 16:30',
      duracao: '01:15',
      numero_conexoes: 0,
      adulto: 608.09,
      taxa_embarque: 34.11,
      adicionais: 0,
      bagagem_despachada_23kg: 0,
      bagagem_mao_10kg: 1
    },
    {
      cia_aparente: 'GOL LINHAS AEREAS',
      numero_voo: 'G3-1379',
      origem: 'GIG',
      destino: 'GRU',
      embarque: '06/06/2026 21:00',
      desembarque: '06/06/2026 22:05',
      duracao: '01:05',
      numero_conexoes: 0,
      adulto: 608.09,
      taxa_embarque: 34.11,
      adicionais: 0,
      bagagem_despachada_23kg: 1,
      bagagem_mao_10kg: 1
    },
    {
      cia_aparente: 'GOL LINHAS AEREAS',
      numero_voo: 'G3-1001',
      origem: 'SDU',
      destino: 'CGH',
      embarque: '06/06/2026 06:30',
      desembarque: '06/06/2026 07:35',
      duracao: '01:05',
      numero_conexoes: 0,
      adulto: 615.85,
      taxa_embarque: 59.95,
      adicionais: 0,
      bagagem_despachada_23kg: 0,
      bagagem_mao_10kg: 1
    }
  ]
  const brToIso = (s: string) => {
    const [date, time] = s.split(' ')
    const [d, m, y] = date.split('/')
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${time}:00`
  }
  const buildResultadosFromRaw = (raw: any[], classe: string) => {
    return raw.slice(0, 5).map((r: any) => ({
      cia: r.cia_aparente,
      numero: r.numero_voo,
      origem: r.origem,
      destino: r.destino,
      partida: brToIso(r.embarque),
      chegada: brToIso(r.desembarque),
      duracao: r.duracao,
      preco: Number(r.adulto) + Number(r.taxa_embarque) + Number(r.adicionais),
      adulto: Number(r.adulto),
      taxa_embarque: Number(r.taxa_embarque),
      adicionais: Number(r.adicionais),
      bag_mao: Boolean(r.bagagem_mao_10kg),
      bag_23: Boolean(r.bagagem_despachada_23kg),
      bag_mao_qty: Number(r.bagagem_mao_10kg || 0),
      bag_23_qty: Number(r.bagagem_despachada_23kg || 0),
      classe: classe,
      escala: r.numero_conexoes || 0
    }))
  }
  const mergeVoos = (items: any[]) => {
    const map = new Map<string, any>()
    items.forEach((r) => {
      const key = `${r.cia}|${r.numero}|${r.partida}|${r.chegada}`
      const varianteBase = {
        bag_mao_qty: r.bag_mao_qty,
        bag_23_qty: r.bag_23_qty,
        adicionais: r.adicionais,
        preco_total: r.adulto + r.taxa_embarque + r.adicionais
      }
      const varianteAlternativa = {
        bag_mao_qty: r.bag_mao_qty, // mantém mão
        bag_23_qty: r.bag_23_qty === 1 ? 0 : 1,
        adicionais: r.bag_23_qty === 1 ? 0 : 105.73,
        preco_total: r.adulto + r.taxa_embarque + (r.bag_23_qty === 1 ? 0 : 105.73)
      }
      if (!map.has(key)) {
        map.set(key, { ...r, variantes: [varianteBase, varianteAlternativa] })
      } else {
        const v = map.get(key)
        // evita duplicações idênticas
        const exists = v.variantes.some((va: any) => va.bag_23_qty === varianteBase.bag_23_qty)
        if (!exists) v.variantes.push(varianteBase)
      }
    })
    const merged = Array.from(map.values())
    merged.forEach(m => m.variantes.sort((a: any, b: any) => a.bag_23_qty - b.bag_23_qty))
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

  const handlePesquisar = () => {
    setSearched(true)
    setLoading(true)
    setResultados([])
    setCollapsed(true)
    setTimeout(() => {
      const exemplos = buildResultadosFromRaw(exemploVoosRaw, formData.classe)
      const merged = mergeVoos(exemplos)
      resultadosStoreRef.current[scope] = merged
      setResultados(merged)
      setLoading(false)
    }, 1800)
  }

  const totalPassageiros = formData.adultos + formData.criancas + formData.bebes

  useEffect(() => {
    if (!searched) {
      const exemplos = buildResultadosFromRaw(exemploVoosRaw, formData.classe)
      const merged = mergeVoos(exemplos)
      resultadosStoreRef.current.domestico = merged
      resultadosStoreRef.current.internacional = merged
      setResultados(resultadosStoreRef.current[scope])
      setSearched(true)
      setCollapsed(true)
    }
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
      const key = `${r.origem}-${r.destino}-${Number(r.adulto || 0).toFixed(2)}`
      if (!map[key]) {
        map[key] = {
          origem: r.origem,
          destino: r.destino,
          adulto: Number(r.adulto || 0),
          taxa: Number(r.taxa_embarque || 0),
          voos: [] as any[]
        }
      }
      map[key].voos.push(r)
    })
    return Object.values(map)
  }, [resultados])

  const linhas = React.useMemo(() => {
    const list = resultados.map((r) => {
      const key = `${r.cia}|${r.numero}|${r.partida}|${r.chegada}`
      const idx = variantSelected[key] ?? 0
      const v = (r as any).variantes ? (r as any).variantes[idx] : { bag_mao_qty: r.bag_mao_qty, bag_23_qty: r.bag_23_qty, preco_total: r.adulto + r.taxa_embarque + r.adicionais }
      return {
        cia: r.cia,
        numero: r.numero,
        partida: r.partida,
        chegada: r.chegada,
        origem: r.origem,
        destino: r.destino,
        escala: r.escala,
        bag: `${v.bag_mao_qty}Mão ${v.bag_23_qty}Desp`,
        classe: r.classe,
        total: v.preco_total
      }
    })
    return list.sort((a,b) => new Date(a.partida).getTime() - new Date(b.partida).getTime())
  }, [resultados, variantSelected])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho + Barra compacta (pill) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 shadow-lg border border-sky-200">
                <Plane className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Aéreo</h1>
                <p className="text-gray-600">Busque e compare passagens aéreas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full border border-gray-300 overflow-hidden text-xs bg-white">
                <button type="button" className={`px-4 py-2 ${scope==='domestico'?'bg-teal-600 text-white':'text-gray-700'}`} onClick={() => { setScope('domestico'); setResultados(resultadosStoreRef.current.domestico || []); setVariantSelected(variantStoreRef.current.domestico || {}); setFormData(formStoreRef.current.domestico) }}>Doméstico</button>
                <button type="button" className={`px-4 py-2 border-l border-gray-300 ${scope==='internacional'?'bg-teal-600 text-white':'text-gray-700'}`} onClick={() => { setScope('internacional'); setResultados(resultadosStoreRef.current.internacional || []); setVariantSelected(variantStoreRef.current.internacional || {}); setFormData(formStoreRef.current.internacional) }}>Internacional</button>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-full shadow-sm px-3 py-2 flex items-center gap-2">
            {/* Origem */}
            <div className="relative flex items-center gap-2 flex-1">
              <MapPin className="h-4 w-4 text-teal-600" />
              {origemSelecionada ? (
                <button
                  type="button"
                  className="px-3 py-1 rounded-full bg-teal-50 border border-teal-300 text-teal-700 text-xs"
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
                  className="w-full bg-transparent text-sm placeholder-gray-400 focus:outline-none"
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
            <div className="h-6 w-px bg-gray-200" />
            {/* Destino */}
            <div className="relative flex items-center gap-2 flex-1">
              <MapPin className="h-4 w-4 text-teal-600" />
              {destinoSelecionada ? (
                <button
                  type="button"
                  className="px-3 py-1 rounded-full bg-teal-50 border border-teal-300 text-teal-700 text-xs"
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
                  className="w-full bg-transparent text-sm placeholder-gray-400 focus:outline-none"
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
            <div className="h-6 w-px bg-gray-200" />
            {/* Ida */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              <input
                type="date"
                name="dataIda"
                value={formData.dataIda}
                onChange={handleInputChange}
                className="bg-transparent text-sm focus:outline-none"
              />
            </div>
            <div className="h-6 w-px bg-gray-200" />
            {/* Volta + Somente ida */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              <input
                type="date"
                name="dataVolta"
                value={formData.dataVolta}
                onChange={handleInputChange}
                disabled={formData.somenteIda}
                className={`bg-transparent text-sm focus:outline-none ${formData.somenteIda ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({...prev, somenteIda: !prev.somenteIda, dataVolta: prev.somenteIda ? prev.dataVolta : ''}))}
                className={`text-xs px-2 py-1 rounded-full border ${formData.somenteIda ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                title="Somente ida"
              >
                Somente ida
              </button>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            {/* Passageiros • Classe */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPaxDropdown(v => !v)}
                className="pl-8 pr-3 py-2 rounded-full text-sm focus:outline-none flex items-center gap-2 hover:bg-gray-50"
                title="Selecionar passageiros e classe"
              >
                <Users className="h-4 w-4 text-teal-600 absolute left-2" />
                <span>{`${totalPassageiros} pax`} • {formData.classe === 'EXECUTIVA' ? 'Executiva' : 'Econômica'}</span>
              </button>
              {showPaxDropdown && (
                <div className="absolute z-10 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3">
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
            <div className="h-6 w-px bg-gray-200" />
            {/* Botão Pesquisar */}
            <button onClick={handlePesquisar} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-full text-sm flex items-center shadow">
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

            {/* Seção: Destinos */}
            <div className="mb-8 hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Destinos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Origem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origem
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="origem"
                      value={formData.origem}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Onde você está?"
                    />
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                  </div>
                </div>

                {/* Destino */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destino
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="destino"
                      value={formData.destino}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Para onde você quer ir?"
                    />
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Datas */}
            <div className="mb-8 hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Datas da Viagem
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Data Ida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Ida
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dataIda"
                      value={formData.dataIda}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Data Volta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Volta
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dataVolta"
                      value={formData.dataVolta}
                      onChange={handleInputChange}
                      disabled={formData.somenteIda}
                      className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        formData.somenteIda ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                      }`}
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Checkbox Somente Ida */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="somenteIda"
                  id="somenteIda"
                  checked={formData.somenteIda}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="somenteIda" className="ml-3 text-sm font-medium text-gray-700">
                  Somente ida (sem volta)
                </label>
              </div>
            </div>

            {/* Seção: Passageiros */}
            <div className="mb-8 hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Passageiros ({totalPassageiros} {totalPassageiros === 1 ? 'pessoa' : 'pessoas'})
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Adultos */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">Adultos</div>
                        <div className="text-sm text-gray-500">12+ anos</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('adultos', 'decrementar')}
                          disabled={formData.adultos <= 1}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{formData.adultos}</span>
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('adultos', 'incrementar')}
                          disabled={totalPassageiros >= 9}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Crianças */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">Crianças</div>
                        <div className="text-sm text-gray-500">2-11 anos</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('criancas', 'decrementar')}
                          disabled={formData.criancas <= 0}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{formData.criancas}</span>
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('criancas', 'incrementar')}
                          disabled={totalPassageiros >= 9}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bebês */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">Bebês</div>
                        <div className="text-sm text-gray-500">0-2 anos</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('bebes', 'decrementar')}
                          disabled={formData.bebes <= 0}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{formData.bebes}</span>
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('bebes', 'incrementar')}
                          disabled={totalPassageiros >= 9}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {totalPassageiros >= 9 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Grupos (Acima de 09 pessoas) a solicitação deve ser feita offline via e-mail
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Seção: Classe */}
            <div className="mb-8 hidden">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Classe do Voo
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'ECONÔMICA', label: 'Econômica', description: 'Básica' },
                  { value: 'PREMIUM ECONOMY', label: 'Premium Economy', description: 'Conforto extra' },
                  { value: 'EXECUTIVA', label: 'Executiva', description: 'Business' },
                  { value: 'PRIMEIRA CLASSE', label: 'Primeira Classe', description: 'Luxo máximo' }
                ].map((classe) => (
                  <label
                    key={classe.value}
                    className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.classe === classe.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="classe"
                      value={classe.value}
                      checked={formData.classe === classe.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <Plane className={`h-6 w-6 mb-2 ${
                      formData.classe === classe.value ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-semibold text-center">{classe.label}</div>
                    <div className="text-xs text-center opacity-75">{classe.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Botão Pesquisar */}
            <div className="hidden">
              <button
                onClick={handlePesquisar}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg flex items-center transition-colors shadow-lg hover:shadow-xl"
              >
                <Search className="h-6 w-6 mr-3" />
                Pesquisar Passagens
              </button>
            </div>
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
                  <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
                  <Plane className="absolute inset-0 m-auto h-8 w-8 text-purple-600 animate-bounce" />
                </div>
                <div className="mt-4 text-gray-700 font-medium">Buscando voos...</div>
                <div className="mt-2 w-full max-w-md">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 bg-purple-600 animate-[loading_1.8s_ease_infinite]" style={{ width: '40%' }}></div>
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
                    <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs">
                      <button type="button" className={`px-3 py-2 ${viewMode==='table'?'bg-gray-200 font-semibold':'bg-white'}`} onClick={() => setViewMode('table')}>Tabela</button>
                      <button type="button" className={`px-3 py-2 border-l border-gray-300 ${viewMode==='cards'?'bg-gray-200 font-semibold':'bg-white'}`} onClick={() => setViewMode('cards')}>Cards</button>
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
                </div>
                <div className="p-6 space-y-4">
                  {viewMode==='table' ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b">
                            <th className="py-2 pr-3">cia</th>
                            <th className="py-2 pr-3">voo</th>
                            <th className="py-2 pr-3">saída</th>
                            <th className="py-2 pr-3">chegada</th>
                            <th className="py-2 pr-3">origem</th>
                            <th className="py-2 pr-3">destino</th>
                            <th className="py-2 pr-3">esc</th>
                            <th className="py-2 pr-3">tipo</th>
                            <th className="py-2 pr-3">bag.</th>
                            <th className="py-2 pr-3">classe</th>
                            <th className="py-2 pr-3 text-right">total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {linhas.map((l, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              <td className="py-2 pr-3 text-gray-900">{l.cia}</td>
                              <td className="py-2 pr-3 font-semibold text-gray-900">{l.numero}</td>
                              <td className="py-2 pr-3 text-gray-900">{new Date(l.partida).toLocaleDateString('pt-BR')} • {new Date(l.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                              <td className="py-2 pr-3 text-gray-900">{new Date(l.chegada).toLocaleDateString('pt-BR')} • {new Date(l.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                              <td className="py-2 pr-3 text-gray-900">{l.origem}</td>
                              <td className="py-2 pr-3 text-gray-900">{l.destino}</td>
                              <td className="py-2 pr-3 text-gray-900">{l.escala}</td>
                              <td className="py-2 pr-3 text-gray-900">OW</td>
                              <td className="py-2 pr-3 text-gray-900">{l.bag}</td>
                              <td className="py-2 pr-3 text-gray-900">{l.classe}</td>
                              <td className="py-2 pr-3 text-right font-semibold text-gray-900">R$ {Number(l.total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                  grupos.map((g, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-0 overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-gray-900">{g.origem} → {g.destino}</div>
                            <div className="text-xs text-gray-600">{g.voos.length} opções</div>
                          </div>
                          <div className="space-y-2">
                            {g.voos.map((r: any, i: number) => (
                              <div key={i} className="grid grid-cols-2 md:grid-cols-[220px_1fr_200px_1fr_140px] gap-3 items-center px-3 py-2 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <div className="h-7 w-7 bg-purple-600 text-white rounded-md flex items-center justify-center text-xs font-semibold">{r.cia.substring(0,1)}</div>
                                  <div>
                                    <div className="text-xs text-gray-500">{r.cia}</div>
                                    <div className="text-xs font-semibold text-gray-900">{r.numero}</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-gray-500">Origem</div>
                                  <div className="text-sm font-semibold text-gray-900">{r.origem} • {new Date(r.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-gray-500">Duração / Conexões</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 rounded-full border border-orange-300 text-orange-700">{r.duracao}</span>
                                    <span className="text-xs text-gray-700">{r.escala > 0 ? `${r.escala} conexão${r.escala>1?'es':''}` : 'Voo direto'}</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] text-gray-500">Destino</div>
                                  <div className="text-sm font-semibold text-gray-900">{r.destino} • {new Date(r.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                                </div>
                                <div className="md:flex md:justify-end items-center gap-2">
                                  {(() => {
                                    const vooKey = `${r.cia}|${r.numero}|${r.partida}|${r.chegada}`
                                    const selectedIdx = variantSelected[vooKey] ?? 0
                                    const variante = (r as any).variantes ? (r as any).variantes[selectedIdx] : { bag_mao_qty: r.bag_mao_qty, bag_23_qty: r.bag_23_qty }
                                    return (
                                      <>
                                        <div className="inline-flex items-center px-3 py-1 rounded-md border border-blue-300 text-xs font-medium text-blue-700">
                                          {`${variante.bag_mao_qty}Mão ${variante.bag_23_qty}Desp`}
                                        </div>
                                        {(r as any).variantes && (
                                          <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs">
                                            <button type="button" className={`px-2 py-1 ${selectedIdx===0?'bg-gray-200 font-semibold':'bg-white'}`} onClick={() => setVariantSelected(prev => ({...prev, [vooKey]: 0}))}>Sem desp</button>
                                            <button type="button" className={`px-2 py-1 border-l border-gray-300 ${selectedIdx===1?'bg-gray-200 font-semibold':'bg-white'}`} onClick={() => setVariantSelected(prev => ({...prev, [vooKey]: 1}))}>Com desp</button>
                                          </div>
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-orange-50 border-l border-gray-200 p-4">
                          <div className="text-right">
                            <div className="text-xs text-orange-700">Por adulto, sem taxas</div>
                            <div className="text-2xl font-extrabold text-orange-700">R$ {Number(g.adulto).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
                          </div>
                          <div className="mt-3 bg-white rounded-lg border border-orange-200 p-3 text-sm">
                            <div className="flex items-center justify-between"><span className="text-gray-600">1 adulto</span><span className="font-semibold text-gray-900">R$ {Number(g.adulto).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
                            <div className="flex items-center justify-between"><span className="text-gray-600">Taxa embarque (adulto)</span><span className="font-semibold text-gray-900">R$ {Number(g.taxa).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
                            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between"><span className="text-gray-700">Total</span><span className="font-bold text-gray-900">R$ {Number(g.adulto + g.taxa).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
                          </div>
                          <div className="mt-3 flex flex-col gap-2">
                            <button type="button" className="w-full py-2 rounded-md bg-orange-600 text-white text-sm font-semibold">Comprar</button>
                            <button type="button" className="w-full py-2 rounded-md bg-white border border-orange-300 text-orange-700 text-sm font-semibold">Baixar orçamento</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Aereo 
