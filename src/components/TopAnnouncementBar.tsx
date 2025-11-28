import { Link } from 'react-router-dom'
import { X, Megaphone } from 'lucide-react'
import { useState } from 'react'

export default function TopAnnouncementBar() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null
  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-2 flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-blue-600/10 text-blue-700 flex items-center justify-center">
          <Megaphone className="h-4 w-4" />
        </div>
        <div className="text-sm text-gray-900 flex-1">Roadmap: veja o que vem por aí</div>
        <Link to="/atualizacoes" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Abrir roadmap</Link>
        <button onClick={() => { setVisible(false) }} className="p-2 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
