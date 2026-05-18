'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Check, Crown, Zap, Shield, ShoppingBag } from 'lucide-react'

interface Plan {
  name: string
  price: number
  features: string[]
  description?: string
}

interface Subscription {
  id: number
  plan: string
  price: number
  start_date: string
  end_date: string
  status: string
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Record<string, Plan>>({})
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('fournisseur_token')
    if (!token) {
      router.push('/fournisseur/login')
      return
    }

    Promise.all([
      api.get('/fournisseur/subscription/plans'),
      api.get('/fournisseur/subscription'),
    ])
      .then(([plansRes, subRes]) => {
        setPlans(plansRes.data.plans)
        setCurrentSubscription(subRes.data.subscription)
      })
      .catch(() => {
        router.push('/fournisseur/login')
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleSubscribe = async (planKey: string) => {
    setSubscribing(planKey)
    try {
      await api.post('/fournisseur/subscription', { plan: planKey })
      const subRes = await api.get('/fournisseur/subscription')
      setCurrentSubscription(subRes.data.subscription)
    } catch (err) {
      console.error(err)
    } finally {
      setSubscribing(null)
    }
  }

  const getPlanIcon = (key: string) => {
    switch (key) {
      case 'basic': return <Shield className="w-6 h-6" />
      case 'pro': return <Zap className="w-6 h-6" />
      case 'max': return <Crown className="w-6 h-6" />
      case 'premium_manual': return <ShoppingBag className="w-6 h-6" />
      default: return <Shield className="w-6 h-6" />
    }
  }

  const getPlanColor = (key: string) => {
    switch (key) {
      case 'basic': return 'border-gray-200 bg-gray-50'
      case 'pro': return 'border-blue-200 bg-blue-50'
      case 'max': return 'border-purple-200 bg-purple-50'
      case 'premium_manual': return 'border-orange-200 bg-orange-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getButtonColor = (key: string) => {
    switch (key) {
      case 'basic': return 'bg-gray-600 hover:bg-gray-700'
      case 'pro': return 'bg-blue-600 hover:bg-blue-700'
      case 'max': return 'bg-purple-600 hover:bg-purple-700'
      case 'premium_manual': return 'bg-orange-600 hover:bg-orange-700'
      default: return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const planKeys = Object.keys(plans)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Abonnement</h1>
        <p className="text-gray-500 mt-2">Choisissez le plan qui correspond à vos besoins</p>
      </div>

      {currentSubscription && currentSubscription.status === 'active' && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-800 font-medium">
            Abonnement actuel: <span className="font-bold">{plans[currentSubscription.plan]?.name || currentSubscription.plan}</span>
            {' '}({currentSubscription.price} DT/mois)
          </p>
          <p className="text-green-600 text-sm mt-1">
            Valide jusqu'au {new Date(currentSubscription.end_date).toLocaleDateString('fr-FR')}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {planKeys.map((key) => {
          const plan = plans[key]
          const isCurrent = currentSubscription?.plan === key && currentSubscription?.status === 'active'
          
          return (
            <div
              key={key}
              className={`relative rounded-2xl border-2 p-6 flex flex-col ${getPlanColor(key)} ${isCurrent ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  Actuel
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  {getPlanIcon(key)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price} DT`}
                    {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mois</span>}
                  </p>
                </div>
              </div>

              {plan.description && (
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              )}

              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(key)}
                disabled={isCurrent || subscribing === key}
                className={`w-full py-3 px-4 rounded-xl text-white font-medium transition ${getButtonColor(key)} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCurrent ? 'Plan actuel' : subscribing === key ? 'Activation...' : 'Choisir ce plan'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
        <h3 className="font-bold text-gray-900 mb-2">Comment fonctionne l'abonnement?</h3>
        <ul className="space-y-2 text-gray-600">
          <li>• <strong>Basic</strong>: Gratuit, idéal pour tester (5 produits max, n'apparaît pas sur le site)</li>
          <li>• <strong>Go Pro</strong>: Pour les fournisseurs avec site web, scraping automatique Enabled</li>
          <li>• <strong>Max</strong>: Le plus complet avec tous les avantages premium</li>
          <li>• <strong>Premium Manuel</strong>: Pour les fournisseurs sans site web, ajout manuel des produits</li>
        </ul>
        <p className="mt-4 text-sm text-orange-600 font-medium">
          ⚠️ Votre abonnement doit être actif pour apparaître sur le site et être scrapé automatiquement.
        </p>
      </div>
    </div>
  )
}