'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Une erreur est survenue</h2>
        <p className="text-gray-500 mb-6">{error.message}</p>
        <button
          onClick={() => reset()}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-xl transition"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}