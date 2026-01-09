import { Home, FileText, Users, DollarSign, Calendar, Tag, BookOpen, Plane, Building, User as UserIcon, Milestone } from 'lucide-react'
import NavItem from './NavItem'
import SidebarSection from './SidebarSection'
import { Link } from 'react-router-dom'

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
  empresaLogo?: string | null
  userName?: string | null
  aereoEnabled?: boolean | null
  userRole?: string
}

const navSchema = [
  {
    title: '7C Turismo',
    items: [
      { to: '/aereo', label: 'Aéreo', icon: <Plane className="h-5 w-5" /> },
    ]
  },
  {
    title: 'CRM',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
      { to: '/cotacoes', label: 'Cotações', icon: <FileText className="h-5 w-5" /> },
      { to: '/clientes', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
      { to: '/financeiro', label: 'Financeiro', icon: <DollarSign className="h-5 w-5" /> },
      { to: '/calendario', label: 'Tarefas', icon: <Calendar className="h-5 w-5" /> },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { to: '/promocoes', label: 'Promoções', icon: <Tag className="h-5 w-5" /> },
    ]
  },
  {
    title: 'Educação',
    items: [
      { to: '/educacao', label: 'Base de conhecimento', icon: <BookOpen className="h-5 w-5" /> },
    ]
  }
]

export default function Sidebar({ collapsed, onToggle, empresaLogo, userName, aereoEnabled, userRole }: SidebarProps) {
  const filteredNavSchema = navSchema.map(section => {
    if (section.title === '7C Turismo') {
      return {
        ...section,
        items: section.items.filter(item => item.label !== 'Aéreo' || aereoEnabled)
      }
    }
    return section
  }).filter(section => section.items.length > 0)

  return (
    <aside
      className={`${collapsed ? 'w-20' : 'w-64'} hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ease-out`}
      onMouseEnter={() => { if (collapsed) onToggle() }}
      onMouseLeave={() => { if (!collapsed) onToggle() }}
    >
      <div className={`px-3 py-3 border-b border-gray-100 flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 min-h-[56px]`}>
        {empresaLogo ? (
          <img src={empresaLogo} alt="Logo" className={`${collapsed ? 'h-8 w-8' : 'h-9 w-9'} rounded-lg object-cover flex-shrink-0`} />
        ) : (
          <div className={`${collapsed ? 'h-8 w-8' : 'h-9 w-9'} bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Building className="h-4 w-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <div className="text-sm font-semibold text-gray-800 leading-none">{userName || 'Agência'}</div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        {filteredNavSchema.map(section => (
          <SidebarSection key={section.title} title={section.title} collapsed={collapsed}>
            {section.items.map(item => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} collapsed={collapsed} disabled={(item as any).disabled} />
            ))}
          </SidebarSection>
        ))}
      </div>
      <div className="sticky bottom-2 bg-white px-2 pt-2 border-t border-gray-100">
        <Link to="/atualizacoes" className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 mx-2 mb-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50`}>
          <Milestone className="h-5 w-5 text-gray-500" />
          {!collapsed && <span>Atualizações</span>}
        </Link>
        <Link to="/perfil" className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 mx-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50`}>
          <UserIcon className="h-5 w-5 text_gray-500" />
          {!collapsed && <span>Perfil</span>}
        </Link>
      </div>
    </aside>
  )
}
