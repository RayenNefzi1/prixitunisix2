import axios from 'axios'
import Cookies from 'js-cookie'

const isBrowser = typeof window !== 'undefined'

export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Attach token on every request (check both client and fournisseur tokens)
api.interceptors.request.use((config) => {
  if (!isBrowser) return config
  
  // Check for fournisseur token first (for fournisseur routes)
  const fournisseurToken = localStorage.getItem('fournisseur_token')
  if (fournisseurToken && config.url?.includes('/fournisseur')) {
    config.headers.Authorization = `Bearer ${fournisseurToken}`
  } else {
    // Otherwise use client token
    const token = Cookies.get('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  
  return config
})

// 401 → clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('auth_token')
      if (isBrowser) {
        // Check if it was a fournisseur route
        if (err.config?.url?.includes('/fournisseur')) {
          localStorage.removeItem('fournisseur_token')
          window.location.href = '/fournisseur/login'
        } else {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
