import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Category = { id: number; name: string; slug: string; parent_id: number | null }
type Item = { id: number; title: string; youtube_id: string; published_at: string | null }

export default function EducacaoLives() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [yearCat, setYearCat] = useState<number | null>(null)
  const [monthCat, setMonthCat] = useState<number | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const load = async () => {
      const { data: cats } = await supabase.from('content_category').select('id, name, slug, parent_id').order('parent_id').order('name')
      setCategories((cats as any) || [])
    }
    load()
  }, [])

  const livesRoot = useMemo(() => categories.find(c => c.slug === 'lives' && c.parent_id === null), [categories])
  const years = useMemo(() => categories.filter(c => c.parent_id === livesRoot?.id), [categories, livesRoot])
  const months = useMemo(() => categories.filter(c => c.parent_id === yearCat), [categories, yearCat])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const loadItems = async () => {
      if (!monthCat) { setItems([]); return }
      const { data } = await supabase.from('content_item')
        .select('id, title, youtube_id, published_at, content_item_category!inner(category_id)')
        .eq('type', 'live')
        .eq('published', true)
        .eq('content_item_category.category_id', monthCat)
        .order('published_at', { ascending: false })
      setItems(((data as any) || []).map((d:any)=>({ id:d.id, title:d.title, youtube_id:d.youtube_id, published_at:d.published_at })))
    }
    loadItems()
  }, [monthCat])

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lives gravadas</h1>
            <p className="text-sm text-gray-600">Navegue por Ano e Mês e selecione a live desejada.</p>
          </div>
          <Link to="/educacao" className="px-3 py-2 bg-white border border-gray-200 rounded">Voltar</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="text-gray-900 font-medium mb-2">Anos</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {years.map(y => (
                  <button key={y.id} onClick={() => { setYearCat(y.id); setMonthCat(null) }} className={`px-3 py-2 rounded border ${yearCat===y.id?'border-blue-300 bg-blue-50 text-blue-700':'border-gray-200 bg-white text-gray-800'}`}>{y.name}</button>
                ))}
              </div>
              {!!yearCat && (
                <div className="mt-4">
                  <div className="text-gray-900 font-medium mb-2">Meses</div>
                  <div className="grid grid-cols-3 gap-2">
                    {months.map(m => (
                      <button key={m.id} onClick={() => setMonthCat(m.id)} className={`px-3 py-2 rounded border ${monthCat===m.id?'border-blue-300 bg-blue-50 text-blue-700':'border-gray-200 bg-white text-gray-800'}`}>{m.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="text-gray-900 font-medium mb-3">Conteúdos</div>
              {items.length===0 ? (
                <div className="text-gray-700">Selecione um mês para visualizar as lives.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map(it => (
                    <Link key={it.id} to={`/educacao/item/${it.id}`} className="group border border-gray-200 bg-white rounded-2xl overflow-hidden hover:border-blue-300 transition">
                      <div className="aspect-square bg-black">
                        <img className="w-full h-full object-cover" src={`https://img.youtube.com/vi/${it.youtube_id}/hqdefault.jpg`} alt={it.title} />
                      </div>
                      <div className="p-3">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition">{it.title}</div>
                        <div className="text-xs text-gray-700">{it.published_at ? new Date(it.published_at).toLocaleDateString('pt-BR') : ''}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
