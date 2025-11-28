import { Link } from 'react-router-dom'
import { PlayCircle, Film } from 'lucide-react'

export default function EducacaoHome() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Base de Conhecimento</h1>
            <p className="text-sm text-gray-600">Educação corporativa com conteúdos estratégicos e técnicos para agências.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/educacao/lives" className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden">
            <div className="p-6 flex items-center">
              <div className="h-12 w-12 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center mr-4">
                <PlayCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-medium text-gray-900">Lives gravadas</div>
                <div className="text-sm text-gray-600">Transmissões gravadas por período (Ano/Mês).</div>
              </div>
            </div>
            <div className="h-32 bg-gradient-to-r from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200" />
          </Link>

          <Link to="/educacao/videos" className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden">
            <div className="p-6 flex items-center">
              <div className="h-12 w-12 rounded-xl bg-purple-600/10 text-purple-700 flex items-center justify-center mr-4">
                <Film className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-medium text-gray-900">Vídeos</div>
                <div className="text-sm text-gray-600">Conteúdos técnicos e estratégicos organizados por temas.</div>
              </div>
            </div>
            <div className="h-32 bg-gradient-to-r from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200" />
          </Link>
        </div>
      </div>
    </div>
  )
}
