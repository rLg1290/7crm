import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Shield, 
  Check, 
  Save, 
  AlertCircle,
  LayoutDashboard,
  Building2,
  Tag,
  Users,
  BarChart3,
  Search,
  BookOpen,
  ListTodo,
  Lock,
  Calendar
} from 'lucide-react'

interface RolePermission {
  role: string
  label: string
  can_access_admin: boolean
  can_access_crm: boolean
  allowed_pages: string[]
}

// Mapa de páginas disponíveis no sistema Admin para configuração
const ADMIN_PAGES = [
  { id: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: '/empresas', label: 'Empresas', icon: Building2 },
  { id: '/usuarios', label: 'Usuários', icon: Users },
  { id: '/permissoes', label: 'Permissões', icon: Lock },
  { id: '/promocoes', label: 'Promoções', icon: Tag },
  { id: '/educacao', label: 'Educação', icon: BookOpen },
  { id: '/atualizacoes', label: 'Atualizações', icon: Tag },
  { id: '/comercial/kanban', label: 'Kanban Comercial', icon: ListTodo },
  { id: '/comercial/calendario', label: 'Calendário Comercial', icon: Calendar },
  { id: '/pesquisas', label: 'Pesquisas', icon: Search },
]

export default function Permissoes() {
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role')
      
      if (error) throw error
      setPermissions(data || [])
    } catch (err: any) {
      console.error('Erro ao carregar permissões:', err)
      setError('Não foi possível carregar as permissões.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSystem = (role: string, field: 'can_access_admin' | 'can_access_crm') => {
    setPermissions(prev => prev.map(p => {
      if (p.role === role) {
        return { ...p, [field]: !p[field] }
      }
      return p
    }))
  }

  const handleTogglePage = (role: string, pageId: string) => {
    setPermissions(prev => prev.map(p => {
      if (p.role === role) {
        const currentPages = Array.isArray(p.allowed_pages) ? p.allowed_pages : []
        const isAllowed = currentPages.includes(pageId) || currentPages.includes('*')
        
        let newPages: string[]
        if (isAllowed) {
          // Remover permissão
          // Se tiver '*', transforma em lista explicita menos o item removido
          if (currentPages.includes('*')) {
            newPages = ADMIN_PAGES.map(pg => pg.id).filter(id => id !== pageId)
          } else {
            newPages = currentPages.filter(id => id !== pageId)
          }
        } else {
          // Adicionar permissão
          newPages = [...currentPages, pageId]
        }

        return { ...p, allowed_pages: newPages }
      }
      return p
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const updates = permissions.map(p => ({
        role: p.role,
        label: p.label,
        can_access_admin: p.can_access_admin,
        can_access_crm: p.can_access_crm,
        allowed_pages: p.allowed_pages
      }))

      const { error } = await supabase
        .from('role_permissions')
        .upsert(updates)

      if (error) throw error

      setSuccess('Permissões atualizadas com sucesso!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      setError('Erro ao salvar as permissões.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Permissões</h1>
          <p className="text-gray-500 mt-1">Configure o acesso para cada tipo de usuário do sistema.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Salvar Alterações</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <Check className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {permissions.map((rolePerm) => (
          <div key={rolePerm.role} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  rolePerm.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                  rolePerm.role === 'user' ? 'bg-blue-100 text-blue-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{rolePerm.label}</h3>
                  <p className="text-xs text-gray-500 font-mono">Role: {rolePerm.role}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rolePerm.can_access_admin}
                    onChange={() => handleToggleSystem(rolePerm.role, 'can_access_admin')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Acesso Admin</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rolePerm.can_access_crm}
                    onChange={() => handleToggleSystem(rolePerm.role, 'can_access_crm')}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Acesso CRM</span>
                </label>
              </div>
            </div>

            {/* Area de Permissões de Páginas (Apenas se tiver acesso ao Admin) */}
            {rolePerm.can_access_admin && (
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">
                  Visibilidade de Páginas (Admin)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {ADMIN_PAGES.map((page) => {
                    const Icon = page.icon
                    const isAllowed = rolePerm.allowed_pages.includes('*') || rolePerm.allowed_pages.includes(page.id)
                    
                    return (
                      <div 
                        key={page.id}
                        onClick={() => handleTogglePage(rolePerm.role, page.id)}
                        className={`cursor-pointer rounded-lg border p-3 flex items-center space-x-3 transition-all ${
                          isAllowed 
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`p-1.5 rounded ${isAllowed ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`text-sm ${isAllowed ? 'font-medium text-blue-900' : 'text-gray-500'}`}>
                          {page.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {!rolePerm.can_access_admin && (
              <div className="px-6 py-8 text-center text-gray-500 text-sm italic bg-gray-50/30">
                Este perfil não tem acesso ao Painel Administrativo.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
