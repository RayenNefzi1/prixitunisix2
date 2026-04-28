'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { Tag } from 'lucide-react'

interface Marque {
  id: number; name: string; slug: string; logo_url: string | null; products_count: number
}

export default function MarquesPage() {
  const [marques, setMarques] = useState<Marque[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    api.get('/marques')
      .then(res => setMarques(res.data.marques))
      .finally(() => setLoading(false))
  }, [])

  const filtered = marques.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <Tag className="w-8 h-8 text-brand-600" />
          Marques
        </h1>
        <p className="mt-2 text-gray-500">Trouvez tous les produits par marque.</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher une marque…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">Aucune marque trouvée.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(m => (
            <Link
              key={m.id}
              href={`/marques/${m.slug}`}
              className="group flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-gray-100 bg-white hover:border-brand-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              {m.logo_url ? (
                <img src={m.logo_url} alt={m.name} className="h-10 object-contain mb-3" />
              ) : (
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-lg font-black text-brand-600">{m.name[0]}</span>
                </div>
              )}
              <span className="text-sm font-semibold text-gray-800 group-hover:text-brand-600 transition text-center leading-tight">{m.name}</span>
              <span className="text-xs text-gray-400 mt-1">{m.products_count} produit{m.products_count > 1 ? 's' : ''}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
