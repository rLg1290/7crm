import { Link } from 'react-router-dom'
import { navSchema } from '../config/navigation'
import { User } from '@supabase/supabase-js'
import { ArrowRight, Shield } from 'lucide-react'

// Extender o tipo User para incluir a role e permissões
type UserWithPermissions = User & {
  role?: string
  allowed_pages?: string[]
}

type HomeProps = {
  user: UserWithPermissions
}

export default function Home({ user }: HomeProps) {
  const allowedPages = user.allowed_pages || []
  const isAdmin = user.role === 'admin'

  const hasAccess = (path: string) => {
    if (isAdmin) return true
    if (allowedPages.includes('*')) return true
    return allowedPages.includes(path)
  }

  // Flatten the nav schema and filter by access
  const accessibleItems = navSchema
    .flatMap(section => section.items)
    .filter(item => hasAccess(item.to))

  // Group by original sections
  const sections = navSchema.map(section => ({
    ...section,
    items: section.items.filter(item => hasAccess(item.to))
  })).filter(section => section.items.length > 0)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-full mb-4">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bem-vindo, {user.user_metadata?.full_name || user.email}!
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Selecione uma das ferramentas abaixo para começar a gerenciar suas atividades.
        </p>
      </div>

      <div className="grid gap-8">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 px-1 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              {section.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {section.items.map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col items-start"
                >
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-1">
                    {item.label}
                  </h3>
                  <div className="mt-auto pt-4 w-full flex items-center justify-end text-sm font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
                    Acessar <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {accessibleItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500">
              Você não possui permissões de acesso configuradas. 
              <br />
              Entre em contato com o administrador do sistema.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
