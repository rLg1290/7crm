import React, { useState } from 'react'
import { Plane, Search, Minus, Plus, Calendar, MapPin, Users, Settings } from 'lucide-react'

interface BuscaPassagem {
  origem: string
  destino: string
  dataIda: string
  dataVolta: string
  somenteIda: boolean
  adultos: number
  criancas: number
  bebes: number
  classe: string
}

const Aereo = () => {
  const [formData, setFormData] = useState<BuscaPassagem>({
    origem: '',
    destino: '',
    dataIda: '',
    dataVolta: '',
    somenteIda: false,
    adultos: 1,
    criancas: 0,
    bebes: 0,
    classe: 'ECONÔMICA'
  })

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

  const ajustarPassageiros = (tipo: 'adultos' | 'criancas' | 'bebes', operacao: 'incrementar' | 'decrementar') => {
    setFormData(prev => {
      const novoValor = operacao === 'incrementar' ? prev[tipo] + 1 : Math.max(0, prev[tipo] - 1)
      
      // Validar limite mínimo de adultos
      if (tipo === 'adultos' && novoValor < 1) {
        return prev
      }
      
      // Validar limite total de passageiros
      const total = (tipo === 'adultos' ? novoValor : prev.adultos) + 
                   (tipo === 'criancas' ? novoValor : prev.criancas) + 
                   (tipo === 'bebes' ? novoValor : prev.bebes)
      
      if (total > 9) {
        return prev
      }
      
      return {
        ...prev,
        [tipo]: novoValor
      }
    })
  }

  const handlePesquisar = () => {
    console.log('🔍 Pesquisando passagens com:', formData)
    alert('🔍 Busca de passagens simulada!\n\nEm breve será integrada com APIs reais de companhias aéreas.')
  }

  const totalPassageiros = formData.adultos + formData.criancas + formData.bebes

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 shadow-lg border border-sky-200">
              <Plane className="h-8 w-8 text-sky-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Aéreo</h1>
              <p className="text-gray-600 mt-1">Busque e compare passagens aéreas</p>
            </div>
          </div>
        </div>

        {/* Interface de Busca */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          {/* Formulário */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Encontrar Passagem</h2>
              <p className="text-gray-600">Preencha os dados da sua viagem para buscar as melhores opções</p>
            </div>

            {/* Seção: Destinos */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                Destinos
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Origem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origem
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="origem"
                      value={formData.origem}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Onde você está?"
                    />
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                  </div>
                </div>

                {/* Destino */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destino
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="destino"
                      value={formData.destino}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Para onde você quer ir?"
                    />
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Datas */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Datas da Viagem
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Data Ida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Ida
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dataIda"
                      value={formData.dataIda}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Data Volta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Volta
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      name="dataVolta"
                      value={formData.dataVolta}
                      onChange={handleInputChange}
                      disabled={formData.somenteIda}
                      className={`w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        formData.somenteIda ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                      }`}
                    />
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Checkbox Somente Ida */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="somenteIda"
                  id="somenteIda"
                  checked={formData.somenteIda}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="somenteIda" className="ml-3 text-sm font-medium text-gray-700">
                  Somente ida (sem volta)
                </label>
              </div>
            </div>

            {/* Seção: Passageiros */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Passageiros ({totalPassageiros} {totalPassageiros === 1 ? 'pessoa' : 'pessoas'})
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Adultos */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">Adultos</div>
                        <div className="text-sm text-gray-500">12+ anos</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('adultos', 'decrementar')}
                          disabled={formData.adultos <= 1}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{formData.adultos}</span>
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('adultos', 'incrementar')}
                          disabled={totalPassageiros >= 9}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Crianças */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">Crianças</div>
                        <div className="text-sm text-gray-500">2-11 anos</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('criancas', 'decrementar')}
                          disabled={formData.criancas <= 0}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{formData.criancas}</span>
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('criancas', 'incrementar')}
                          disabled={totalPassageiros >= 9}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bebês */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-semibold text-gray-900">Bebês</div>
                        <div className="text-sm text-gray-500">0-2 anos</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('bebes', 'decrementar')}
                          disabled={formData.bebes <= 0}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">{formData.bebes}</span>
                        <button
                          type="button"
                          onClick={() => ajustarPassageiros('bebes', 'incrementar')}
                          disabled={totalPassageiros >= 9}
                          className="w-8 h-8 rounded-full border-2 border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {totalPassageiros >= 9 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Grupos (Acima de 09 pessoas) a solicitação deve ser feita offline via e-mail
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Seção: Classe */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Classe do Voo
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: 'ECONÔMICA', label: 'Econômica', description: 'Básica' },
                  { value: 'PREMIUM ECONOMY', label: 'Premium Economy', description: 'Conforto extra' },
                  { value: 'EXECUTIVA', label: 'Executiva', description: 'Business' },
                  { value: 'PRIMEIRA CLASSE', label: 'Primeira Classe', description: 'Luxo máximo' }
                ].map((classe) => (
                  <label
                    key={classe.value}
                    className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.classe === classe.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="classe"
                      value={classe.value}
                      checked={formData.classe === classe.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <Plane className={`h-6 w-6 mb-2 ${
                      formData.classe === classe.value ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div className="text-sm font-semibold text-center">{classe.label}</div>
                    <div className="text-xs text-center opacity-75">{classe.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Botão Pesquisar */}
            <div className="flex justify-center">
              <button
                onClick={handlePesquisar}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg flex items-center transition-colors shadow-lg hover:shadow-xl"
              >
                <Search className="h-6 w-6 mr-3" />
                Pesquisar Passagens
              </button>
            </div>
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Plane className="h-5 w-5 text-blue-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800 font-medium">Em Desenvolvimento</p>
              <p className="text-sm text-blue-700 mt-1">
                Esta interface será integrada com APIs de companhias aéreas para busca em tempo real de passagens, 
                comparação de preços e emissão de bilhetes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Aereo 