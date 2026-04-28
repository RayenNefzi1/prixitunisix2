'use client'

import { Ticket } from 'lucide-react'

export default function CouponsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-50 rounded-2xl mb-6">
        <Ticket className="w-10 h-10 text-brand-600" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Coupons & Promotions</h1>
      <p className="text-gray-500 max-w-md mx-auto">
        Cette section sera bientôt disponible. Retrouvez ici tous les codes promo et réductions exclusives de vos marchands préférés.
      </p>
      <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-50 rounded-full text-brand-700 text-sm font-medium">
        ⏳ Bientôt disponible
      </div>
    </div>
  )
}
