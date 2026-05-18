'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, CheckCircle, XCircle } from 'lucide-react'

const FORBIDDEN_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'aol.com', 'icloud.com', 'mail.com', 'yandex.com', 'protonmail.com', 'gmx.com', 'zoho.com']

export default function FournisseurLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState<{ email: string; password: string }>({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [emailMessage, setEmailMessage] = useState('')

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  // Client-side email validation
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
      setEmailMessage('Veuillez utiliser un email professionnel (pas Gmail, Hotmail, Yahoo, etc.)')
    } else {
      setEmailStatus('valid')
      setEmailMessage('')
    }
  }, [])

  useEffect(() => {
    if (!form.email) {
      setEmailStatus('idle')
      setEmailMessage('')
      return
    }

    const timer = setTimeout(() => {
      validateEmail(form.email)
    }, 300)

    return () => clearTimeout(timer)
  }, [form.email, validateEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!form.email || !form.password) return
    if (emailStatus === 'invalid') return
    
    setError(null)
    setLoading(true)

    try {
        const res = await api.post('/fournisseur/login', form)
        localStorage.setItem('fournisseur_token', res.data.token)
        localStorage.setItem('fournisseur_user', JSON.stringify(res.data.user))
        router.push('/fournisseur')
    } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string, errors?: Record<string, string[]> } } }
        if (e.response?.data?.errors) {
            const firstField = Object.keys(e.response.data.errors)[0]
            setError(e.response.data.errors[firstField][0])
        } else if (e.response?.data?.message) {
            setError(e.response.data.message)
        } else {
            setError('Erreur de connexion.')
        }
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold text-gray-900">
            Prix<span className="text-brand-600">Tunisix</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-6">Espace Fournisseur</h1>
          <p className="text-gray-500 mt-2">Connectez-vous à votre espace marchand</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email professionnel
              </label>
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
                  placeholder="vous@entreprise.com"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailStatus === 'valid' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {emailStatus === 'invalid' && <XCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {emailMessage && (
                <p className="text-red-500 text-xs mt-1">{emailMessage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || emailStatus === 'invalid' || !form.email || !form.password}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Se connecter <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link href="/fournisseur/register" className="text-brand-600 font-medium hover:underline">
                Créer un espace fournisseur
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