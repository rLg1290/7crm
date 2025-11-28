import { useEffect, useState } from 'react'
import { roadmap } from '../data/updates'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { ArrowRight, CheckCircle2, CircleDashed, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AtualizacoesPage() {
  const [updates, setUpdates] = useState<any[]>([])
  const formatDateBR = (s: string) => {
    if (!s) return ''
    const parts = s.split('-')
    if (parts.length === 3) {
      const y = Number(parts[0])
      const m = Number(parts[1])
      const d = Number(parts[2])
      return new Date(y, m - 1, d).toLocaleDateString('pt-BR')
    }
    return new Date(s).toLocaleDateString('pt-BR')
  }
  useEffect(() => {
    const load = async () => {
      if (!isSupabaseConfigured || !supabase) { setUpdates([]); return }
      const { data } = await supabase.from('product_updates').select('id, title, date, type, summary, tags').order('date', { ascending: false })
      setUpdates((data as any) || [])
    }
    load()
  }, [])
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Atualizações</h1>
            <p className="text-sm text-gray-600">Resumo das últimas melhorias e visão do nosso Roadmap.</p>
          </div>
          <Link to="/dashboard" className="px-3 py-2 bg-white border border-gray-200 rounded">Voltar</Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-gray-900">Últimas atualizações</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {updates.length === 0 && (
              <div className="text-sm text-gray-700">Nenhum card de atualização disponível.</div>
            )}
            {updates.map(u => (
              <div key={u.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                <div className="text-sm text-gray-500">{formatDateBR(u.date)}</div>
                <div className="mt-1 text-base font-semibold text-gray-900">{u.title}</div>
                <div className="mt-1 text-sm text-gray-800">{u.summary}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(u.tags || []).map((t: string) => (
                    <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-gray-900">Roadmap</h2>
          </div>
          <div className="space-y-8">
            {roadmap.map(r => (
              <div key={r.year}>
                <div className="text-lg font-semibold text-gray-900 mb-2">{r.year}</div>
                <div className="space-y-3">
                  {r.items.map((it, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                        {it.status === 'concluído' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : it.status === 'em andamento' ? (
                          <Clock3 className="h-4 w-4" />
                        ) : (
                          <CircleDashed className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-medium text-gray-900">{it.title}</div>
                        <div className="text-sm text-gray-700">{it.description}</div>
                        <div className="mt-1 text-xs text-gray-500">{it.quarter} • {it.status}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {it.tags?.map(t => (
                            <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{t}</span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
