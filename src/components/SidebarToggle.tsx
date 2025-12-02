type SidebarToggleProps = {
  collapsed: boolean
  onToggle: () => void
}

export default function SidebarToggle({ collapsed, onToggle }: SidebarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
      aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
      title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
    >
      <span className="font-medium">{collapsed ? 'Expandir' : 'Colapsar'}</span>
    </button>
  )
}

