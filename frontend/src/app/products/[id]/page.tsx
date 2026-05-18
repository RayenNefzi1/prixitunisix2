'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { isLoggedIn } from '@/lib/auth'
import PriceHistoryChart from '@/components/product/PriceHistoryChart'
import LoginModal from '@/components/common/LoginModal'
import { Heart, Bell, ExternalLink, ChevronRight, Star, Package, Tag, ArrowLeft, TrendingDown, CheckCircle } from 'lucide-react'

interface Offer {
  id: number
  price: number
  is_available: boolean
  merchant_url: string
  raw_title: string
  merchant_website: { name: string; logo_url: string | null; base_url: string } | null
  discount: { discounted_price: number; value: number; type: string } | null
}

interface Product {
  id: number
  name: string
  description: string | null
  image_url: string | null
  specifications: Record<string, string> | null
  category: { id: number; name: string }
  brand: { name: string } | null
  offers: Offer[]
}

export default function ProductDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const id      = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked]     = useState(false)
  const [alertSet, setAlertSet] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        const p = res.data
        // Redirect to SEF URL if possible
        if (p.slug && p.category?.code) {
          router.replace(`/produits/${p.category.code}/${p.slug}`)
          return
        }
        setProduct(p)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="skeleton h-5 w-48 mb-6 rounded-lg" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-8 w-3/4 rounded-lg" />
            <div className="skeleton h-5 w-1/2 rounded-lg" />
            <div className="skeleton h-32 rounded-2xl mt-4" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl">😕</span>
        <h2 className="mt-4 text-xl font-bold text-gray-800">Produit introuvable</h2>
        <Link href="/products" className="mt-4 inline-block text-brand-600 hover:underline">← Retour</Link>
      </div>
    </div>
  )

  const availableOffers = product.offers.filter(o => o.is_available).sort((a, b) => a.price - b.price)
  const bestOffer = availableOffers[0]
  const bestPrice = bestOffer ? (bestOffer.discount?.discounted_price ?? bestOffer.price) : null
  const worstPrice = availableOffers.length > 1 ? availableOffers[availableOffers.length - 1].price : null
  const savings = bestPrice && worstPrice ? worstPrice - bestPrice : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-brand-600">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/products" className="hover:text-brand-600">Produits</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/products?category_id=${product.category.id}`} className="hover:text-brand-600">{product.category.name}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-800 font-medium truncate max-w-48">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Retour aux produits
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 flex items-center justify-center min-h-60">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="max-h-52 max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-300">
                  <Package className="w-16 h-16" /><span className="text-sm">Pas d&apos;image</span>
                </div>
              )}
            </div>
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-600" /> Caractéristiques
                </h3>
                <dl className="space-y-0">
                  {Object.entries(product.specifications).map(([k, v]) => (
                    <div key={k} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                      <dt className="w-24 shrink-0 text-xs font-semibold text-gray-500 capitalize leading-5">{k}</dt>
                      <dd className="text-sm text-gray-800 leading-5">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {product.brand && <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{product.brand.name}</span>}
                    <Link href={`/products?category_id=${product.category.id}`} className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 transition">
                      {product.category.name}
                    </Link>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
                  {product.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{product.description}</p>}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'text-yellow-400 fill-current' : 'text-gray-200 fill-current'}`} />)}</div>
                    <span className="text-sm text-gray-500">4.0 (24 avis)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => {
                    if (!isLoggedIn()) {
                      setShowLoginModal(true)
                      return
                    }
                    setLiked(v => !v)
                  }}
                    className={`p-2.5 rounded-xl border transition ${liked ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-400'}`}>
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                  </button>
                  <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
                  <button onClick={() => setAlertSet(v => !v)}
                    className={`p-2.5 rounded-xl border transition ${alertSet ? 'border-brand-200 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-400 hover:border-brand-200 hover:text-brand-600'}`}>
                    <Bell className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {bestPrice !== null && (
                <div className="mt-5 pt-5 border-t border-gray-100 flex items-end justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-xs text-gray-500 font-medium">Meilleur prix</span>
                    <div className="text-3xl font-extrabold text-brand-700 mt-0.5">
                      {bestPrice.toFixed(3)} <span className="text-lg font-semibold">TND</span>
                    </div>
                    {bestOffer?.merchant_website && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-gray-600">chez <span className="font-semibold">{bestOffer.merchant_website.name}</span></span>
                      </div>
                    )}
                  </div>
                  {savings !== null && savings > 0 && (
                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-center">
                      <div className="flex items-center gap-1 text-green-600 font-bold text-base">
                        <TrendingDown className="w-4 h-4" /> Économisez {savings.toFixed(3)} TND
                      </div>
                      <p className="text-xs text-green-500 mt-0.5">par rapport au prix le plus élevé</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {bestOffer && (
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
                <h3 className="font-semibold text-gray-800 mb-4">Historique des prix (7 derniers jours)</h3>
                <PriceHistoryChart offerId={bestOffer.id} />
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4">
                Comparer les offres <span className="text-sm font-normal text-gray-400">({availableOffers.length} marchands)</span>
              </h3>
              {availableOffers.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Aucune offre disponible.</p>
              ) : (
                <div className="space-y-3">
                  {availableOffers.map((offer, idx) => {
                    const displayPrice = offer.discount?.discounted_price ?? offer.price
                    const isBest = idx === 0
                    return (
                      <div key={offer.id}
                        className={`flex items-center justify-between gap-4 rounded-xl px-4 py-4 border transition ${isBest ? 'border-brand-200 bg-brand-50 price-best' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isBest ? 'bg-brand-100' : 'bg-white border border-gray-200'}`}>
                            <span className="text-sm font-bold text-brand-700">{offer.merchant_website?.name?.[0] ?? '?'}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-gray-800">{offer.merchant_website?.name ?? 'Marchand inconnu'}</span>
                              {isBest && <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Meilleur prix</span>}
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{offer.raw_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            {offer.discount && <p className="text-xs text-gray-400 line-through">{offer.price.toFixed(3)} TND</p>}
                            <p className={`text-xl font-extrabold ${isBest ? 'text-brand-700' : 'text-gray-700'}`}>
                              {displayPrice.toFixed(3)} <span className="text-sm font-semibold">TND</span>
                            </p>
                          </div>
                          <a href={offer.merchant_url} target="_blank" rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${isBest ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                            Voir <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
