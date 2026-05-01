import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider, useDispatch } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import store from './store.js'
import './index.css'
import { useSocket } from '@/hooks/useSocket'
import { fetchMe } from '@/features/auth/authSlice'

function AppShell() {
  const dispatch = useDispatch()
  useSocket()

  useEffect(() => {
    dispatch(fetchMe())
  }, [dispatch])

  return <App />
}

// ── Singleton root guard ──────────────────────────────────────────────────────
// Vite HMR re-executes this module on every hot reload.
// Without this guard, each reload calls createRoot() on the same #root element,
// causing the "container already passed to createRoot" warning and cascading
// DOM removeChild/insertBefore errors that crash LoginPage and ProtectedRoute.
// Storing the root on window means HMR updates call root.render() (safe)
// instead of createRoot() again (crashes).
const container = document.getElementById('root')

let root = window.__placewise_root__
if (!root) {
  root = ReactDOM.createRoot(container)
  window.__placewise_root__ = root
}

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppShell />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background:   '#0f172a',
              color:        '#f8fafc',
              fontSize:     '0.875rem',
              borderRadius: '0.625rem',
              padding:      '12px 16px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0f172a' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)