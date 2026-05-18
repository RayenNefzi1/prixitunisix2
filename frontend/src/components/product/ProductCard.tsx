'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Heart, Star, TrendingDown, ExternalLink } from 'lucide-react'
import { isLoggedIn } from '@/lib/auth'
import { api } from '@/lib/api'
import { getFavoriteIds, updateFavoritesCache, clearFavoritesCache } from '@/lib/favorites-cache'
import LoginModal from '@/components/common/LoginModal'

interface Product {
  id: number
  name: string
  slug: string
  image_url: string | null
  category: { id?: number; name: string; code?: string; slug?: string } | null
  brand: { name: string } | null
  offers?: Array<{ price: number; is_available: boolean; merchant_website?: { name: string } | null }>
}

function productUrl(product: Product): string {
  if (product.slug && product.category?.code) {
    return `/produits/${product.category.code}/${product.slug}`
  }
  if (product.slug && product.category?.slug) {
    return `/produits/${product.category.slug}/${product.slug}`
  }
  return `/products/${product.id}`
}

export default function ProductCard({ product }: { product: Product }) {
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [favoritesChecked, setFavoritesChecked] = useState(false)

  // Check if product is already favorited using cache
  useEffect(() => {
    if (!isLoggedIn()) {
      setFavoritesChecked(true)
      return
    }
    
    getFavoriteIds()
      .then(favIds => {
        setLiked(favIds.includes(product.id))
      })
      .catch(() => {})
      .finally(() => setFavoritesChecked(true))
  }, [product.id])

  const availableOffers = product.offers?.filter(o => o.is_available) ?? []
  const prices = availableOffers.map(o => o.price)
  const minPrice = prices.length ? Math.min(...prices) : null
  const maxPrice = prices.length ? Math.max(...prices) : null
  const bestMerchant = availableOffers.find(o => o.price === minPrice)?.merchant_website?.name
  const offerCount = availableOffers.length
  const hasPriceDrop = maxPrice && minPrice && maxPrice - minPrice > 20

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isLoggedIn()) {
      setShowLoginModal(true)
      return
    }
    
    setLoading(true)
    try {
      const res = await api.post('/favorites/toggle', { product_id: product.id })
      const isAdded = res.data.status === 'added'
      setLiked(isAdded)
      updateFavoritesCache(product.id, isAdded)
      clearFavoritesCache()
      // Trigger storage event for real-time updates in other components
      localStorage.setItem('favorites_updated', Date.now().toString())
      localStorage.removeItem('favorites_updated')
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Link href={productUrl(product)} className="group block">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:ring-brand-200 transition-all duration-200 overflow-hidden">
          {/* Image */}
          <div className="relative bg-gray-50 h-44 flex items-center justify-center p-4">
            {hasPriceDrop && (
              <span className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <TrendingDown className="w-3 h-3" />
                Meilleur prix
              </span>
            )}
            <button
              onClick={handleWishlistClick}
              onMouseDown={e => e.preventDefault()}
              disabled={!favoritesChecked}
              className={`absolute top-2 right-2 p-1.5 rounded-full transition ${liked ? 'bg-red-100 text-red-500' : 'bg-white text-gray-300 hover:text-red-400'} shadow-sm ${!favoritesChecked ? 'opacity-50' : ''}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            </button>
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="max-h-36 max-w-full object-contain group-hover:scale-105 transition-transform duration-200" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-300">
                <span className="text-5xl">📦</span>
              </div>
            )}
          </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-1">
            {product.brand && (
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                {product.brand.name}
              </span>
            )}
            <span className="text-xs text-gray-400">{product.category?.name}</span>
          </div>

          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-brand-700 transition min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating placeholder */}
          <div className="flex items-center gap-1 mt-1.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} className={`w-3 h-3 ${i <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`} />
            ))}
            <span className="text-xs text-gray-400 ml-1">(24)</span>
          </div>

          {/* Price */}
          <div className="mt-3 pt-3 border-t border-gray-50">
            {minPrice !== null ? (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs text-gray-400">À partir de</span>
                    <div className="text-xl font-extrabold text-brand-700 leading-tight">
                      {minPrice.toFixed(3)}
                      <span className="text-sm font-semibold ml-1">TND</span>
                    </div>
                  </div>
                  {offerCount > 1 && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500">{offerCount} offres</span>
                      {maxPrice && maxPrice > minPrice && (
                        <div className="text-xs text-green-600 font-medium">
                          Économisez {(maxPrice - minPrice).toFixed(3)} TND
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {bestMerchant && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Meilleure offre: <span className="font-medium text-gray-700">{bestMerchant}</span></span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400 italic">Aucune offre disponible</span>
            )}
          </div>
        </div>
      </div>
      </Link>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}
