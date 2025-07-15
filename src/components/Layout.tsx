import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  LogOut, 
  User as UserIcon, 
  FileText, 
  Users, 
  Calendar, 
  Plane, 
  Hotel,
  Monitor,
  Building,
  DollarSign,
  Menu,
  X
} from 'lucide-react'
import { User } from '@supabase/supabase-js'
import NotificationCenter from './NotificationCenter'

interface LayoutProps {
  user: User
  children: React.ReactNode
}

interface EmpresaLogo {
  logotipo: string | null
}

const Layout: React.FC<LayoutProps> = ({ user, children }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null)

  // Buscar logo da empresa
  useEffect(() => {
    const fetchEmpresaLogo = async () => {
      const empresaId = user.user_metadata?.empresa_id
      
      if (empresaId) {
        try {
          const { data, error } = await supabase
            .from('empresas')
            .select('logotipo')
            .eq('id', empresaId)
            .single()

          if (data && !error && data.logotipo) {
            setEmpresaLogo(data.logotipo)
          }
        } catch (error) {
          console.error('Erro ao buscar logo da empresa:', error)
        }
      }
    }

    fetchEmpresaLogo()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navigation = [
    { name: 'Cotações', href: '/cotacoes', icon: FileText, color: 'text-green-600' },
    { name: 'Clientes', href: '/clientes', icon: Users, color: 'text-purple-600' },
    { name: 'Financeiro', href: '/financeiro', icon: DollarSign, color: 'text-emerald-600' },
    { name: 'Calendário', href: '/calendario', icon: Calendar, color: 'text-orange-600' },
    // { name: 'Aéreo', href: '/aereo', icon: Plane, color: 'text-sky-600' },
    // { name: 'Hotelaria', href: '/hotelaria', icon: Hotel, color: 'text-indigo-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Moderno */}
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3">
            
            {/* Logo e Empresa - Esquerda */}
            <div className="flex items-center min-w-0 flex-1">
              <Link to="/dashboard" className="flex items-center group">
                {empresaLogo ? (
                  <img 
                    src={empresaLogo} 
                    alt="Logo da empresa"
                    className="h-10 w-10 rounded-xl object-cover border-2 border-gray-100 group-hover:border-blue-200 group-hover:scale-105 transition-all duration-200 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const fallbackIcon = document.createElement('div')
                      fallbackIcon.innerHTML = '<svg class="h-10 w-10 text-blue-600 group-hover:text-blue-700 transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/></svg>'
                      e.currentTarget.parentNode?.insertBefore(fallbackIcon, e.currentTarget)
                    }}
                  />
                ) : (
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-200">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="ml-4 hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {user.user_metadata?.empresa || 'CRM Turismo'}
                  </h1>
                  <p className="text-sm text-gray-500 -mt-1">Sistema de Gestão</p>
                </div>
              </Link>
            </div>

            {/* Menu Central Moderno */}
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl mx-8">
              <nav className="flex items-center space-x-1 bg-gray-50 rounded-full p-2 border border-gray-200 shadow-sm">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.href
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group relative inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-blue-700 shadow-md border border-blue-100'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <Icon className={`h-4 w-4 mr-2 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                      <span className="hidden xl:block">{item.name}</span>
                      <span className="xl:hidden">{item.name.split(' ')[0]}</span>
                      
                      {isActive && (
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Perfil e Ações - Direita */}
            <div className="flex items-center justify-end space-x-4 min-w-0 flex-1">
              
              {/* Notification Center */}
              <NotificationCenter />

              {/* User Profile */}
              <Link to="/perfil" className="hidden sm:flex items-center space-x-3 group">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                    {user.user_metadata?.nome || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">
                    {user.user_metadata?.empresa || 'Agência'}
                  </p>
                </div>
                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:scale-105 transition-all duration-200 border-2 border-white shadow-sm">
                  <UserIcon className="h-5 w-5 text-blue-700" />
                </div>
              </Link>
              
              {/* Mobile User - só ícone */}
              <Link to="/perfil" className="sm:hidden">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 border-2 border-white shadow-sm">
                  <UserIcon className="h-5 w-5 text-blue-700" />
                </div>
              </Link>
              
              {/* Logout Button - apenas ícone */}
              <button
                onClick={handleLogout}
                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 group"
                title="Sair"
              >
                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Moderna */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile user info moderna */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4">
              <Link 
                to="/perfil" 
                className="flex items-center space-x-4 group" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center border-2 border-white shadow-sm">
                  <UserIcon className="h-6 w-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                    {user.user_metadata?.nome || 'Usuário'}
                  </div>
                  <div className="text-sm text-gray-500 group-hover:text-blue-500 transition-colors">
                    {user.email}
                  </div>
                </div>
                <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  )
}

export default Layout 