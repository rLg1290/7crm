import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { User } from '@supabase/supabase-js'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Empresas from './pages/Empresas'
import Promocoes from './pages/Promocoes'
import Usuarios from './pages/Usuarios'
import Relatorios from './pages/Relatorios'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAdminRole = async (user: User | null) => {
    if (!user) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error || !profile || profile.role !== 'admin') {
        console.log('❌ Acesso negado: usuário não é admin')
        await supabase.auth.signOut()
        setUser(null)
      } else {
        console.log('✅ Usuário admin verificado')
        setUser(user)
      }
    } catch (err) {
      console.error('Erro ao verificar role:', err)
      await supabase.auth.signOut()
      setUser(null)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminRole(session?.user || null)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminRole(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema administrativo...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/promocoes" element={<Promocoes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App