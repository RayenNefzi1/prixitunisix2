'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Bell, Trash2, ShoppingBag, ArrowLeft, BellOff, CheckCircle } from 'lucide-react'

interface PriceAlert {
  id: number
  target_price: number
  current_price: number
  created_at: string
  product: {
    id: number
    name: string
    slug: string
    image_url: string | null
    category: { name: string } | null
  }
}

const Spinner = () => (
  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export default function ClientAlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<number | null>(null)

  useEffect(() => {
    api.get('/client/alerts')
      .then(res => setAlerts(res.data))
      .catch(err => console.error('Failed to load alerts:', err))
      .finally(() => setLoading(false))
  }, [])

  const removeAlert = async (alertId: number) => {
    setRemoving(alertId)
    try {
      await api.delete(`/client/alerts/${alertId}`)
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch (err) {
      console.error('Failed to remove alert:', err)
    } finally {
      setRemoving(null)
    }
  }

  const getPriceStatus = (current: number, target: number) => {
    if (current <= target) return 'reached'
    const diff = ((current - target) / target) * 100
    if (diff <= 10) return 'close'
    return 'high'
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour aux produits
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-600" />
            Mes Alertes Prix
          </h1>
          <p className="text-gray-500">Soyez notifié quand le prix baisse</p>
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BellOff className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune alerte</h3>
            <p className="text-gray-500 mb-6">Créez des alertes prix pour recevoir des notifications.</p>
            <Link href="/products" className="btn-primary">
              Parcourir les produits
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => {
              const status = getPriceStatus(alert.current_price, alert.target_price)
              
              return (
                <div key={alert.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Image */}
                    <Link href={`/products/${alert.product.slug}`}>
                      <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        {alert.product.image_url ? (
                          <img src={alert.product.image_url} alt={alert.product.name} className="w-full h-full object-contain p-2" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${alert.product.slug}`} className="font-semibold text-gray-900 hover:text-brand-600 truncate block">
                        {alert.product.name}
                      </Link>
                      {alert.product.category && (
                        <p className="text-sm text-gray-500 mt-0.5">{alert.product.category.name}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Prix actuel:</span>
                          <span className="font-bold text-gray-900">{alert.current_price.toFixed(3)} TND</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Objectif:</span>
                          <span className="font-bold text-brand-600">{alert.target_price.toFixed(3)} TND</span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col items-end gap-2">
                      {status === 'reached' ? (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Atteint!
                        </span>
                      ) : status === 'close' ? (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                          Proche
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                          {(((alert.current_price - alert.target_price) / alert.target_price) * 100).toFixed(0)}% au-dessus
                        </span>
                      )}
                      
                      <button
                        onClick={() => removeAlert(alert.id)}
                        disabled={removing === alert.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                      >
                        {removing === alert.id ? <Spinner /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-brand-50 border border-brand-100 rounded-xl">
          <p className="text-sm text-brand-800">
            <strong>Comment ça marche:</strong> Lorsqu'un prix atteint ou passe sous votre prix cible, vous recevrez une notification. Les alertes sont vérifiées quotidiennement.
          </p>
        </div>
      </div>
    </div>
  )
}