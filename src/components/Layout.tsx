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
  X,
  Tag,
  BookOpen,
  MessageSquare
} from 'lucide-react'
import { User } from '@supabase/supabase-js'
import NotificationCenter from './NotificationCenter'
import ChatWidget from './ChatWidget'
import Sidebar from './Sidebar'
import RoadmapCard from './RoadmapCard'

interface LayoutProps {
  user: User
  children: React.ReactNode
}

interface EmpresaLogo {
  logotipo: string | null
  chat_enabled?: boolean | null
  sette_visible?: boolean | null
  central_visible?: boolean | null
}

const Layout: React.FC<LayoutProps> = ({ user, children }) => {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showEducacaoHint, setShowEducacaoHint] = useState(false)
  const [empresaLogo, setEmpresaLogo] = useState<string | null>(null)
  const [chatEnabled, setChatEnabled] = useState<boolean>(true)
  const [showChat, setShowChat] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const v = localStorage.getItem(`sidebar_collapsed_${user.id}`)
    return v === '1'
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [setteVisible, setSetteVisible] = useState<boolean>(true)
  const [centralVisible, setCentralVisible] = useState<boolean>(false)
  const [aereoEnabled, setAereoEnabled] = useState<boolean>(false)
  const [chatInitialMode, setChatInitialMode] = useState<'ia' | 'central'>('ia')
  const [userRole, setUserRole] = useState<string>('user')

  // Buscar logo da empresa
  useEffect(() => {
    const fetchEmpresaLogo = async () => {
      const empresaId = user.user_metadata?.empresa_id
      
      if (empresaId) {
        try {
          const { data, error } = await supabase
            .from('empresas')
            .select('logotipo, chat_enabled, sette_visible, central_visible, aereo_enabled')
            .eq('id', empresaId)
            .single()

          if (data && !error) {
            if (data.logotipo) setEmpresaLogo(data.logotipo)
            if (typeof data.chat_enabled === 'boolean') setChatEnabled(Boolean(data.chat_enabled))
            if (typeof data.sette_visible === 'boolean') setSetteVisible(Boolean(data.sette_visible))
            if (typeof data.central_visible === 'boolean') setCentralVisible(Boolean(data.central_visible))
            if (typeof data.aereo_enabled === 'boolean') {
              setAereoEnabled(Boolean(data.aereo_enabled))
            } else {
              setAereoEnabled(false) // Default to false if not present/null
            }
          }
        } catch (error) {
          console.error('Erro ao buscar logo da empresa:', error)
        }
      }
    }

    fetchEmpresaLogo()
  }, [user])

  useEffect(() => {
    const seen = localStorage.getItem('educacao_hint_seen')
    if (!seen) {
      setTimeout(() => setShowEducacaoHint(true), 600)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const navigation = [
    { name: 'Cotações', href: '/cotacoes', icon: FileText, color: 'text-green-600' },
    { name: 'Clientes', href: '/clientes', icon: Users, color: 'text-purple-600' },
    { name: 'Financeiro', href: '/financeiro', icon: DollarSign, color: 'text-emerald-600' },
    { name: 'Calendário', href: '/calendario', icon: Calendar, color: 'text-orange-600' },
    { name: 'Promoções', href: '/promocoes', icon: Tag, color: 'text-pink-600' },
    // { name: 'Aéreo', href: '/aereo', icon: Plane, color: 'text-sky-600' },
    // { name: 'Hotelaria', href: '/hotelaria', icon: Hotel, color: 'text-indigo-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {false && (
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3">
            
            {/* Logo e Empresa - Esquerda */}
            <div className="flex items-center min-w-0 flex-1">
              <Link to="/dashboard" className="flex items-center group">
                {empresaLogo ? (
                  <img 
                    src={empresaLogo || ''} 
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

            {/* Botão para mobile abrir sidebar */}
            <div className="lg:hidden flex-1 flex justify-center">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
                aria-label="Abrir menu"
                title="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Perfil e Ações - Direita */}
            <div className="flex items-center justify-end space-x-4 min-w-0 flex-1">
              
              {/* Notification Center */}
              <NotificationCenter />

              {/* Base de conhecimento - ícone curto */}
              <div className="relative">
                <Link
                  to="/educacao"
                  className="inline-flex h-10 w-10 items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Base de conhecimento"
                  onClick={() => { localStorage.setItem('educacao_hint_seen','1'); setShowEducacaoHint(false) }}
                >
                  <BookOpen className="h-5 w-5" />
                </Link>
                <div className="pointer-events-none absolute -top-3 -right-3 z-50" aria-hidden="true">
                  <span className="inline-flex px-2 py-[2px] text-[9px] font-semibold rounded-full bg-blue-600 text-white shadow-sm">Novo</span>
                </div>
                {showEducacaoHint && (
                  <div className="absolute right-0 mt-2 z-50">
                    <div className="relative bg-white border border-blue-200 shadow-lg rounded-xl p-3 w-64">
                      <div className="text-xs font-semibold text-blue-700 uppercase">Novo</div>
                      <div className="mt-1 text-sm text-gray-900">Base de conhecimento: vídeos e lives gravadas para educação corporativa.</div>
                      <div className="mt-2 flex justify-end">
                        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded" onClick={() => { localStorage.setItem('educacao_hint_seen','1'); setShowEducacaoHint(false) }}>Entendi</button>
                      </div>
                      <div className="absolute -top-2 right-6 w-3 h-3 bg-white border border-blue-200 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>

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

              {/* Mobile menu legacy removido */}
            </div>
          </div>
        </div>
      </header>
      )}

      <RoadmapCard />

      <div className="min-h-screen flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => {
          const v = !sidebarCollapsed
          setSidebarCollapsed(v)
          localStorage.setItem(`sidebar_collapsed_${user.id}`, v ? '1' : '0')
        }} empresaLogo={empresaLogo} userName={user.user_metadata?.empresa || 'Agência'} aereoEnabled={aereoEnabled} userRole={userRole} />
        <main className="flex-1">
          {children}
        </main>
      </div>

      {chatEnabled && showChat && (
        <ChatWidget onClose={() => setShowChat(false)} user={user} initialMode={chatInitialMode} />
      )}

      {chatEnabled && (
      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => setShowChatMenu(true)}
        onMouseLeave={() => setShowChatMenu(false)}
      >
        <div
          className="h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center select-none"
          aria-hidden="true"
        >
          <MessageSquare className="h-6 w-6" />
        </div>
        {showChatMenu && <div className="absolute bottom-full right-0 h-2 w-56" />}
        {showChatMenu && (
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 ease-out origin-bottom scale-100 opacity-100">
            <div className="px-3 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500">Abrir como</div>
            <div className="p-2 space-y-1">
              {setteVisible && (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => { setChatInitialMode('ia'); setShowChat(true); setShowChatMenu(false) }}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-[11px]">AI</span>
                  <span>Sette (I.A)</span>
                </button>
              )}
              {centralVisible && (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => { setChatInitialMode('central'); setShowChat(true); setShowChatMenu(false) }}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white text-[11px]">7C</span>
                  <span>Central 7C</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      

      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white border-r border-gray-200 shadow-xl p-2">
            <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
            <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100" aria-label="Fechar" onClick={() => setMobileSidebarOpen(false)}>
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
