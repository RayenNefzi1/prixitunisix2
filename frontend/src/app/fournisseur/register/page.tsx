'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Briefcase } from 'lucide-react'

export default function FournisseurRegisterPage() {
  const router  = useRouter()
  const [form, setForm] = useState({
    company_name: '', contact_email: '', merchant_url: '', company_phone: '', company_address: '',
  })
  const [errors, setErrors]   = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await api.post('/fournisseur/register', form)
      setSuccess(true)
      setTimeout(() => router.push('/fournisseur'), 1500)
    } catch (err: any) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else if (err.response?.status === 401) {
        router.push('/login?redirect=/fournisseur/register')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Espace créé avec succès !</h2>
        <p className="text-gray-500 mt-2">Redirection vers votre tableau de bord…</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex w-16 h-16 items-center justify-center bg-brand-50 rounded-2xl mb-4">
          <Briefcase className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Créer mon espace fournisseur</h1>
        <p className="text-gray-500 mt-2 text-sm">Gérez vos produits et suivez vos statistiques.</p>
      </div>

      <form onSubmit={submit} className="space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {[
          { key: 'company_name', label: 'Nom de la société *', type: 'text', required: true },
          { key: 'contact_email', label: 'Email de contact *', type: 'email', required: true },
          { key: 'merchant_url', label: 'URL de la boutique', type: 'url', required: false },
          { key: 'company_phone', label: 'Téléphone', type: 'tel', required: false },
          { key: 'company_address', label: 'Adresse', type: 'text', required: false },
        ].map(({ key, label, type, required }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type={type}
              required={required}
              value={(form as any)[key]}
              onChange={e => set(key, e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key][0]}</p>}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary disabled:opacity-60"
        >
          {loading ? 'Création…' : 'Créer mon espace'}
        </button>

        <p className="text-center text-xs text-gray-400">
          Déjà un espace ? <Link href="/fournisseur" className="text-brand-600 hover:underline">Accéder</Link>
        </p>
      </form>
    </div>
  )
}
