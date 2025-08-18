import { useState, useEffect } from 'react'
import { Search, Eye, Download, Calendar, User, Building2, BarChart3, TrendingUp, Users, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PesquisaResposta {
  id: string
  nome_pesquisa: string
  tipo_pesquisa: 'identificada' | 'anonima'
  nome_agencia?: string
  email_agencia?: string
  telefone_agencia?: string
  cidade_agencia?: string
  estado_agencia?: string
  cep_agencia?: string
  endereco_agencia?: string
  demanda_agencia: 'lazer' | 'corporativo' | 'ambos'
  percentual_lazer?: number
  percentual_corporativo?: number
  demanda_aereo: 'domestico' | 'internacional' | 'ambos'
  percentual_domestico?: number
  percentual_internacional?: number
  vende_hotelaria: boolean
  motivo_nao_hotelaria?: 'nao_entendo' | 'nao_tenho_fornecedor' | 'outro'
  motivo_nao_hotelaria_outro?: string
  tipo_hotelaria?: 'brasil' | 'internacional' | 'ambos'
  percentual_hotelaria_brasil?: number
  percentual_hotelaria_internacional?: number
  faturamento_6meses: 'ate_30k' | '30k_50k' | '50k_100k' | '100k_500k' | '500k_1m' | 'mais_1m'
  percentual_faturamento_7c: number
  percentual_faturamento_outros: number
  utiliza_crm_erp: boolean
  utiliza_planilhas: boolean
  sistema_crm_atual?: string
  opiniao_crm: 'extremamente_util' | 'muito_util' | 'pouco_util' | 'nao_seria_util'
  facilidade_buscador: number
  preco_buscador: number
  disponibilidade_buscador: number
  atendimento_central: number
  pos_venda: number
  recomendacao: number
  feedback_melhorias?: string
  comentario_sugestao?: string
  cupom_desconto?: string
  cupom_utilizado: boolean
  sistema_cupons?: string
  created_at: string
  updated_at: string
  ip_address?: string
  session_id?: string
}

interface PesquisaAgrupada {
  nome_pesquisa: string
  total_respostas: number
  respostas_identificadas: number
  respostas_anonimas: number
  data_inicio: string
  data_fim: string
  nps_score: number
  media_satisfacao: number
  status: 'ativa' | 'finalizada'
  respostas: PesquisaResposta[]
}

const Pesquisas = () => {
  const [pesquisas, setPesquisas] = useState<PesquisaAgrupada[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todas')
  const [selectedPesquisa, setSelectedPesquisa] = useState<PesquisaAgrupada | null>(null)
  


  useEffect(() => {
    fetchPesquisas()
  }, [])

  const calcularNPS = (respostas: PesquisaResposta[]): number => {
    if (respostas.length === 0) return 0
    
    const promotores = respostas.filter(r => r.recomendacao >= 9).length
    const detratores = respostas.filter(r => r.recomendacao <= 6).length
    
    return Math.round(((promotores - detratores) / respostas.length) * 100)
  }

  const calcularMediaSatisfacao = (respostas: PesquisaResposta[]): number => {
    if (respostas.length === 0) return 0
    
    const soma = respostas.reduce((acc, r) => {
      return acc + r.facilidade_buscador + r.preco_buscador + r.disponibilidade_buscador + r.atendimento_central + r.pos_venda
    }, 0)
    
    return Math.round((soma / (respostas.length * 5)) * 10) / 10
  }



  const exportarDados = (pesquisa: PesquisaAgrupada) => {
    const headers = [
      'ID',
      'Data Resposta',
      'Tipo Pesquisa',
      'Nome Agência',
      'Email Agência',
      'Cidade',
      'Estado',
      'Demanda Agência',
      'Demanda Aéreo',
      'Vende Hotelaria',
      'Faturamento 6 Meses',
      'Facilidade Buscador',
      'Preço Buscador',
      'Disponibilidade Buscador',
      'Atendimento Central',
      'Pós Venda',
      'Recomendação NPS',
      'Feedback Melhorias',
      'Cupom Desconto',
      'IP Address'
    ]

    const csvContent = [
      headers.join(','),
      ...pesquisa.respostas.map(resposta => [
        resposta.id,
        new Date(resposta.created_at).toLocaleDateString('pt-BR'),
        resposta.tipo_pesquisa,
        resposta.nome_agencia || '',
        resposta.email_agencia || '',
        resposta.cidade_agencia || '',
        resposta.estado_agencia || '',
        resposta.demanda_agencia || '',
        resposta.demanda_aereo || '',
        resposta.vende_hotelaria ? 'Sim' : 'Não',
        resposta.faturamento_6meses || '',
        resposta.facilidade_buscador,
        resposta.preco_buscador,
        resposta.disponibilidade_buscador,
        resposta.atendimento_central,
        resposta.pos_venda,
        resposta.recomendacao,
        `"${resposta.feedback_melhorias || ''}"`,
        resposta.cupom_desconto || '',
        resposta.ip_address || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${pesquisa.nome_pesquisa}_respostas.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const fetchPesquisas = async () => {
    try {
      setLoading(true)
      
      const { data: respostas, error } = await supabase
        .from('pesquisa_respostas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar respostas:', error)
        return
      }

      if (!respostas || respostas.length === 0) {
        setPesquisas([])
        return
      }

      // Agrupar respostas por nome_pesquisa
      const pesquisasAgrupadas = respostas.reduce((acc: { [key: string]: PesquisaResposta[] }, resposta) => {
        const nomePesquisa = resposta.nome_pesquisa
        if (!acc[nomePesquisa]) {
          acc[nomePesquisa] = []
        }
        acc[nomePesquisa].push(resposta)
        return acc
      }, {})

      // Converter para array de PesquisaAgrupada
      const pesquisasProcessadas: PesquisaAgrupada[] = Object.entries(pesquisasAgrupadas).map(([nomePesquisa, respostas]) => {
        const dataInicio = respostas.reduce((min, r) => r.created_at < min ? r.created_at : min, respostas[0].created_at)
        const dataFim = respostas.reduce((max, r) => r.created_at > max ? r.created_at : max, respostas[0].created_at)
        const agora = new Date()
        const ultimaResposta = new Date(dataFim)
        const diasSemResposta = Math.floor((agora.getTime() - ultimaResposta.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          nome_pesquisa: nomePesquisa,
          total_respostas: respostas.length,
          respostas_identificadas: respostas.filter(r => r.tipo_pesquisa === 'identificada').length,
          respostas_anonimas: respostas.filter(r => r.tipo_pesquisa === 'anonima').length,
          data_inicio: dataInicio,
          data_fim: dataFim,
          nps_score: calcularNPS(respostas),
          media_satisfacao: calcularMediaSatisfacao(respostas),
          status: diasSemResposta > 7 ? 'finalizada' : 'ativa',
          respostas: respostas
        }
      })

      setPesquisas(pesquisasProcessadas)
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPesquisas = pesquisas.filter(pesquisa => {
    const matchesSearch = pesquisa.nome_pesquisa.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todas' || pesquisa.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const totalRespostas = pesquisas.reduce((sum, pesquisa) => sum + pesquisa.total_respostas, 0)

  const mediaNPS = pesquisas.length > 0 ? 
    Math.round(pesquisas.reduce((sum, p) => sum + p.nps_score, 0) / pesquisas.length) : 0
  const mediaSatisfacaoGeral = pesquisas.length > 0 ? 
    Math.round((pesquisas.reduce((sum, p) => sum + p.media_satisfacao, 0) / pesquisas.length) * 10) / 10 : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800'
      case 'pausada': return 'bg-yellow-100 text-yellow-800'
      case 'finalizada': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pesquisas</h1>
              <p className="text-gray-600 mt-2">Gerencie pesquisas de satisfação e mercado</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Search className="h-5 w-5" />
              Nova Pesquisa
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome da pesquisa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todos os Status</option>
                <option value="ativa">Ativas</option>
                <option value="finalizada">Finalizadas</option>
              </select>
              

            </div>
          </div>
        </div>

        {/* Lista de Pesquisas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredPesquisas.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma pesquisa encontrada</h3>
              <p className="text-gray-600">Tente ajustar os filtros ou criar uma nova pesquisa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Nome da Pesquisa</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Período</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Respostas</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">NPS Score</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Satisfação</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPesquisas.map((pesquisa, index) => (
                    <tr key={`${pesquisa.nome_pesquisa}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="font-medium text-gray-900">{pesquisa.nome_pesquisa}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {pesquisa.total_respostas} respostas • {pesquisa.respostas_identificadas} identificadas • {pesquisa.respostas_anonimas} anônimas
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pesquisa.status)}`}>
                          {pesquisa.status === 'ativa' ? 'Ativa' : 'Finalizada'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(pesquisa.data_inicio)} - {formatDate(pesquisa.data_fim)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {pesquisa.total_respostas}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-medium ${
                          pesquisa.nps_score >= 50 ? 'text-green-600' :
                          pesquisa.nps_score >= 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {pesquisa.nps_score}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {pesquisa.media_satisfacao}/10
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedPesquisa(pesquisa)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => exportarDados(pesquisa)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pesquisas</p>
                <p className="text-2xl font-bold text-gray-900">{pesquisas.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Respostas</p>
                <p className="text-2xl font-bold text-gray-900">{totalRespostas}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NPS Médio</p>
                <p className="text-2xl font-bold text-gray-900">{mediaNPS}</p>
                <p className="text-xs text-gray-500">Net Promoter Score</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
                <p className="text-2xl font-bold text-gray-900">{mediaSatisfacaoGeral}</p>
                <p className="text-xs text-gray-500">Escala 0-10</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Detalhes */}
        {selectedPesquisa && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Detalhes: {selectedPesquisa.nome_pesquisa}
                  </h2>
                  <button
                    onClick={() => setSelectedPesquisa(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Header da Pesquisa */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{selectedPesquisa.nome_pesquisa}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPesquisa.status === 'ativa' 
                        ? 'bg-green-500 bg-opacity-20 text-green-100' 
                        : 'bg-gray-500 bg-opacity-20 text-gray-100'
                    }`}>
                      {selectedPesquisa.status === 'ativa' ? 'Ativa' : 'Finalizada'}
                    </span>
                  </div>
                  
                  {/* Estatísticas Principais */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold mb-1">{selectedPesquisa.total_respostas}</div>
                      <div className="text-sm opacity-90">Total de Respostas</div>
                    </div>
                    <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold mb-1">{selectedPesquisa.respostas_identificadas}</div>
                      <div className="text-sm opacity-90">Identificadas</div>
                      <div className="text-xs opacity-75 mt-1">
                        {((selectedPesquisa.respostas_identificadas / selectedPesquisa.total_respostas) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                      <div className={`text-3xl font-bold mb-1 ${
                        selectedPesquisa.nps_score >= 50 ? 'text-green-200' :
                        selectedPesquisa.nps_score >= 0 ? 'text-yellow-200' :
                        'text-red-200'
                      }`}>
                        {selectedPesquisa.nps_score > 0 ? '+' : ''}{selectedPesquisa.nps_score}
                      </div>
                      <div className="text-sm opacity-90">NPS Score</div>
                      <div className="text-xs opacity-75 mt-1">
                        {selectedPesquisa.nps_score >= 50 ? 'Excelente' :
                         selectedPesquisa.nps_score >= 0 ? 'Bom' : 'Crítico'}
                      </div>
                    </div>
                    <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
                      <div className="text-3xl font-bold mb-1">{selectedPesquisa.media_satisfacao.toFixed(1)}</div>
                      <div className="text-sm opacity-90">Satisfação Média</div>
                      <div className="text-xs opacity-75 mt-1">
                        {selectedPesquisa.media_satisfacao >= 8 ? 'Muito Alta' :
                         selectedPesquisa.media_satisfacao >= 6 ? 'Alta' :
                         selectedPesquisa.media_satisfacao >= 4 ? 'Média' : 'Baixa'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Período da Pesquisa */}
                  <div className="mt-4 pt-4 border-t border-white border-opacity-20">
                    <div className="flex items-center justify-between text-sm opacity-90">
                      <div>
                        <span className="font-medium">Período:</span> {new Date(selectedPesquisa.data_inicio).toLocaleDateString('pt-BR')} - {new Date(selectedPesquisa.data_fim).toLocaleDateString('pt-BR')}
                      </div>
                      <div>
                        <span className="font-medium">Taxa de Identificação:</span> {((selectedPesquisa.respostas_identificadas / selectedPesquisa.total_respostas) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lista de Respostas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Respostas Individuais</h3>
                  {selectedPesquisa.respostas.map((resposta, index) => (
                    <div key={resposta.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">Resposta #{index + 1}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            resposta.tipo_pesquisa === 'identificada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {resposta.tipo_pesquisa === 'identificada' ? 'Identificada' : 'Anônima'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {new Date(resposta.created_at).toLocaleDateString('pt-BR')} às {new Date(resposta.created_at).toLocaleTimeString('pt-BR')}
                          </div>
                          {resposta.ip_address && (
                            <div className="text-xs text-gray-400">IP: {resposta.ip_address}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Dados da Agência */}
                        {resposta.tipo_pesquisa === 'identificada' && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Dados da Agência
                            </h4>
                            <div className="text-sm text-blue-800 space-y-2">
                              <div><strong>Nome:</strong> {resposta.nome_agencia || 'Não informado'}</div>
                              <div><strong>Email:</strong> {resposta.email_agencia || 'Não informado'}</div>
                              <div><strong>Telefone:</strong> {resposta.telefone_agencia || 'Não informado'}</div>
                              <div><strong>Cidade:</strong> {resposta.cidade_agencia || 'Não informado'}</div>
                              <div><strong>Estado:</strong> {resposta.estado_agencia || 'Não informado'}</div>
                              <div><strong>CEP:</strong> {resposta.cep_agencia || 'Não informado'}</div>
                              <div><strong>Endereço:</strong> {resposta.endereco_agencia || 'Não informado'}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Avaliações com Percentuais */}
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Avaliações
                          </h4>
                          <div className="text-sm text-green-800 space-y-2">
                            <div className="flex justify-between items-center">
                              <span><strong>Facilidade Buscador:</strong></span>
                              <div className="flex items-center gap-2">
                                <span>{resposta.facilidade_buscador}/10</span>
                                <span className="text-xs bg-green-200 px-2 py-1 rounded">{(resposta.facilidade_buscador * 10)}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span><strong>Preços:</strong></span>
                              <div className="flex items-center gap-2">
                                <span>{resposta.preco_buscador}/10</span>
                                <span className="text-xs bg-green-200 px-2 py-1 rounded">{(resposta.preco_buscador * 10)}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span><strong>Disponibilidade:</strong></span>
                              <div className="flex items-center gap-2">
                                <span>{resposta.disponibilidade_buscador}/10</span>
                                <span className="text-xs bg-green-200 px-2 py-1 rounded">{(resposta.disponibilidade_buscador * 10)}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span><strong>Atendimento:</strong></span>
                              <div className="flex items-center gap-2">
                                <span>{resposta.atendimento_central}/10</span>
                                <span className="text-xs bg-green-200 px-2 py-1 rounded">{(resposta.atendimento_central * 10)}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span><strong>Pós-venda:</strong></span>
                              <div className="flex items-center gap-2">
                                <span>{resposta.pos_venda}/10</span>
                                <span className="text-xs bg-green-200 px-2 py-1 rounded">{(resposta.pos_venda * 10)}%</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center border-t pt-2 mt-2">
                              <span><strong>Recomendação (NPS):</strong></span>
                              <div className="flex items-center gap-2">
                                <span>{resposta.recomendacao}/10</span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  resposta.recomendacao >= 9 ? 'bg-green-200 text-green-800' :
                                  resposta.recomendacao >= 7 ? 'bg-yellow-200 text-yellow-800' :
                                  'bg-red-200 text-red-800'
                                }`}>
                                  {resposta.recomendacao >= 9 ? 'Promotor' :
                                   resposta.recomendacao >= 7 ? 'Neutro' : 'Detrator'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Perfil de Negócio */}
                         <div className="bg-purple-50 p-4 rounded-lg">
                           <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                             <Building2 className="h-4 w-4" />
                             Perfil de Negócio
                           </h4>
                           <div className="text-sm text-purple-800 space-y-3">
                             {/* Demanda */}
                             <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                               <div className="font-semibold text-purple-900 mb-2">Demanda Principal</div>
                               <div><strong>Tipo:</strong> {resposta.demanda_agencia || 'Não informado'}</div>
                               {resposta.percentual_lazer && resposta.percentual_corporativo && (
                                 <div className="mt-2">
                                   <div className="flex justify-between items-center mb-1">
                                     <span className="text-xs">Lazer vs Corporativo</span>
                                   </div>
                                   <div className="flex gap-2">
                                     <div className="bg-blue-200 px-2 py-1 rounded text-xs font-medium">
                                       {resposta.percentual_lazer}% Lazer
                                     </div>
                                     <div className="bg-gray-200 px-2 py-1 rounded text-xs font-medium">
                                       {resposta.percentual_corporativo}% Corporativo
                                     </div>
                                   </div>
                                 </div>
                               )}
                             </div>
                             
                             {/* Voos */}
                             <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                               <div className="font-semibold text-purple-900 mb-2">Tipo de Voos</div>
                               <div><strong>Tipo:</strong> {resposta.demanda_aereo || 'Não informado'}</div>
                               {resposta.percentual_domestico && resposta.percentual_internacional && (
                                 <div className="mt-2">
                                   <div className="flex justify-between items-center mb-1">
                                     <span className="text-xs">Doméstico vs Internacional</span>
                                   </div>
                                   <div className="flex gap-2">
                                     <div className="bg-green-200 px-2 py-1 rounded text-xs font-medium">
                                       {resposta.percentual_domestico}% Doméstico
                                     </div>
                                     <div className="bg-blue-200 px-2 py-1 rounded text-xs font-medium">
                                       {resposta.percentual_internacional}% Internacional
                                     </div>
                                   </div>
                                 </div>
                               )}
                             </div>
                             
                             {/* Hotelaria */}
                             <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                               <div className="font-semibold text-purple-900 mb-2">Hotelaria</div>
                               <div><strong>Vende:</strong> {resposta.vende_hotelaria ? 'Sim' : 'Não'}</div>
                               {!resposta.vende_hotelaria && resposta.motivo_nao_hotelaria && (
                                 <div className="mt-1">
                                   <strong>Motivo:</strong> {
                                     resposta.motivo_nao_hotelaria === 'nao_entendo' ? 'Não entendo do produto' :
                                     resposta.motivo_nao_hotelaria === 'nao_tenho_fornecedor' ? 'Não tenho fornecedor' :
                                     resposta.motivo_nao_hotelaria_outro || 'Outro'
                                   }
                                 </div>
                               )}
                               {resposta.vende_hotelaria && resposta.tipo_hotelaria && (
                                 <div className="mt-2">
                                   <div><strong>Tipo:</strong> {
                                     resposta.tipo_hotelaria === 'brasil' ? 'Apenas Brasil' :
                                     resposta.tipo_hotelaria === 'internacional' ? 'Apenas Internacional' :
                                     'Brasil e Internacional'
                                   }</div>
                                   {resposta.percentual_hotelaria_brasil && resposta.percentual_hotelaria_internacional && (
                                     <div className="mt-2">
                                       <div className="flex gap-2">
                                         <div className="bg-green-200 px-2 py-1 rounded text-xs font-medium">
                                           {resposta.percentual_hotelaria_brasil}% Brasil
                                         </div>
                                         <div className="bg-blue-200 px-2 py-1 rounded text-xs font-medium">
                                           {resposta.percentual_hotelaria_internacional}% Internacional
                                         </div>
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               )}
                             </div>
                             
                             {/* Faturamento */}
                             <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                               <div className="font-semibold text-purple-900 mb-2">Faturamento (6 meses)</div>
                               <div><strong>Faixa:</strong> {
                                 resposta.faturamento_6meses === 'ate_30k' ? 'Até R$ 30k' :
                                 resposta.faturamento_6meses === '30k_50k' ? 'R$ 30k - R$ 50k' :
                                 resposta.faturamento_6meses === '50k_100k' ? 'R$ 50k - R$ 100k' :
                                 resposta.faturamento_6meses === '100k_500k' ? 'R$ 100k - R$ 500k' :
                                 resposta.faturamento_6meses === '500k_1m' ? 'R$ 500k - R$ 1M' :
                                 resposta.faturamento_6meses === 'mais_1m' ? 'Mais de R$ 1M' :
                                 'Não informado'
                               }</div>
                               {resposta.percentual_faturamento_7c && resposta.percentual_faturamento_outros && (
                                 <div className="mt-2">
                                   <div className="flex justify-between items-center mb-1">
                                     <span className="text-xs font-medium">Distribuição do Faturamento</span>
                                   </div>
                                   <div className="flex gap-2">
                                     <div className="bg-indigo-200 px-3 py-2 rounded text-xs font-bold border-2 border-indigo-400">
                                       {resposta.percentual_faturamento_7c}% 7C
                                     </div>
                                     <div className="bg-gray-200 px-3 py-2 rounded text-xs font-bold border-2 border-gray-400">
                                       {resposta.percentual_faturamento_outros}% Outros
                                     </div>
                                   </div>
                                 </div>
                               )}
                             </div>
                             
                             {/* CRM */}
                             <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                               <div className="font-semibold text-purple-900 mb-2">Sistema de Gestão</div>
                               <div><strong>Utiliza CRM/ERP:</strong> {resposta.utiliza_crm_erp ? 'Sim' : 'Não'}</div>
                               <div><strong>Utiliza Planilhas:</strong> {resposta.utiliza_planilhas ? 'Sim' : 'Não'}</div>
                               <div><strong>Opinião sobre CRM:</strong> {
                                 resposta.opiniao_crm === 'extremamente_util' ? 'Extremamente Útil' :
                                 resposta.opiniao_crm === 'muito_util' ? 'Muito Útil' :
                                 resposta.opiniao_crm === 'pouco_util' ? 'Pouco Útil' :
                                 resposta.opiniao_crm === 'nao_seria_util' ? 'Não Seria Útil' :
                                 'Não informado'
                               }</div>
                             </div>
                           </div>
                         </div>
                      </div>
                      
                      {/* Seção de Cupons e Feedback */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* Sistema de Cupons */}
                        {(resposta.cupom_desconto || resposta.sistema_cupons) && (
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Sistema de Cupons
                            </h4>
                            <div className="text-sm text-yellow-800 space-y-2">
                              {resposta.cupom_desconto && (
                                <div><strong>Código de Desconto:</strong> <span className="bg-yellow-200 px-2 py-1 rounded font-mono">{resposta.cupom_desconto}</span></div>
                              )}
                              {resposta.sistema_cupons && (
                                <div><strong>Sistema de Cupons:</strong> {resposta.sistema_cupons}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Feedback e Melhorias */}
                        {(resposta.feedback_melhorias || resposta.comentario_sugestao) && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">Feedback e Sugestões</h4>
                            <div className="space-y-3">
                              {resposta.feedback_melhorias && (
                                <div>
                                  <div className="text-sm font-medium text-gray-900 mb-1">Feedback de Melhorias:</div>
                                  <div className="text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-gray-400">
                                    "{resposta.feedback_melhorias}"
                                  </div>
                                </div>
                              )}
                              {resposta.comentario_sugestao && (
                                <div>
                                  <div className="text-sm font-medium text-gray-900 mb-1">Comentário/Sugestão:</div>
                                  <div className="text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-blue-400">
                                    "{resposta.comentario_sugestao}"
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Informações Técnicas */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">Informações Técnicas</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-500">
                          <div><strong>ID:</strong> {resposta.id}</div>
                          <div><strong>Pesquisa:</strong> {resposta.nome_pesquisa}</div>
                          <div><strong>Criado em:</strong> {new Date(resposta.created_at).toLocaleString('pt-BR')}</div>
                          <div><strong>Atualizado em:</strong> {new Date(resposta.updated_at).toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Pesquisas