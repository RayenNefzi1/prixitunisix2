'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import PriceHistoryChart from '@/components/product/PriceHistoryChart'
import { Heart, Bell, ExternalLink, Tag, ArrowLeft, TrendingDown, CheckCircle } from 'lucide-react'

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

  useEffect(() => {
    api.get(`/produits/${categorySlug}/${productSlug}`)
      .then(res => setProduct(res.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true)
        else console.error(err)
      })
      .finally(() => setLoading(false))
  }, [categorySlug, productSlug])

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
