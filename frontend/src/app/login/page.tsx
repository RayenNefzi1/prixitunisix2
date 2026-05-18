'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sendOtp, verifyLoginOtp, formatTunisianPhone, isValidTunisianPhone } from '@/lib/auth'
import { AlertCircle, MessageCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'

type Step = 'phone' | 'otp'

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep]     = useState<Step>('phone')
  const [phone, setPhone]   = useState('')
  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const [error, setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const formattedPhone = formatTunisianPhone(phone)
  const phoneValid = isValidTunisianPhone(formattedPhone)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneValid) return
    setError(null)
    setLoading(true)
    try {
      await sendOtp(formattedPhone)
      setStep('otp')
      setCountdown(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erreur lors de l\'envoi du code.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return
    setError(null)
    setLoading(true)
    try {
      const user = await verifyLoginOtp(formattedPhone, code)
      // Force hard reload immediately - no delay, no flash of old state
      window.location.replace('/')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msgs = e.response?.data?.errors
      const first = msgs ? Object.values(msgs).flat()[0] : null
      setError(first ?? e.response?.data?.message ?? 'Code incorrect ou expiré.')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setError(null)
    setLoading(true)
    try {
      await sendOtp(formattedPhone)
      setOtp(['', '', '', '', '', ''])
      setCountdown(60)
      otpRefs.current[0]?.focus()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e.response?.data?.message ?? 'Erreur lors du renvoi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-base">PT</span>
            </div>
            <span className="text-2xl font-extrabold text-gray-900">
              Prix<span className="text-brand-600">Tunisix</span>
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            {step === 'phone' ? 'Connexion' : 'Vérification'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {step === 'phone'
              ? 'Entrez votre numéro tunisien pour recevoir un code WhatsApp'
              : <>Code envoyé sur WhatsApp au <span className="font-semibold text-gray-700">{formattedPhone}</span></>
            }
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-8">
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Step 1: Phone ─────────────────────────────────────────── */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Numéro de téléphone tunisien
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 focus-within:bg-white transition overflow-hidden">
                  <span className="pl-3 pr-1 py-2.5 text-sm font-semibold text-gray-500 select-none border-r border-gray-200 pr-3">
                    🇹🇳 +216
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={8}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    className="flex-1 pr-4 py-2.5 text-sm bg-transparent focus:outline-none placeholder-gray-400"
                    placeholder="9X XXX XXX"
                    autoFocus
                  />
                  {phone.length === 8 && (
                    phoneValid
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 mr-3" />
                      : <AlertCircle className="w-4 h-4 text-red-400 mr-3" />
                  )}
                </div>
                {phone.length === 8 && !phoneValid && (
                  <p className="mt-1.5 text-xs text-red-500">Numéro invalide — doit commencer par 2, 4, 5 ou 9</p>
                )}
              </div>

              <button type="submit" disabled={loading || !phoneValid}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 shadow-sm">
                {loading ? <Spinner /> : <MessageCircle className="w-4 h-4" />}
                {loading ? 'Envoi...' : 'Recevoir le code WhatsApp'}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ───────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                  Code à 6 chiffres
                </label>
                <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none transition bg-gray-50 focus:bg-white"
                    />
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading || otp.join('').length !== 6}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-2">
                {loading ? <><Spinner /> Vérification...</> : 'Confirmer et se connecter'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setStep('phone'); setError(null); setOtp(['','','','','','']) }}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="w-3.5 h-3.5" /> Changer de numéro
                </button>
                <button type="button" onClick={handleResend} disabled={countdown > 0 || loading}
                  className="text-brand-600 hover:underline disabled:text-gray-400 disabled:no-underline">
                  {countdown > 0 ? `Renvoyer (${countdown}s)` : 'Renvoyer le code'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold text-brand-600 hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
