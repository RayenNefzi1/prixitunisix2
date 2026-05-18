'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Briefcase, BarChart2, Package, Key, ExternalLink, TrendingUp, Eye, MousePointer, CreditCard, AlertCircle } from 'lucide-react'

interface Stats {
  total_clicks: number; clicks_this_month: number; clicks_today: number
  total_product_views: number; views_this_month: number; total_products: number
}
interface Fournisseur {
  id: number; company_name: string; contact_email: string; api_key: string | null
  active: boolean; merchant_url: string | null; logo_url: string | null
  merchant_website: { id: number; name: string } | null
}
interface Subscription {
  id: number; plan: string; price: number; start_date: string; end_date: string; status: string
}

export default function FournisseurPage() {
  const router = useRouter()
  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null)
  const [stats, setStats]             = useState<Stats | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [appearsOnWebsite, setAppearsOnWebsite] = useState(false)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false)
  const [generatingKey, setGeneratingKey]  = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('fournisseur_token')
    if (!token) {
      router.push('/fournisseur/login')
      return
    }
    
    api.get('/fournisseur/dashboard')
      .then(res => {
        setFournisseur(res.data.fournisseur)
        setStats(res.data.stats)
        setSubscription(res.data.subscription)
        setAppearsOnWebsite(res.data.appears_on_website)
      })
      .catch(err => {
        if (err.response?.status === 401) {
          router.push('/fournisseur/login')
        } else if (err.response?.status === 404) {
          setError('no_fournisseur')
        } else {
          setError('error')
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const generateApiKey = async () => {
    setGeneratingKey(true)
    try {
      const res = await api.post('/fournisseur/generate-api-key')
      setFournisseur(prev => prev ? { ...prev, api_key: res.data.api_key } : prev)
      setApiKeyRevealed(true)
    } finally {
      setGeneratingKey(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (error === 'no_fournisseur') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex w-20 h-20 items-center justify-center bg-brand-50 rounded-2xl mb-6">
          <Briefcase className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Espace Fournisseur</h1>
        <p className="text-gray-500 mb-8">Vous n&apos;avez pas encore d&apos;espace fournisseur. Inscrivez-vous pour accéder au tableau de bord marchand.</p>
        <Link href="/fournisseur/register" className="btn-primary">Créer mon espace fournisseur</Link>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-16 text-gray-500">Une erreur est survenue. <Link href="/login" className="text-brand-600">Se connecter</Link></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl text-white">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
          <Briefcase className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">{fournisseur?.company_name}</h1>
          <p className="text-brand-200 text-sm mt-0.5">{fournisseur?.contact_email}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${fournisseur?.active ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'}`}>
          {fournisseur?.active ? 'Actif' : 'Inactif'}
        </div>
      </div>

      {/* Subscription Status */}
      {!subscription || subscription.status !== 'active' ? (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-orange-800">Aucun abonnement actif</p>
            <p className="text-sm text-orange-700 mt-1">Vous devez choisir un abonnement pour apparaître sur le site et être scrapé.</p>
          </div>
          <Link href="/fournisseur/subscription" className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 whitespace-nowrap">
            Souscrire
          </Link>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4">
          <div className={`p-2 rounded-lg ${appearsOnWebsite ? 'bg-green-100' : 'bg-gray-100'}`}>
            <CreditCard className={`w-5 h-5 ${appearsOnWebsite ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Abonnement: {subscription.plan === 'basic' ? 'Basic' : subscription.plan === 'pro' ? 'Go Pro' : subscription.plan === 'max' ? 'Max' : 'Premium Manuel'}</p>
            <p className="text-sm text-gray-500">
              {appearsOnWebsite ? '✓ Apparaît sur le site' : '✗ N\'apparaît pas sur le site'}
            </p>
          </div>
          <Link href="/fournisseur/subscription" className="text-sm text-brand-600 hover:underline">
            Gérer
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Clics aujourd'hui", value: stats?.clicks_today ?? 0, icon: <MousePointer className="w-5 h-5 text-blue-500" /> },
          { label: 'Clics ce mois', value: stats?.clicks_this_month ?? 0, icon: <TrendingUp className="w-5 h-5 text-green-500" /> },
          { label: 'Vues ce mois', value: stats?.views_this_month ?? 0, icon: <Eye className="w-5 h-5 text-purple-500" /> },
          { label: 'Clics total', value: stats?.total_clicks ?? 0, icon: <BarChart2 className="w-5 h-5 text-orange-500" /> },
          { label: 'Vues total', value: stats?.total_product_views ?? 0, icon: <Eye className="w-5 h-5 text-pink-500" /> },
          { label: 'Produits', value: stats?.total_products ?? 0, icon: <Package className="w-5 h-5 text-brand-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
            <p className="text-2xl font-extrabold text-gray-900">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* API Key */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-brand-600" />
          <h2 className="font-bold text-gray-900">Clé API</h2>
        </div>
        {fournisseur?.api_key ? (
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-mono text-gray-700 break-all">
              {apiKeyRevealed ? fournisseur.api_key : '••••••••••••••••••••••••••••••••'}
            </code>
            <button onClick={() => setApiKeyRevealed(v => !v)} className="text-xs text-brand-600 hover:underline whitespace-nowrap">
              {apiKeyRevealed ? 'Masquer' : 'Révéler'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">Aucune clé API générée.</p>
        )}
        <button
          onClick={generateApiKey}
          disabled={generatingKey}
          className="mt-3 text-sm text-brand-600 hover:underline disabled:opacity-50"
        >
          {generatingKey ? 'Génération…' : 'Générer une nouvelle clé'}
        </button>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/fournisseur/products" className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition">
          <Package className="w-4 h-4" /> Mes produits
        </Link>
        <Link href="/fournisseur/links" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <ExternalLink className="w-4 h-4" /> Liens affiliés
        </Link>
        <Link href="/fournisseur/subscription" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <CreditCard className="w-4 h-4" /> Abonnement
        </Link>
        <Link href="/fournisseur/profile" className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition">
          <Briefcase className="w-4 h-4" /> Modifier profil
        </Link>
      </div>
    </div>
  )
}
