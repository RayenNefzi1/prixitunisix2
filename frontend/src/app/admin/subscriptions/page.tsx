'use client'

import { useEffect, useState } from 'react'
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import adminApi from '@/lib/admin-api'

interface Subscription {
  id: number
  plan: string
  price: number
  status: string
  start_date: string
  end_date: string
  fournisseur: {
    company_name: string
    contact_email: string
  }
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    adminApi.get(`/admin/subscriptions?page=${page}`)
      .then(res => res.data)
      .then(data => {
        setSubscriptions(data.data || [])
        setTotalPages(data.last_page || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600',
      trial: 'bg-blue-100 text-blue-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-600'
  }

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-100 text-gray-600',
      pro: 'bg-blue-100 text-blue-700',
      max: 'bg-purple-100 text-purple-700',
      premium_manual: 'bg-orange-100 text-orange-700',
    }
    return colors[plan] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
        <p className="text-gray-500">Gérer les abonnements des fournisseurs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['basic', 'pro', 'max', 'premium_manual'].map(plan => {
          const count = subscriptions.filter(s => s.plan === plan && s.status === 'active').length
          return (
            <div key={plan} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500 capitalize">{plan === 'premium_manual' ? 'Premium Manuel' : plan === 'pro' ? 'Go Pro' : plan}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Fournisseur</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Plan</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Prix</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Statut</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Expiration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse" /></td>
                </tr>
              ))
            ) : subscriptions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Aucun abonnement trouvé</td>
              </tr>
            ) : subscriptions.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{sub.fournisseur.company_name}</p>
                    <p className="text-sm text-gray-500">{sub.fournisseur.contact_email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadge(sub.plan)}`}>
                    {sub.plan === 'pro' ? 'Go Pro' : sub.plan === 'max' ? 'Max' : sub.plan === 'premium_manual' ? 'Premium Manuel' : 'Basic'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900 font-medium">{typeof sub.price === 'number' ? sub.price.toFixed(2) : '—'} DT</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(sub.status)}`}>
                    {sub.status === 'active' ? 'Actif' : sub.status === 'expired' ? 'Expiré' : sub.status === 'cancelled' ? 'Annulé' : 'Essai'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {sub.end_date ? new Date(sub.end_date).toLocaleDateString('fr-FR') : '-'}
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