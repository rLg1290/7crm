import { 
  LayoutDashboard,
  Building2,
  Tag,
  Users,
  BarChart3,
  Search,
  BookOpen,
  Shield,
  LogOut,
  ListTodo,
  Lock,
  Calendar
} from 'lucide-react'
import NavItem from './NavItem'
import SidebarSection from './SidebarSection'
import { User } from '@supabase/supabase-js'

// Extender o tipo User para incluir a role e permissões
type UserWithPermissions = User & {
  role?: string
  allowed_pages?: string[]
}

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
  user: UserWithPermissions
  onLogout: () => void
  className?: string
}

type NavItemConfig = {
  to: string
  label: string
  icon: React.ReactNode
}

type NavSectionConfig = {
  title: string
  items: NavItemConfig[]
}

// Configuração base do Menu (sem roles, pois será filtrado dinamicamente)
const navSchema: NavSectionConfig[] = [
  {
    title: 'Gestão',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { to: '/relatorios', label: 'Relatórios', icon: <BarChart3 className="h-5 w-5" /> },
    ]
  },
  {
    title: 'Administração',
    items: [
      { to: '/empresas', label: 'Empresas', icon: <Building2 className="h-5 w-5" /> },
      { to: '/usuarios', label: 'Usuários', icon: <Users className="h-5 w-5" /> },
      { to: '/permissoes', label: 'Permissões', icon: <Lock className="h-5 w-5" /> },
      { to: '/promocoes', label: 'Promoções', icon: <Tag className="h-5 w-5" /> },
      { to: '/educacao', label: 'Educação', icon: <BookOpen className="h-5 w-5" /> },
      { to: '/atualizacoes', label: 'Atualizações', icon: <Tag className="h-5 w-5" /> },
    ]
  },
  {
    title: 'Comercial',
    items: [
      { to: '/comercial/kanban', label: 'Kanban Comercial', icon: <ListTodo className="h-5 w-5" /> },
      { to: '/comercial/calendario', label: 'Calendário Comercial', icon: <Calendar className="h-5 w-5" /> },
    ]
  },
  {
    title: 'Outros',
    items: [
      { to: '/pesquisas', label: 'Pesquisas', icon: <Search className="h-5 w-5" /> },
    ]
  }
]

export default function Sidebar({ collapsed, onToggle, user, onLogout, className }: SidebarProps) {
  // Função para traduzir a role para exibição
  const getRoleLabel = (role?: string) => {
    switch(role) {
      case 'admin': return 'Administrador'
      case 'comercial': return 'Comercial'
      case 'financeiro': return 'Financeiro'
      default: return 'Usuário'
    }
  }

  // Verificar permissões
  const allowedPages = user.allowed_pages || []
  const isAdmin = user.role === 'admin'
  
  // O admin sempre vê a página de permissões, outros não (a menos que explicitamente permitido, mas por segurança ocultamos hardcoded)
  // Mas vamos seguir a regra do allowed_pages. Se '*' estiver lá, libera tudo.
  
  const hasAccess = (path: string) => {
    if (isAdmin) return true // Admin acessa tudo
    if (allowedPages.includes('*')) return true
    return allowedPages.includes(path)
  }

  const filteredNav = navSchema.map(section => ({
    ...section,
    items: section.items.filter(item => hasAccess(item.to))
  })).filter(section => section.items.length > 0)

  return (
    <aside
      className={`${collapsed ? 'w-20' : 'w-64'} flex-col bg-white border-r border-gray-200 transition-all duration-200 ease-out ${className || 'hidden lg:flex'}`}
      onMouseEnter={() => { if (collapsed) onToggle() }}
      onMouseLeave={() => { if (!collapsed) onToggle() }}
    >
      <div className={`px-3 py-3 border-b border-gray-100 flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 min-h-[64px]`}>
        <div className="h-9 w-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
           <Shield className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 leading-none">7CRM Admin</span>
            <span className="text-xs text-gray-500 mt-0.5">Sistema Administrativo</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-3">
        {filteredNav.map(section => (
          <SidebarSection key={section.title} title={section.title} collapsed={collapsed}>
            {section.items.map(item => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} collapsed={collapsed} />
            ))}
          </SidebarSection>
        ))}
      </div>
      
      <div className="border-t border-gray-100 p-2">
         {/* User Profile */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 px-2 py-2 rounded-xl text-sm text-gray-700`}>
             <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
               user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
               ['comercial', 'financeiro'].includes(user.role || '') ? 'bg-gradient-to-br from-orange-500 to-red-500' :
               'bg-gray-400'
             }`}>
               <Shield className="h-4 w-4" />
             </div>
             {!collapsed && (
               <div className="flex flex-col overflow-hidden">
                 <span className="font-medium truncate">{user.user_metadata?.full_name || user.email}</span>
                 <span className="text-xs text-blue-600 uppercase">{getRoleLabel(user.role)}</span>
               </div>
             )}
          </div>
          
          <button 
            onClick={onLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 px-3 py-2 mt-1 rounded-xl text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors`}
            title="Sair"
          >
             <LogOut className="h-5 w-5" />
             {!collapsed && <span>Sair</span>}
          </button>
      </div>
    </aside>
  )
}
