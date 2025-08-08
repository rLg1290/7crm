import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Building2, 
  Users, 
  Tag, 
  TrendingUp, 
  Activity,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react'

interface Estatisticas {
  totalEmpresas: number
  totalUsuarios: number
  totalPromocoes: number
  empresasAtivas: number
  usuariosAtivos: number
  promocoesAtivas: number
}

const Dashboard = () => {
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    totalEmpresas: 0,
    totalUsuarios: 0,
    totalPromocoes: 0,
    empresasAtivas: 0,
    usuariosAtivos: 0,
    promocoesAtivas: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    carregarEstatisticas()
  }, [])

  const carregarEstatisticas = async () => {
    try {
      setLoading(true)
      
      // Buscar estatísticas das empresas
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('id, ativo')
      
      if (empresasError) throw empresasError

      // Buscar estatísticas das promoções
      const { data: promocoes, error: promocoesError } = await supabase
        .from('promocoes')
        .select('id, ativo')
      
      if (promocoesError) throw promocoesError

      // Calcular estatísticas
      const totalEmpresas = empresas?.length || 0
      const empresasAtivas = empresas?.filter(e => e.ativo).length || 0
      const totalPromocoes = promocoes?.length || 0
      const promocoesAtivas = promocoes?.filter(p => p.ativo).length || 0

      setEstatisticas({
        totalEmpresas,
        totalUsuarios: 0, // Será implementado quando tivermos acesso aos usuários
        totalPromocoes,
        empresasAtivas,
        usuariosAtivos: 0,
        promocoesAtivas
      })

    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
      setError('Erro ao carregar estatísticas do dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-500 mt-1">Visão geral do sistema 7CRM</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Última atualização</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleString('pt-BR')}
            </p>
          </div>
          <button
            onClick={carregarEstatisticas}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Atualizar dados"
          >
            <Activity className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empresas */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Empresas</p>
              <p className="text-3xl font-bold text-gray-900">{estatisticas.totalEmpresas}</p>
              <p className="text-sm text-green-600 mt-1">
                {estatisticas.empresasAtivas} ativas
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Promoções */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Promoções</p>
              <p className="text-3xl font-bold text-gray-900">{estatisticas.totalPromocoes}</p>
              <p className="text-sm text-pink-600 mt-1">
                {estatisticas.promocoesAtivas} ativas
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Tag className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </div>

        {/* Usuários */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Usuários</p>
              <p className="text-3xl font-bold text-gray-900">{estatisticas.totalUsuarios}</p>
              <p className="text-sm text-purple-600 mt-1">
                {estatisticas.usuariosAtivos} ativos
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações Rápidas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">Criar Nova Empresa</p>
                  <p className="text-sm text-blue-600">Adicionar uma nova agência ao sistema</p>
                </div>
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </button>
            
            <button className="w-full text-left p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors border border-pink-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-pink-900">Nova Promoção</p>
                  <p className="text-sm text-pink-600">Criar promoção para todas as empresas</p>
                </div>
                <Tag className="h-5 w-5 text-pink-600" />
              </div>
            </button>
            
            <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">Relatório Geral</p>
                  <p className="text-sm text-green-600">Visualizar métricas consolidadas</p>
                </div>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </button>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-orange-600" />
            Atividade Recente
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sistema iniciado</p>
                <p className="text-xs text-gray-500">Dashboard administrativo carregado</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Dados atualizados</p>
                <p className="text-xs text-gray-500">Estatísticas carregadas com sucesso</p>
              </div>
            </div>
            
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Mais atividades serão exibidas aqui</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard