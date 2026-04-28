import Cookies from 'js-cookie'
import api from './api'

export interface User {
  id: number
  name: string
  prename: string
  email?: string
  phone?: string
  role: 'client' | 'merchant' | 'employee' | 'admin'
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post('/auth/login', { email, password })
  Cookies.set('auth_token', data.token, { expires: 7, sameSite: 'lax' })
  if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(data.user))
  return data.user
}

export async function register(
  name: string,
  prename: string,
  email: string,
  password: string,
  password_confirmation: string
): Promise<User> {
  const { data } = await api.post('/auth/register', {
    name,
    prename,
    email,
    password,
    password_confirmation,
  })
  Cookies.set('auth_token', data.token, { expires: 7, sameSite: 'lax' })
  if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(data.user))
  return data.user
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
  Cookies.remove('auth_token')
  if (typeof window !== 'undefined') localStorage.removeItem('user')
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me')
  return data
}

export function isLoggedIn(): boolean {
  return !!Cookies.get('auth_token')
}

// ── OTP / WhatsApp auth ───────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<void> {
  await api.post('/auth/otp/send', { phone })
}

export async function verifyLoginOtp(phone: string, code: string): Promise<User> {
  const { data } = await api.post('/auth/otp/verify-login', { phone, code })
  Cookies.set('auth_token', data.token, { expires: 7, sameSite: 'lax' })
  if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(data.user))
  return data.user
}

export async function verifyRegisterOtp(phone: string, code: string): Promise<User> {
  const { data } = await api.post('/auth/otp/verify-register', { phone, code })
  Cookies.set('auth_token', data.token, { expires: 7, sameSite: 'lax' })
  if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(data.user))
  return data.user
}

/** Format a raw Tunisian number to E.164: "98000001" → "+21698000001" */
export function formatTunisianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('216')) return '+' + digits
  return '+216' + digits
}

/** Validate a Tunisian mobile phone (after E.164 formatting) — starts with 2, 4, 5, or 9 */
export function isValidTunisianPhone(phone: string): boolean {
  return /^\+216[2459]\d{7}$/.test(phone)
}

export async function updateProfile(data: { name?: string; prename?: string; email?: string }): Promise<User> {
  const { data: user } = await api.patch('/auth/profile', data)
  if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(user))
  return user
}
