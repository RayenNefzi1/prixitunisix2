'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'

const adminApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')
    setLoading(true)

    try {
      const res = await adminApi.post('/auth/login', form)

      const data = res.data

      if (data.user?.role !== 'admin' && data.user?.role !== 'employee') {
        setGeneralError('Vous n\'avez pas accès à l\'espace admin.')
        setLoading(false)
        return
      }

      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_user', JSON.stringify(data.user))
      router.push('/admin')
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else if (err.response?.data?.message) {
        setGeneralError(err.response.data.message)
      } else {
        setGeneralError('Une erreur est survenue. Veuillez réessayer.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-white">
            Prix<span className="text-brand-600">Tunisix</span>
          </Link>
          <h1 className="text-xl font-bold text-white mt-6">Espace Administrateur</h1>
          <p className="text-slate-400 mt-2">Connectez-vous pour gérer la plateforme</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {generalError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  placeholder="admin@prixtunisix.tn"
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-brand-600">
              ← Retour au site principal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}