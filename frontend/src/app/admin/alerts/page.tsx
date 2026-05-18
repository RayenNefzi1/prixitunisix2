'use client'

import { useEffect, useState } from 'react'
import { Bell, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import adminApi from '@/lib/admin-api'

interface Alert {
  id: number
  target_price: number
  triggered_at: string | null
  product: {
    id: number
    name: string
    slug: string
  }
  client: {
    user: {
      name: string
      prename: string
      email: string
    }
    phone: string
  }
  created_at: string
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    const status = filter !== 'all' ? `&status=${filter}` : ''
    adminApi.get(`/admin/alerts?page=${page}${status}`)
      .then(res => res.data)
      .then(data => {
        setAlerts(data.data || [])
        setTotalPages(data.last_page || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, filter])

  const deleteAlert = async (id: number) => {
    if (!confirm('Supprimer cette alerte?')) return
    try {
      await adminApi.delete(`/admin/alerts/${id}`)
      setAlerts(alerts.filter(a => a.id !== id))
    } catch { console.error() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes Prix</h1>
          <p className="text-gray-500">Gérer les alertes de prix des clients</p>
        </div>
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1) }}
          className="px-4 py-2 border border-gray-200 rounded-xl"
        >
          <option value="all">Toutes</option>
          <option value="active">Actives</option>
          <option value="triggered">Déclenchées</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total alertes</p>
          <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Actives</p>
          <p className="text-2xl font-bold text-green-600">{alerts.filter(a => !a.triggered_at).length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Déclenchées</p>
          <p className="text-2xl font-bold text-brand-600">{alerts.filter(a => a.triggered_at).length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Produit</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Client</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Prix cible</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Statut</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse" /></td>
                </tr>
              ))
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Aucune alerte trouvée</td>
              </tr>
            ) : alerts.map(alert => (
              <tr key={alert.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 truncate max-w-[200px]">{alert.product.name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-900">{alert.client.user.prename} {alert.client.user.name}</p>
                  <p className="text-sm text-gray-500">{alert.client.phone}</p>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{alert.target_price.toFixed(3)} TND</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${alert.triggered_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {alert.triggered_at ? 'Déclenchée' : 'En attente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(alert.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
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