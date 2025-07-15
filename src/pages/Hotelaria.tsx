import React, { useState, useEffect } from 'react'
import { Hotel, Search, Calendar, MapPin, Users, Plus, Minus, Star, Settings, X, AlertTriangle } from 'lucide-react'
import { hotelbedsService, Hotel as HotelType } from '../services/hotelbedsService'
import HotelResultados from '../components/HotelResultados'

interface Quarto {
  id: string
  adultos: number
  criancas: number
}

interface BuscaHotel {
  destino: string
  checkin: string
  checkout: string
  quartos: Quarto[]
  nacionalidade: string
  estrelas: string[]
  checkinAntecipado: boolean
  checkoutTardio: boolean
  cancelamentoGratuito: boolean
}

interface Destino {
  code: string
  name: {
    content: string
  }
  countryCode: string
  type: string
}

const Hotelaria = () => {
  const [formData, setFormData] = useState<BuscaHotel>({
    destino: '',
    checkin: '',
    checkout: '',
    quartos: [
      { id: '1', adultos: 2, criancas: 0 }
    ],
    nacionalidade: 'Brasil',
    estrelas: [],
    checkinAntecipado: false,
    checkoutTardio: false,
    cancelamentoGratuito: false
  })

  const [showQuartosModal, setShowQuartosModal] = useState(false)
  const [hoteis, setHoteis] = useState<HotelType[]>([])
  const [carregandoHoteis, setCarregandoHoteis] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [destinosSugeridos, setDestinosSugeridos] = useState<Destino[]>([])
  const [carregandoDestinos, setCarregandoDestinos] = useState(false)
  const [mostrarDestinos, setMostrarDestinos] = useState(false)
  const [credenciaisConfiguradas, setCredenciaisConfiguradas] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Verificar credenciais ao carregar
  useEffect(() => {
    const verificarSetup = async () => {
      const temCredenciais = hotelbedsService.verificarCredenciais()
      setCredenciaisConfiguradas(temCredenciais)
      
      if (temCredenciais) {
        try {
          const conexaoOk = await hotelbedsService.testarConexao()
          if (!conexaoOk) {
            setErro('Erro na conexão com a API. Verifique suas credenciais.')
          }
        } catch (error) {
          console.error('Erro no teste de conexão:', error)
          setErro('Falha ao conectar com o serviço de hotéis.')
        }
      }
    }
    
    verificarSetup()
  }, [])

  // Buscar destinos quando usuário digita
  useEffect(() => {
    const buscarDestinos = async () => {
      if (formData.destino.length >= 3 && credenciaisConfiguradas) {
        setCarregandoDestinos(true)
        setErro(null)
        
        try {
          const resposta = await hotelbedsService.buscarDestinos(formData.destino)
          setDestinosSugeridos(resposta.destinations)
          setMostrarDestinos(true)
        } catch (error) {
          console.error('Erro ao buscar destinos:', error)
          setErro('Erro na busca de destinos. Tente novamente.')
          setDestinosSugeridos([])
        } finally {
          setCarregandoDestinos(false)
        }
      } else {
        setDestinosSugeridos([])
        setMostrarDestinos(false)
      }
    }

    const timer = setTimeout(buscarDestinos, 500)
    return () => clearTimeout(timer)
  }, [formData.destino, credenciaisConfiguradas])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleEstrelasChange = (estrela: string) => {
    setFormData(prev => ({
      ...prev,
      estrelas: prev.estrelas.includes(estrela)
        ? prev.estrelas.filter(e => e !== estrela)
        : [...prev.estrelas, estrela]
    }))
  }

  const selecionarDestino = (destino: Destino) => {
    setFormData(prev => ({
      ...prev,
      destino: destino.name.content
    }))
    setMostrarDestinos(false)
    setDestinosSugeridos([])
  }

  const adicionarQuarto = () => {
    const novoQuarto: Quarto = {
      id: Date.now().toString(),
      adultos: 2,
      criancas: 0
    }
    setFormData(prev => ({
      ...prev,
      quartos: [...prev.quartos, novoQuarto]
    }))
  }

  const removerQuarto = (quartoId: string) => {
    if (formData.quartos.length > 1) {
      setFormData(prev => ({
        ...prev,
        quartos: prev.quartos.filter(q => q.id !== quartoId)
      }))
    }
  }

  const ajustarPassageirosQuarto = (quartoId: string, tipo: 'adultos' | 'criancas', operacao: 'incrementar' | 'decrementar') => {
    setFormData(prev => ({
      ...prev,
      quartos: prev.quartos.map(quarto => {
        if (quarto.id === quartoId) {
          const novoValor = operacao === 'incrementar' 
            ? quarto[tipo] + 1 
            : Math.max(tipo === 'adultos' ? 1 : 0, quarto[tipo] - 1)
          
          // Limitar máximo de 4 pessoas por quarto
          const totalQuarto = (tipo === 'adultos' ? novoValor : quarto.adultos) + 
                             (tipo === 'criancas' ? novoValor : quarto.criancas)
          
          if (totalQuarto > 4) {
            return quarto
          }
          
          return {
            ...quarto,
            [tipo]: novoValor
          }
        }
        return quarto
      })
    }))
  }

  const getTotalHospedes = () => {
    return formData.quartos.reduce((total, quarto) => total + quarto.adultos + quarto.criancas, 0)
  }

  const validarFormulario = (): string | null => {
    if (!formData.destino.trim()) {
      return 'Por favor, informe o destino'
    }
    
    if (!formData.checkin) {
      return 'Por favor, informe a data de check-in'
    }
    
    if (!formData.checkout) {
      return 'Por favor, informe a data de check-out'
    }
    
    const checkinDate = new Date(formData.checkin)
    const checkoutDate = new Date(formData.checkout)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    if (checkinDate < hoje) {
      return 'A data de check-in deve ser hoje ou futura'
    }
    
    if (checkoutDate <= checkinDate) {
      return 'A data de check-out deve ser posterior ao check-in'
    }
    
    return null
  }

  const handlePesquisar = async () => {
    if (!credenciaisConfiguradas) {
      setErro('⚠️ API Hotelbeds não configurada. Verifique suas credenciais.')
      return
    }

    const erroValidacao = validarFormulario()
    if (erroValidacao) {
      setErro(erroValidacao)
      return
    }

    setCarregandoHoteis(true)
    setErro(null)
    setMostrarResultados(false)

    try {
      console.log('🔍 Iniciando busca de hotéis...')
      
      const parametrosBusca = {
        destino: formData.destino,
        checkin: formData.checkin,
        checkout: formData.checkout,
        quartos: formData.quartos.map(q => ({
          adultos: q.adultos,
          criancas: q.criancas
        })),
        nacionalidade: formData.nacionalidade,
        moeda: 'EUR',
        categoria: formData.estrelas.length > 0 ? formData.estrelas : undefined,
        filtros: {
          checkinAntecipado: formData.checkinAntecipado,
          checkoutTardio: formData.checkoutTardio,
          cancelamentoGratuito: formData.cancelamentoGratuito
        }
      }

      const resultados = await hotelbedsService.buscarDisponibilidade(parametrosBusca)
      
      console.log('✅ Busca concluída:', resultados.length, 'hotéis encontrados')
      
      setHoteis(resultados)
      setMostrarResultados(true)
      
      if (resultados.length === 0) {
        setErro('Nenhum hotel encontrado para os critérios informados. Tente ajustar as datas ou destino.')
      }
      
    } catch (error) {
      console.error('❌ Erro na busca:', error)
      setErro(error instanceof Error ? error.message : 'Erro na busca de hotéis. Tente novamente.')
      setHoteis([])
      setMostrarResultados(false)
    } finally {
      setCarregandoHoteis(false)
    }
  }

  const handleVerDetalhesHotel = async (hotel: HotelType) => {
    console.log('🏨 Ver detalhes do hotel:', hotel.nome)
    
    try {
      const detalhes = await hotelbedsService.buscarDetalhesHotel(hotel.id)
      if (detalhes) {
        console.log('✅ Detalhes carregados:', detalhes)
        // Aqui você pode abrir um modal mais detalhado ou navegar para uma nova página
        alert(`Detalhes do ${hotel.nome} carregados! Verifique o console para ver todas as informações.`)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error)
      alert('Erro ao carregar detalhes do hotel. Tente novamente.')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg border border-indigo-200">
              <Hotel className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Hotelaria</h1>
              <p className="text-gray-600 mt-1">Busque e compare hotéis com a API Hotelbeds</p>
            </div>
          </div>

          {/* Alerta de configuração */}
          {!credenciaisConfiguradas && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">API Hotelbeds não configurada</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Para usar a busca real de hotéis, siga estes passos:
                    <br />
                    <strong>1.</strong> Registre-se em: <a href="https://developer.hotelbeds.com/" target="_blank" rel="noopener noreferrer" className="underline">developer.hotelbeds.com</a>
                    <br />
                    <strong>2.</strong> Obtenha sua API Key e Secret no dashboard
                    <br />
                    <strong>3.</strong> Configure no arquivo .env:
                  </p>
                  <code className="bg-yellow-100 px-2 py-1 rounded mt-2 inline-block text-xs">
                    REACT_APP_HOTELBEDS_API_KEY=sua_api_key<br />
                    REACT_APP_HOTELBEDS_SECRET=seu_secret
                  </code>
                  <p className="text-xs text-yellow-600 mt-2">
                    💡 As credenciais de teste têm quota de 50 requisições/dia
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Alert de erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Erro</h3>
                  <p className="text-sm text-red-700 mt-1">{erro}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Interface de Busca */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          {/* Formulário */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Encontrar Hotel</h2>
              <p className="text-gray-600">Preencha os dados da sua estadia para buscar as melhores opções</p>
            </div>

            {/* Seção: Destino */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Destino
              </h3>
              <div className="relative">
                <input
                  type="text"
                  name="destino"
                  value={formData.destino}
                  onChange={handleInputChange}
                  onFocus={() => {
                    if (destinosSugeridos.length > 0) {
                      setMostrarDestinos(true)
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Para onde você quer ir? Cidade, hotel ou ponto de referência"
                />
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                {carregandoDestinos ? (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                )}

                {/* Dropdown de destinos */}
                {mostrarDestinos && destinosSugeridos.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {destinosSugeridos.map((destino, index) => (
                      <button
                        key={index}
                        onClick={() => selecionarDestino(destino)}
                        className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-purple-50"
                      >
                        <div className="font-medium text-gray-900">{destino.name.content}</div>
                        <div className="text-sm text-gray-500">{destino.type} • {destino.countryCode}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Seção: Datas */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Datas da Estadia
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="checkin"
                      value={formData.checkin}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Check-out */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="checkout"
                      value={formData.checkout}
                      onChange={handleInputChange}
                      min={formData.checkin || new Date().toISOString().split('T')[0]}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Quartos e Hóspedes */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Quartos e Hóspedes
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <button
                  onClick={() => setShowQuartosModal(true)}
                  className="w-full p-4 bg-white border border-gray-300 rounded-lg hover:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formData.quartos.length} {formData.quartos.length === 1 ? 'quarto' : 'quartos'} para {getTotalHospedes()} {getTotalHospedes() === 1 ? 'hóspede' : 'hóspedes'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formData.quartos.map((quarto, index) => (
                          <span key={quarto.id}>
                            Quarto {index + 1}: {quarto.adultos} adulto{quarto.adultos !== 1 ? 's' : ''}
                            {quarto.criancas > 0 && `, ${quarto.criancas} criança${quarto.criancas !== 1 ? 's' : ''}`}
                            {index < formData.quartos.length - 1 && ' • '}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                </button>
              </div>
            </div>

            {/* Seção: Parâmetros Adicionais */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Parâmetros Adicionais
              </h3>
              
              <div className="space-y-6">
                {/* Nacionalidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nacionalidade dos hóspedes
                  </label>
                  <select
                    name="nacionalidade"
                    value={formData.nacionalidade}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Brasil">Brasil</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Estados Unidos">Estados Unidos</option>
                    <option value="França">França</option>
                    <option value="Alemanha">Alemanha</option>
                    <option value="Reino Unido">Reino Unido</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                {/* Categoria de Estrelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Categoria (estrelas)
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: 'sem-estrelas', label: 'Sem estrelas' },
                      { value: '2-estrelas', label: '2 estrelas' },
                      { value: '3-estrelas', label: '3 estrelas' },
                      { value: '4-estrelas', label: '4 estrelas' },
                      { value: '5-estrelas', label: '5 estrelas' }
                    ].map((categoria) => (
                      <label
                        key={categoria.value}
                        className={`flex items-center px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.estrelas.includes(categoria.value)
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.estrelas.includes(categoria.value)}
                          onChange={() => handleEstrelasChange(categoria.value)}
                          className="sr-only"
                        />
                        {categoria.value !== 'sem-estrelas' && (
                          <Star className={`h-4 w-4 mr-1 ${
                            formData.estrelas.includes(categoria.value) ? 'text-purple-600' : 'text-gray-400'
                          }`} />
                        )}
                        <span className="text-sm font-medium">{categoria.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Opções Extras */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="checkinAntecipado"
                      checked={formData.checkinAntecipado}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Check-in antecipado</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="checkoutTardio"
                      checked={formData.checkoutTardio}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Check-out tardio</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="cancelamentoGratuito"
                      checked={formData.cancelamentoGratuito}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Cancelamento gratuito</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Botão Buscar */}
            <div className="flex justify-center">
              <button
                onClick={handlePesquisar}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg flex items-center transition-colors shadow-lg hover:shadow-xl"
              >
                <Search className="h-6 w-6 mr-3" />
                Buscar Hotéis
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Quartos */}
        {showQuartosModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Quartos e Hóspedes</h3>
                  <p className="text-sm text-gray-600 mt-1">Configure os quartos e número de hóspedes</p>
                </div>
                <button
                  onClick={() => setShowQuartosModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-6">
                  {formData.quartos.map((quarto, index) => (
                    <div key={quarto.id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Quarto {index + 1}</h4>
                        {formData.quartos.length > 1 && (
                          <button
                            onClick={() => removerQuarto(quarto.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remover
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        {/* Adultos */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Adultos</label>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => ajustarPassageirosQuarto(quarto.id, 'adultos', 'decrementar')}
                              disabled={quarto.adultos <= 1}
                              className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900">{quarto.adultos}</span>
                            <button
                              onClick={() => ajustarPassageirosQuarto(quarto.id, 'adultos', 'incrementar')}
                              disabled={quarto.adultos + quarto.criancas >= 4}
                              className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Crianças */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Crianças</label>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => ajustarPassageirosQuarto(quarto.id, 'criancas', 'decrementar')}
                              disabled={quarto.criancas <= 0}
                              className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900">{quarto.criancas}</span>
                            <button
                              onClick={() => ajustarPassageirosQuarto(quarto.id, 'criancas', 'incrementar')}
                              disabled={quarto.adultos + quarto.criancas >= 4}
                              className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          {quarto.criancas > 0 && (
                            <p className="text-xs text-gray-500 mt-1">0-17 anos</p>
                          )}
                        </div>
                      </div>

                      {quarto.adultos + quarto.criancas >= 4 && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                          ⚠️ Máximo de 4 pessoas por quarto
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Botão Adicionar Quarto */}
                  <button
                    onClick={adicionarQuarto}
                    className="w-full p-4 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Adicionar um quarto
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowQuartosModal(false)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Concluído
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resultados da Busca */}
        {(mostrarResultados || carregandoHoteis) && (
          <div className="mt-8">
            <HotelResultados
              hoteis={hoteis}
              carregando={carregandoHoteis}
              onVerDetalhes={handleVerDetalhesHotel}
            />
          </div>
        )}

        {/* Informações sobre a API */}
        {!mostrarResultados && !carregandoHoteis && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Hotel className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800 font-medium">
                  {credenciaisConfiguradas ? 'Busca de Hotéis com API Hotelbeds' : 'Sistema de Hotelaria'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {credenciaisConfiguradas 
                    ? 'Integração completa com a API Hotelbeds. Faça sua busca para ver hotéis reais com disponibilidade e preços em tempo real.'
                    : 'Interface completa para busca de hotéis. Configure suas credenciais da API Hotelbeds para ativar a busca real.'
                  }
                </p>
                {credenciaisConfiguradas && (
                  <div className="mt-2 space-y-1 text-xs text-blue-600">
                    <p>✅ Autocomplete de destinos</p>
                    <p>✅ Busca em tempo real</p>
                    <p>✅ Filtros avançados</p>
                    <p>✅ Detalhes completos dos hotéis</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Hotelaria 