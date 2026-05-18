'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { isLoggedIn } from '@/lib/auth'
import PriceHistoryChart from '@/components/product/PriceHistoryChart'
import { Heart, Bell, ExternalLink, Tag, ArrowLeft, TrendingDown, CheckCircle, BellOff } from 'lucide-react'

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
  slug: string
  description: string | null
  image_url: string | null
  specifications: Record<string, string> | null
  category: { id: number; name: string; code?: string; slug?: string }
  brand: { name: string; slug?: string } | null
  offers: Offer[]
}

export default function ProductDetailPage() {
  const { categorySlug, productSlug } = useParams<{ categorySlug: string; productSlug: string }>()
  const [product, setProduct]     = useState<Product | null>(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [targetPrice, setTargetPrice] = useState('')
  const [creatingAlert, setCreatingAlert] = useState(false)
  const [alertCreated, setAlertCreated] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [togglingFavorite, setTogglingFavorite] = useState(false)
  const [productAlert, setProductAlert] = useState<{ id: number; target_price: number; reached: boolean } | null>(null)

  useEffect(() => {
    api.get(`/produits/${categorySlug}/${productSlug}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true)
        else console.error(err)
      })
      .finally(() => setLoading(false))
  }, [categorySlug, productSlug])

  // Track product view
  useEffect(() => {
    if (product && isLoggedIn()) {
      api.post('/client/track-view', { product_id: product.id })
        .catch(err => console.error('Failed to track view:', err))
    }
  }, [product])

  // Check if product is favorited
  useEffect(() => {
    if (product && isLoggedIn()) {
      api.get('/favorites')
        .then(res => {
          const favIds = res.data.map((f: { id: number }) => f.id)
          setIsFavorited(favIds.includes(product.id))
        })
        .catch(() => {})
    }
  }, [product])

  // Check if product has alert
  useEffect(() => {
    if (product && isLoggedIn()) {
      api.get('/client/alerts')
        .then(res => {
          const alert = res.data.find((a: { product: { id: number } }) => a.product?.id === product.id)
          if (alert) {
            setProductAlert({ id: alert.id, target_price: alert.target_price, reached: alert.reached })
          }
        })
        .catch(() => {})
    }
  }, [product])

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!isLoggedIn()) return
    setTogglingFavorite(true)
    try {
      const res = await api.post('/favorites/toggle', { product_id: product.id })
      setIsFavorited(res.data.status === 'added')
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    } finally {
      setTogglingFavorite(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="skeleton h-5 w-48 mb-6 rounded-lg" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="lg:col-span-2 space-y-4">
            <div className="skeleton h-8 w-3/4 rounded-lg" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-gray-500 mb-4">Produit introuvable.</p>
        <Link href="/products" className="text-brand-600 hover:underline">← Retour aux produits</Link>
      </div>
    )
  }

  const availableOffers = product.offers.filter(o => o.is_available).sort((a, b) => a.price - b.price)
  const bestOffer       = availableOffers[0]
  const bestPrice       = bestOffer?.price

  const createAlert = async () => {
    if (!targetPrice || !bestPrice) return
    setCreatingAlert(true)
    try {
      const res = await api.post('/client/alerts', {
        product_id: product.id,
        target_price: parseFloat(targetPrice),
      })
      setAlertCreated(true)
      setProductAlert({ id: res.data.id, target_price: parseFloat(targetPrice), reached: false })
      // Trigger storage event for real-time updates
      localStorage.setItem('alerts_updated', Date.now().toString())
      localStorage.removeItem('alerts_updated')
      setTimeout(() => {
        setAlertCreated(false)
        setShowAlertForm(false)
        setTargetPrice('')
      }, 2000)
    } catch (err) {
      console.error('Failed to create alert:', err)
    } finally {
      setCreatingAlert(false)
    }
  }

  const catSlug  = product.category?.code ?? categorySlug
  const catName  = product.category?.name

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-brand-600">Accueil</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-brand-600">Produits</Link>
        {catName && (
          <>
            <span>/</span>
            <Link href={`/products?category_id=${product.category.id}`} className="hover:text-brand-600">{catName}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Image */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center p-6">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="max-h-64 object-contain" />
            ) : (
              <div className="text-gray-200 text-6xl font-black">?</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div>
          {product.brand && (
            <Link href={`/marques/${product.brand.slug ?? product.brand.name.toLowerCase()}`}
              className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-1 rounded-full hover:bg-brand-100 transition mb-3">
              <Tag className="w-3 h-3" />{product.brand.name}
            </Link>
          )}
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2">{product.name}</h1>

          {bestPrice && (
            <div className="flex items-end gap-2 mb-4">
              <span className="text-3xl font-black text-brand-600">{bestPrice.toFixed(2)} TND</span>
              {availableOffers.length > 1 && (
                <span className="text-sm text-gray-400 mb-1">
                  sur {availableOffers.length} offres
                </span>
              )}
{/* Favorite Button */}
              <button
                onClick={toggleFavorite}
                disabled={togglingFavorite}
                className={`p-2 rounded-full transition ${isFavorited ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
                title="Ajouter aux favoris"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
              {/* Price Alert Button - show status */}
              <button
                onClick={() => setShowAlertForm(!showAlertForm)}
                className={`p-2 rounded-full transition ${
                  alertCreated 
                    ? 'bg-green-100 text-green-600' 
                    : productAlert?.reached 
                      ? 'bg-green-100 text-green-600' 
                      : productAlert 
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-500 hover:text-brand-600 hover:bg-brand-50'
                }`}
                title={productAlert ? `Alerte: ${productAlert.target_price.toFixed(3)} TND` : 'Créer une alerte prix'}
              >
                {alertCreated ? <CheckCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </button>
            </div>
          )}

          {/* Alert Form */}
          {showAlertForm && bestPrice && (
            <div className="mb-4 p-4 bg-brand-50 border border-brand-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-600" />
                  <span className="text-sm font-semibold text-brand-800">
                    {productAlert ? 'Alerte active' : 'Créer une alerte prix'}
                  </span>
                </div>
                {productAlert && (
                  <span className={`text-xs px-2 py-1 rounded-full ${productAlert.reached ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {productAlert.reached ? '✓ Prix atteint!' : `Objectif: ${productAlert.target_price.toFixed(3)} TND`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder={`Prix cible (actuel: ${bestPrice.toFixed(3)})`}
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                />
                <button
                  onClick={createAlert}
                  disabled={creatingAlert || !targetPrice}
                  className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
                >
                  {creatingAlert ? '...' : productAlert ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
              <p className="text-xs text-brand-700 mt-2">
                Vous serez notifié quand le prix atteint ou dépasse votre cible.
              </p>
            </div>
          )}

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>
          )}

          {/* Offers */}
          <div className="space-y-3 mb-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Offres disponibles</h2>
            {availableOffers.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune offre disponible actuellement.</p>
            ) : (
              availableOffers.map((offer, idx) => (
                <div key={offer.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition ${
                    idx === 0 ? 'border-brand-200 bg-brand-50' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}>
                  {offer.merchant_website?.logo_url ? (
                    <img src={offer.merchant_website.logo_url} alt={offer.merchant_website.name} className="h-8 w-16 object-contain" />
                  ) : (
                    <div className="w-16 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-500">
                      {offer.merchant_website?.name?.[0] ?? '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{offer.merchant_website?.name ?? 'Marchand'}</p>
                    {idx === 0 && <span className="text-xs text-brand-600 font-semibold flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Meilleur prix</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900">{offer.price.toFixed(2)} TND</p>
                    <a href={offer.merchant_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                      Acheter <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Price history */}
          {bestOffer && (
            <div className="mt-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Historique des prix</h2>
              <PriceHistoryChart offerId={bestOffer.id} />
            </div>
          )}

          {/* Specs */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Caractéristiques</h2>
              <div className="rounded-xl overflow-hidden border border-gray-100">
                {Object.entries(product.specifications).map(([k, v], idx) => (
                  <div key={k} className={`flex text-sm px-4 py-2.5 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <span className="font-medium text-gray-500 w-40 flex-shrink-0">{k}</span>
                    <span className="text-gray-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
