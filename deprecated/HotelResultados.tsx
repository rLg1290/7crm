import { useState, useMemo } from 'react'
import { Hotel } from '../services/hotelbedsService'
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  Wifi, 
  Coffee,
  Phone,
  Mail,
  Globe,
  Heart,
  Share2,
  Calendar,
  User,
  Building,
  Route,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Eye
} from 'lucide-react'

interface HotelResultadosProps {
  hoteis: Hotel[]
  carregando: boolean
  onVerDetalhes: (hotel: Hotel) => void
}

interface Filtros {
  categoria: number[]
  precoMin: number
  precoMax: number
  facilidades: string[]
  avaliacaoMin: number
}

const HotelResultados: React.FC<HotelResultadosProps> = ({ hoteis, carregando, onVerDetalhes }) => {
  const [filtros, setFiltros] = useState<Filtros>({
    categoria: [],
    precoMin: 0,
    precoMax: 1000,
    facilidades: [],
    avaliacaoMin: 0
  })
  
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [hotelSelecionado, setHotelSelecionado] = useState<Hotel | null>(null)
  const [imagemAtual, setImagemAtual] = useState(0)
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set())

  // Aplicar filtros aos hotéis
  const hotelsFiltrados = useMemo(() => {
    return hoteis.filter(hotel => {
      // Filtro por categoria
      if (filtros.categoria.length > 0 && !filtros.categoria.includes(hotel.categoria)) {
        return false
      }
      
      // Filtro por avaliação
      if (hotel.avaliacoes.nota < filtros.avaliacaoMin) {
        return false
      }
      
      // Filtro por facilidades
      if (filtros.facilidades.length > 0) {
        const hotelFacilidades = hotel.facilidades.map(f => f.toLowerCase())
        const facilitadesFiltro = filtros.facilidades.map(f => f.toLowerCase())
        
        if (!facilitadesFiltro.some(f => hotelFacilidades.some(hf => hf.includes(f)))) {
          return false
        }
      }
      
      return true
    })
  }, [hoteis, filtros])

  const toggleFavorito = (hotelId: string) => {
    const novosFavoritos = new Set(favoritos)
    if (novosFavoritos.has(hotelId)) {
      novosFavoritos.delete(hotelId)
    } else {
      novosFavoritos.add(hotelId)
    }
    setFavoritos(novosFavoritos)
  }

  const renderEstrelas = (categoria: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < categoria ? 'text-yellow-500 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const abrirDetalhes = (hotel: Hotel) => {
    setHotelSelecionado(hotel)
    setImagemAtual(0)
  }

  const proximaImagem = () => {
    if (hotelSelecionado && hotelSelecionado.imagens.length > 0) {
      setImagemAtual((prev) => 
        prev === hotelSelecionado.imagens.length - 1 ? 0 : prev + 1
      )
    }
  }

  const imagemAnterior = () => {
    if (hotelSelecionado && hotelSelecionado.imagens.length > 0) {
      setImagemAtual((prev) => 
        prev === 0 ? hotelSelecionado.imagens.length - 1 : prev - 1
      )
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Buscando hotéis...</p>
        </div>
      </div>
    )
  }

  if (hoteis.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <MapPin className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum hotel encontrado</h3>
        <p className="text-gray-600">Tente ajustar seus critérios de busca.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {hotelsFiltrados.length} {hotelsFiltrados.length === 1 ? 'hotel encontrado' : 'hotéis encontrados'}
          </h2>
          <p className="text-gray-600 mt-1">
            {filtros.categoria.length > 0 || filtros.facilidades.length > 0 || filtros.avaliacaoMin > 0
              ? 'Filtros aplicados'
              : 'Todos os resultados'
            }
          </p>
        </div>
        
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Painel de Filtros */}
      {mostrarFiltros && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            <button
              onClick={() => setFiltros({
                categoria: [],
                precoMin: 0,
                precoMax: 1000,
                facilidades: [],
                avaliacaoMin: 0
              })}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              Limpar filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Categoria</label>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(estrela => (
                  <label key={estrela} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filtros.categoria.includes(estrela)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFiltros(prev => ({
                            ...prev,
                            categoria: [...prev.categoria, estrela]
                          }))
                        } else {
                          setFiltros(prev => ({
                            ...prev,
                            categoria: prev.categoria.filter(c => c !== estrela)
                          }))
                        }
                      }}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 flex items-center">
                      {renderEstrelas(estrela)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Avaliação Mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Avaliação mínima: {filtros.avaliacaoMin}/10
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filtros.avaliacaoMin}
                onChange={(e) => setFiltros(prev => ({
                  ...prev,
                  avaliacaoMin: parseFloat(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Facilidades */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Facilidades</label>
              <div className="space-y-2">
                {['wifi', 'estacionamento', 'café', 'piscina', 'academia'].map(facilidade => (
                  <label key={facilidade} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filtros.facilidades.includes(facilidade)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFiltros(prev => ({
                            ...prev,
                            facilidades: [...prev.facilidades, facilidade]
                          }))
                        } else {
                          setFiltros(prev => ({
                            ...prev,
                            facilidades: prev.facilidades.filter(f => f !== facilidade)
                          }))
                        }
                      }}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 capitalize">{facilidade}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Hotéis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hotelsFiltrados.map((hotel) => (
          <div key={hotel.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Imagem Principal */}
            <div className="relative h-48">
              {hotel.imagens.length > 0 ? (
                <img
                  src={hotel.imagens[0].url}
                  alt={hotel.nome}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Hotel'
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <MapPin className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Botão Favorito */}
              <button
                onClick={() => toggleFavorito(hotel.id)}
                className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <Heart 
                  className={`h-5 w-5 ${
                    favoritos.has(hotel.id) 
                      ? 'text-red-500 fill-current' 
                      : 'text-gray-400'
                  }`} 
                />
              </button>

              {/* Categoria */}
              <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full shadow-md">
                <div className="flex items-center space-x-1">
                  {renderEstrelas(hotel.categoria)}
                </div>
              </div>
            </div>

            {/* Informações do Hotel */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {hotel.nome}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {hotel.endereco.cidade}, {hotel.endereco.pais}
                  </div>
                </div>
                
                {hotel.avaliacoes.nota > 0 && (
                  <div className="text-right">
                    <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-semibold">
                      {hotel.avaliacoes.nota.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {hotel.avaliacoes.comentarios} avaliações
                    </div>
                  </div>
                )}
              </div>

              {/* Facilidades principais */}
              {hotel.facilidades.length > 0 && (
                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                  {hotel.facilidades.slice(0, 3).map((facilidade, index) => (
                    <div key={index} className="flex items-center">
                      <Wifi className="h-4 w-4 mr-1" />
                      <span>{facilidade}</span>
                    </div>
                  ))}
                  {hotel.facilidades.length > 3 && (
                    <span className="text-purple-600">+{hotel.facilidades.length - 3} mais</span>
                  )}
                </div>
              )}

              {/* Descrição resumida */}
              {hotel.descricao && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {hotel.descricao}
                </p>
              )}

              {/* Ações */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Check-in: {hotel.politicas.checkin}
                </div>
                
                <div className="space-x-2">
                  <button
                    onClick={() => abrirDetalhes(hotel)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {hotelSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{hotelSelecionado.nome}</h3>
                <div className="flex items-center mt-1">
                  {renderEstrelas(hotelSelecionado.categoria)}
                  <span className="ml-2 text-gray-600">{hotelSelecionado.endereco.cidade}</span>
                </div>
              </div>
              <button
                onClick={() => setHotelSelecionado(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Galeria de Imagens */}
              {hotelSelecionado.imagens.length > 0 && (
                <div className="relative mb-6">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={hotelSelecionado.imagens[imagemAtual]?.url}
                      alt={hotelSelecionado.nome}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Hotel'
                      }}
                    />
                  </div>
                  
                  {hotelSelecionado.imagens.length > 1 && (
                    <>
                      <button
                        onClick={imagemAnterior}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={proximaImagem}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {imagemAtual + 1} / {hotelSelecionado.imagens.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações Principais */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Endereço</h4>
                    <div className="text-gray-600 space-y-1">
                      <p>{hotelSelecionado.endereco.rua}</p>
                      <p>{hotelSelecionado.endereco.cidade}, {hotelSelecionado.endereco.estado}</p>
                      <p>{hotelSelecionado.endereco.pais} - {hotelSelecionado.endereco.cep}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Contato</h4>
                    <div className="space-y-2">
                      {hotelSelecionado.contato.telefone && (
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          {hotelSelecionado.contato.telefone}
                        </div>
                      )}
                      {hotelSelecionado.contato.website && (
                        <div className="flex items-center text-gray-600">
                          <Globe className="h-4 w-4 mr-2" />
                          <a 
                            href={hotelSelecionado.contato.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700"
                          >
                            Site oficial
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Políticas</h4>
                    <div className="text-gray-600 space-y-1">
                      <p>Check-in: {hotelSelecionado.politicas.checkin}</p>
                      <p>Check-out: {hotelSelecionado.politicas.checkout}</p>
                      <p className="text-sm">{hotelSelecionado.politicas.cancelamento}</p>
                    </div>
                  </div>
                </div>

                {/* Facilidades e Descrição */}
                <div className="space-y-4">
                  {hotelSelecionado.descricao && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Descrição</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {hotelSelecionado.descricao}
                      </p>
                    </div>
                  )}

                  {hotelSelecionado.facilidades.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Facilidades</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {hotelSelecionado.facilidades.map((facilidade, index) => (
                          <div key={index} className="flex items-center text-gray-600 text-sm">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                            {facilidade}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 space-x-3">
              <button
                onClick={() => toggleFavorito(hotelSelecionado.id)}
                className={`px-4 py-2 border rounded-lg transition-colors ${
                  favoritos.has(hotelSelecionado.id)
                    ? 'border-red-300 text-red-700 bg-red-50'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart className={`h-4 w-4 inline mr-2 ${
                  favoritos.has(hotelSelecionado.id) ? 'fill-current' : ''
                }`} />
                {favoritos.has(hotelSelecionado.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              </button>
              
              <button
                onClick={() => onVerDetalhes(hotelSelecionado)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ver Disponibilidade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HotelResultados 