import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function RoadmapCard() {
  const [visible, setVisible] = useState<boolean>(() => {
    return localStorage.getItem('roadmap_card_dismissed') !== '1'
  })
  useEffect(() => {
    if (!visible) localStorage.setItem('roadmap_card_dismissed', '1')
  }, [visible])
  if (!visible) return null
  return (
    <div className="fixed top-3 right-3 z-50 bg-white border border-gray-200 shadow-xl rounded-xl p-3 w-72">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">Roadmap</div>
          <div className="text-xs text-gray-600 mt-1">Novas funcionalidades em breve. Deixe suas sugestões.</div>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Fechar"
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}
