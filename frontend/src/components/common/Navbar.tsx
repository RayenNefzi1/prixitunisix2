'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import { Heart, Bell, LogOut, Menu, X, ChevronDown, Store, Tag, Ticket, Briefcase, User, Settings, LayoutDashboard } from 'lucide-react'
import SearchBar from './SearchBar'
import { api } from '@/lib/api'
import { getFavoriteIds, clearFavoritesCache } from '@/lib/favorites-cache'

interface FavoriteProduct {
  id: number
  name: string
  slug: string
  image: string | null
}

interface AlertProduct {
  id: number
  target_price: number
  product: {
    id: number
    name: string
    slug: string
    image_url: string | null
    category: string | null
  } | null
}

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; prename: string; role: string } | null>(null)
  const [fournisseur, setFournisseur] = useState<{ company_name: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [favoritesOpen, setFavoritesOpen] = useState(false)
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alerts, setAlerts] = useState<AlertProduct[]>([])
  const favoritesRef = useRef<HTMLDivElement>(null)
  const alertsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('auth_token')
      const stored = localStorage.getItem('user')
      const fournisseurToken = localStorage.getItem('fournisseur_token')
      const fournisseurStored = localStorage.getItem('fournisseur_user')
      
      if (token && stored) {
        setUser(JSON.parse(stored))
        setFournisseur(null)
      } else if (fournisseurToken && fournisseurStored) {
        setUser(null)
        setFournisseur(JSON.parse(fournisseurStored))
      } else {
        setUser(null)
        setFournisseur(null)
      }
    }
    
    checkAuth()
    
    // Check auth on storage changes (e.g., login from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'auth_token' || e.key === 'fournisseur_token' || e.key === 'fournisseur_user') {
        checkAuth()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [router.asPath])

  // Force refresh on mount to check auth state
  useEffect(() => {
    const token = Cookies.get('auth_token')
    const stored = localStorage.getItem('user')
    const fournisseurToken = localStorage.getItem('fournisseur_token')
    const fournisseurStored = localStorage.getItem('fournisseur_user')
    
    if (token && stored) {
      setUser(JSON.parse(stored))
    } else if (fournisseurToken && fournisseurStored) {
      setFournisseur(JSON.parse(fournisseurStored))
    } else {
      setUser(null)
      setFournisseur(null)
    }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (favoritesRef.current && !favoritesRef.current.contains(e.target as Node)) {
        setFavoritesOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load favorites and alerts on page load and when user changes
  useEffect(() => {
    const loadFavorites = () => {
      clearFavoritesCache()
      if (user) {
        api.get('/favorites')
          .then(res => setFavorites(res.data))
          .catch(err => console.error('Failed to load favorites:', err))
      } else {
        setFavorites([])
      }
    }

    const loadAlerts = () => {
      if (user) {
        api.get('/client/alerts')
          .then(res => setAlerts(res.data))
          .catch(err => console.error('Failed to load alerts:', err))
      } else {
        setAlerts([])
      }
    }

    // Load immediately when user is present
    if (user) {
      loadFavorites()
      loadAlerts()
    }

    // Listen for localStorage changes (favorites updated from other components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'favorites_updated') {
        loadFavorites()
      }
      if (e.key === 'alerts_updated') {
        loadAlerts()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    // Also poll every 10 seconds for updates
    const interval = setInterval(() => {
      if (user) {
        loadFavorites()
        loadAlerts()
      }
    }, 10000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [user])

  const handleLogout = () => {
    if (fournisseur) {
      localStorage.removeItem('fournisseur_token')
      localStorage.removeItem('fournisseur_user')
      setFournisseur(null)
    } else {
      Cookies.remove('auth_token')
      localStorage.removeItem('user')
      setUser(null)
    }
    setUserMenuOpen(false)
    router.push('/')
  }

  const handleFournisseurLogout = () => {
    localStorage.removeItem('fournisseur_token')
    localStorage.removeItem('fournisseur_user')
    setFournisseur(null)
    router.push('/')
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
      {/* Top bar */}
      <div className="bg-brand-700 text-white text-xs py-1.5 px-4 text-center">
        🇹🇳 Comparez les prix sur MyTek, Tunisianet, TunisiaTech et plus &mdash;{' '}
        <span className="font-semibold">Économisez jusqu&apos;à 30%</span>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-1.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">PT</span>
            </div>
            <span className="text-xl font-extrabold text-gray-900 hidden sm:block">
              Prix<span className="text-brand-600">Tunisix</span>
            </span>
          </Link>

          {/* Search bar */}
          <SearchBar />

          {/* Actions */}
          <div className="hidden md:flex items-center gap-1">
            {/* Espace Fournisseur */}
            {!fournisseur && !user && (
              <Link
                href="/fournisseur/login"
                className="flex items-center gap-1.5 text-sm font-medium text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition"
              >
                <Briefcase className="w-4 h-4" />
                <span className="hidden lg:inline">Espace Fournisseur</span>
              </Link>
            )}
            {fournisseur && !user && (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-purple-700 border border-purple-200 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition"
              >
                <User className="w-4 h-4" />
                <span className="hidden lg:inline">Espace Client</span>
              </Link>
            )}

            {user ? (
              <>
                {user.role === 'client' && (
                  <Link
                    href="/fournisseur/login"
                    className="flex items-center gap-1.5 text-sm font-medium text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="hidden lg:inline">Espace Fournisseur</span>
                  </Link>
                )}
                {/* Favorites Dropdown */}
                <div 
                  className="relative" 
                  ref={favoritesRef}
                  onMouseEnter={() => setFavoritesOpen(true)}
                  onMouseLeave={() => setFavoritesOpen(false)}
                >
                  <button 
                    onClick={() => router.push('/client/favorites')}
                    className="p-2 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition relative"
                  >
                    <Heart className="w-5 h-5" />
                    {favorites.length > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                  {favoritesOpen && (
                    <div className="absolute right-0 mt-1 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 z-50">
                      <div className="p-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">Mes Favoris ({favorites.length})</p>
                      </div>
                      {favorites.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Aucun favori
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto">
                          {favorites.slice(0, 5).map((product) => (
                            <Link 
                              key={product.id} 
                              href={`/products/${product.slug}`}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 transition"
                              onClick={() => setFavoritesOpen(false)}
                            >
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Heart className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                              </div>
                            </Link>
                          ))}
                          {favorites.length > 5 && (
                            <Link 
                              href="/client/favorites"
                              className="block p-3 text-center text-sm text-brand-600 hover:bg-gray-50 border-t border-gray-100"
                              onClick={() => setFavoritesOpen(false)}
                            >
                              Voir tous les favoris ({favorites.length})
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Alerts Dropdown - show yellow if any not reached, green if all reached */}
                <div 
                  className="relative" 
                  ref={alertsRef}
                  onMouseEnter={() => setAlertsOpen(true)}
                  onMouseLeave={() => setAlertsOpen(false)}
                >
                  <button 
                    onClick={() => router.push('/client/alerts')}
                    className={`p-2 rounded-xl transition relative ${
                      alerts.some(a => a.reached) 
                        ? 'text-green-600 hover:bg-green-50' 
                        : alerts.length > 0 
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50'
                    }`}
                  >
                    <Bell className="w-5 h-5" />
                    {alerts.length > 0 && (
                      <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white ${
                        alerts.every(a => a.reached) ? 'bg-green-500' : 'bg-yellow-500'
                      }`}>
                        {alerts.length}
                      </span>
                    )}
                  </button>
                  {alertsOpen && (
                    <div className="absolute right-0 mt-1 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 z-50">
                      <div className="p-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">Mes Alertes Prix ({alerts.length})</p>
                      </div>
                      {alerts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          Aucune alerte
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto">
                          {alerts.slice(0, 5).map((alert) => (
                            <Link 
                              key={alert.id} 
                              href={`/products/${alert.product?.slug}`}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 transition"
                              onClick={() => setAlertsOpen(false)}
                            >
                              {alert.product?.image_url ? (
                                <img src={alert.product.image_url} alt={alert.product.name} className="w-12 h-12 object-cover rounded-lg" />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Bell className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{alert.product?.name}</p>
                                <p className={`text-xs ${alert.reached ? 'text-green-600' : 'text-yellow-600'}`}>
                                  Objectif: {alert.target_price.toFixed(3)} TND
                                  {alert.current_price && (
                                    <span className="ml-1"> (Actuel: {alert.current_price.toFixed(3)} TND)</span>
                                  )}
                                  {alert.reached && <span className="ml-1 font-bold">✓ Atteint!</span>}
                                </p>
                              </div>
                            </Link>
                          ))}
                          {alerts.length > 5 && (
                            <Link 
                              href="/client/alerts"
                              className="block p-3 text-center text-sm text-brand-600 hover:bg-gray-50 border-t border-gray-100"
                              onClick={() => setAlertsOpen(false)}
                            >
                              Voir toutes les alertes ({alerts.length})
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-700 font-bold text-sm">{(user.prename || '')[0] || '?'}{(user.name || '')[0] || '?'}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.prename || user.name || 'Utilisateur'}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-xs text-gray-500">Connecté en tant que</p>
                        <p className="text-sm font-semibold text-gray-800">{user.prename || ''} {user.name || ''}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 capitalize mt-0.5">{user.role}</span>
                      </div>
                      <Link href="/client/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <LayoutDashboard className="w-4 h-4 text-gray-400" /> Mon Compte
                      </Link>
                      <Link href="/client/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <User className="w-4 h-4 text-gray-400" /> Mon profil
                      </Link>
                      <Link href="/client/favorites" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <Heart className="w-4 h-4 text-gray-400" /> Mes favoris
                      </Link>
                      <Link href="/client/alerts" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <Bell className="w-4 h-4 text-gray-400" /> Alertes prix
                      </Link>
                      <div className="border-t border-gray-100 mt-1">
                        <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition">
                          <LogOut className="w-4 h-4" /> Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : fournisseur ? (
              <div className="relative ml-1" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-50 transition"
                >
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-brand-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{fournisseur.company_name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-xs text-gray-500">Connecté en tant que</p>
                      <p className="text-sm font-semibold text-gray-800">{fournisseur.company_name}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 mt-0.5">Fournisseur</span>
                    </div>
                    <Link href="/fournisseur" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard className="w-4 h-4 text-gray-400" /> Tableau de bord
                    </Link>
                    <Link href="/fournisseur/products" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                      <Store className="w-4 h-4 text-gray-400" /> Mes produits
                    </Link>
                    <Link href="/fournisseur/subscription" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                      <Tag className="w-4 h-4 text-gray-400" /> Abonnement
                    </Link>
                    <div className="border-t border-gray-100 mt-1">
                      <button onClick={handleFournisseurLogout} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition">
                        <LogOut className="w-4 h-4" /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-brand-600 px-3 py-2 rounded-xl hover:bg-gray-50 transition">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  S&apos;inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 pb-2 -mt-1 border-t border-gray-100 pt-2">
          <Link href="/products" className="text-sm text-gray-600 hover:text-brand-600 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition">
            Tous les produits
          </Link>
          <span className="mx-1 text-gray-200">|</span>
          <Link href="/products?sort=price_asc" className="text-sm text-brand-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-50 transition flex items-center gap-1">
            🔥 Meilleures offres
          </Link>
          <span className="mx-1 text-gray-200">|</span>
          <Link href="/boutiques" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition">
            <Store className="w-4 h-4" /> Boutiques
          </Link>
          <span className="mx-1 text-gray-200">|</span>
          <Link href="/marques" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition">
            <Tag className="w-4 h-4" /> Marques
          </Link>
          <span className="mx-1 text-gray-200">|</span>
          <Link href="/coupons" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 font-medium px-3 py-1.5 rounded-lg hover:bg-brand-50 transition">
            <Ticket className="w-4 h-4" /> Coupons
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-2">
          <Link href="/products" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}>Tous les produits</Link>
          <Link href="/products?sort=price_asc" className="block py-2 text-sm font-medium text-brand-600" onClick={() => setMenuOpen(false)}>🔥 Meilleures offres</Link>
          <Link href="/boutiques" className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}><Store className="w-4 h-4" /> Boutiques</Link>
          <Link href="/marques" className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}><Tag className="w-4 h-4" /> Marques</Link>
          <Link href="/coupons" className="flex items-center gap-2 py-2 text-sm font-medium text-gray-700" onClick={() => setMenuOpen(false)}><Ticket className="w-4 h-4" /> Coupons</Link>
          <Link href="/fournisseur" className="flex items-center gap-2 py-2 text-sm font-medium text-brand-700" onClick={() => setMenuOpen(false)}><Briefcase className="w-4 h-4" /> Espace Fournisseur</Link>
          <div className="border-t border-gray-100 pt-3 mt-2 flex gap-2">
            {user ? (
              <>
                <Link href="/client/dashboard" className="flex-1 text-center py-2.5 text-sm font-medium border border-gray-200 rounded-xl" onClick={() => setMenuOpen(false)}>Mon Compte</Link>
                <Link href="/client/profile" className="flex-1 text-center py-2.5 text-sm font-medium border border-gray-200 rounded-xl" onClick={() => setMenuOpen(false)}>Profil</Link>
                <button onClick={handleLogout} className="text-sm text-red-600 font-medium">Déconnexion</button>
              </>
            ) : fournisseur ? (
              <>
                <Link href="/fournisseur" className="flex-1 text-center py-2.5 text-sm font-medium border border-purple-200 text-purple-700 rounded-xl" onClick={() => setMenuOpen(false)}>Tableau de bord</Link>
                <button onClick={handleFournisseurLogout} className="text-sm text-red-600 font-medium">Déconnexion</button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex-1 text-center py-2.5 text-sm font-medium border border-gray-200 rounded-xl" onClick={() => setMenuOpen(false)}>Connexion</Link>
                <Link href="/register" className="flex-1 text-center py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-xl" onClick={() => setMenuOpen(false)}>S&apos;inscrire</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
