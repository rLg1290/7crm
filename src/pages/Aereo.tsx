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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
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
      const fake = [
        {
          cia: 'LATAM', numero: 'LA1234', origem: formData.origem || 'GRU', destino: formData.destino || 'JFK',
          partida: '2025-12-20T09:40:00', chegada: '2025-12-20T17:10:00',
          duracao: '7h 30m', preco: 2890.50, classe: formData.classe, escala: 0
        },
        {
          cia: 'AZUL', numero: 'AD5678', origem: formData.origem || 'GRU', destino: formData.destino || 'MIA',
          partida: '2025-12-21T22:15:00', chegada: '2025-12-22T06:05:00',
          duracao: '7h 50m', preco: 3120.00, classe: formData.classe, escala: 1, conexao: 'REC'
        },
        {
          cia: 'GOL', numero: 'G3 9012', origem: formData.origem || 'CGH', destino: formData.destino || 'EZE',
          partida: '2025-12-19T07:10:00', chegada: '2025-12-19T09:30:00',
          duracao: '2h 20m', preco: 890.90, classe: formData.classe, escala: 0
        }
      ]
      setResultados(fake)
      setLoading(false)
    }, 1800)
  }

  const totalPassageiros = formData.adultos + formData.criancas + formData.bebes

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
                    <p className="text-sm text-gray-600">{resultados.length} opções encontradas</p>
                    {collapsed && (
                      <p className="text-xs text-gray-500 mt-1">
                        {`${formData.origem || 'Origem'} → ${formData.destino || 'Destino'}`} • {formData.dataIda || 'Ida'}{!formData.somenteIda ? ` • ${formData.dataVolta || 'Volta'}` : ''} • {totalPassageiros} pax • {formData.classe === 'EXECUTIVA' ? 'Executiva' : 'Econômica'}
                      </p>
                    )}
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
                <div className="p-6 space-y-4">
                  {resultados.map((r, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-purple-600 text-white rounded-lg flex items-center justify-center font-semibold">{r.cia.substring(0,1)}</div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{r.cia} • {r.numero}</div>
                            <div className="text-xs text-gray-600">{r.classe} {r.escala > 0 ? `• ${r.escala} escala${r.escala>1?'s':''}` : '• direto'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">R$ {Number(r.preco).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
                          <div className="text-xs text-gray-600">ida: {new Date(r.partida).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} • {r.duracao}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-gray-700">
                        <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Origem</div><div className="font-semibold">{r.origem}</div></div>
                        <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Destino</div><div className="font-semibold">{r.destino}</div></div>
                        <div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Chegada</div><div className="font-semibold">{new Date(r.chegada).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div></div>
                      </div>
                    </div>
                  ))}
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
