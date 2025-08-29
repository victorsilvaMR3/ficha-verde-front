import axios from 'axios'

// Origin da API (sem /api no final). Em prod vem do .env; em dev, se não tiver, usa proxy em '/api'
const ORIGIN = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '')

// Se ORIGIN existir, usa `${ORIGIN}/api`; senão, mantém '/api' (proxy do Vite)
const baseURL = ORIGIN ? `${ORIGIN}/api` : '/api'

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
    if (token) {
      const parsedToken = JSON.parse(token)
      if (parsedToken.state?.token) {
        config.headers.Authorization = `Bearer ${parsedToken.state.token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url || ''
    if (status === 401) {
      const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')
      if (!isAuthEndpoint) {
        localStorage.removeItem('auth-storage')
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
