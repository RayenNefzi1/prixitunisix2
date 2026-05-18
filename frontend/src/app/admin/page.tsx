'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import adminApi from '@/lib/admin-api'
import { Users, Store, Package, TrendingUp, Bell, ShoppingBag, Tag } from 'lucide-react'

interface Stats {
  total_users: number
  total_fournisseurs: number
  total_products: number
  total_offers: number
  active_alerts: number
  total_categories: number
  total_brands: number
  total_merchants: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.get('/admin/dashboard')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Utilisateurs', value: stats?.total_users ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Fournisseurs', value: stats?.total_fournisseurs ?? 0, icon: Store, color: 'bg-purple-500' },
    { label: 'Produits', value: stats?.total_products ?? 0, icon: Package, color: 'bg-green-500' },
    { label: 'Offres', value: stats?.total_offers ?? 0, icon: ShoppingBag, color: 'bg-orange-500' },
    { label: 'Catégories', value: stats?.total_categories ?? 0, icon: Tag, color: 'bg-yellow-500' },
    { label: 'Marques', value: stats?.total_brands ?? 0, icon: Bell, color: 'bg-red-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
        <p className="text-gray-500">Vue d'ensemble de la plateforme</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/users" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <Users className="w-8 h-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Gestion utilisateurs</span>
          </Link>
          <Link href="/admin/fournisseurs" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <Store className="w-8 h-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Fournisseurs</span>
          </Link>
          <Link href="/admin/products" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <Package className="w-8 h-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Produits</span>
          </Link>
          <Link href="/admin/analytics" className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <TrendingUp className="w-8 h-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Analytics</span>
          </Link>
        </div>
      </div>

      {/* Price Alerts Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Alertes prix actives</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_alerts ?? 0}</p>
            </div>
          </div>
          <Link href="/admin/alerts" className="text-brand-600 hover:underline text-sm font-medium">
            Voir toutes →
          </Link>
        </div>
      </div>
    </div>
  )
}