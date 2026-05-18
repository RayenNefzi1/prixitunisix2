'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Briefcase, ArrowRight, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const FORBIDDEN_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'aol.com', 'icloud.com', 'mail.com', 'yandex.com', 'protonmail.com', 'gmx.com', 'zoho.com']

const PASSWORD_REQUIREMENTS = [
  { key: 'length', label: 'Au moins 8 caractères', test: (p: string) => p.length >= 8 },
  { key: 'uppercase', label: 'Une majuscule', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'Une minuscule', test: (p: string) => /[a-z]/.test(p) },
  { key: 'number', label: 'Un chiffre', test: (p: string) => /[0-9]/.test(p) },
  { key: 'special', label: 'Un caractère spécial', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function FournisseurRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', password_confirmation: '' })
  const [companyForm, setCompanyForm] = useState({ company_name: '', company_phone: '', company_address: '', merchant_website_id: '' })
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [emailMessage, setEmailMessage] = useState('')

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))
  const setCompany = (key: string, value: string) => setCompanyForm(f => ({ ...f, [key]: value }))

  const validateEmail = useCallback((email: string) => {
    if (!email || !email.includes('@')) {
      setEmailStatus('idle')
      setEmailMessage('')
      return
    }
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) {
      setEmailStatus('idle')
      setEmailMessage('')
      return
    }
    if (FORBIDDEN_DOMAINS.includes(domain)) {
      setEmailStatus('invalid')
      setEmailMessage('Veuillez utiliser un email professionnel')
    } else {
      setEmailStatus('valid')
      setEmailMessage('Email professionnel valide.')
    }
  }, [])

  useEffect(() => {
    if (!form.email) {
      setEmailStatus('idle')
      setEmailMessage('')
      return
    }
    const timer = setTimeout(() => validateEmail(form.email), 300)
    return () => clearTimeout(timer)
  }, [form.email, validateEmail])

  const passwordRequirements = PASSWORD_REQUIREMENTS.map(req => ({ ...req, met: req.test(form.password) }))
  const allPasswordRequirementsMet = passwordRequirements.every(r => r.met)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!form.email || !form.password || !companyForm.company_name) return
    if (emailStatus === 'invalid') return
    if (!allPasswordRequirementsMet) {
      setErrors({ password: ['Le mot de passe ne respecte pas les critères.'] })
      return
    }
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ['Les mots de passe ne correspondent pas.'] })
      return
    }

    setLoading(true)
    setErrors(null)

    try {
      const res = await api.post('/fournisseur/register', {
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        ...companyForm,
      })
      localStorage.setItem('fournisseur_token', res.data.token)
      localStorage.setItem('fournisseur_user', JSON.stringify(res.data.user))
      router.push('/fournisseur/subscription')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string, errors?: Record<string, string[]> } } }
      if (e.response?.data?.errors) {
        setErrors(e.response.data.errors)
      } else if (e.response?.data?.message) {
        setErrors({ general: [e.response.data.message] })
      } else {
        setErrors({ general: ['Une erreur est survenue.'] })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            Prix<span className="text-brand-600">Tunisix</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6">Créer un compte fournisseur</h1>
          <p className="text-gray-500 mt-2">Créez votre compte avec un email professionnel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          {errors?.general && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-xl focus:ring-2 transition ${
                    emailStatus === 'valid' ? 'border-green-300 focus:ring-green-500' :
                    emailStatus === 'invalid' ? 'border-red-300 focus:ring-red-500' :
                    'border-gray-200 focus:ring-brand-500'
                  }`}
                  placeholder="contact@entreprise.tn"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailStatus === 'valid' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {emailStatus === 'invalid' && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {emailMessage && (
                <p className={`text-xs mt-1 ${emailStatus === 'valid' ? 'text-green-600' : 'text-red-500'}`}>
                  {emailMessage}
                </p>
              )}
              {errors?.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l&apos;entreprise</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={companyForm.company_name}
                  onChange={e => setCompany('company_name', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  placeholder="Mon Entreprise"
                  required
                />
              </div>
              {errors?.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site e-commerce</label>
              <select
                value={companyForm.merchant_website_id}
                onChange={e => setCompany('merchant_website_id', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Sélectionner un site (optionnel)</option>
                <option value="1">MyTek</option>
                <option value="2">Tunisianet</option>
                <option value="3">SFax Computer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={companyForm.company_phone}
                onChange={e => setCompany('company_phone', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                placeholder="+216 00 000 000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={companyForm.company_address}
                onChange={e => setCompany('company_address', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                placeholder="Adresse de l'entreprise"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-2.5 border rounded-xl focus:ring-2 transition ${
                    form.password && !allPasswordRequirementsMet ? 'border-orange-300 focus:ring-orange-500' :
                    'border-gray-200 focus:ring-brand-500'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {form.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map(req => (
                    <div key={req.key} className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-600' : 'text-gray-400'}`}>
                      {req.met ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
              {errors?.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={form.password_confirmation}
                onChange={e => set('password_confirmation', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                placeholder="••••••••"
                required
              />
              {errors?.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation[0]}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || emailStatus === 'invalid' || !allPasswordRequirementsMet || !form.email || !form.password || !companyForm.company_name}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Créer mon espace fournisseur <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Link href="/fournisseur/login" className="text-brand-600 font-medium hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          <Link href="/login" className="hover:text-brand-600">
            ← Retour à la connexion client
          </Link>
        </p>
      </div>
    </div>
  )
}