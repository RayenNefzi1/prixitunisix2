'use client'

import { useEffect, useState } from 'react'
import { Tag, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import adminApi from '@/lib/admin-api'

interface Category {
  id: number
  name: string
  slug: string
  code: string | null
  parent_id: number | null
  children?: Category[]
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', parent_id: '' })

  useEffect(() => {
    setLoading(true)
    adminApi.get(`/categories?page=${page}`)
      .then(res => res.data)
      .then(data => {
        setCategories(data.data || [])
        setTotalPages(data.last_page || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await adminApi.post(`/admin/categories`, { ...form, parent_id: form.parent_id || null })
      if (res.status === 201 || res.status === 200) {
        setShowForm(false)
        setForm({ name: '', slug: '', parent_id: '' })
        setPage(1)
      }
    } catch { console.error() }
  }

  const deleteCategory = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie?')) return
    try {
      await adminApi.delete(`/admin/categories/${id}`)
      setCategories(categories.filter(c => c.id !== id))
    } catch { console.error() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-gray-500">Gérer les catégories de produits</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Nouvelle catégorie</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent (optionnel)</label>
                <select
                  value={form.parent_id}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                >
                  <option value="">Aucune</option>
                  {categories.filter(c => !c.parent_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700">
                Enregistrer
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nom</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Slug</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Code</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Parent</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full animate-pulse" /></td>
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Aucune catégorie trouvée</td>
              </tr>
            ) : categories.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-gray-500 text-sm">{cat.slug}</td>
                <td className="px-6 py-4 text-gray-500">{cat.code || '-'}</td>
                <td className="px-6 py-4 text-gray-500">
                  {cat.parent_id ? categories.find(c => c.id === cat.parent_id)?.name || '-' : '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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