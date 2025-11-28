import { useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Category = { id: number; name: string; slug: string; type: string; parent_id: number | null }
type Item = { id: number; title: string; type: string; youtube_url: string; youtube_id: string; description: string | null; published_at: string | null; published: boolean }

const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function EducacaoAdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase não configurado')
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
          .select('id, title, type, youtube_url, youtube_id, description, published_at, published')
          .order('published_at', { ascending: false })
          .limit(100)
        if (e2) throw e2
        setItems(its || [])
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const livesRoot = useMemo(() => categories.find(c => c.slug === 'lives' && c.parent_id === null), [categories])
  const years = useMemo(() => categories.filter(c => c.parent_id === livesRoot?.id), [categories, livesRoot])
  const monthsByYear = useMemo(() => {
    const map: Record<number, Category[]> = {}
    years.forEach(y => { map[y.id] = categories.filter(c => c.parent_id === y.id) })
    return map
  }, [categories, years])

  const categoriesById = useMemo(() => {
    const map = new Map<number, Category>()
    categories.forEach(c => map.set(c.id, c))
    return map
  }, [categories])

  const [newCat, setNewCat] = useState<{ name: string; type: string; parent_id: number | null }>({ name: '', type: 'Lives', parent_id: null })

  const getPath = (cat: Category) => {
    const parts: string[] = []
    let cur: Category | undefined = cat
    while (cur) {
      parts.unshift(cur.name)
      cur = cur.parent_id ? categoriesById.get(cur.parent_id) : undefined
    }
    return parts.join(' / ')
  }

  const createCategory = async () => {
    if (!newCat.name.trim()) return
    const slug = newCat.name.trim().toLowerCase().replace(/\s+/g, '-')
    const { data, error: e } = await supabase!.from('content_category').insert([{ name: newCat.name.trim(), slug, type: newCat.type, parent_id: newCat.parent_id }]).select().single()
    if (e) { setError(e.message); return }
    setCategories(prev => [...prev, data as Category])
    setNewCat({ name: '', type: newCat.type, parent_id: newCat.parent_id })
  }

  const createOrGetCategory = async (parentId: number | null, name: string, slug: string, type = 'Lives') => {
    const existing = categories.find(c => c.slug === slug && c.parent_id === parentId)
    if (existing) return existing
    const { data, error: e } = await supabase!.from('content_category').insert([{ name, slug, type, parent_id: parentId }]).select().single()
    if (e) throw e
    setCategories(prev => [...prev, data])
    return data as Category
  }

  const [form, setForm] = useState<{ title: string; type: 'live' | 'video'; youtube_url: string; description: string; date: string; time: string; published: boolean; category_id: number | null; autoByDate: boolean }>({ title: '', type: 'live', youtube_url: '', description: '', date: '', time: '', published: true, category_id: null, autoByDate: true })

  const parseYouTubeId = (url: string) => {
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '')
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || ''
      return ''
    } catch { return '' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error('Supabase não configurado')
      const youtube_id = parseYouTubeId(form.youtube_url)
      if (!youtube_id) throw new Error('URL do YouTube inválida')
      const published_at = form.date && form.time ? new Date(`${form.date}T${form.time}:00`).toISOString() : null
      const { data: item, error: e1 } = await supabase
        .from('content_item')
        .insert([{ title: form.title, type: form.type, youtube_url: form.youtube_url, youtube_id, description: form.description, published_at, published: form.published }])
        .select()
        .single()
      if (e1) throw e1
      setItems(prev => [item as Item, ...prev])

      let targetCategoryId: number | null = form.category_id
      if (form.autoByDate) {
        const root = await createOrGetCategory(null, 'Lives', 'lives', 'Lives')
        const dt = published_at ? new Date(published_at) : new Date()
        const yearName = String(dt.getFullYear())
        const monthName = monthNames[dt.getMonth()]
        const yearCat = await createOrGetCategory(root.id, yearName, yearName.toLowerCase(), 'Lives')
        const monthCat = await createOrGetCategory(yearCat.id, monthName, monthName.toLowerCase(), 'Lives')
        targetCategoryId = monthCat.id
      }
      if (targetCategoryId) {
        await supabase!.from('content_item_category').insert([{ content_item_id: (item as any).id, category_id: targetCategoryId }])
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar')
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Educação (Admin)</h1>
        <p className="text-gray-600">Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar esta seção.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <h1 className="text-2xl font-semibold text-gray-900">Educação</h1>
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {loading ? (
        <div>Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded border border-gray-200 p-4">
              <h2 className="text-gray-900 font-medium mb-3">Gerenciar Categorias</h2>
              <div className="space-y-2">
                <input className="w-full border border-gray-300 rounded p-2 text-gray-900" placeholder="Nome da categoria" value={newCat.name} onChange={e => setNewCat(prev => ({ ...prev, name: e.target.value }))} />
                <select className="w-full border border-gray-300 rounded p-2 text-gray-900" value={newCat.type} onChange={e => setNewCat(prev => ({ ...prev, type: e.target.value }))}>
                  <option value="Lives">Lives</option>
                  <option value="Videos">Videos</option>
                  <option value="Categoria">Categoria</option>
                </select>
                <select className="w-full border border-gray-300 rounded p-2 text-gray-900" value={String(newCat.parent_id ?? '')} onChange={e => setNewCat(prev => ({ ...prev, parent_id: e.target.value ? Number(e.target.value) : null }))}>
                  <option value="">Sem pai (raiz)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{getPath(c)}</option>
                  ))}
                </select>
                <button onClick={createCategory} className="w-full px-4 py-2 bg-blue-600 text-white rounded">Criar categoria</button>
              </div>
              <div className="mt-4">
                <h3 className="text-gray-900 font-medium mb-2">Árvore Lives</h3>
                <ul className="space-y-2 text-gray-900">
                  <li>
                    <span className="font-semibold">Lives</span>
                    <ul className="ml-4 mt-2 space-y-1">
                      {years.map(y => (
                        <li key={y.id}>
                          <span className="font-medium">{y.name}</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {(monthsByYear[y.id] || []).map(m => (
                              <li key={m.id}>{m.name}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded border border-gray-200 p-4">
              <h2 className="text-gray-900 font-medium mb-3">Cadastrar Conteúdo</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-900">Título</label>
                  <input className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm text-gray-900">Tipo</label>
                  <select className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value as any }))}>
                    <option value="live">Live</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-900">URL do YouTube</label>
                  <input className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.youtube_url} onChange={e => setForm(prev => ({ ...prev, youtube_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
                </div>
                <div>
                  <label className="block text-sm text-gray-900">Data e Hora</label>
                  <div className="flex gap-2">
                    <input type="date" className="mt-1 border border-gray-300 rounded p-2 text-gray-900" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} />
                    <input type="time" className="mt-1 border border-gray-300 rounded p-2 text-gray-900" value={form.time} onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-900">Descrição</label>
                  <textarea className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(prev => ({ ...prev, published: e.target.checked }))} />
                  <span className="text-gray-900">Publicar</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-900">Categoria</label>
                    <select className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={String(form.category_id ?? '')} onChange={e => setForm(prev => ({ ...prev, category_id: e.target.value ? Number(e.target.value) : null }))}>
                      <option value="">Sem categoria</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{getPath(c)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" checked={form.autoByDate} onChange={e => setForm(prev => ({ ...prev, autoByDate: e.target.checked }))} />
                    <span className="text-gray-900">Criar ano/mês automaticamente</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </form>
            </div>

            <div className="bg-white rounded border border-gray-200 p-4 mt-6">
              <h2 className="text-gray-900 font-medium mb-3">Itens Recentes</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {items.map(it => (
                  <div key={it.id} className="border border-gray-200 rounded overflow-hidden">
                    <div className="aspect-video bg-black">
                      <img className="w-full h-full object-cover" src={`https://img.youtube.com/vi/${it.youtube_id}/hqdefault.jpg`} alt={it.title} />
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-gray-900">{it.title}</div>
                      <div className="text-xs text-gray-700">{it.type} {it.published_at ? `• ${new Date(it.published_at).toLocaleDateString('pt-BR')}` : ''}</div>
                      {it.description && <div className="text-sm text-gray-800 mt-1">{it.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
