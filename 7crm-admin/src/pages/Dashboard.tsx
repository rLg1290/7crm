import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FileText, DollarSign, RefreshCcw, BarChart2 } from 'lucide-react'

interface Metrics {
  cotacoes: { quantidade: number; valorTotal: number }
  vendas: { quantidade: number; valorTotal: number }
  emissoesComparativo: { seteC: number; concorrentes: number }
}

// Componente para animação suave de números
const AnimatedNumber: React.FC<{ value: number; duration?: number; decimals?: number; formatter?: (n: number) => string }> = ({ value, duration = 800, decimals = 0, formatter }) => {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(0)

  useEffect(() => {
    const start = startRef.current
    const diff = value - start
    const startTime = performance.now()

    const step = (t: number) => {
      const progress = Math.min((t - startTime) / duration, 1)
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 4)
      const current = start + diff * eased
      const output = decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current)
      setDisplay(output)
      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        startRef.current = value
      }
    }

    requestAnimationFrame(step)
  }, [value, duration, decimals])

  return <span>{formatter ? formatter(display) : display}</span>
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    cotacoes: { quantidade: 0, valorTotal: 0 },
    vendas: { quantidade: 0, valorTotal: 0 },
    emissoesComparativo: { seteC: 0, concorrentes: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'ano' | 'todos' | 'personalizado'>('mes')
  const [empresas, setEmpresas] = useState<Array<{ id: string; nome: string }>>([])
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | 'todas'>('todas')
  // Período personalizado
  const [dataInicioCustom, setDataInicioCustom] = useState<string>('')
  const [dataFimCustom, setDataFimCustom] = useState<string>('')

  // Normalização robusta sem usar replaceAll (para evitar ambientes sem suporte)
  const normalize = (s?: any) => {
    try {
      const base = s == null ? '' : String(s)
      return base.trim().toUpperCase().replace(/_/g, ' ').replace(/-/g, ' ')
    } catch {
      return ''
    }
  }
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const parseDate = (v: any): Date | null => {
    if (!v) return null
    try {
      return new Date(v)
    } catch {
      return null
    }
  }

  const labelEmpresa = (e: any) => {
    const nome = (e?.nome ?? '').trim()
    const codigo = (e?.codigo_agencia ?? '').trim()
    const cnpj = (e?.cnpj ?? '').trim()
    // Fallbacks para evitar nomes em branco no dropdown
    if (nome && nome.toLowerCase() !== 'null') return nome
    if (codigo) return `Agência ${codigo}`
    if (cnpj) return cnpj
    return e?.id ?? 'Agência'
  }

  const carregarEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome, codigo_agencia, cnpj, ativo')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (error) throw error
      const lista = (data || []).map((e: any) => ({ id: e.id, nome: labelEmpresa(e) }))
      setEmpresas(lista)
      console.log('[Dashboard] Empresas carregadas:', lista)
    } catch (err: any) {
      console.error('Erro ao carregar empresas:', err)
    }
  }

  const carregarMetricas = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('cotacoes')
        .select('id, status, valor, data_criacao, created_at, empresa_id')

      if (selectedEmpresaId !== 'todas') {
        query = query.eq('empresa_id', selectedEmpresaId)
      }

      const { data, error } = await query
      if (error) throw error

      let registros: any[] = []
      try {
        registros = (data || []).filter(r => {
          if (periodo === 'todos') return true
          const d = parseDate((r as any).data_criacao || (r as any).created_at || (r as any).criado_em)
          if (!d) return true

          // Normalizar hora do registro para comparação
          const dataRegistro = new Date(d)

          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)

          let start: Date | null = null
          let end: Date | null = null

          if (periodo === 'hoje') {
            start = new Date(hoje)
            end = new Date(hoje)
            end.setHours(23, 59, 59, 999)
          } else if (periodo === 'semana') {
            // Segunda-feira como início da semana
            const day = hoje.getDay() // 0=domingo, 1=segunda, ...
            const diffParaSegunda = (day + 6) % 7
            start = new Date(hoje)
            start.setDate(hoje.getDate() - diffParaSegunda)
            start.setHours(0, 0, 0, 0)
            end = new Date(start)
            end.setDate(start.getDate() + 6)
            end.setHours(23, 59, 59, 999)
          } else if (periodo === 'mes') {
            start = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
            end = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
            start.setHours(0, 0, 0, 0)
            end.setHours(23, 59, 59, 999)
          } else if (periodo === 'ano') {
            start = new Date(hoje.getFullYear(), 0, 1)
            end = new Date(hoje.getFullYear(), 11, 31)
            start.setHours(0, 0, 0, 0)
            end.setHours(23, 59, 59, 999)
          } else if (periodo === 'personalizado') {
            if (dataInicioCustom) {
              start = new Date(dataInicioCustom)
              start.setHours(0, 0, 0, 0)
            }
            if (dataFimCustom) {
              end = new Date(dataFimCustom)
              end.setHours(23, 59, 59, 999)
            }
          }

          if (start && end) return dataRegistro >= start && dataRegistro <= end
          if (start && !end) return dataRegistro >= start
          if (!start && end) return dataRegistro <= end
          return true
        })
      } catch (fErr: any) {
        console.error('[Dashboard] Erro no filtro de período:', fErr)
        // Fallback seguro: usar os dados sem filtrar para não quebrar a tela
        registros = (data || [])
      }

      const cotarStatuses = ['COTAR', 'AGUARDANDO CLIENTE']
      const cotacoesLista = registros.filter(r => cotarStatuses.includes(normalize((r as any).status)))
      const vendasLista = registros.filter(r => normalize((r as any).status) === 'EMITIDO')

      const safeValor = (v: any) => typeof v === 'number' ? v : (v ? Number(v) : 0)

      const cotacoesValorTotal = cotacoesLista.reduce((acc, r) => acc + safeValor((r as any).valor), 0)
      const vendasValorTotal = vendasLista.reduce((acc, r) => acc + safeValor((r as any).valor), 0)

      // Calcular Emissões 7C x Concorrentes (defensivo quando não há vendas)
      let seteC = 0
      let concorrentes = 0
      const vendasIds = vendasLista.map(v => String((v as any).id))

      if (vendasIds.length > 0) {
        let cpQuery = supabase
          .from('contas_pagar')
          .select('id, fornecedor_id, origem, origem_id, empresa_id, created_at')
          .eq('origem', 'COTACAO')
          .in('origem_id', vendasIds)

        if (selectedEmpresaId !== 'todas') {
          cpQuery = cpQuery.eq('empresa_id', selectedEmpresaId)
        }

        const { data: contasRelacionadas, error: cpError } = await cpQuery
        if (cpError) throw cpError

        const porCotacao = new Map<string, any[]>()
        (contasRelacionadas || []).forEach((cp: any) => {
          const cid = String(cp?.origem_id || '')
          if (!cid) return
          if (!porCotacao.has(cid)) porCotacao.set(cid, [])
          porCotacao.get(cid)!.push(cp)
        })

        vendasIds.forEach(cid => {
          const lista = porCotacao.get(cid) || []
          if (lista.length === 0) return
          const tem7c = lista.some(x => Number(x.fornecedor_id) === 3)
          const temOutro = lista.some(x => x.fornecedor_id != null && Number(x.fornecedor_id) !== 3)
          if (tem7c) {
            seteC += 1
          } else if (temOutro) {
            concorrentes += 1
          }
        })
      }

      setMetrics({
        cotacoes: { quantidade: cotacoesLista.length, valorTotal: cotacoesValorTotal },
        vendas: { quantidade: vendasLista.length, valorTotal: vendasValorTotal },
        emissoesComparativo: { seteC, concorrentes }
      })
    } catch (err: any) {
      console.error('Erro ao carregar métricas do Dashboard:', err)
      setError(err?.message || 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEmpresas()
  }, [])

  useEffect(() => {
    carregarMetricas()
  }, [periodo, selectedEmpresaId, dataInicioCustom, dataFimCustom])

  // Percentuais para Emissões 7C x Concorrentes
  const totalComparativo = (metrics.emissoesComparativo?.seteC || 0) + (metrics.emissoesComparativo?.concorrentes || 0)
  const pct7c = totalComparativo > 0 ? Math.round(((metrics.emissoesComparativo?.seteC || 0) * 100) / totalComparativo) : 0
  const pctConc = totalComparativo > 0 ? 100 - pct7c : 0

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
          {typeof error === 'string' && (error.includes('RLS') || error.includes('permission'))
            ? 'Permissões insuficientes (RLS) para ler dados de todas as agências. Podemos ajustar as policies ou criar uma RPC com SECURITY DEFINER.'
            : `Erro: ${String(error)}`}
        </div>
      )}

      {/* Filtros: Período e Agência */}
      {/* removido comentário inválido */}
      <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Período:</label>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value as any)}
            className="border rounded-lg px-3 py-2 text-sm bg-white text-black"
            style={{ color: '#000' }}
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Essa semana</option>
            <option value="mes">Este Mês</option>
            <option value="ano">Ano</option>
            <option value="todos">Todos</option>
            <option value="personalizado">Personalizado</option>
          </select>
          {periodo === 'personalizado' && (
            <div className="flex items-center gap-2 ml-2">
              <label className="text-sm text-gray-600">De:</label>
              <input
                type="date"
                value={dataInicioCustom}
                onChange={e => setDataInicioCustom(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white text-black"
                style={{ color: '#000' }}
              />
              <label className="text-sm text-gray-600">Até:</label>
              <input
                type="date"
                value={dataFimCustom}
                onChange={e => setDataFimCustom(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white text-black"
                style={{ color: '#000' }}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Agência:</label>
          <select
            value={selectedEmpresaId}
            onChange={e => setSelectedEmpresaId((e.target.value || 'todas') as any)}
            className="border rounded-lg px-3 py-2 text-sm bg-white min-w-[220px] text-black"
            style={{ color: '#000' }}
          >
            <option value="todas">Todas as agências</option>
            {empresas.length === 0 && (
              <option value="" disabled>Nenhuma agência ativa</option>
            )}
            {empresas.map(e => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Cotações */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Cotações</h2>
                <p className="text-xs text-gray-500">Status: COTAR + AGUARDANDO CLIENTE</p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white transition"
              onClick={carregarMetricas}
              disabled={loading}
              title="Atualizar métricas"
            >
              <RefreshCcw className="h-4 w-4" />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          <div className="mt-3">
            <div className="text-4xl font-extrabold tracking-tight text-gray-900">
              <AnimatedNumber value={metrics.cotacoes.quantidade} />
            </div>
            <div className="text-sm font-medium text-blue-700 mt-1">
              Total (R$): <AnimatedNumber value={metrics.cotacoes.valorTotal} decimals={2} formatter={formatCurrency} />
            </div>
          </div>
        </div>

        {/* Card VENDAS */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">VENDAS</h2>
                <p className="text-xs text-gray-500">Status: EMITIDO</p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white transition"
              onClick={carregarMetricas}
              disabled={loading}
              title="Atualizar métricas"
            >
              <RefreshCcw className="h-4 w-4" />
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
          <div className="mt-3">
            <div className="text-4xl font-extrabold tracking-tight text-gray-900">
              <AnimatedNumber value={metrics.vendas.quantidade} />
            </div>
            <div className="text-sm font-medium text-emerald-700 mt-1">
              Total (R$): <AnimatedNumber value={metrics.vendas.valorTotal} decimals={2} formatter={formatCurrency} />
            </div>
          </div>
        </div>
      </div>
      {/* Card Emissões 7C x Concorrentes */}
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-600/10 text-purple-600 flex items-center justify-center">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Emissões 7C x Concorrentes</h2>
              <p className="text-xs text-gray-500">Base: VENDAS (EMITIDO) com contas a pagar vinculadas</p>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white transition"
            onClick={carregarMetricas}
            disabled={loading}
            title="Atualizar métricas"
          >
            <RefreshCcw className="h-4 w-4" />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">7C</div>
            <div className="text-4xl font-extrabold tracking-tight text-gray-900">
              <AnimatedNumber value={metrics.emissoesComparativo.seteC} />
            </div>
            <div className="text-sm text-gray-600">{pct7c}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Concorrentes</div>
            <div className="text-4xl font-extrabold tracking-tight text-gray-900">
              <AnimatedNumber value={metrics.emissoesComparativo.concorrentes} />
            </div>
            <div className="text-sm text-gray-600">{pctConc}%</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>7C {pct7c}%</span>
            <span>Concorrentes {pctConc}%</span>
          </div>
          <div className="h-2 w-full bg-purple-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600" style={{ width: `${pct7c}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard