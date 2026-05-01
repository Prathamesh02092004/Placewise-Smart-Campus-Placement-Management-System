/**
 * Real API service — Axios instance wired to the PlaceWise backend.
 *
 * Base URL is read from VITE_API_BASE_URL (default: http://localhost:5000/api).
 *
 * Authentication strategy:
 *   • Access token  → in-memory (Redux store), sent as Bearer header.
 *   • Refresh token → HttpOnly cookie, sent automatically by the browser.
 *
 * Token refresh strategy:
 *   On any 401 the interceptor calls POST /auth/refresh (uses the cookie) and
 *   replays the original request.  Only the three endpoints that would cause
 *   an infinite loop are excluded from this retry:
 *     /auth/refresh  — the refresh endpoint itself
 *     /auth/login    — if login fails with 401 it's a bad credential, not expiry
 *     /auth/logout   — if logout fails just clear state locally
 *
 *   NOTE: /auth/me is NOT excluded — it must be retried after a refresh so
 *   that session restore on page reload works correctly.
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// ── Endpoints that must never trigger a refresh retry ────────────────────────
// Keep this list minimal — only the ones that would create an infinite loop.
const NO_REFRESH_URLS = ['/auth/refresh', '/auth/login', '/auth/logout']

// Module-level store reference — injected by store.js after creation.
// This breaks the store → authSlice → api → store circular dependency.
let _store = null
export const injectStore = (store) => { _store = store }

const api = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,                        // send/receive the HttpOnly refresh cookie
  headers:         { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach Bearer token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = _store?.getState().auth.token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor — transparent 401 → refresh → replay ────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Only skip refresh for the specific endpoints that would loop.
      // /auth/me is intentionally NOT in this list so session restore works.
      const shouldSkip = NO_REFRESH_URLS.some((u) =>
        originalRequest.url?.includes(u)
      )
      if (shouldSkip) return Promise.reject(error)

      if (isRefreshing) {
        // Queue until the in-flight refresh resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }).catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res      = await api.post('/auth/refresh')
        const newToken = res.data?.data?.accessToken

        if (!newToken) throw new Error('No access token in refresh response')

        const { setCredentials } = await import('@/features/auth/authSlice')
        _store.dispatch(setCredentials({
          token: newToken,
          user:  _store.getState().auth.user,
        }))

        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        const { logout } = await import('@/features/auth/authSlice')
        _store?.dispatch(logout())
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

/**
 * Extract a human-readable message from an Axios error.
 * Backend shape: { success: false, message: '...', errors: [...] }
 */
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message
  if (error?.response?.data?.error)   return error.response.data.error
  if (error?.message)                 return error.message
  return 'Something went wrong. Please try again.'
}

export default api