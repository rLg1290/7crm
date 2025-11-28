import React, { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  valueISO: string
  onChange: (iso: string) => void
  className?: string
}

export default function DateBRPicker({ valueISO, onChange, className }: Props) {
  const parseISO = (iso?: string) => {
    if (!iso || iso.length < 10) return null
    const y = parseInt(iso.slice(0,4))
    const m = parseInt(iso.slice(5,7)) - 1
    const d = parseInt(iso.slice(8,10))
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
    return { y, m, d }
  }
  const parsed = parseISO(valueISO)
  const now = new Date()
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(parsed?.y ?? now.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? now.getMonth())
  const selYear = parsed?.y ?? null
  const selMonth = parsed?.m ?? null
  const selDay = parsed?.d ?? null
  const monthsPT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  const weekPT = ['D','S','T','Q','Q','S','S']
  const containerRef = useRef<HTMLDivElement>(null)
  const days = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    const count = new Date(viewYear, viewMonth + 1, 0).getDate()
    const startIdx = first.getDay()
    const arr: Array<{ n: number, iso: string } | null> = []
    for (let i = 0; i < startIdx; i++) arr.push(null)
    for (let d = 1; d <= count; d++) {
      const iso = `${String(viewYear).padStart(4,'0')}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      arr.push({ n: d, iso })
    }
    return arr
  }, [viewYear, viewMonth])
  const formatBR = (iso?: string) => {
    if (!iso) return ''
    const a = iso.slice(0,10).split('-')
    return a.length === 3 ? `${a[2]}/${a[1]}/${a[0]}` : iso
  }
  const handleDoc = (e: MouseEvent) => {
    if (!containerRef.current) return
    if (!containerRef.current.contains(e.target as Node)) setOpen(false)
  }
  useEffect(() => {
    document.addEventListener('mousedown', handleDoc)
    return () => document.removeEventListener('mousedown', handleDoc)
  }, [])
  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <input
        value={formatBR(valueISO)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        readOnly
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        placeholder="dd/mm/aaaa"
      />
      {open && (
        <div style={{ position: 'absolute', zIndex: 50, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 6px 20px #0002', marginTop: 6, width: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid #f3f4f6' }}>
            <button onClick={() => { const m = viewMonth - 1; if (m < 0) { setViewMonth(11); setViewYear(viewYear - 1) } else setViewMonth(m) }} className="px-2 py-1">‹</button>
            <div style={{ fontWeight: 700 }}>{monthsPT[viewMonth]} de {viewYear}</div>
            <button onClick={() => { const m = viewMonth + 1; if (m > 11) { setViewMonth(0); setViewYear(viewYear + 1) } else setViewMonth(m) }} className="px-2 py-1">›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: 10, fontSize: 12, color: '#6b7280' }}>
            {weekPT.map((w,i) => (<div key={i} style={{ textAlign: 'center', fontWeight: 700 }}>{w}</div>))}
            {days.map((d,i) => d ? (
              <button
                key={i}
                onClick={() => { onChange(d.iso); setOpen(false) }}
                className="px-2 py-1 rounded"
                style={{ textAlign: 'center', background: (selYear!==null && selMonth!==null && selDay!==null && selYear===viewYear && selMonth===viewMonth && selDay===d.n) ? '#e0f2fe' : '#fff', color: '#111827', border: '1px solid #e5e7eb' }}
              >
                {String(d.n).padStart(2,'0')}
              </button>
            ) : (
              <div key={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
