import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import Sidebar from './Sidebar'
import { Menu, X } from 'lucide-react'

interface LayoutProps {
  user: User
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ user, children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
        className="hidden lg:flex h-screen sticky top-0"
      />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <button onClick={() => setMobileSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
               <Menu className="h-6 w-6 text-gray-600" />
             </button>
             <span className="font-bold text-gray-900">7CRM Admin</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl animate-in slide-in-from-left duration-200 flex flex-col">
            <div className="flex justify-end p-2 border-b border-gray-100">
               <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                 <X className="h-6 w-6 text-gray-600" />
               </button>
            </div>
            <Sidebar 
               collapsed={false} 
               onToggle={() => {}} 
               user={user} 
               onLogout={handleLogout} 
               className="flex h-full border-none w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
