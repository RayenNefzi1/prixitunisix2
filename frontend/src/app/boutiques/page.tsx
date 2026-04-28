'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Store, ExternalLink } from 'lucide-react'

interface Boutique {
  id: number
  name: string
  slug: string
  url: string
  logo_url: string | null
  offers_count: number
}

const MERCHANT_COLORS: Record<string, string> = {
  tunisianet:   'from-blue-50 to-blue-100 border-blue-200',
  tunisiatech:  'from-orange-50 to-orange-100 border-orange-200',
  mytek:        'from-red-50 to-red-100 border-red-200',
  default:      'from-gray-50 to-gray-100 border-gray-200',
}

function getMerchantColor(slug: string): string {
  const key = Object.keys(MERCHANT_COLORS).find(k => slug.toLowerCase().includes(k))
  return MERCHANT_COLORS[key ?? 'default']
}

export default function BoutiquesPage() {
  const [boutiques, setBoutiques] = useState<Boutique[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/boutiques')
      .then(res => setBoutiques(res.data.boutiques))
      .catch(() => setError('Impossible de charger les boutiques.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <Store className="w-8 h-8 text-brand-600" />
          Boutiques
        </h1>
        <p className="mt-2 text-gray-500">Explorez les produits par marchand et comparez les prix.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-gray-500">{error}</div>
      )}

      {!loading && !error && boutiques.length === 0 && (
        <div className="text-center py-16 text-gray-400">Aucune boutique disponible.</div>
      )}

      {!loading && !error && boutiques.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {boutiques.map(b => (
            <Link
              key={b.id}
              href={`/boutiques/${b.slug}`}
              className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 bg-gradient-to-br ${getMerchantColor(b.slug)} hover:shadow-lg transition-all duration-200 hover:-translate-y-1`}
            >
              {b.logo_url ? (
                <img src={b.logo_url} alt={b.name} className="h-14 object-contain mb-4" />
              ) : (
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                  <span className="text-2xl font-black text-brand-600">{b.name[0]}</span>
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-800 group-hover:text-brand-600 transition">{b.name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {b.offers_count.toLocaleString()} produit{b.offers_count > 1 ? 's' : ''}
              </p>
              {b.url && (
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-brand-500 transition"
                  onClick={e => e.stopPropagation()}
                >
                  Visiter le site <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">Voir les produits →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
