import React, { useEffect, useRef, useState } from 'react'
import { Plane, Search, Minus, Plus, Calendar, MapPin, Users, Settings } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
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

const AereoDomestico = () => {
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
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [ciaLogos, setCiaLogos] = useState<Record<string, string>>({})
  const [sortMode, setSortMode] = useState<'price'|'dep_earliest'|'dep_latest'|'dur_shortest'|'dur_longest'>('price')

  const exemploVoosRaw = [
    { cia_aparente: 'GOL LINHAS AEREAS', numero_voo: 'G3-1381', origem: 'GIG', destino: 'GRU', embarque: '06/06/2026 06:15', desembarque: '06/06/2026 07:30', duracao: '01:15', numero_conexoes: 0, adulto: 608.09, taxa_embarque: 34.11, adicionais: 0, bagagem_despachada_23kg: 0, bagagem_mao_10kg: 1 },
    { cia_aparente: 'GOL LINHAS AEREAS', numero_voo: 'G3-1375', origem: 'GIG', destino: 'GRU', embarque: '06/06/2026 11:10', desembarque: '06/06/2026 12:25', duracao: '01:15', numero_conexoes: 0, adulto: 608.09, taxa_embarque: 34.11, adicionais: 0, bagagem_despachada_23kg: 0, bagagem_mao_10kg: 1 },
    { cia_aparente: 'GOL LINHAS AEREAS', numero_voo: 'G3-1377', origem: 'GIG', destino: 'GRU', embarque: '06/06/2026 15:15', desembarque: '06/06/2026 16:30', duracao: '01:15', numero_conexoes: 0, adulto: 608.09, taxa_embarque: 34.11, adicionais: 0, bagagem_despachada_23kg: 0, bagagem_mao_10kg: 1 },
    { cia_aparente: 'GOL LINHAS AEREAS', numero_voo: 'G3-1379', origem: 'GIG', destino: 'GRU', embarque: '06/06/2026 21:00', desembarque: '06/06/2026 22:05', duracao: '01:05', numero_conexoes: 0, adulto: 608.09, taxa_embarque: 34.11, adicionais: 0, bagagem_despachada_23kg: 1, bagagem_mao_10kg: 1 },
    { cia_aparente: 'GOL LINHAS AEREAS', numero_voo: 'G3-1001', origem: 'SDU', destino: 'CGH', embarque: '06/06/2026 06:30', desembarque: '06/06/2026 07:35', duracao: '01:05', numero_conexoes: 0, adulto: 615.85, taxa_embarque: 59.95, adicionais: 0, bagagem_despachada_23kg: 0, bagagem_mao_10kg: 1 }
  ]

  const brToIso = (s: string) => {
    const [date, time] = s.split(' ')
    const [d, m, y] = date.split('/')
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T${time}:00`
  }
  const isoToBrDate = (iso: string) => {
    if (!iso) return ''
    const [y,m,d] = iso.split('-')
    return `${d.padStart(2,'0')}/${m.padStart(2,'0')}/${y}`
  }
  const calcPrazo = (isoDataIda: string) => {
    if (!isoDataIda) return 'normal'
    const hoje = new Date()
    const ida = new Date(isoDataIda)
    const diffMs = ida.getTime() - hoje.getTime()
    const diffDays = Math.floor(diffMs / (1000*60*60*24))
    return diffDays <= 5 ? 'proximo' : 'normal'
  }
  const normalizaClasse = (c: string) => {
    const v = (c || '').toLowerCase()
    if (v.includes('execut')) return 'executiva'
    return 'economica'
  }

  const buildResultadosFromRaw = (raw: any[], classe: string) => {
    return raw.map((r: any) => ({
      cia: r.cia_aparente,
      numero: r.numero_voo,
      tarifa: r.tarifa,
      origem: r.origem,
      destino: r.destino,
      partida: brToIso(r.embarque),
      chegada: brToIso(r.desembarque),
      duracao: r.duracao,
      preco: Number(r.adulto) + Number(r.taxa_embarque) + Number(r.adicionais),
      adulto: Number(r.adulto),
      taxa_embarque: Number(r.taxa_embarque),
      adicionais: Number(r.adicionais),
      bag_mao: Boolean(String(r.cia_aparente || '').toUpperCase().includes('LATAM') ? (r.bagagem_mao_12kg) : (r.bagagem_mao_10kg)),
      bag_23: Boolean(r.bagagem_despachada_23kg),
      bag_mao_qty: Number(String(r.cia_aparente || '').toUpperCase().includes('LATAM') ? (r.bagagem_mao_12kg || 0) : (r.bagagem_mao_10kg || 0)),
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
        adulto: r.adulto,
        taxa_embarque: r.taxa_embarque,
        adicionais: r.adicionais,
        preco_total: r.adulto + r.taxa_embarque + r.adicionais,
        tarifa: r.tarifa
      }
      if (!map.has(key)) {
        map.set(key, { ...r, variantes: [varianteBase] })
      } else {
        const v = map.get(key)
        const exists = v.variantes.some((va: any) => (va.tarifa || '') === (varianteBase.tarifa || ''))
        if (!exists) v.variantes.push(varianteBase)
      }
    })
    const merged = Array.from(map.values())
    merged.forEach(m => m.variantes.sort((a: any, b: any) => (a.bag_23_qty - b.bag_23_qty) || (a.adicionais - b.adicionais)))
    return merged
  }

  const getMinPrice = (r: any) => {
    const vars = (r.variantes || []) as any[]
    if (!vars.length) return Number(r.adulto || 0) + Number(r.taxa_embarque || 0) + Number(r.adicionais || 0)
    return Math.min(...vars.map(v => Number(v.preco_total || (Number(r.adulto||0)+Number(r.taxa_embarque||0)+Number(v.adicionais||0)))))
  }
  const durToMinutes = (s: string) => {
    if (!s) return 0
    const [hh,mm] = s.split(':')
    return Number(hh)*60 + Number(mm)
  }

  const fallbackAirports = [
    { id: 'GIG', iata_code: 'GIG', name: 'Rio de Janeiro', municipality: 'Rio de Janeiro', iso_country: 'BR' },
    { id: 'GRU', iata_code: 'GRU', name: 'São Paulo/Guarulhos', municipality: 'Guarulhos', iso_country: 'BR' },
    { id: 'CGH', iata_code: 'CGH', name: 'São Paulo/Congonhas', municipality: 'São Paulo', iso_country: 'BR' },
    { id: 'SDU', iata_code: 'SDU', name: 'Rio de Janeiro/Santos Dumont', municipality: 'Rio de Janeiro', iso_country: 'BR' },
    { id: 'BSB', iata_code: 'BSB', name: 'Brasília', municipality: 'Brasília', iso_country: 'BR' },
    { id: 'CNF', iata_code: 'CNF', name: 'Belo Horizonte/Confins', municipality: 'Confins', iso_country: 'BR' }
  ]
  const [origemSelecionada, setOrigemSelecionada] = useState<any | null>(null)
  const [destinoSelecionada, setDestinoSelecionada] = useState<any | null>(null)
  const origemInputRef = useRef<HTMLInputElement>(null)
  const destinoInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const ajustarPassageiros = (tipo: 'adultos' | 'criancas' | 'bebes', operacao: 'incrementar' | 'decrementar') => {
    setFormData(prev => {
      const novoValor = operacao === 'incrementar' ? prev[tipo] + 1 : Math.max(0, prev[tipo] - 1)
      if (tipo === 'adultos' && novoValor < 1) return prev
      const total = (tipo === 'adultos' ? novoValor : prev.adultos) + (tipo === 'criancas' ? novoValor : prev.criancas) + (tipo === 'bebes' ? novoValor : prev.bebes)
      if (total > 9) return prev
      return { ...prev, [tipo]: novoValor }
    })
  }

  const handlePesquisar = async () => {
    setSearched(true)
    setLoading(true)
    setResultados([])
    setCollapsed(true)
    try {
      const session = await supabase.auth.getSession()
      
      let codigoAgencia = ''
      const empresaId = session.data.session?.user?.user_metadata?.empresa_id || ''
      const metaCodigo = session.data.session?.user?.user_metadata?.codigo_agencia || ''
      if (empresaId) {
        try {
          const { data } = await supabase
            .from('empresas')
            .select('codigo_agencia')
            .eq('id', empresaId)
            .single()
          codigoAgencia = (data?.codigo_agencia || metaCodigo || '').toString()
        } catch {
          codigoAgencia = (metaCodigo || '').toString()
        }
      } else {
        codigoAgencia = (metaCodigo || '').toString()
      }

      const body = {
        origem: (formData.origem || '').trim().toUpperCase(),
        destino: (formData.destino || '').trim().toUpperCase(),
        data_ida: isoToBrDate(formData.dataIda),
        data_volta: formData.somenteIda ? '' : isoToBrDate(formData.dataVolta),
        adultos: formData.adultos,
        criancas: formData.criancas,
        bebes: formData.bebes,
        classe: normalizaClasse(formData.classe),
        tipo: 'domestico',
        prazo: calcPrazo(formData.dataIda),
        codigo_agencia: codigoAgencia
      }
      console.log('buscar-voos body', body)
      const res = await fetch('https://ethmgnxyrgpkzgmkocwk.supabase.co/functions/v1/buscar-voos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })
      const json = await res.json().catch(() => ({ success: false, voos: [] }))
      const raw = Array.isArray(json.voos) && json.voos.length ? json.voos : exemploVoosRaw
      const exemplos = buildResultadosFromRaw(raw, formData.classe)
      const merged = mergeVoos(exemplos)
      setResultados(merged)
      setPage(1)
    } catch (e) {
      const exemplos = buildResultadosFromRaw(exemploVoosRaw, formData.classe)
      const merged = mergeVoos(exemplos)
      setResultados(merged)
      setPage(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const unique = Array.from(new Set(resultados.map(r => (r.cia || '').trim()))).filter(n => n && !(n in ciaLogos))
    if (!unique.length) return
    if (!isSupabaseConfigured) return
    supabase
      .from('CiasAereas')
      .select('NomeBuscador, logo_url')
      .in('NomeBuscador', unique)
      .then(({ data }) => {
        if (Array.isArray(data)) {
          const next = { ...ciaLogos }
          data.forEach((row: any) => { if (row?.NomeBuscador) next[String(row.NomeBuscador)] = String(row.logo_url || '') })
          setCiaLogos(next)
        }
      })
      .catch(() => {})
  }, [resultados])

  const totalPassageiros = formData.adultos + formData.criancas + formData.bebes

  useEffect(() => {
    if (!searched) {
      const exemplos = buildResultadosFromRaw(exemploVoosRaw, formData.classe)
      const merged = mergeVoos(exemplos)
      setResultados(merged)
      setSearched(true)
      setCollapsed(true)
    }
  }, [])

  useEffect(() => {
    const term = formData.origem.trim()
    if (term.length < 2) { setOrigemSugestoes([]); return }
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
    const term = formData.destino.trim()
    if (term.length < 2) { setDestinoSugestoes([]); return }
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

  const sortedResultados = React.useMemo(() => {
    const arr = [...resultados]
    if (sortMode === 'price') arr.sort((a,b) => getMinPrice(a) - getMinPrice(b))
    else if (sortMode === 'dep_earliest') arr.sort((a,b) => new Date(a.partida).getTime() - new Date(b.partida).getTime())
    else if (sortMode === 'dep_latest') arr.sort((a,b) => new Date(b.partida).getTime() - new Date(a.partida).getTime())
    else if (sortMode === 'dur_shortest') arr.sort((a,b) => durToMinutes(a.duracao) - durToMinutes(b.duracao))
    else if (sortMode === 'dur_longest') arr.sort((a,b) => durToMinutes(b.duracao) - durToMinutes(a.duracao))
    return arr
  }, [resultados, sortMode])
  const pagedResultados = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedResultados.slice(start, start + pageSize)
  }, [sortedResultados, page])

  const grupos = React.useMemo(() => {
    const map: Record<string, any> = {}
    pagedResultados.forEach((r) => {
      const key = `${r.origem}-${r.destino}-${Number(r.adulto || 0).toFixed(2)}`
      if (!map[key]) {
        map[key] = { origem: r.origem, destino: r.destino, adulto: Number(r.adulto || 0), taxa: Number(r.taxa_embarque || 0), voos: [] as any[] }
      }
      map[key].voos.push(r)
    })
    return Object.values(map)
  }, [pagedResultados])

  const linhas = React.useMemo(() => {
    const list = pagedResultados.map((r) => {
      const key = `${r.cia}|${r.numero}|${r.partida}|${r.chegada}`
      const idx = variantSelected[key] ?? 0
      const v = (r as any).variantes ? (r as any).variantes[idx] : { bag_mao_qty: r.bag_mao_qty, bag_23_qty: r.bag_23_qty, preco_total: r.adulto + r.taxa_embarque + r.adicionais }
      return { cia: r.cia, numero: r.numero, partida: r.partida, chegada: r.chegada, origem: r.origem, destino: r.destino, escala: r.escala, bag: `${v.bag_mao_qty}Mão ${v.bag_23_qty}Desp`, classe: r.classe, total: v.preco_total }
    })
    return list.sort((a,b) => new Date(a.partida).getTime() - new Date(b.partida).getTime())
  }, [pagedResultados, variantSelected])

  const navigate = useNavigate()
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 shadow-lg border border-sky-200">
                <Plane className="h-8 w-8 text-sky-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Aéreo • Doméstico</h1>
                <p className="text-gray-600">Busque e compare passagens aéreas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full border border-gray-300 overflow-hidden text-xs bg-white">
                <button type="button" className={`px-4 py-2 bg-teal-600 text-white`}>Doméstico</button>
                <button type="button" className={`px-4 py-2 border-l border-gray-300 text-gray-700`} onClick={() => navigate('/aereointer')}>Internacional</button>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-full shadow-sm px-3 py-2 flex items-center gap-2">
            <div className="relative flex items-center gap-2 flex-1">
              <MapPin className="h-4 w-4 text-teal-600" />
              {origemSelecionada ? (
                <button type="button" className="px-3 py-1 rounded-full bg-teal-50 border border-teal-300 text-teal-700 text-xs" onClick={() => { setOrigemSelecionada(null); setShowOrigemSugestoes(true); setTimeout(() => origemInputRef.current?.focus(), 0) }}>
                  {origemSelecionada.iata_code} - {origemSelecionada.municipality || origemSelecionada.name}
                </button>
              ) : (
                <input ref={origemInputRef} type="text" name="origem" value={formData.origem} onChange={handleInputChange} placeholder="Origem" className="w-full bg-transparent text-sm placeholder-gray-400 focus:outline-none" onFocus={() => setShowOrigemSugestoes(true)} onBlur={() => setTimeout(() => setShowOrigemSugestoes(false), 150)} />
              )}
              {showOrigemSugestoes && origemSugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20">
                  <ul className="max-h-64 overflow-auto">
                    {origemSugestoes.map((a) => (
                      <li key={a.id}>
                        <button type="button" className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between" onMouseDown={() => { setFormData(prev => ({ ...prev, origem: a.iata_code })); setOrigemSugestoes([]); setShowOrigemSugestoes(false); setOrigemSelecionada(a) }}>
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
            <div className="relative flex items-center gap-2 flex-1">
              <MapPin className="h-4 w-4 text-teal-600" />
              {destinoSelecionada ? (
                <button type="button" className="px-3 py-1 rounded-full bg-teal-50 border border-teal-300 text-teal-700 text-xs" onClick={() => { setDestinoSelecionada(null); setShowDestinoSugestoes(true); setTimeout(() => destinoInputRef.current?.focus(), 0) }}>
                  {destinoSelecionada.iata_code} - {destinoSelecionada.municipality || destinoSelecionada.name}
                </button>
              ) : (
                <input ref={destinoInputRef} type="text" name="destino" value={formData.destino} onChange={handleInputChange} placeholder="Destino" className="w-full bg-transparent text-sm placeholder-gray-400 focus:outline-none" onFocus={() => setShowDestinoSugestoes(true)} onBlur={() => setTimeout(() => setShowDestinoSugestoes(false), 150)} />
              )}
              {showDestinoSugestoes && destinoSugestoes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20">
                  <ul className="max-h-64 overflow-auto">
                    {destinoSugestoes.map((a) => (
                      <li key={a.id}>
                        <button type="button" className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between" onMouseDown={() => { setFormData(prev => ({ ...prev, destino: a.iata_code })); setDestinoSugestoes([]); setShowDestinoSugestoes(false); setDestinoSelecionada(a) }}>
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
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              <input type="date" name="dataIda" value={formData.dataIda} onChange={handleInputChange} className="bg-transparent text-sm focus:outline-none" />
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              <input type="date" name="dataVolta" value={formData.dataVolta} onChange={handleInputChange} disabled={formData.somenteIda} className={`bg-transparent text-sm focus:outline-none ${formData.somenteIda ? 'opacity-60 cursor-not-allowed' : ''}`} />
              <button type="button" onClick={() => setFormData(prev => ({...prev, somenteIda: !prev.somenteIda, dataVolta: prev.somenteIda ? prev.dataVolta : ''}))} className={`text-xs px-2 py-1 rounded-full border ${formData.somenteIda ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`} title="Somente ida">Somente ida</button>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="relative">
              <button type="button" onClick={() => setShowPaxDropdown(v => !v)} className="pl-8 pr-3 py-2 rounded-full text-sm focus:outline-none flex items-center gap-2 hover:bg-gray-50" title="Selecionar passageiros e classe">
                <Users className="h-4 w-4 text-teal-600 absolute left-2" />
                <span>{`${totalPassageiros} pax`} • {formData.classe === 'EXECUTIVA' ? 'Executiva' : 'Econômica'}</span>
              </button>
              {showPaxDropdown && (
                <div className="absolute z-10 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Adultos</div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => ajustarPassageiros('adultos','decrementar')} disabled={formData.adultos <= 1 && (formData.criancas + formData.bebes) === 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50"><Minus className="h-4 w-4" /></button>
                        <div className="w-6 text-center text-sm font-semibold">{formData.adultos}</div>
                        <button type="button" onClick={() => ajustarPassageiros('adultos','incrementar')} disabled={totalPassageiros >= 9} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50"><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Crianças</div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => ajustarPassageiros('criancas','decrementar')} disabled={totalPassageiros <= 1 && formData.criancas > 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50"><Minus className="h-4 w-4" /></button>
                        <div className="w-6 text-center text-sm font-semibold">{formData.criancas}</div>
                        <button type="button" onClick={() => ajustarPassageiros('criancas','incrementar')} disabled={totalPassageiros >= 9} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50"><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">Bebês</div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => ajustarPassageiros('bebes','decrementar')} disabled={totalPassageiros <= 1 && formData.bebes > 0} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50"><Minus className="h-4 w-4" /></button>
                        <div className="w-6 text-center text-sm font-semibold">{formData.bebes}</div>
                        <button type="button" onClick={() => ajustarPassageiros('bebes','incrementar')} disabled={totalPassageiros >= 9} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 disabled:opacity-50"><Plus className="h-4 w-4" /></button>
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
            <button onClick={handlePesquisar} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-4 rounded-full text-sm flex items-center shadow"><Search className="h-4 w-4 mr-2" />Buscar</button>
          </div>
        </div>

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
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Resultados da Busca</h2>
                    <p className="text-sm text-gray-600">{viewMode==='table' ? `${linhas.length} voos` : `${grupos.length} grupos por valor`}</p>
                    {collapsed && (
                      <p className="text-xs text-gray-500 mt-1">{`${formData.origem || 'Origem'} → ${formData.destino || 'Destino'}`} • {formData.dataIda || 'Ida'}{!formData.somenteIda ? ` • ${formData.dataVolta || 'Volta'}` : ''} • {totalPassageiros} pax • {formData.classe === 'EXECUTIVA' ? 'Executiva' : 'Econômica'}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-xs">
                      <button type="button" className={`px-3 py-2 ${viewMode==='table'?'bg-gray-200 font-semibold':'bg-white'}`} onClick={() => setViewMode('table')}>Tabela</button>
                      <button type="button" className={`px-3 py-2 border-l border-gray-300 ${viewMode==='cards'?'bg-gray-200 font-semibold':'bg-white'}`} onClick={() => setViewMode('cards')}>Cards</button>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600">Ordenar</span>
                      <select value={sortMode} onChange={(e)=>{ setSortMode(e.target.value as any); setPage(1) }} className="border border-gray-300 rounded-md px-2 py-1 bg-white">
                        <option value="price">Preço (menor)</option>
                        <option value="dep_earliest">Saída • mais cedo</option>
                        <option value="dep_latest">Saída • mais tarde</option>
                        <option value="dur_shortest">Duração • mais rápido</option>
                        <option value="dur_longest">Duração • mais lento</option>
                      </select>
                    </div>
                    {collapsed && (
                      <button type="button" onClick={() => setCollapsed(false)} className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700" title="Editar busca">Editar busca</button>
                    )}
                  </div>
                </div>
                <div className="p-6 space-y-4">
                    {viewMode==='table' ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr className="text-left text-gray-700 border-b uppercase text-xs tracking-wide">
                              <th className="py-2 pr-3">cia</th>
                              <th className="py-2 pr-3">voo</th>
                              <th className="py-2 pr-3">saída</th>
                              <th className="py-2 pr-3">chegada</th>
                              <th className="py-2 pr-3">origem</th>
                              <th className="py-2 pr-3">destino</th>
                              <th className="py-2 pr-3">bag.</th>
                              <th className="py-2 pr-3">classe</th>
                              <th className="py-2 pr-3">duração</th>
                              <th className="py-2 pr-3">tarifa</th>
                              <th className="py-2 pr-3 text-right">total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedResultados.map((r, i) => {
                              const vooKey = `${r.cia}|${r.numero}|${r.partida}|${r.chegada}`
                              const selectedIdx = variantSelected[vooKey] ?? 0
                              const v = r.variantes[selectedIdx]
                              const total = Number(r.adulto) + Number(r.taxa_embarque) + Number(v.adicionais || 0)
                              const breakdown = `Adulto: R$ ${Number(v.adulto ?? r.adulto).toLocaleString('pt-BR',{minimumFractionDigits:2})}\nTaxa: R$ ${Number(v.taxa_embarque ?? r.taxa_embarque).toLocaleString('pt-BR',{minimumFractionDigits:2})}\nAdicionais: R$ ${Number(v.adicionais||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
                              return (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                  <td className="py-2 pr-3 text-gray-900">
                                    <div className="flex items-center gap-2">
                                      {ciaLogos[r.cia] ? (
                                        <img src={ciaLogos[r.cia]} alt={r.cia} className="h-6 w-6 rounded-md object-contain bg-white border border-gray-200" />
                                      ) : (
                                        <div className="h-6 w-6 bg-purple-600 text-white rounded-md flex items-center justify-center text-[11px] font-semibold">{r.cia.substring(0,1)}</div>
                                      )}
                                      <div className="text-xs text-gray-600">{r.cia}</div>
                                    </div>
                                  </td>
                                  <td className="py-2 pr-3">
                                    <span className="inline-flex px-2 py-1 rounded-md border border-sky-300 text-sky-700 text-xs font-medium bg-sky-50">{r.numero}</span>
                                  </td>
                                  <td className="py-2 pr-3 text-gray-900 font-mono">{new Date(r.partida).toLocaleDateString('pt-BR')} • {new Date(r.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                  <td className="py-2 pr-3 text-gray-900 font-mono">{new Date(r.chegada).toLocaleDateString('pt-BR')} • {new Date(r.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</td>
                                  <td className="py-2 pr-3 text-gray-900">
                                    <span className="inline-flex px-2 py-1 rounded-md border border-gray-300 text-gray-800 text-xs bg-white">{r.origem}</span>
                                  </td>
                                  <td className="py-2 pr-3 text-gray-900">
                                    <span className="inline-flex px-2 py-1 rounded-md border border-gray-300 text-gray-800 text-xs bg-white">{r.destino}</span>
                                  </td>
                                  <td className="py-2 pr-3 text-gray-900">
                                    <span className="inline-flex items-center px-2 py-1 rounded-md border border-blue-300 text-xs font-medium text-blue-700 bg-blue-50">{`${v.bag_mao_qty}Mão ${v.bag_23_qty}Desp`}</span>
                                  </td>
                                  <td className="py-2 pr-3 text-gray-900">
                                    <span className="inline-flex px-2 py-1 rounded-md border border-gray-300 text-gray-800 text-xs bg-white">{r.classe}</span>
                                  </td>
                                  <td className="py-2 pr-3 text-gray-900">
                                    <span className="inline-flex px-2 py-1 rounded-md border border-orange-300 text-orange-700 text-xs bg-orange-50">{r.duracao}</span>
                                  </td>
                                  <td className="py-2 pr-3 text-gray-900">
                                    <select value={selectedIdx} onChange={(e)=>setVariantSelected(prev=>({...prev,[vooKey]: Number((e.target as HTMLSelectElement).value)}))} className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white">
                                      {r.variantes.map((vr: any, vi: number)=> (
                                        <option key={vi} value={vi}>{vr.tarifa || 'Tarifa'}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-2 pr-3 text-right" title={breakdown}>
                                    <span className="inline-flex px-3 py-1.5 rounded-md border border-teal-300 bg-teal-50 text-teal-700 font-semibold">R$ {Number(v.preco_total ?? total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                                  </td>
                                </tr>
                              )
                            })}
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
                              {g.voos.map((r: any, i: number) => {
                                const vooKey = `${r.cia}|${r.numero}|${r.partida}|${r.chegada}`
                                const selectedIdx = variantSelected[vooKey] ?? 0
                                const variante = r.variantes[selectedIdx]
                                return (
                                  <div key={i} className="grid grid-cols-2 md:grid-cols-[220px_1fr_200px_1fr_200px] gap-3 items-center px-3 py-2 rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center gap-2">
                                      {ciaLogos[r.cia] ? (
                                        <img src={ciaLogos[r.cia]} alt={r.cia} className="h-7 w-7 rounded-md object-contain bg-white border border-gray-200" />
                                      ) : (
                                        <div className="h-7 w-7 bg-purple-600 text-white rounded-md flex items-center justify-center text-xs font-semibold">{r.cia.substring(0,1)}</div>
                                      )}
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
                                      <div className="text-sm font-bold text-gray-900">R$ {Number(variante.preco_total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
                                      <div className="inline-flex items-center px-3 py-1 rounded-md border border-blue-300 text-xs font-medium text-blue-700">{`${variante.bag_mao_qty}Mão ${variante.bag_23_qty}Desp`}</div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-gray-500">Tarifa</span>
                                        <select
                                          value={selectedIdx}
                                          onChange={(e) => setVariantSelected(prev => ({...prev, [vooKey]: Number((e.target as HTMLSelectElement).value)}))}
                                          className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white"
                                        >
                                          {r.variantes.map((vr: any, vi: number) => (
                                            <option key={vi} value={vi}>{vr.tarifa || 'Tarifa'}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
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
                          </div>
                        </div>
                      </div>
                  ))
                  )}
                </div>
                {/* Paginação */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Página {page} de {Math.max(1, Math.ceil(resultados.length / pageSize))}</div>
                  <div className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm">
                    <button type="button" className={`px-3 py-2 ${page<=1?'opacity-50 cursor-not-allowed':'bg-white'}`} disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</button>
                    <button type="button" className={`px-3 py-2 border-l border-gray-300 ${page>=Math.ceil(resultados.length / pageSize)?'opacity-50 cursor-not-allowed':'bg-white'}`} disabled={page>=Math.ceil(resultados.length / pageSize)} onClick={() => setPage(p => Math.min(Math.ceil(resultados.length / pageSize), p+1))}>Próxima</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AereoDomestico
