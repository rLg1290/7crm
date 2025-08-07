import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { 
  LogOut, 
  Shield,
  LayoutDashboard,
  Building2,
  Tag,
  Users,
  BarChart3,
  Menu,
  X
} from 'lucide-react'
import { User } from '@supabase/supabase-js'

interface LayoutProps {
  user: User
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ user, children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-blue-600' },
    { name: 'Empresas', href: '/empresas', icon: Building2, color: 'text-green-600' },
    { name: 'Promoções', href: '/promocoes', icon: Tag, color: 'text-pink-600' },
    { name: 'Usuários', href: '/usuarios', icon: Users, color: 'text-purple-600' },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3, color: 'text-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Administrativo */}
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo e Título - Esquerda */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center group">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-all duration-200">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    7CRM Admin
                  </h1>
                  <p className="text-sm text-gray-500 -mt-1">Sistema Administrativo</p>
                </div>
              </Link>
            </div>

            {/* Menu Central */}
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
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <Icon className={`h-4 w-4 mr-2 transition-colors ${
                        isActive ? item.color : 'text-gray-400 group-hover:text-gray-600'
                      }`} />
                      <span>{item.name}</span>
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Perfil e Logout - Direita */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-blue-600 font-medium">Administrador</p>
                </div>
                <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
              </div>

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

        {/* Mobile Navigation */}
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
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 transition-colors ${
                      isActive ? item.color : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default Layout