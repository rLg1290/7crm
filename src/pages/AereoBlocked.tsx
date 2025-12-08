import { Lock } from 'lucide-react'

export default function AereoBlocked() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 text-gray-700 mb-4">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Aéreo indisponível no momento</h1>
        <p className="text-gray-600 mt-2">Estamos preparando esta área. Em breve você poderá pesquisar e comparar voos aqui.</p>
      </div>
    </div>
  )
}

