'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getMe, updateProfile, logout, User } from '@/lib/auth'
import { User as UserIcon, Mail, Phone, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export default function ClientProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ prename: '', name: '', email: '' })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch((err) => {
        console.error('Failed to get user:', err)
        // Don't redirect - just show not logged in state
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (user) {
      setForm({
        prename: user.prename || '',
        name: user.name || '',
        email: user.email || '',
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      const updatedUser = await updateProfile({
        name: form.name.trim() || undefined,
        prename: form.prename.trim() || undefined,
        email: form.email.trim() || undefined,
      })
      setUser(updatedUser)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msgs = e.response?.data?.errors
      setError(msgs ? Object.values(msgs).flat()[0] : e.response?.data?.message ?? 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600">
            <ArrowLeft className="w-4 h-4" /> Retour aux produits
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-brand-700 font-bold text-xl">{(user?.prename || '')[0] || '?'}{(user?.name || '')[0] || '?'}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
              <p className="text-sm text-gray-500">{user?.role === 'client' ? 'Client' : user?.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Téléphone</p>
              <p className="font-medium text-gray-800">{user?.phone || 'Non défini'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Prénom</p>
              <p className="font-medium text-gray-800">{user?.prename || 'Non défini'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Nom</p>
              <p className="font-medium text-gray-800">{user?.name || 'Non défini'}</p>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Modifier mes informations</h2>
          
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />Informations enregistrées avec succès!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prenom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.prename}
                    onChange={e => setForm({ ...form, prename: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none transition bg-gray-50 focus:bg-white"
                    placeholder="Mohamed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none transition bg-gray-50 focus:bg-white"
                    placeholder="Ben Ahmed"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none transition bg-gray-50 focus:bg-white"
                  placeholder="vous@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
            >
              {saving ? <><Spinner /> Enregistrement...</> : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>

        {/* Logout */}
        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}