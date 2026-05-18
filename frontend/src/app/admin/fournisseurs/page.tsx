'use client'

import { useEffect, useState } from 'react'
import { Store, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import adminApi from '@/lib/admin-api'

interface Fournisseur {
  id: number
  company_name: string
  contact_email: string
  active: boolean
  merchant_website: { name: string } | null
  subscription: { plan: string; status: string; end_date: string } | null
}

export default function AdminFournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    adminApi.get(`/admin/fournisseurs?page=${page}`)
      .then(res => res.data)
      .then(data => {
        setFournisseurs(data.data || [])
        setTotalPages(data.last_page || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await adminApi.put(`/admin/fournisseurs/${id}/toggle`, { active: !currentStatus })
      if (res.status === 200) {
        setFournisseurs(fournisseurs.map(f => f.id === id ? { ...f, active: !currentStatus } : f))
      }
    } catch (err) { 
      console.error(err) 
    }
  }

  const getPlanBadge = (plan: string, status: string) => {
    if (status !== 'active') return 'bg-gray-100 text-gray-600'
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
        <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
        <p className="text-gray-500">Gérer les fournisseurs et leurs abonnements</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Entreprise</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Site</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Abonnement</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Statut</th>
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
            ) : fournisseurs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Aucun fournisseur trouvé</td>
              </tr>
            ) : fournisseurs.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Store className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-900">{f.company_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{f.contact_email}</td>
                <td className="px-6 py-4 text-gray-600">{f.merchant_website?.name || '-'}</td>
                <td className="px-6 py-4">
                  {f.subscription ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanBadge(f.subscription.plan, f.subscription.status)}`}>
                      {f.subscription.plan === 'pro' ? 'Go Pro' : f.subscription.plan === 'max' ? 'Max' : f.subscription.plan === 'premium_manual' ? 'Premium Manuel' : 'Basic'}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Aucun</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${f.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {f.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleActive(f.id, f.active)}
                    className={`p-2 rounded-lg transition ${f.active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                  >
                    {f.active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
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