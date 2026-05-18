'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Heart, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'

interface FavoriteProduct {
  id: number
  name: string
  slug: string
  image: string | null
  category: { id: number; name: string } | null
  brand: { id: number; name: string } | null
  pivot: { created_at: string }
}

const Spinner = () => (
  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export default function ClientFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/favorites')
      .then(res => setFavorites(res.data))
      .catch(err => console.error('Failed to load favorites:', err))
      .finally(() => setLoading(false))
  }, [])

  const removeFavorite = async (productId: number) => {
    try {
      await api.delete(`/favorites/${productId}`)
      setFavorites(prev => prev.filter(p => p.id !== productId))
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour aux produits
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Mes Favoris</h1>
          <p className="text-gray-500">Gérez vos produits favoris</p>
        </div>

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun favori</h3>
            <p className="text-gray-500 mb-6">Ajoutez des produits à vos favoris pour les retrouver ici.</p>
            <Link href="/products" className="btn-primary">
              Parcourir les produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/products/${product.slug}`}>
                  <div className="aspect-square bg-gray-50 relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 truncate hover:text-brand-600">{product.name}</h3>
                  </Link>
                  {product.category && (
                    <p className="text-sm text-gray-500 mt-1">{product.category.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <Link href={`/products/${product.slug}`} className="text-sm font-medium text-brand-600 hover:underline">
                      Voir
                    </Link>
                    <button
                      onClick={() => removeFavorite(product.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}