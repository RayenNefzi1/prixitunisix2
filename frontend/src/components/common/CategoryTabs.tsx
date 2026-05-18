'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface Category {
  id: number
  code: string
  name: string
  slug: string
  children?: Category[]
}

const TAB_CONFIG: Record<string, { icon: string; color: string }> = {
  'informatique':   { icon: '💻', color: 'hover:text-blue-600' },
  'pc-portables':    { icon: '🖥️', color: 'hover:text-indigo-600' },
  'smartphones':     { icon: '📱', color: 'hover:text-green-500' },
  'tablettes':       { icon: '📲', color: 'hover:text-purple-500' },
  'ecrans':          { icon: '🖥️', color: 'hover:text-cyan-500' },
  'audio':           { icon: '🎧', color: 'hover:text-pink-500' },
  'gaming':         { icon: '🎮', color: 'hover:text-red-500' },
  'composants-pc':   { icon: '⚙️', color: 'hover:text-gray-600' },
  'peripheriques':   { icon: '🖱️', color: 'hover:text-teal-500' },
  'electromenager': { icon: '🏠', color: 'hover:text-orange-500' },
}

const SUB_ICONS: Record<string, string> = {
  'pc-portables':               '💻', 'pc-portables-gaming': '🎮', 'pc-bureau':   '🖥️',
  'smartphones':                '📱', 'tablettes':           '📟', 'smartwatches':'⌚',
  'televiseurs':                '📺', 'audio':               '🎧', 'ecrans':      '🖥️',
  'composants-pc':              '⚙️', 'imprimantes':         '🖨️', 'peripheriques':'🖱️',
  'photo-video':                '📷',
  'refrigerateurs-congelateurs':'❄️', 'machines-a-laver':   '🌀',
  'lave-vaisselle':             '🍽️', 'climatisation':       '🌬️',
  'petit-electromenager':       '☕', 'cuisine-cuisson':     '🍳',
  'mobilier':                   '🛋️', 'decoration':          '🖼️', 'literie': '🛏️',
  'cuisine-table':              '🍴', 'jardinage':           '🌱', 'bricolage':'🔧',
  'chiens':                     '🐕', 'chats':               '🐈', 'oiseaux-rongeurs':'🐦',
  'aquariophilie':              '🐟', 'animaux-accessoires': '🦮',
  'soins-visage':               '✨', 'soins-corps':         '🧴', 'parfums':'🌸',
  'coiffure':                   '💇', 'sante-bienetre':      '💊', 'electro-beaute':'💅',
  'sport-fitness':              '🏋️', 'motos-scooters':      '🏍️', 'camping-aventure':'⛺',
  'jeux-video':                 '🎮', 'jouets-jeux':         '🧸', 'bebe-puericulture':'👶',
  'livres-musique':             '🎵',
}

export default function CategoryTabs({ categories }: { categories: Category[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tabs = categories.filter(c => TAB_CONFIG[c.slug])


  const activeCat = tabs.find(t => t.slug === openSlug) ?? null
  const activeSubs = activeCat
    ? [...(activeCat.children ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    : []

  const enter = (slug: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setOpenSlug(slug)
  }
  const leave = () => {
    leaveTimer.current = setTimeout(() => setOpenSlug(null), 160)
  }
  useEffect(() => () => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }, [])

  return (
    // Fixed position - stays at top below main navbar (navbar is ~88px total height)
    <div className="bg-white border-b border-gray-200 sticky top-16 left-0 right-0 z-40">

      {/* ── Tab strip ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map(cat => {
            const cfg = TAB_CONFIG[cat.slug]!
            const isOpen = openSlug === cat.slug

            return (
              <div
                key={cat.id}
                className="flex-shrink-0"
                onMouseEnter={() => enter(cat.slug)}
                onMouseLeave={leave}
              >
                <Link
                  href={`/products?category_id=${cat.id}`}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-semibold text-gray-700
                    whitespace-nowrap border-b-2 transition-all
                    ${isOpen
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent ' + cfg.color}
                  `}
                >
                  <span className="text-lg leading-none">{cfg.icon}</span>
                  <span>{cat.name}</span>
                  {(cat.children ?? []).length > 0 && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Dropdown panel ───────────────────────────────────────────────
           • Sibling of the tab strip → NOT inside overflow-x-auto
           • position:absolute top-full left-0 right-0 → spans full width
           • z-50 to float above all page content
           • minHeight = tallest category height → uniform across all tabs   */}
      {activeCat && activeSubs.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-50 bg-white shadow-2xl border-t border-gray-100"
          onMouseEnter={() => enter(activeCat.slug)}
          onMouseLeave={leave}
        >
          <div className="mx-auto max-w-7xl px-8 py-5">
            {/* Sub-category tiles — flex-wrap so each card shrinks to its content */}
            <div className="flex flex-wrap gap-2">
              {activeSubs.map(sub => (
                <Link
                  key={sub.id}
                  href={`/products?category_id=${sub.id}`}
                  onClick={() => setOpenSlug(null)}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center
                    text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-all group w-[100px]"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform leading-none">
                    {SUB_ICONS[sub.slug] ?? '🏷️'}
                  </span>
                  <span className="text-xs font-semibold leading-snug break-words w-full">
                    {sub.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <Link
                href={`/products?category_id=${activeCat.id}`}
                onClick={() => setOpenSlug(null)}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Voir tout &mdash; {activeCat.name}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
