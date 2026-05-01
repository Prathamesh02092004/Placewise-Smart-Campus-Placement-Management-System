import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ShieldCheck, Eye, EyeOff, ArrowLeft, Building2, GraduationCap } from 'lucide-react'
import {
  login, selectAuthLoading, selectAuthError,
  clearAuthError, selectIsAuthenticated, selectCurrentUser,
} from '@/features/auth/authSlice'
import Button from '@/components/common/Button'
import toast from 'react-hot-toast'

const ROLE_META = {
  recruiter: { label: 'Recruiter Portal', color: 'bg-emerald-600', path: '/recruiter/dashboard' },
  placement: { label: 'Placement Cell',   color: 'bg-purple-600',  path: '/placement/dashboard' },
  admin:     { label: 'Admin Panel',      color: 'bg-orange-600',  path: '/admin/dashboard' },
}

export default function AdminLoginPage() {
  const dispatch        = useDispatch()
  const navigate        = useNavigate()
  const loading         = useSelector(selectAuthLoading)
  const error           = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user            = useSelector(selectCurrentUser)

  const [form, setForm]               = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user) {
      const meta = ROLE_META[user.role]
      navigate(meta?.path || '/', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => () => { dispatch(clearAuthError()) }, [dispatch])

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    if (error) dispatch(clearAuthError())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return }
    const result = await dispatch(login(form))
    if (login.fulfilled.match(result)) {
      const role = result.payload?.user?.role
      if (role === 'student') {
        toast.error('Please use the Student Login instead.')
        dispatch({ type: 'auth/logout' })
        return
      }
      toast.success('Welcome back!')
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted flex">

      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-96 bg-ink p-10 text-white">
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <ShieldCheck size={18} className="text-white" />
          </div>
          <span className="text-base font-semibold">PlaceWise Staff</span>
        </div>
        <div className="mb-auto space-y-4">
          <h2 className="text-2xl font-semibold leading-snug">
            Staff &amp; Recruiter Access
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Restricted portal for recruiters, placement officers and system administrators.
          </p>
          <div className="space-y-2 pt-2">
            {Object.entries(ROLE_META).map(([role, meta]) => (
              <div key={role} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5">
                <div className={`w-2 h-2 rounded-full ${meta.color}`} />
                <span className="text-sm text-white/80">{meta.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">Authorised personnel only</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-ink">Staff Login</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Recruiter · Placement Officer · Admin
            </p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-status-danger-bg border border-red-200 text-sm text-status-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email"
                placeholder="your@email.com"
                value={form.email} onChange={handleChange}
                className="form-input" required />
            </div>

            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password} onChange={handleChange}
                  className="form-input pr-9" required />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading}
              className="mt-2 bg-ink hover:bg-ink/90">
              Sign In
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-ink-muted">new recruiter?</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <Link to="/recruiter-register"
            className="flex items-center justify-center gap-2 w-full h-9 text-sm font-medium rounded-lg border border-surface-border hover:bg-surface-subtle transition-colors text-ink-secondary">
            <Building2 size={14} /> Create Recruiter Account
          </Link>

          <p className="text-center text-sm text-ink-secondary mt-4">
            Student?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Use student login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}