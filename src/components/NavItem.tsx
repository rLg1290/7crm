import { Link, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'

type NavItemProps = {
  to: string
  icon: ReactNode
  label: string
  collapsed: boolean
}

export default function NavItem({ to, icon, label, collapsed }: NavItemProps) {
  const location = useLocation()
  const active = location.pathname === to
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

