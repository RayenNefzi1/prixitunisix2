'use client'

import { useEffect, useState } from 'react'
import adminApi from '@/lib/admin-api'
import { Users, ChevronLeft, ChevronRight, Search } from 'lucide-react'

interface User {
  id: number
  name: string
  prename: string
  email: string
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: page.toString() })
    if (roleFilter) params.append('role', roleFilter)
    if (search) params.append('search', search)

    adminApi.get(`/admin/users?${params}`)
      .then(res => {
        setUsers(res.data.data || [])
        setTotalPages(res.data.last_page || 1)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [page, roleFilter, search])

  const updateRole = async (userId: number, newRole: string) => {
    try {
      const res = await adminApi.put(`/admin/users/${userId}/role`, { role: newRole })
      if (res.status === 200) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      }
    } catch (err) { 
      console.error(err) 
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      employee: 'bg-blue-100 text-blue-700',
      client: 'bg-green-100 text-green-700',
      fournisseur: 'bg-purple-100 text-purple-700',
      merchant: 'bg-orange-100 text-orange-700',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500">Gérer les utilisateurs de la plateforme</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="px-4 py-2 border border-gray-200 rounded-xl"
        >
          <option value="">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
          <option value="client">Client</option>
          <option value="fournisseur">Fournisseur</option>
          <option value="merchant">Marchand</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Utilisateur</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rôle</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Inscription</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Aucun utilisateur trouvé</td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-700 font-bold text-sm">{(user.prename || '')[0]}{(user.name || '')[0]}</span>
                    </div>
                    <span className="font-medium text-gray-900">{user.prename} {user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={e => updateRole(user.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getRoleBadge(user.role)}`}
                  >
                    <option value="client">Client</option>
                    <option value="fournisseur">Fournisseur</option>
                    <option value="merchant">Marchand</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} sur {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}