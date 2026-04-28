'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Tag } from 'lucide-react'
import api from '@/lib/api'

interface Suggestion {
  type: 'product' | 'brand'
  id: number
  name: string
  slug: string
  image_url: string | null
  category: string | null
  min_price: number | null
}

interface Props {
  className?: string
}

export default function SearchBar({ className = '' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch suggestions with 250 ms debounce
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      api.get(`/search/suggestions?q=${encodeURIComponent(q.trim())}`)
        .then(res => {
          setSuggestions(res.data)
          setOpen(res.data.length > 0)
          setActiveIdx(-1)
        })
        .catch(() => {})
    }, 250)
  }, [])

  useEffect(() => {
    fetchSuggestions(query)
  }, [query, fetchSuggestions])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const navigate = (q: string) => {
    setOpen(false)
    setQuery(q)
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        const s = suggestions[activeIdx]
        setOpen(false)
        setQuery(s.name)
        router.push(s.type === 'brand' ? `/marques/${s.slug}` : `/products/${s.slug}`)
      } else {
        navigate(query)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) navigate(query)
  }

  return (
    <div ref={containerRef} className={`relative flex-1 max-w-2xl ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Rechercher un produit, une marque..."
            autoComplete="off"
            className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:bg-white transition"
          />
          <button
            type="submit"
            className="absolute right-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Chercher
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl ring-1 ring-gray-100 overflow-hidden z-50">
          {suggestions.map((s, idx) => (
            <button
              key={`${s.type}-${s.id}`}
              onMouseDown={() => {
                setOpen(false)
                setQuery(s.name)
                router.push(s.type === 'brand' ? `/marques/${s.slug}` : `/products/${s.slug}`)
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-brand-50 transition ${
                idx === activeIdx ? 'bg-brand-50' : ''
              }`}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} className="w-full h-full object-contain" />
                ) : s.type === 'brand' ? (
                  <Tag className="w-4 h-4 text-brand-400" />
                ) : (
                  <Search className="w-4 h-4 text-gray-300" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                {s.type === 'brand' ? (
                  <p className="text-xs text-brand-500 font-medium">Marque</p>
                ) : (
                  <p className="text-xs text-gray-400 truncate">{s.category}</p>
                )}
              </div>

              {/* Price or brand badge */}
              {s.type === 'product' && s.min_price != null && (
                <span className="text-sm font-bold text-brand-600 flex-shrink-0">
                  {s.min_price.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} DT
                </span>
              )}
            </button>
          ))}

          {/* "See all results" footer */}
          <button
            onMouseDown={() => navigate(query)}
            className="w-full px-4 py-2.5 text-sm text-brand-600 font-medium border-t border-gray-100 hover:bg-brand-50 transition text-left"
          >
            Voir tous les résultats pour &ldquo;{query}&rdquo; →
          </button>
        </div>
      )}
    </div>
  )
}
