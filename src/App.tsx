import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Cotacoes from './pages/Cotacoes'
import Clientes from './pages/Clientes'
import Financeiro from './pages/Financeiro'
import Calendario from './pages/Calendario'
import Aereo from './pages/Aereo'
// Removendo import da página Hotelaria (não será utilizada por enquanto)
import QuadroVoos from './pages/QuadroVoos'
import Perfil from './pages/Perfil'
import TesteLogin from './pages/TesteLogin'
import CotacaoPrint from './pages/CotacaoPrint'
import CotacaoHtml from './pages/CotacaoHtml'
import CotacaoPrintRaw from './pages/CotacaoPrintRaw'
import CotacaoView from './pages/CotacaoView'
import { logger } from './utils/logger'
import SolicitacaoOrcamento from './pages/SolicitacaoOrcamento'
import Promocoes from './pages/Promocoes'
import { User } from '@supabase/supabase-js'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  logger.debug('🚀 App component rendering', { loading, user: Boolean(user) })

  useEffect(() => {
    logger.debug('🔍 Checking authentication...')
    // Verificar se há usuário logado
    supabase.auth.getUser().then(({ data: { user } }) => {
      logger.debug('👤 User from auth', { user: Boolean(user) })
      setUser(user)
      setLoading(false)
    })

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.debug('🔄 Auth state changed', { event, user: Boolean(session?.user) })
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    logger.debug('⏳ Showing loading screen...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  logger.debug('🎯 Rendering main app', { user: Boolean(user) })

  // Usa basename coerente com o base do Vite
  const basename = (import.meta as any).env.BASE_URL || '/'
  return (
    <Router basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Rota especial para teste - acessível sem login */}
        <Route path="/teste" element={<TesteLogin />} />
        {/* Rota pública para solicitação de orçamento por empresa - acessível sem login */}
        <Route path="/orcamento/:nomeEmpresa" element={<SolicitacaoOrcamento />} />
        {/* Rota de impressão FORA do Layout */}
        <Route path="/cotacao/:id/print" element={<CotacaoPrint />} />
        {/* Rota de visualização HTML FORA do Layout */}
        <Route path="/cotacao/:id/html" element={<CotacaoHtml />} />
        {/* Rota de impressão RAW FORA do Layout */}
        <Route path="/confirmacao/:codigo" element={<CotacaoPrintRaw />} />
        <Route path="/cotacao/:codigo" element={<CotacaoView />} />
        {/* Rotas normais */}
        {!user ? (
          <Route path="*" element={<LoginPage />} />
        ) : (
          <Route path="*" element={
            <Layout user={user}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cotacoes" element={<Cotacoes user={user} />} />
                <Route path="/clientes" element={<Clientes user={user} />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/aereo" element={<Aereo />} />
                // Removendo rota /hotelaria do roteador
                <Route path="/quadro-voos" element={<QuadroVoos />} />
                <Route path="/promocoes" element={<Promocoes user={user} />} />
                <Route path="/perfil" element={<Perfil user={user} />} />
              </Routes>
            </Layout>
          } />
        )}
      </Routes>
    </Router>
  )
}

export default App