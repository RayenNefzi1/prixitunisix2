'use client'

import { useEffect, useState } from 'react'
import { Package, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import adminApi from '@/lib/admin-api'

interface Product {
  id: number
  name: string
  slug: string
  image_url: string | null
  category: { name: string } | null
  brand: { name: string } | null
  is_validated: boolean
  created_at: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString() })
    if (search) params.append('search', search)

    adminApi.get(`/products?${params}`)
      .then(res => res.data)
      .then(data => {
        setProducts(data.data || [])
        setTotalPages(data.last_page || 1)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [page, search])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
        <p className="text-gray-500">Gérer les produits de la plateforme</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Produit</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Catégorie</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Marque</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Statut</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse" /></td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Aucun produit trouvé</td>
              </tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{p.category?.name || '-'}</td>
                <td className="px-6 py-4 text-gray-600">{p.brand?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.is_validated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.is_validated ? 'Validé' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(p.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}