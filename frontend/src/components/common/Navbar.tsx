'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Cookies from 'js-cookie'
import { ShoppingCart, Heart, Bell, LogOut, Menu, X, ChevronDown, Store, Tag, Ticket, Briefcase } from 'lucide-react'
import SearchBar from './SearchBar'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; prename: string; role: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))

    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    Cookies.remove('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    setUserMenuOpen(false)
    router.push('/')
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white shadow-sm'}`}>
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
            <Link
              href="/fournisseur"
              className="flex items-center gap-1.5 text-sm font-medium text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition"
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden lg:inline">Espace Fournisseur</span>
            </Link>

            {user ? (
              <>
                <Link href="/client/favorites" title="Favoris" className="p-2 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link href="/client/alerts" title="Alertes prix" className="p-2 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition">
                  <Bell className="w-5 h-5" />
                </Link>
                <Link href="/client/cart" title="Panier" className="p-2 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition">
                  <ShoppingCart className="w-5 h-5" />
                </Link>

                {/* User menu */}
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
                  >
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-700 font-bold text-sm">{user.prename[0]}{user.name[0]}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.prename}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-xs text-gray-500">Connecté en tant que</p>
                        <p className="text-sm font-semibold text-gray-800">{user.prename} {user.name}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 capitalize mt-0.5">{user.role}</span>
                      </div>
                      <Link href="/client/favorites" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <Heart className="w-4 h-4 text-gray-400" /> Mes favoris
                      </Link>
                      <Link href="/client/cart" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <ShoppingCart className="w-4 h-4 text-gray-400" /> Mon panier
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
              <button onClick={handleLogout} className="text-sm text-red-600 font-medium">Déconnexion</button>
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
