'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import { Search, TrendingDown, ShieldCheck, Bell, ChevronRight, Zap, Globe } from 'lucide-react'

interface Product {
  id: number
  name: string
  slug: string
  image_url: string | null
  category: { name: string }
  brand: { name: string } | null
  offers?: Array<{ price: number; is_available: boolean; merchant_website?: { name: string } | null }>
}


const FEATURES = [
  { icon: <TrendingDown className="w-6 h-6 text-brand-600" />, title: 'Meilleurs prix garantis', desc: 'Comparez instantanément des milliers d\'offres sur les boutiques tunisiennes.' },
  { icon: <Bell className="w-6 h-6 text-brand-600" />, title: 'Alertes prix', desc: 'Soyez notifié dès que le prix baisse sur vos produits favoris.' },
  { icon: <ShieldCheck className="w-6 h-6 text-brand-600" />, title: 'Marchands vérifiés', desc: 'Achetez en toute confiance avec nos marchands partenaires certifiés.' },
  { icon: <Zap className="w-6 h-6 text-brand-600" />, title: 'Temps réel', desc: 'Prix mis à jour en continu pour vous offrir les données les plus fraîches.' },
]

export default function HomePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/products')
      .then(res => setProducts(res.data.data ?? res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-blue-500 text-white pt-14 pb-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-sm mb-6">
            <Globe className="w-4 h-4" />
            <span>Le comparateur de prix n°1 en Tunisie</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Comparez les prix,<br />
            <span className="text-yellow-300">économisez vraiment.</span>
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            Trouvez les meilleures offres sur MyTek, Tunisianet, SFax Computer et plus — en un seul clic.
          </p>

          {/* Big search */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-2xl shadow-2xl overflow-hidden">
              <Search className="absolute left-5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ex: HP Laptop 15, Samsung Galaxy, RTX 4080..."
                className="flex-1 pl-12 pr-4 py-4 text-gray-800 text-base focus:outline-none placeholder-gray-400"
              />
              <button type="submit" className="m-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl transition text-sm">
                Comparer
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
              <span className="text-xs text-blue-200">Tendances:</span>
              {['HP Laptop', 'Samsung Galaxy', 'Réfrigérateur', 'Machine à laver', 'TV Samsung'].map(s => (
                <button key={s} type="button" onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                  className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-full transition">
                  {s}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-3 divide-x divide-gray-100 py-5">
            {[
              { value: `${products.length}+`, label: 'Produits comparés' },
              { value: '3+', label: 'Marchands partenaires' },
              { value: '100%', label: 'Gratuit' },
            ].map(stat => (
              <div key={stat.label} className="text-center px-6">
                <div className="text-2xl font-extrabold text-brand-700">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Products ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">🔥 Offres du moment</h2>
            <p className="text-sm text-gray-500 mt-0.5">Produits avec les meilleures comparaisons de prix</p>
          </div>
          <Link href="/products" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
            Voir tout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                <div className="skeleton h-44 w-full" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-6 w-24 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl">📦</span>
            <p className="mt-3 font-medium">Aucun produit pour l&apos;instant</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.slice(0, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Pourquoi PrixTunisix ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="flex flex-col items-start gap-3 p-5 rounded-2xl bg-gray-50 hover:bg-brand-50 transition">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">{f.icon}</div>
                <h3 className="font-semibold text-gray-800">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="bg-gradient-to-r from-brand-700 to-brand-500 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div>
            <h2 className="text-2xl font-extrabold mb-2">Ne ratez plus jamais une bonne affaire</h2>
            <p className="text-blue-100">Créez un compte gratuit et activez les alertes prix sur vos produits favoris.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/register" className="bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition shadow">
              Créer un compte
            </Link>
            <Link href="/products" className="border border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition">
              Explorer
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
