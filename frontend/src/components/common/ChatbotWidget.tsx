'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import api from '@/lib/api'
import Link from 'next/link'

interface Message {
  role: 'user' | 'bot'
  text: string
  products?: Array<{ id: number; name: string; image_url: string | null; price: number | null }>
}

export default function ChatbotWidget() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Bonjour ! Je suis votre assistant d'achat. Décrivez ce que vous cherchez (produit, budget, caractéristiques)…" },
  ])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    setMessages(m => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chatbot', { message: text })
      const data = res.data
      setMessages(m => [...m, {
        role: 'bot',
        text: data.reply,
        products: data.products,
      }])
    } catch {
      setMessages(m => [...m, { role: 'bot', text: "Désolé, une erreur est survenue. Réessayez plus tard." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        title="Assistant d'achat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl ring-1 ring-gray-100 flex flex-col overflow-hidden" style={{ maxHeight: '520px' }}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 bg-brand-600 text-white">
            <Bot className="w-5 h-5" />
            <div>
              <p className="font-bold text-sm">Assistant PrixTunisix</p>
              <p className="text-xs text-brand-200">Trouvez le meilleur prix</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 0 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>

                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {m.products.slice(0, 3).map(p => (
                        <Link
                          key={p.id}
                          href={`/products/${p.id}`}
                          className="flex items-center gap-2 bg-white rounded-xl p-2 hover:bg-brand-50 transition"
                          onClick={() => setOpen(false)}
                        >
                          {p.image_url && (
                            <img src={p.image_url} alt={p.name} className="w-10 h-10 object-contain rounded-lg bg-gray-50" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                            {p.price && <p className="text-xs text-brand-600 font-bold">{p.price.toFixed(2)} TND</p>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ex: smartphone moins de 500 TND…"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
