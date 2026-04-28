'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import { Tag } from 'lucide-react'

interface Marque { id: number; name: string; slug: string; logo_url: string | null }
interface Product {
  id: number; name: string; slug: string; image_url: string | null
  best_price?: number | null
  category: { id: number; name: string } | null
  brand: { id: number; name: string } | null
  offers?: Array<{ price: number; is_available: boolean }>
}
interface Paginated {
  marque: Marque; products: Product[]
  current_page: number; last_page: number; total: number; per_page: number
}

export default function MarqueDetailPage() {
  const { slug }     = useParams<{ slug: string }>()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const page         = parseInt(searchParams.get('page') ?? '1')
  const sort         = searchParams.get('sort') ?? 'price_asc'

  const [data, setData]       = useState<Paginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/marques/${slug}`, { params: { page, sort, per_page: 24 } })
      .then(res => setData(res.data))
      .catch(() => setError('Marque introuvable.'))
      .finally(() => setLoading(false))
  }, [slug, page, sort])

  useEffect(() => { load() }, [load])

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key !== 'page') params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <Link href="/marques" className="text-brand-600 hover:underline">← Retour aux marques</Link>
      </div>
    )
  }

  const marque   = data?.marque
  const products = data?.products ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-brand-600">Accueil</Link>
        <span>/</span>
        <Link href="/marques" className="hover:text-brand-600">Marques</Link>
        {marque && <><span>/</span><span className="text-gray-800 font-medium">{marque.name}</span></>}
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-brand-50 to-white rounded-2xl border border-brand-100">
        {marque?.logo_url ? (
          <img src={marque.logo_url} alt={marque.name} className="h-14 object-contain" />
        ) : (
          <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center">
            <Tag className="w-7 h-7 text-brand-600" />
          </div>
        )}
        <div>
          {loading && !marque ? (
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-gray-900">{marque?.name ?? slug}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {data ? `${data.total.toLocaleString()} produit${data.total > 1 ? 's' : ''}` : ''}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{data ? `${data.total.toLocaleString()} résultats` : ''}</p>
        <select
          value={sort}
          onChange={e => setParam('sort', e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
        >
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="name_asc">Nom A→Z</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Aucun produit pour cette marque.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {(() => {
            const last = data.last_page
            const pages: (number | '...')[] = []
            if (last <= 9) {
              for (let i = 1; i <= last; i++) pages.push(i)
            } else {
              pages.push(1)
              if (page > 4) pages.push('...')
              for (let i = Math.max(2, page - 2); i <= Math.min(last - 1, page + 2); i++) pages.push(i)
              if (page < last - 3) pages.push('...')
              pages.push(last)
            }
            return pages.map((p, i) =>
              p === '...'
                ? <span key={`e${i}`} className="px-3 py-2 text-gray-400">…</span>
                : <button key={p} onClick={() => setParam('page', String(p))}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      p === page ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-brand-50'
                    }`}>{p}</button>
            )
          })()}
        </div>
      )}
    </div>
  )
}
