'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-8 text-center animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Connexion requise
        </h3>
        <p className="text-gray-500 mb-6">
          Vous devez être connecté pour ajouter des produits à vos favoris.
        </p>

        <div className="space-y-3">
          <Link
            href="/login"
            onClick={onClose}
            className="block w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="block w-full py-3 px-4 border-2 border-gray-200 hover:border-brand-300 text-gray-700 font-semibold rounded-xl transition"
          >
            Créer un compte
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}