import { useEffect } from 'react'
import { FileText, Users, DollarSign, Calendar, Tag, BookOpen, ChevronLeft, ChevronRight, Building, User as UserIcon } from 'lucide-react'
import NavItem from './NavItem'
import SidebarSection from './SidebarSection'
import { Link } from 'react-router-dom'

type SidebarProps = {
  collapsed: boolean
  onToggle: () => void
  empresaLogo?: string | null
  userName?: string | null
}

const navSchema = [
  {
    title: 'Operações',
    items: [
      { to: '/cotacoes', label: 'Cotações', icon: <FileText className="h-5 w-5" /> },
      { to: '/clientes', label: 'Clientes', icon: <Users className="h-5 w-5" /> },
      { to: '/financeiro', label: 'Financeiro', icon: <DollarSign className="h-5 w-5" /> },
      { to: '/calendario', label: 'Calendário', icon: <Calendar className="h-5 w-5" /> },
    ]
  },
  {
    title: 'Marketing',
    items: [
      { to: '/promocoes', label: 'Promoções', icon: <Tag className="h-5 w-5" /> },
      { to: '/educacao', label: 'Educação', icon: <BookOpen className="h-5 w-5" /> },
    ]
  }
]

export default function Sidebar({ collapsed, onToggle, empresaLogo, userName }: SidebarProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        onToggle()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onToggle])

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ease-out`}>
      <div className="px-3 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {empresaLogo ? (
            <img src={empresaLogo} alt="Logo" className={`rounded-lg object-cover ${collapsed ? 'h-8 w-8' : 'h-9 w-9'}`} />
          ) : (
            <div className={`${collapsed ? 'h-8 w-8' : 'h-9 w-9'} bg-blue-600 rounded-lg flex items-center justify-center`}>
              <Building className="h-4 w-4 text-white" />
            </div>
          )}
          {!collapsed && (
            <div className="text-sm font-semibold text-gray-800">{userName || 'Agência'}</div>
          )}
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-3">
        {navSchema.map(section => (
          <SidebarSection key={section.title} title={section.title} collapsed={collapsed}>
            {section.items.map(item => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} collapsed={collapsed} />
            ))}
          </SidebarSection>
        ))}
      </div>
      <div className="p-2 border-t border-gray-100">
        <Link to="/perfil" className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 mx-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50`}>
          <UserIcon className="h-5 w-5 text-gray-500" />
          {!collapsed && <span>Perfil</span>}
        </Link>
      </div>
    </aside>
  )
}
