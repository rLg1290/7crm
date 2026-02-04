import { 
  LayoutDashboard,
  Building2,
  Tag,
  Users,
  BarChart3,
  Search,
  BookOpen,
  ListTodo,
  Lock,
  Calendar,
  Plane,
  Banknote
} from 'lucide-react'

export type NavItemConfig = {
  to: string
  label: string
  icon: React.ReactNode
}

export type NavSectionConfig = {
  title: string
  items: NavItemConfig[]
}

// Configuração base do Menu (sem roles, pois será filtrado dinamicamente)
export const navSchema: NavSectionConfig[] = [
  {
    title: 'Gestão',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
      { to: '/operacoes', label: 'Operações (Emissões)', icon: <Plane className="h-5 w-5" /> },
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
    title: 'Financeiro',
    items: [
      { to: '/financeiro', label: 'Visão Geral', icon: <Banknote className="h-5 w-5" /> },
    ]
  },
  {
    title: 'Outros',
    items: [
      { to: '/pesquisas', label: 'Pesquisas', icon: <Search className="h-5 w-5" /> },
    ]
  }
]
