'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Package, Search, Filter, Eye, MousePointer, TrendingUp, ExternalLink, Plus } from 'lucide-react'

interface Product {
  id: number
  name: string
  slug: string
  image_url: string | null
  category: { id: number; name: string } | null
  brand: { id: number; name: string } | null
  lowest_price: number | null
  offer_count: number
  total_clicks: number
  total_views: number
}

export default function FournisseurProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<{ [key: number]: { clicks_today: number; views_today: number } }>({})

  useEffect(() => {
    const token = localStorage.getItem('fournisseur_token')
    if (!token) {
      router.push('/fournisseur/login')
      return
    }
    
    api.get('/fournisseur/products')
      .then(res => setProducts(res.data.products || []))
      .catch(err => {
        if (err.response?.status === 401) {
          router.push('/fournisseur/login')
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const loadProductStats = (productId: number) => {
    if (stats[productId]) return
    
    api.get(`/fournisseur/products/${productId}/stats`)
      .then(res => setStats(prev => ({ ...prev, [productId]: res.data })))
      .catch(console.error)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/fournisseur" className="text-sm text-gray-500 hover:text-brand-600 mb-1 inline-flex items-center gap-1">
            ← Retour au tableau de bord
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">Mes Produits</h1>
          <p className="text-gray-500 text-sm">{products.length} produits suivis</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">
          <Filter className="w-4 h-4" /> Filtrer
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit</h3>
          <p className="text-gray-500 mb-4">Aucun produit n'est actuellement associé à votre boutique.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
              onMouseEnter={() => loadProductStats(product.id)}
            >
              <div className="flex items-center gap-4">
                {/* Image */}
                <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${product.slug}`} className="font-semibold text-gray-900 hover:text-brand-600 truncate block">
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {product.brand && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{product.brand.name}</span>
                    )}
                    {product.category && (
                      <span className="text-xs text-gray-500">{product.category.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="font-bold text-brand-600">
                      {product.lowest_price ? `${product.lowest_price.toFixed(3)} TND` : 'N/A'}
                    </span>
                    <span className="text-gray-400">{product.offer_count} offre{product.offer_count > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-400">
                      <MousePointer className="w-4 h-4" />
                      <span className="text-xs">Clics</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{product.total_clicks}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs">Vues</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{product.total_views}</p>
                  </div>
                  {stats[product.id] && (
                    <>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-green-500">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs">Aujourd'hui</span>
                        </div>
                        <p className="text-lg font-bold text-green-600">{stats[product.id].clicks_today}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <Link 
                  href={`/products/${product.slug}`} 
                  className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
                >
                  <ExternalLink className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}