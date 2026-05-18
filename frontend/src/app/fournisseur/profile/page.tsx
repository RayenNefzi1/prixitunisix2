'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Briefcase, Save, AlertCircle, CheckCircle, Upload } from 'lucide-react'

interface Fournisseur {
  id: number
  company_name: string
  contact_email: string
  phone: string | null
  address: string | null
  description: string | null
  merchant_url: string | null
  logo_url: string | null
  active: boolean
}

export default function FournisseurProfilePage() {
  const router = useRouter()
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    company_name: '',
    contact_email: '',
    phone: '',
    address: '',
    description: '',
    merchant_url: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('fournisseur_token')
    if (!token) {
      router.push('/fournisseur/login')
      return
    }
    
    api.get('/fournisseur/dashboard')
      .then(res => {
        const f = res.data.fournisseur
        setFournisseur(f)
        setForm({
          company_name: f.company_name || '',
          contact_email: f.contact_email || '',
          phone: f.phone || '',
          address: f.address || '',
          description: f.description || '',
          merchant_url: f.merchant_url || '',
        })
      })
      .catch(err => {
        if (err.response?.status === 401) {
          router.push('/fournisseur/login')
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      await api.patch('/fournisseur/profile', form)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de la sauvegarde'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/fournisseur" className="text-sm text-gray-500 hover:text-brand-600 mb-1 inline-flex items-center gap-1">
          ← Retour au tableau de bord
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">Modifier mon profil</h1>
        <p className="text-gray-500">Gérez les informations de votre entreprise</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700">
            <CheckCircle className="w-5 h-5" />
            Profil enregistré avec succès!
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Company Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-600" />
            Informations entreprise
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'entreprise *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => setForm({ ...form, company_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                placeholder="MyTek Tunisia"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email de contact *</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={e => setForm({ ...form, contact_email: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                placeholder="contact@mytek.tn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                placeholder="+216 50 000 000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                placeholder="Avenue de la République, Tunis"
              />
            </div>
          </div>
        </div>

        {/* Website Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Site web</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">URL de votre boutique</label>
              <input
                type="url"
                value={form.merchant_url}
                onChange={e => setForm({ ...form, merchant_url: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                placeholder="https://www.mytek.tn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none resize-none"
                placeholder="Décrivez votre boutique..."
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer les modifications
            </>
          )}
        </button>
      </form>
    </div>
  )
}