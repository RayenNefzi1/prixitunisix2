'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, ShoppingBag } from 'lucide-react'
import adminApi from '@/lib/admin-api'

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    setLoading(true)
    adminApi.get(`/admin/analytics/clicks?from=${dateRange}`)
      .then(res => res.data)
      .then(data => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateRange])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const totalClicks = analytics?.reduce((sum: number, item: any) => sum + item.total_clicks, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Statistiques et performances</p>
        </div>
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl"
        >
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clics totaux</p>
              <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nouveaux utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">+124</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Offres actives</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clicks by day */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Clics par jour</h2>
        <div className="h-64 flex items-end gap-2">
          {analytics?.slice(0, 14).map((item: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-brand-500 rounded-t"
                style={{ height: `${(item.total_clicks / (totalClicks || 1)) * 200}px` }}
              />
              <span className="text-xs text-gray-400">{item.date?.slice(5) || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}