'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, Users, ShoppingBag, Store, BarChart3, 
  Settings, LogOut, Menu, X, Package, Bell, Tag, CreditCard, RefreshCw
} from 'lucide-react'

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { href: '/admin/fournisseurs', icon: Store, label: 'Fournisseurs' },
  { href: '/admin/products', icon: Package, label: 'Produits' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Abonnements' },
  { href: '/admin/categories', icon: Tag, label: 'Catégories' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/alerts', icon: Bell, label: 'Alertes Prix' },
  { href: '/admin/scraping', icon: RefreshCw, label: 'Scraping' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin] = useState<{ name: string; prename: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const stored = localStorage.getItem('admin_user')
    
    if (token && stored) {
      setAdmin(JSON.parse(stored))
    } else if (pathname !== '/admin/login') {
      router.push('/admin/login')
    }
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/admin/login')
  }

  const isLoginPage = pathname === '/admin/login'

  // If on login page, just render children without the admin layout
  if (isLoginPage) {
    return <>{children}</>
  }

  // Show loading while checking auth
  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <header className="bg-slate-800 text-white sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-700 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin" className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">PT</span>
              </div>
              <span>PrixTunisix Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300">
              {(admin?.prename || '')[0]}{(admin?.name || '')[0]}
            </span>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-56px)] transition-all overflow-hidden`}>
          <nav className="p-4 space-y-1">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 hover:text-brand-600 rounded-lg transition"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile menu overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}