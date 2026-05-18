'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SlidersHorizontal, X, ArrowUpDown, Search, ChevronDown, ChevronUp } from 'lucide-react'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'

// ── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: number
  name: string
  slug: string
  children?: Category[]
}
interface Brand { id: number; name: string }
interface SpecFilter { key: string; label: string; values: string[] }
interface Product {
  id: number; name: string; slug: string; image_url: string | null
  min_price: number | null
  category: { id: number; name: string } | null
  brand: { id: number; name: string } | null
  offers?: Array<{ price: number; is_available: boolean; merchant_website?: { name: string } | null }>
}
interface PaginatedResults {
  data: Product[]; current_page: number; last_page: number; total: number
}
type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc'
const SORT_LABELS: Record<SortOption, string> = {
  relevance: 'Pertinence', price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant', name_asc: 'Nom A → Z',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function sortProducts(products: Product[], sort: SortOption): Product[] {
  const copy = [...products]
  if (sort === 'price_asc')  return copy.sort((a, b) => (a.min_price ?? Infinity) - (b.min_price ?? Infinity))
  if (sort === 'price_desc') return copy.sort((a, b) => (b.min_price ?? -Infinity) - (a.min_price ?? -Infinity))
  if (sort === 'name_asc')   return copy.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  return copy
}

// ── Collapsible filter section ─────────────────────────────────────────────

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

// ── Main component (Suspense boundary for useSearchParams) ─────────────────

function SearchResultsInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const q          = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('category_id') ?? ''
  const brandId    = searchParams.get('brand_id') ?? ''

  // Parse specs from URL: specs[ram]=16+Go  →  { ram: '16 Go' }
  const activeSpecs: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    const m = key.match(/^specs\[([a-z_]+)\]$/)
    if (m) activeSpecs[m[1]] = value
  })

  const [result, setResult]           = useState<PaginatedResults | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [brands, setBrands]           = useState<Brand[]>([])
  const [specFilters, setSpecFilters] = useState<SpecFilter[]>([])
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)
  const [sort, setSort]               = useState<SortOption>('relevance')
  const [showFilters, setShowFilters] = useState(false)
  const [sortOpen, setSortOpen]       = useState(false)
  const [minPrice, setMinPrice]       = useState('')
  const [maxPrice, setMaxPrice]       = useState('')

  // Load categories + brands once
  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')]).then(([c, b]) => {
      setAllCategories(c.data)
      setBrands(b.data)
    })
  }, [])

  // Load spec filters when category changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (categoryId) params.set('category_id', categoryId)
    api.get(`/search/filters?${params}`)
      .then(res => setSpecFilters(res.data))
      .catch(() => setSpecFilters([]))
  }, [categoryId])

  // Fetch results
  const fetchResults = useCallback(() => {
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
  useEffect(() => { fetchResults() }, [fetchResults])

  // Close sort dropdown on outside click
  useEffect(() => {
    const h = () => setSortOpen(false)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  // ── URL helpers ──────────────────────────────────────────────────────────

  const setFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page')
    router.push(`/search?${p}`)
  }

  const setSpecFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    const paramKey = `specs[${key}]`
    if (activeSpecs[key] === value) {
      p.delete(paramKey) // toggle off
    } else {
      p.set(paramKey, value)
    }
    p.delete('page')
    router.push(`/search?${p}`)
  }

  const clearFilters = () => {
    setMinPrice('')
    setMaxPrice('')
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  const hasFilters = categoryId || brandId || Object.keys(activeSpecs).length > 0 || minPrice || maxPrice

  // ── Resolve labels ───────────────────────────────────────────────────────

  let activeCatName: string | null = null
  for (const root of allCategories) {
    if (String(root.id) === categoryId) { activeCatName = root.name; break }
    const sub = (root.children ?? []).find(c => String(c.id) === categoryId)
    if (sub) { activeCatName = sub.name; break }
  }
  const activeBrandName = brands.find(b => String(b.id) === brandId)?.name ?? null

  const flatCategories = allCategories.flatMap(root => [
    { id: root.id, name: root.name, isRoot: true },
    ...(root.children ?? []).map(sub => ({ id: sub.id, name: sub.name, isRoot: false })),
  ])

  const displayProducts = result ? sortProducts(result.data, sort) : []

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-brand-500" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {q
                    ? <><span className="text-gray-500 font-normal text-lg">Résultats pour </span>&ldquo;{q}&rdquo;</>
                    : 'Tous les produits'}
                </h1>
              </div>
              {result && (
                <p className="text-sm text-gray-500 mt-0.5 pl-7">
                  {result.total.toLocaleString('fr-FR')} produit{result.total !== 1 ? 's' : ''}
                  {activeCatName && <span className="text-gray-400"> · {activeCatName}</span>}
                  {activeBrandName && <span className="text-gray-400"> · {activeBrandName}</span>}
                  {Object.entries(activeSpecs).map(([k, v]) => {
                    const label = specFilters.find(f => f.key === k)?.label ?? k
                    return (
                      <span key={k} className="text-gray-400"> · {label}: {v}</span>
                    )
                  })}
                </p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Sort */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setSortOpen(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition bg-white"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {SORT_LABELS[sort]}
                </button>
                {sortOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 py-1.5 z-40">
                    {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
                      <button
                        key={opt}
                        onClick={() => { setSort(opt); setSortOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition ${
                          sort === opt ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {SORT_LABELS[opt]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition bg-white md:hidden"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {hasFilters && <span className="w-2 h-2 rounded-full bg-brand-600" />}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-gray-500">Filtres actifs :</span>
              {activeCatName && (
                <Chip label={activeCatName} onRemove={() => setFilter('category_id', '')} />
              )}
              {activeBrandName && (
                <Chip label={activeBrandName} onRemove={() => setFilter('brand_id', '')} />
              )}
              {Object.entries(activeSpecs).map(([k, v]) => {
                const label = specFilters.find(f => f.key === k)?.label ?? k
                return (
                  <Chip key={k} label={`${label}: ${v}`} onRemove={() => setSpecFilter(k, v)} />
                )
              })}
              {(minPrice || maxPrice) && (
                <Chip
                  label={`Prix: ${minPrice || '0'} – ${maxPrice || '∞'} TND`}
                  onRemove={() => { setMinPrice(''); setMaxPrice('') }}
                />
              )}
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 underline ml-1">
                Tout effacer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
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

            {/* Price range */}
            <FilterSection title="Prix (TND)">
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-gray-400 text-xs">–</span>
                <input
                  type="number" min="0" placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </FilterSection>

            {/* Category */}
            <FilterSection title="Catégorie">
              <div className="space-y-0.5">
                <RadioBtn
                  label="Toutes"
                  active={!categoryId}
                  onClick={() => setFilter('category_id', '')}
                />
                {flatCategories.map(cat => (
                  <RadioBtn
                    key={cat.id}
                    label={cat.name}
                    active={categoryId === String(cat.id)}
                    onClick={() => setFilter('category_id', String(cat.id))}
                    indent={!cat.isRoot}
                  />
                ))}
              </div>
            </FilterSection>

            {/* Brand */}
            {brands.length > 0 && (
              <FilterSection title="Marque">
                <div className="space-y-0.5 max-h-44 overflow-y-auto">
                  <RadioBtn
                    label="Toutes"
                    active={!brandId}
                    onClick={() => setFilter('brand_id', '')}
                  />
                  {brands.map(brand => (
                    <RadioBtn
                      key={brand.id}
                      label={brand.name}
                      active={brandId === String(brand.id)}
                      onClick={() => setFilter('brand_id', String(brand.id))}
                    />
                  ))}
                </div>
              </FilterSection>
            )}

            {/* Dynamic spec filters */}
            {specFilters.map(filter => (
              <FilterSection key={filter.key} title={filter.label} defaultOpen={filter.values.length <= 8}>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {filter.values.map(value => (
                    <CheckBtn
                      key={value}
                      label={value}
                      checked={activeSpecs[filter.key] === value}
                      onClick={() => setSpecFilter(filter.key, value)}
                    />
                  ))}
                </div>
              </FilterSection>
            ))}
          </div>
        </aside>

        {/* ── Results ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(12)].map((_, i) => (
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
          ) : !result || result.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Search className="w-9 h-9 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {q ? `Aucun résultat pour « ${q} »` : 'Aucun produit trouvé'}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mb-5">
                {hasFilters
                  ? 'Essayez de supprimer certains filtres pour voir plus de résultats.'
                  : 'Vérifiez l\'orthographe ou essayez des mots-clés plus généraux.'}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition"
                >
                  Supprimer les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {result.last_page > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
                  >
                    ← Précédent
                  </button>
                  {buildPages(result.last_page, page).map((item, i) =>
                    item === '...' ? (
                      <span key={`d${i}`} className="px-2 text-gray-400">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={`w-9 h-9 text-sm font-medium rounded-xl transition ${
                          page === item
                            ? 'bg-brand-600 text-white'
                            : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    disabled={page === result.last_page}
                    onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition"
                  >
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

// ── Small reusable UI atoms ────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove}><X className="w-3 h-3" /></button>
    </span>
  )
}

function RadioBtn({ label, active, onClick, indent = false }: {
  label: string; active: boolean; onClick: () => void; indent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition ${indent ? 'pl-5' : ''} ${
        active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}

function CheckBtn({ label, checked, onClick }: {
  label: string; checked: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 text-left text-sm px-3 py-1.5 rounded-lg transition ${
        checked ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className={`w-4 h-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition ${
        checked ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}

function buildPages(total: number, current: number): (number | '...')[] {
  const delta = 2
  const range: (number | '...')[] = []
  const left  = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)
  range.push(1)
  if (left > 2) range.push('...')
  for (let i = left; i <= right; i++) range.push(i)
  if (right < total - 1) range.push('...')
  if (total > 1) range.push(total)
  return range
}

// ── Page export ────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="skeleton w-48 h-8 rounded-xl" />
      </div>
    }>
      <SearchResultsInner />
    </Suspense>
  )
}
