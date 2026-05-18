'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search } from 'lucide-react'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'

// ── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: number; name: string; slug: string; code?: string; children?: Category[]
}
interface Brand { id: number; name: string }
interface SpecFilter { key: string; label: string; values: string[] }
interface Product {
  id: number; name: string; slug: string; image_url: string | null
  min_price?: number | null
  category: { id: number; name: string } | null
  brand: { id: number; name: string } | null
  offers?: Array<{ price: number; is_available: boolean; merchant_website?: { name: string } | null }>
}
interface PaginatedProducts {
  data: Product[]; current_page: number; last_page: number; total: number
}

// ── Collapsible section ────────────────────────────────────────────────────

function FilterSection({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700"
      >
        {title}
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  )
}

function RadioBtn({ label, active, onClick, indent = false }: {
  label: string; active: boolean; onClick: () => void; indent?: boolean
}) {
  return (
    <button onClick={onClick}
      className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition ${indent ? 'pl-5' : ''} ${
        active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}

function CheckBtn({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 text-left text-sm px-3 py-1.5 rounded-lg transition ${
        checked ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition ${
        checked ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────

function ProductsInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const q          = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('category_id') ?? ''
  const brandId    = searchParams.get('brand_id') ?? ''

  // specs[ram]=8+Go  →  { ram: '8 Go' }
  const activeSpecs: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    const m = key.match(/^specs\[([a-z_]+)\]$/)
    if (m) activeSpecs[m[1]] = value
  })

  const [result, setResult]               = useState<PaginatedProducts | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [brands, setBrands]               = useState<Brand[]>([])
  const [specFilters, setSpecFilters]     = useState<SpecFilter[]>([])
  const [loading, setLoading]             = useState(true)
  const [showFilters, setShowFilters]     = useState(false)
  const [page, setPage]                   = useState(1)
  const [minPrice, setMinPrice]           = useState('')
  const [maxPrice, setMaxPrice]           = useState('')

  // Load categories + brands once
  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')]).then(([c, b]) => {
      setAllCategories(c.data)
      setBrands(b.data)
    })
  }, [])

  // Load spec filters whenever category changes
  useEffect(() => {
    if (!categoryId) { setSpecFilters([]); return }
    api.get(`/search/filters?category_id=${categoryId}`)
      .then(res => setSpecFilters(res.data))
      .catch(() => setSpecFilters([]))
  }, [categoryId])

  // Fetch products via search/results (supports spec filters)
  const fetchProducts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (categoryId) params.set('category_id', categoryId)
    if (brandId) params.set('brand_id', brandId)
    if (minPrice) params.set('min_price', minPrice)
    if (maxPrice) params.set('max_price', maxPrice)
    Object.entries(activeSpecs).forEach(([k, v]) => params.set(`specs[${k}]`, v))
    params.set('page', String(page))

    api.get(`/search/results?${params}`)
      .then(res => setResult(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [q, categoryId, brandId, page, minPrice, maxPrice, JSON.stringify(activeSpecs)])

  useEffect(() => { setPage(1) }, [q, categoryId, brandId, JSON.stringify(activeSpecs)])
  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── URL helpers ──────────────────────────────────────────────────────────

  const setFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page')
    router.push(`/products?${p}`)
  }

  const setSpecFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    const pk = `specs[${key}]`
    if (activeSpecs[key] === value) p.delete(pk); else p.set(pk, value)
    p.delete('page')
    router.push(`/products?${p}`)
  }

  const clearFilters = () => {
    setMinPrice(''); setMaxPrice('')
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  const hasFilters = categoryId || brandId || Object.keys(activeSpecs).length > 0 || minPrice || maxPrice

  // ── Resolve labels ───────────────────────────────────────────────────────

  const activeCatId = categoryId ? Number(categoryId) : null
  let activeRoot: Category | null = null
  let activeSub: Category | null = null
  for (const root of allCategories) {
    if (root.id === activeCatId) { activeRoot = root; break }
    const sub = (root.children ?? []).find(c => c.id === activeCatId)
    if (sub) { activeRoot = root; activeSub = sub; break }
  }
  const activeCategory = activeSub ?? activeRoot
  const activeBrand    = brands.find(b => String(b.id) === brandId)

  // Sidebar subcategories: children of active root
  const sidebarSubs = activeRoot
    ? [...(activeRoot.children ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    : []

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {q ? `Résultats pour "${q}"` : activeCategory ? activeCategory.name : 'Tous les produits'}
              </h1>
              {result && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {result.total.toLocaleString('fr-FR')} produit{result.total !== 1 ? 's' : ''}
                  {activeRoot && activeSub && <span className="text-gray-400"> · {activeRoot.name}</span>}
                  {Object.entries(activeSpecs).map(([k, v]) => {
                    const lbl = specFilters.find(f => f.key === k)?.label ?? k
                    return <span key={k} className="text-gray-400"> · {lbl}: {v}</span>
                  })}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres
              {hasFilters && <span className="w-2 h-2 rounded-full bg-brand-600" />}
            </button>
          </div>

          {/* Active chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-500">Filtres actifs :</span>
              {activeCategory && (
                <Chip label={activeCategory.name} onRemove={() => setFilter('category_id', '')} />
              )}
              {activeBrand && (
                <Chip label={activeBrand.name} onRemove={() => setFilter('brand_id', '')} />
              )}
              {Object.entries(activeSpecs).map(([k, v]) => {
                const lbl = specFilters.find(f => f.key === k)?.label ?? k
                return <Chip key={k} label={`${lbl}: ${v}`} onRemove={() => setSpecFilter(k, v)} />
              })}
              {(minPrice || maxPrice) && (
                <Chip
                  label={`Prix: ${minPrice || '0'} – ${maxPrice || '∞'} TND`}
                  onRemove={() => { setMinPrice(''); setMaxPrice('') }}
                />
              )}
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Tout effacer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 flex gap-6">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-56 flex-shrink-0`}>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-5 sticky top-40 max-h-[calc(100vh-140px)] overflow-y-auto z-35">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" />
                Filtrer par
              </h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-brand-600 hover:underline">
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Search box */}
            <div className="mb-4">
              <form onSubmit={e => {
                e.preventDefault()
                const v = (e.currentTarget.querySelector('input') as HTMLInputElement).value
                setFilter('q', v)
              }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    defaultValue={q}
                    placeholder="Rechercher..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 bg-gray-50"
                  />
                </div>
              </form>
            </div>

            {/* Price range */}
            <FilterSection title="Prix (TND)">
              <div className="flex items-center gap-2">
                <input type="number" min="0" placeholder="Min" value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input type="number" min="0" placeholder="Max" value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </FilterSection>

            {/* Category */}
            <FilterSection title="Catégorie">
              <div className="space-y-0.5">
                <RadioBtn label="Toutes" active={!categoryId} onClick={() => setFilter('category_id', '')} />
                {sidebarSubs.length > 0
                  ? sidebarSubs.map(sub => (
                      <RadioBtn
                        key={sub.id} label={sub.name}
                        active={categoryId === String(sub.id)}
                        onClick={() => setFilter('category_id', String(sub.id))}
                      />
                    ))
                  : allCategories.map(root => (
                      <RadioBtn
                        key={root.id} label={root.name}
                        active={categoryId === String(root.id)}
                        onClick={() => setFilter('category_id', String(root.id))}
                      />
                    ))
                }
              </div>
            </FilterSection>

            {/* Brand */}
            {brands.length > 0 && (
              <FilterSection title="Marque">
                <div className="space-y-0.5 max-h-44 overflow-y-auto">
                  <RadioBtn label="Toutes" active={!brandId} onClick={() => setFilter('brand_id', '')} />
                  {brands.map(brand => (
                    <RadioBtn
                      key={brand.id} label={brand.name}
                      active={brandId === String(brand.id)}
                      onClick={() => setFilter('brand_id', String(brand.id))}
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Dynamic spec filters — appear when a category is selected */}
            {specFilters.map(filter => (
              <FilterSection key={filter.key} title={filter.label} defaultOpen={filter.values.length <= 8}>
                <div className="space-y-0.5 max-h-52 overflow-y-auto">
                  {filter.values.map(value => (
                    <CheckBtn
                      key={value} label={value}
                      checked={activeSpecs[filter.key] === value}
                      onClick={() => setSpecFilter(filter.key, value)}
                    />
                  ))}
                </div>
              </FilterSection>
            ))}
          </div>
        </aside>

        {/* ── Product grid ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
                  <div className="skeleton h-44 w-full" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-3 w-16" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-6 w-24 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !result || result.data.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl">🔍</span>
              <h3 className="mt-4 text-lg font-semibold text-gray-800">Aucun produit trouvé</h3>
              <p className="text-gray-500 mt-2">
                {hasFilters
                  ? 'Essayez de supprimer certains filtres.'
                  : 'Essayez un autre terme ou supprimez les filtres.'}
              </p>
              <button
                onClick={clearFilters}
                className="mt-5 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition"
              >
                Voir tous les produits
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {result.data.map(product => <ProductCard key={product.id} product={product} />)}
              </div>
              {result.last_page > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-10 flex-wrap">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition">
                    ← Précédent
                  </button>
                  {(() => {
                    const last = result.last_page
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
                        ? <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                        : <button key={p} onClick={() => setPage(p as number)}
                            className={`w-9 h-9 text-sm font-medium rounded-xl transition ${
                              page === p ? 'bg-brand-600 text-white' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}>
                            {p}
                          </button>
                    )
                  })()}
                  <button disabled={page === result.last_page} onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition">
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove}><X className="w-3 h-3" /></button>
    </span>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="skeleton w-32 h-8 rounded-xl" />
      </div>
    }>
      <ProductsInner />
    </Suspense>
  )
}
