import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type Item = { id: number; title: string; type: string; youtube_id: string; description: string | null; published_at: string | null; duration_seconds: number | null }

export default function EducacaoItem() {
  const { id } = useParams()
  const [item, setItem] = useState<Item | null>(null)
  const [related, setRelated] = useState<Item[]>([])
  const [fav, setFav] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !supabase) return
      const { data } = await supabase.from('content_item').select('id, title, type, youtube_id, description, published_at, duration_seconds').eq('id', Number(id)).single()
      setItem((data as any) || null)
      const { data: rel } = await supabase.from('content_item').select('id, title, type, youtube_id, description, published_at').order('published_at', { ascending: false }).limit(6)
      setRelated((rel as any) || [])
      const { data: f } = await supabase.from('content_favorite').select('item_id').eq('item_id', Number(id))
      setFav(Boolean(f && f.length))
    }
    load()
  }, [id])

  const toggleFav = async () => {
    if (!isSupabaseConfigured || !supabase || !item) return
    if (fav) {
      await supabase.from('content_favorite').delete().eq('item_id', item.id)
      setFav(false)
    } else {
      await supabase.from('content_favorite').insert({ user_id: (await supabase.auth.getUser()).data.user?.id, item_id: item.id })
      setFav(true)
    }
  }

  return (
    <div className="p-0 bg-gray-50 min-h-screen">
      <div className="px-6 pt-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Base de Conhecimento</h1>
          <p className="text-sm text-gray-600">Visualização de conteúdo</p>
        </div>
        <Link to="/educacao" className="px-3 py-2 bg-white border border-gray-200 rounded">Voltar</Link>
      </div>
      {!item ? (
        <div className="px-6 text-gray-700">Carregando…</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-6 gap-6 p-6">
          <div className="xl:col-span-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="w-full aspect-[16/9] bg-black rounded-xl overflow-hidden">
                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${item.youtube_id}`} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold text-gray-900">{item.title}</div>
                <div className="text-sm text-gray-700">{item.type} {item.published_at ? `• ${new Date(item.published_at).toLocaleDateString('pt-BR')}` : ''} {item.duration_seconds ? `• ${Math.round(item.duration_seconds/60)} min` : ''}</div>
                {item.description && <div className="text-base text-gray-800 mt-2">{item.description}</div>}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={toggleFav} className={`px-4 py-2 rounded-lg ${fav?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-800'}`}>{fav?'Favorito':'Favoritar'}</button>
                <button className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-800">Concluído</button>
              </div>
            </div>
          </div>
          <div className="xl:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="text-gray-900 font-medium mb-3">Relacionados</div>
              <div className="space-y-3">
                {related.map(r => (
                  <Link key={r.id} to={`/educacao/item/${r.id}`} className="block border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition">
                    <div className="aspect-video bg-black">
                      <img className="w-full h-full object-cover" src={`https://img.youtube.com/vi/${r.youtube_id}/hqdefault.jpg`} alt={r.title} />
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-gray-900">{r.title}</div>
                      <div className="text-xs text-gray-700">{r.type} {r.published_at ? `• ${new Date(r.published_at).toLocaleDateString('pt-BR')}` : ''}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
