import { ReactNode } from 'react'

type SidebarSectionProps = {
  title: string
  children: ReactNode
  collapsed: boolean
}

export default function SidebarSection({ title, children, collapsed }: SidebarSectionProps) {
  return (
    <div className="mb-2">
      {!collapsed && (
        <div className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider leading-none">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}
