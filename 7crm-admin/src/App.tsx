import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { User } from '@supabase/supabase-js'
import LoginPage from './components/LoginPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import EducacaoAdminPage from './pages/Educacao'
import Kanban from './pages/Kanban'
import KanbanComercial from './pages/KanbanComercial'
import CalendarioComercial from './pages/CalendarioComercial'
import Empresas from './pages/Empresas'
import Promocoes from './pages/Promocoes'
import Usuarios from './pages/Usuarios'
import Pesquisas from './pages/Pesquisas'
import Permissoes from './pages/Permissoes'
import Relatorios from './pages/Relatorios'
import AtualizacoesAdminPage from './pages/AtualizacoesAdmin'

// Extender o tipo User para incluir permissões
type UserWithPermissions = User & {
  role?: string
  allowed_pages?: string[]
}

function App() {
  const [user, setUser] = useState<UserWithPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAdminRole = async (user: User | null) => {
    if (!user) {
      setUser(null)
      setLoading(false)
      return
    }

    try {
      // 1. Buscar o profile para saber a role
      const { data: profile, error: profileError } = await supabase!
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) throw profileError || new Error('Perfil não encontrado')

      // 2. Buscar as permissões dessa role
      const { data: permissions, error: permError } = await supabase!
        .from('role_permissions')
        .select('can_access_admin, allowed_pages')
        .eq('role', profile.role)
        .single()

      if (permError) {
        console.error('Erro ao buscar permissões:', permError)
        // Fallback seguro: se não tiver permissão definida, nega acesso (exceto admin hardcoded se necessário, mas melhor negar)
        throw new Error('Permissões não configuradas')
      }

      if (!permissions.can_access_admin) {
        console.log(`❌ Acesso negado: role '${profile.role}' não tem permissão de Admin`)
        await supabase!.auth.signOut()
        setUser(null)
      } else {
        // Injetar role e permissões no usuário
        const userWithPerms = { 
          ...user, 
          role: profile.role,
          allowed_pages: permissions.allowed_pages as string[]
        }
        console.log('✅ Acesso permitido:', profile.role)
        setUser(userWithPerms)
      }
    } catch (err) {
      console.error('Erro de autenticação:', err)
      await supabase!.auth.signOut()
      setUser(null)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('🚫 Supabase Admin não configurado; pulando fluxo de autenticação')
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkAdminRole(session?.user || null)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase!.auth.onAuthStateChange((_event, session) => {
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

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Configuração necessária (Admin)</h1>
          <p className="text-gray-600 mb-4">Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> em um arquivo <code>.env</code> dentro de <code>7crm-admin</code>.</p>
          <pre className="bg-gray-100 text-sm p-3 rounded border text-left">{`VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima`}</pre>
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
          <Route path="/educacao" element={<EducacaoAdminPage />} />
          <Route path="/empresas" element={<Empresas />} />
          <Route path="/promocoes" element={<Promocoes />} />
          <Route path="/atualizacoes" element={<AtualizacoesAdminPage />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/permissoes" element={<Permissoes />} />
          <Route path="/pesquisas" element={<Pesquisas />} />
          <Route path="/comercial/kanban" element={<KanbanComercial />} />
          <Route path="/comercial/calendario" element={<CalendarioComercial />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
