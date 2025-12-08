import { Link, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { Lock } from 'lucide-react'

type NavItemProps = {
  to: string
  icon: ReactNode
  label: string
  collapsed: boolean
  disabled?: boolean
}

export default function NavItem({ to, icon, label, collapsed, disabled }: NavItemProps) {
  const location = useLocation()
  const active = location.pathname === to
  if (disabled) {
    return (
      <div
        className={`group flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 mx-2 px-3 py-2 rounded-xl transition-colors text-gray-500 bg-gray-50 cursor-not-allowed opacity-70`}
        aria-disabled="true"
        title={`${label} bloqueado`}
      >
        <div className={`h-5 w-5 text-gray-400`}>{icon}</div>
        {!collapsed && <span className="text-sm truncate">{label}</span>}
        <Lock className="h-4 w-4 ml-auto text-gray-400" />
      </div>
    )
  }
  return (
    <Link
      to={to}
      className={`group flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 mx-2 px-3 py-2 rounded-xl transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
      aria-label={label}
      title={collapsed ? label : undefined}
    >
      <div className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}>{icon}</div>
      {!collapsed && <span className="text-sm truncate">{label}</span>}
    </Link>
  )
}
