import { Navigate } from 'react-router-dom'
import { User } from '@supabase/supabase-js'

type UserWithPermissions = User & {
  role?: string
  allowed_pages?: string[]
}

type ProtectedRouteProps = {
  user: UserWithPermissions | null
  path: string
  children: React.ReactNode
}

export default function ProtectedRoute({ user, path, children }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/" replace />
  }

  const allowedPages = user.allowed_pages || []
  const isAdmin = user.role === 'admin'

  const hasAccess = () => {
    if (isAdmin) return true
    if (allowedPages.includes('*')) return true
    return allowedPages.includes(path)
  }

  if (!hasAccess()) {
    // Se não tiver acesso, redireciona para a Home que mostrará apenas o que é permitido
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
