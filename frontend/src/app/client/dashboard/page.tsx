'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Heart, History, Sparkles, ArrowRight, MousePointerClick, TrendingUp, Store } from 'lucide-react'

interface RecentProduct {
  id: number
  name: string
  slug: string
  image: string | null
  category: string | null
  brand: string | null
  best_price: number | null
  viewed_at: string
}

interface Suggestion {
  id: number
  name: string
  slug: string
  image: string | null
  category: string | null
  brand: string | null
  best_price: number | null
  reason: string
}

interface Stats {
  liked_count: number
  visited_count: number
  total_clicks: number
  most_viewed_brand: { id: number; name: string; image: string | null; view_count: number } | null
  most_viewed_fournisseur: { id: number; name: string; count: number } | null
}

interface DashboardData {
  stats: Stats
  recent_products: RecentProduct[]
  suggestions: Suggestion[]
}

const Spinner = () => (
  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/client/dashboard')
      .then(res => setData(res.data))
      .catch(err => {
        console.error('Failed to load dashboard:', err)
        setError('Erreur lors du chargement des données')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Erreur lors du chargement'}</p>
          <button onClick={() => window.location.reload()} className="text-brand-600 hover:underline">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const { stats, recent_products, suggestions } = data

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mon Compte</h1>
          <p className="text-gray-500">Gérez votre compte et vos préférences</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Produits Aimés</span>
              <Heart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.liked_count}</div>
            <p className="text-xs text-gray-400 mt-1">Dans vos favoris</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Produits Visités</span>
              <History className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.visited_count}</div>
            <p className="text-xs text-gray-400 mt-1">Historique de navigation</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Clics Totaux</span>
              <MousePointerClick className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total_clicks}</div>
            <p className="text-xs text-gray-400 mt-1">Liens marchands visités</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Marque Préférée</span>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            {stats.most_viewed_brand ? (
              <>
                <div className="text-xl font-bold text-gray-900 truncate">{stats.most_viewed_brand.name}</div>
                <p className="text-xs text-gray-400 mt-1">{stats.most_viewed_brand.view_count} visites</p>
              </>
            ) : (
              <div className="text-gray-400 text-sm">Aucune donnée</div>
            )}
          </div>
        </div>

        {/* Fournisseur Stats */}
        {stats.most_viewed_fournisseur && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-8">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6 text-brand-600" />
              <div>
                <p className="text-sm text-gray-500">Fournisseur le Plus Visité</p>
                <p className="text-lg font-bold text-gray-900">{stats.most_viewed_fournisseur.name}</p>
                <p className="text-xs text-gray-400">{stats.most_viewed_fournisseur.count} produits vus</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Products */}
        {recent_products.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5" />
                Produits Récemment Visités
              </h2>
              <Link href="/client/favorites" className="text-sm text-brand-600 hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recent_products.slice(0, 5).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="bg-white rounded-xl ring-1 ring-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-50 relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Heart className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                    {product.best_price && (
                      <p className="text-sm font-bold text-brand-600">{product.best_price.toFixed(3)} TND</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Recommandations IA pour Vous
            </h2>
            <p className="text-sm text-gray-500 mb-4">Basé sur votre historique de navigation</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {suggestions.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="bg-white rounded-xl ring-1 ring-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-50 relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Sparkles className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                    {product.best_price && (
                      <p className="text-sm font-bold text-brand-600">{product.best_price.toFixed(3)} TND</p>
                    )}
                    <p className="text-xs text-gray-400 truncate">{product.reason}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/client/favorites" className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md transition">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <p className="font-semibold text-gray-900">Mes Favoris</p>
              <p className="text-sm text-gray-500">{stats.liked_count} produits aimés</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>
          <Link href="/client/profile" className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md transition">
            <History className="w-8 h-8 text-brand-600" />
            <div>
              <p className="font-semibold text-gray-900">Paramètres</p>
              <p className="text-sm text-gray-500">Modifier mon profil</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>
          <Link href="/client/alerts" className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-md transition">
            <Store className="w-8 h-8 text-brand-600" />
            <div>
              <p className="font-semibold text-gray-900">Alertes Prix</p>
              <p className="text-sm text-gray-500">Gérer mes alertes</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  )
}