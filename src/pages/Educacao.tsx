import { useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Category = { id: number; name: string; slug: string; type: string; parent_id: number | null }
type Item = { id: number; title: string; type: string; youtube_id: string; description: string | null; published_at: string | null; published: boolean }

export default function EducacaoPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selected, setSelected] = useState<Item | null>(null)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'live' | 'video'>('live')
  const [year, setYear] = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Configuração do Supabase necessária')
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const { data: cats, error: e1 } = await supabase
          .from('content_category')
          .select('id, name, slug, type, parent_id')
          .order('parent_id', { ascending: true })
          .order('name', { ascending: true })
        if (e1) throw e1
        setCategories(cats || [])
        const { data: its, error: e2 } = await supabase
          .from('content_item')
          .select('id, title, type, youtube_id, description, published_at, published')
          .eq('published', true)
          .order('published_at', { ascending: false })
          .limit(50)
        if (e2) throw e2
        const list = its || []
        setItems(list)
        setSelected(list[0] || null)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const livesRoot = useMemo(() => categories.find(c => c.slug === 'lives' && c.parent_id === null), [categories])
  const livesYears = useMemo(() => categories.filter(c => c.parent_id === livesRoot?.id), [categories, livesRoot])
  const monthsByYear = useMemo(() => {
    const map: Record<number, Category[]> = {}
    livesYears.forEach(y => { map[y.id] = categories.filter(c => c.parent_id === y.id) })
    return map
  }, [categories, livesYears])
  const themesRoot = useMemo(() => categories.filter(c => c.parent_id === null && c.slug !== 'lives'), [categories])
  const allMonths = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  const filtered = useMemo(() => {
    let list = items.filter(i => i.type === mode)
    if (search.trim()) list = list.filter(i => i.title.toLowerCase().includes(search.toLowerCase()))
    if (mode === 'live') {
      if (year) list = list.filter(i => i.published_at && new Date(i.published_at).getFullYear() === Number(year))
      if (month) list = list.filter(i => {
        if (!i.published_at) return false
        return allMonths[new Date(i.published_at).getMonth()] === month
      })
    }
    return list
  }, [items, mode, search, year, month])

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Educação</h1>
        <p className="text-gray-600">Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para acessar esta seção.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Base de Conhecimento</h1>
          <p className="text-sm text-gray-600">Educação corporativa com conteúdos estratégicos e técnicos para agências.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('grid')} className={`px-3 py-1 rounded ${view==='grid'?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-800'}`}>Grid</button>
          <button onClick={() => setView('list')} className={`px-3 py-1 rounded ${view==='list'?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-800'}`}>Lista</button>
        </div>
      </div>
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-4 bg-white rounded border border-gray-200 p-4 flex flex-wrap items-center gap-3">
            <input value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 min-w-[200px] border border-gray-300 rounded p-2 text-gray-900" placeholder="Buscar conteúdo…" />
            <div className="flex bg-gray-100 rounded overflow-hidden">
              <button onClick={()=>setMode('live')} className={`px-3 py-2 ${mode==='live'?'bg-white text-blue-700 border border-blue-200':'text-gray-700'}`}>Lives (replay)</button>
              <button onClick={()=>setMode('video')} className={`px-3 py-2 ${mode==='video'?'bg-white text-blue-700 border border-blue-200':'text-gray-700'}`}>Vídeos gravados</button>
            </div>
            {mode==='live' && (
              <>
                <select value={year} onChange={e=>setYear(e.target.value)} className="border border-gray-300 rounded p-2 text-gray-900">
                  <option value="">Ano</option>
                  {[...new Set(items.filter(i=>i.type==='live').map(i=>i.published_at?new Date(i.published_at).getFullYear():null).filter(Boolean))].map(y=>(<option key={String(y)} value={String(y)}>{String(y)}</option>))}
                </select>
                <select value={month} onChange={e=>setMonth(e.target.value)} className="border border-gray-300 rounded p-2 text-gray-900">
                  <option value="">Mês</option>
                  {allMonths.map(m=>(<option key={m} value={m}>{m}</option>))}
                </select>
              </>
            )}
            {mode==='video' && (
              <select value={String(categoryId??'')} onChange={e=>setCategoryId(e.target.value?Number(e.target.value):null)} className="border border-gray-300 rounded p-2 text-gray-900">
                <option value="">Categoria</option>
                {themesRoot.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            )}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded border border-gray-200 p-4">
              <h2 className="text-gray-900 font-medium mb-3">Lives</h2>
              <ul className="space-y-2">
                {livesYears.map(y => (
                  <li key={y.id}>
                    <span className="font-medium text-gray-900">{y.name}</span>
                    <ul className="ml-4 mt-1 space-y-1 text-gray-800">
                      {(monthsByYear[y.id] || []).map(m => (
                        <li key={m.id}>{m.name}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-gray-200 p-4">
              {selected ? (
                <div className="space-y-3">
                  <div className="aspect-video bg-black rounded overflow-hidden">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${selected.youtube_id}`}
                      title={selected.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{selected.title}</div>
                    <div className="text-xs text-gray-700">{selected.type} {selected.published_at ? `• ${new Date(selected.published_at).toLocaleDateString('pt-BR')}` : ''}</div>
                    {selected.description && <div className="text-sm text-gray-800 mt-1">{selected.description}</div>}
                  </div>
                </div>
              ) : (
                <div className="text-gray-700">Selecione um conteúdo ao lado</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded border border-gray-200 p-4">
              <h2 className="text-gray-900 font-medium mb-3">Conteúdos</h2>
              <div className={`${view==='grid'?'grid grid-cols-1 sm:grid-cols-2 gap-3':'space-y-3'}`}>
                {filtered.map(it => (
                  <button
                    key={it.id}
                    onClick={() => setSelected(it)}
                    className={`w-full text-left border rounded overflow-hidden transition ${selected?.id === it.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="aspect-video bg-black">
                      <img className="w-full h-full object-cover" src={`https://img.youtube.com/vi/${it.youtube_id}/hqdefault.jpg`} alt={it.title} />
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-gray-900">{it.title}</div>
                      <div className="text-xs text-gray-700">{it.type} {it.published_at ? `• ${new Date(it.published_at).toLocaleDateString('pt-BR')}` : ''}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
