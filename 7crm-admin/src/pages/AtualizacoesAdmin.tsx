import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

type UpdateItem = { id: number; title: string; date: string; type: string; summary: string; tags: string[] }

export default function AtualizacoesAdminPage() {
  const [items, setItems] = useState<UpdateItem[]>([])
  const [form, setForm] = useState<{ title: string; date: string; type: string; summary: string; tags: string }>({ title: '', date: '', type: 'ux', summary: '', tags: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ title: string; date: string; type: string; summary: string; tags: string }>({ title: '', date: '', type: 'ux', summary: '', tags: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !supabase) return
      const { data, error } = await supabase.from('product_updates').select('id, title, date, type, summary, tags').order('date', { ascending: false })
      if (!error) setItems((data as any) || [])
    }
    load()
  }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error('Supabase não configurado')
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const { data, error } = await supabase.from('product_updates').insert([{ title: form.title, date: form.date, type: form.type, summary: form.summary, tags }]).select().single()
      if (error) throw error
      setItems(prev => [data as UpdateItem, ...prev])
      setForm({ title: '', date: '', type: 'ux', summary: '', tags: '' })
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar')
    }
  }

  const remove = async (id: number) => {
    if (!isSupabaseConfigured || !supabase) return
    const { error } = await supabase.from('product_updates').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
  }

  const startEdit = (i: UpdateItem) => {
    setEditingId(i.id)
    setEditForm({ title: i.title, date: i.date, type: i.type, summary: i.summary, tags: (i.tags || []).join(', ') })
  }

  const saveEdit = async () => {
    if (!isSupabaseConfigured || !supabase || editingId === null) return
    setError(null)
    try {
      const tags = editForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      const { data, error } = await supabase
        .from('product_updates')
        .update({ title: editForm.title, date: editForm.date, type: editForm.type, summary: editForm.summary, tags })
        .eq('id', editingId)
        .select()
        .single()
      if (error) throw error
      setItems(prev => prev.map(i => (i.id === editingId ? (data as UpdateItem) : i)))
      setEditingId(null)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar edição')
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Atualizações</h1>
        <p className="text-gray-800">Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar esta seção.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Atualizações</h1>
      {error && <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>}

      <div className="bg-white rounded border border-gray-200 p-4">
        <h2 className="text-gray-900 font-medium mb-3">Criar card</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-900">Título</label>
            <input className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.title} onChange={e=>setForm(prev=>({ ...prev, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-900">Data</label>
            <input type="date" className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.date} onChange={e=>setForm(prev=>({ ...prev, date: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-900">Tipo</label>
            <select className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.type} onChange={e=>setForm(prev=>({ ...prev, type: e.target.value }))}>
              <option value="feature">feature</option>
              <option value="ux">ux</option>
              <option value="fix">fix</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-900">Tags (separadas por vírgula)</label>
            <input className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.tags} onChange={e=>setForm(prev=>({ ...prev, tags: e.target.value }))} placeholder="ux, layout" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-900">Resumo</label>
            <textarea className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-900" value={form.summary} onChange={e=>setForm(prev=>({ ...prev, summary: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded border border-gray-200 p-4">
        <h2 className="text-gray-900 font-medium mb-3">Cards existentes</h2>
        {items.length === 0 ? (
          <div className="text-gray-700">Nenhum card criado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map(i => (
              <div key={i.id} className="border border-gray-200 rounded p-3">
                {editingId === i.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input className="border border-gray-300 rounded p-2 text-gray-900" value={editForm.title} onChange={e=>setEditForm(prev=>({ ...prev, title: e.target.value }))} />
                      <input type="date" className="border border-gray-300 rounded p-2 text-gray-900" value={editForm.date} onChange={e=>setEditForm(prev=>({ ...prev, date: e.target.value }))} />
                      <select className="border border-gray-300 rounded p-2 text-gray-900" value={editForm.type} onChange={e=>setEditForm(prev=>({ ...prev, type: e.target.value }))}>
                        <option value="feature">feature</option>
                        <option value="ux">ux</option>
                        <option value="fix">fix</option>
                      </select>
                      <input className="border border-gray-300 rounded p-2 text-gray-900" value={editForm.tags} onChange={e=>setEditForm(prev=>({ ...prev, tags: e.target.value }))} placeholder="ux, layout" />
                    </div>
                    <textarea className="w-full border border-gray-300 rounded p-2 text-gray-900" value={editForm.summary} onChange={e=>setEditForm(prev=>({ ...prev, summary: e.target.value }))} />
                    <div className="flex justify-end gap-2">
                      <button onClick={()=>{ setEditingId(null) }} className="px-3 py-1 bg-white border border-gray-300 rounded">Cancelar</button>
                      <button onClick={saveEdit} className="px-3 py-1 bg-blue-600 text-white rounded">Salvar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500">{(() => { const p = i.date.split('-'); return p.length===3 ? new Date(Number(p[0]), Number(p[1])-1, Number(p[2])).toLocaleDateString('pt-BR') : new Date(i.date).toLocaleDateString('pt-BR') })()}</div>
                    <div className="text-base font-semibold text-gray-900">{i.title}</div>
                    <div className="text-sm text-gray-800">{i.summary}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(i.tags || []).map(t => (<span key={t} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{t}</span>))}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={()=>startEdit(i)} className="px-3 py-1 bg-white border border-gray-300 rounded">Editar</button>
                      <button onClick={()=>remove(i.id)} className="px-3 py-1 bg-red-600 text-white rounded">Apagar</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
