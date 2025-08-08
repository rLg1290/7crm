import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  Building2, 
  Tag, 
  FileText,
  AlertCircle,
  Filter
} from 'lucide-react'

interface RelatorioData {
  totalEmpresas: number
  empresasAtivas: number
  totalUsuarios: number
  usuariosAdmin: number
  totalPromocoes: number
  promocoesAtivas: number
  promocoesPorMes: { mes: string; total: number }[]
  empresasMaisAtivas: { nome: string; total_promocoes: number }[]
  usuariosPorEmpresa: { empresa: string; total: number }[]
}

const Relatorios = () => {
  const [data, setData] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroMes, setFiltroMes] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [empresas, setEmpresas] = useState<{ id: number; nome: string }[]>([])

  useEffect(() => {
    carregarRelatorios()
    carregarEmpresas()
  }, [filtroMes, filtroEmpresa])

  const carregarEmpresas = async () => {
    try {
      const { data: empresasData, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .order('nome')
      
      if (error) throw error
      setEmpresas(empresasData || [])
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
    }
  }

  const carregarRelatorios = async () => {
    try {
      setLoading(true)
      
      // Estatísticas gerais de empresas
      const { data: empresasStats, error: empresasError } = await supabase
        .from('empresas')
        .select('id, ativo')
      
      if (empresasError) throw empresasError
      
      // Estatísticas gerais de usuários
      const { data: usuariosStats, error: usuariosError } = await supabase
        .from('profiles')
        .select('id, role, empresa_id')
      
      if (usuariosError) throw usuariosError
      
      // Estatísticas de promoções com filtros
      let promocoesQuery = supabase
        .from('promocoes')
        .select('id, ativo, created_at, empresa_id, empresa:empresas(nome)')
      
      if (filtroEmpresa) {
        promocoesQuery = promocoesQuery.eq('empresa_id', filtroEmpresa)
      }
      
      if (filtroMes) {
        const [ano, mes] = filtroMes.split('-')
        const inicioMes = `${ano}-${mes}-01`
        const fimMes = `${ano}-${mes}-31`
        promocoesQuery = promocoesQuery
          .gte('created_at', inicioMes)
          .lte('created_at', fimMes)
      }
      
      const { data: promocoesStats, error: promocoesError } = await promocoesQuery
      
      if (promocoesError) throw promocoesError
      
      // Promoções por mês (últimos 6 meses)
      const { data: promocoesPorMes, error: promocoesMesError } = await supabase
        .rpc('get_promocoes_por_mes')
      
      if (promocoesMesError) {
        console.warn('Erro ao carregar promoções por mês:', promocoesMesError)
      }
      
      // Empresas mais ativas
      const { data: empresasMaisAtivas, error: empresasAtivasError } = await supabase
        .rpc('get_empresas_mais_ativas')
      
      if (empresasAtivasError) {
        console.warn('Erro ao carregar empresas mais ativas:', empresasAtivasError)
      }
      
      // Processar dados
      const totalEmpresas = empresasStats?.length || 0
      const empresasAtivas = empresasStats?.filter(e => e.ativo).length || 0
      const totalUsuarios = usuariosStats?.length || 0
      const usuariosAdmin = usuariosStats?.filter(u => u.role === 'admin').length || 0
      const totalPromocoes = promocoesStats?.length || 0
      const promocoesAtivas = promocoesStats?.filter(p => p.ativo).length || 0
      
      // Usuários por empresa
      const usuariosPorEmpresa = empresas.map(empresa => {
        const total = usuariosStats?.filter(u => u.empresa_id === empresa.id).length || 0
        return { empresa: empresa.nome, total }
      }).filter(item => item.total > 0)
      
      setData({
        totalEmpresas,
        empresasAtivas,
        totalUsuarios,
        usuariosAdmin,
        totalPromocoes,
        promocoesAtivas,
        promocoesPorMes: promocoesPorMes || [],
        empresasMaisAtivas: empresasMaisAtivas || [],
        usuariosPorEmpresa
      })
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err)
      setError('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  const exportarRelatorio = () => {
    if (!data) return
    
    const relatorio = {
      data_geracao: new Date().toISOString(),
      filtros: {
        mes: filtroMes || 'Todos',
        empresa: filtroEmpresa ? empresas.find(e => e.id.toString() === filtroEmpresa)?.nome : 'Todas'
      },
      estatisticas: {
        empresas: {
          total: data.totalEmpresas,
          ativas: data.empresasAtivas
        },
        usuarios: {
          total: data.totalUsuarios,
          administradores: data.usuariosAdmin
        },
        promocoes: {
          total: data.totalPromocoes,
          ativas: data.promocoesAtivas
        }
      },
      detalhes: {
        promocoes_por_mes: data.promocoesPorMes,
        empresas_mais_ativas: data.empresasMaisAtivas,
        usuarios_por_empresa: data.usuariosPorEmpresa
      }
    }
    
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 mt-1">Análise e estatísticas do sistema</p>
        </div>
        <button
          onClick={exportarRelatorio}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filtros:</span>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="month"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <select
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as empresas</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>
          
          {(filtroMes || filtroEmpresa) && (
            <button
              onClick={() => {
                setFiltroMes('')
                setFiltroEmpresa('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {data && (
        <>
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Empresas</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data.empresasAtivas}/{data.totalEmpresas}
                  </p>
                  <p className="text-sm text-gray-500">Ativas/Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Usuários</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.totalUsuarios}</p>
                  <p className="text-sm text-gray-500">{data.usuariosAdmin} administradores</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Tag className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Promoções</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data.promocoesAtivas}/{data.totalPromocoes}
                  </p>
                  <p className="text-sm text-gray-500">Ativas/Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos e Tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Promoções por Mês */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Promoções por Mês</h3>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              
              {data.promocoesPorMes.length > 0 ? (
                <div className="space-y-3">
                  {data.promocoesPorMes.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.mes}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.max(10, (item.total / Math.max(...data.promocoesPorMes.map(p => p.total))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{item.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
              )}
            </div>

            {/* Empresas Mais Ativas */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Empresas Mais Ativas</h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              
              {data.empresasMaisAtivas.length > 0 ? (
                <div className="space-y-3">
                  {data.empresasMaisAtivas.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                        <span className="text-sm text-gray-600 truncate">{item.nome}</span>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {item.total_promocoes} promoções
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
              )}
            </div>

            {/* Usuários por Empresa */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Usuários por Empresa</h3>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              
              {data.usuariosPorEmpresa.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.usuariosPorEmpresa.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {item.empresa}
                        </span>
                        <span className="text-lg font-semibold text-blue-600">
                          {item.total}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.total === 1 ? 'usuário' : 'usuários'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Resumo do Período</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((data.empresasAtivas / data.totalEmpresas) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Taxa de empresas ativas</p>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round((data.promocoesAtivas / data.totalPromocoes) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Taxa de promoções ativas</p>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((data.usuariosAdmin / data.totalUsuarios) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Taxa de administradores</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Relatorios