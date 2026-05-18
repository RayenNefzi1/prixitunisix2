'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { ExternalLink, Copy, MousePointer, Eye, TrendingUp, Search } from 'lucide-react'

interface ProductLink {
  product_id: number
  product_name: string
  product_slug: string
  product_image: string | null
  merchant_website: string
  offer_count: number
  total_clicks: number
  total_views: number
  clicks_today: number
  views_today: number
  best_price: number | null
}

export default function FournisseurLinksPage() {
  const router = useRouter()
  const [links, setLinks] = useState<ProductLink[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copyFeedback, setCopyFeedback] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('fournisseur_token')
    if (!token) {
      router.push('/fournisseur/login')
      return
    }
    
    api.get('/fournisseur/affiliate-links')
      .then(res => {
        const data = res.data
        setLinks(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        if (err.response?.status === 401) {
          router.push('/fournisseur/login')
        }
        setLinks([])
      })
      .finally(() => setLoading(false))
  }, [router])

  const copyLink = (productId: number, url: string) => {
    navigator.clipboard.writeText(url)
    setCopyFeedback(productId)
    setTimeout(() => setCopyFeedback(null), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  const filteredLinks = Array.isArray(links) ? links.filter(l => 
    l.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.merchant_website || '').toLowerCase().includes(search.toLowerCase())
  ) : []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/fournisseur" className="text-sm text-gray-500 hover:text-brand-600 mb-1 inline-flex items-center gap-1">
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">Liens Affiliés</h1>
        <p className="text-gray-500">Suivez les performances de vos liens vers les produits</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <ExternalLink className="w-4 h-4" /> Total Liens
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{links.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <MousePointer className="w-4 h-4" /> Clics Total
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{links.reduce((s, l) => s + l.total_clicks, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Eye className="w-4 h-4" /> Vues Total
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{links.reduce((s, l) => s + l.total_views, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <TrendingUp className="w-4 h-4" /> Clics Aujourd'hui
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{links.reduce((s, l) => s + l.clicks_today, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
        />
      </div>

      {links.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ExternalLink className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun lien</h3>
          <p className="text-gray-500">Aucun lien affilié disponible pour le moment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Produit</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Boutique</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Prix</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Clics</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Vues</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Aujourd'hui</th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLinks.map(link => (
                <tr key={link.product_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        {link.product_image ? (
                          <img src={link.product_image} alt={link.product_name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <Link href={`/products/${link.product_slug}`} className="font-medium text-gray-900 hover:text-brand-600 truncate max-w-[200px]">
                        {link.product_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{link.merchant_website}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-brand-600">
                      {link.best_price ? `${link.best_price.toFixed(3)} TND` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MousePointer className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{link.total_clicks.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{link.total_views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      +{link.clicks_today}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => copyLink(link.product_id, `${window.location.origin}/products/${link.product_slug}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition"
                    >
                      {copyFeedback === link.product_id ? (
                        <>
                          <Copy className="w-4 h-4" />
                          Copié!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copier
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}