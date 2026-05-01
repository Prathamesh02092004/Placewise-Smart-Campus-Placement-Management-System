import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import {
  login, selectAuthLoading, selectAuthError,
  clearAuthError, selectIsAuthenticated, selectCurrentUser,
} from '@/features/auth/authSlice'
import Button from '@/components/common/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const dispatch        = useDispatch()
  const navigate        = useNavigate()
  const location        = useLocation()
  const loading         = useSelector(selectAuthLoading)
  const error           = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user            = useSelector(selectCurrentUser)

  const [form, setForm]               = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const from = location.state?.from?.pathname

  useEffect(() => {
    if (isAuthenticated && user) {
      const map = {
        student:   '/student/dashboard',
        recruiter: '/recruiter/dashboard',
        placement: '/placement/dashboard',
        admin:     '/admin/dashboard',
      }
      navigate(from || map[user.role] || '/', { replace: true })
    }
  }, [isAuthenticated, user, navigate, from])

  useEffect(() => () => { dispatch(clearAuthError()) }, [dispatch])

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    if (error) dispatch(clearAuthError())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return }
    const result = await dispatch(login(form))
    if (login.fulfilled.match(result)) toast.success('Welcome back!')
  }

  return (
    <div className="min-h-screen bg-surface-muted flex">

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col w-96 bg-brand-600 p-10 text-white">
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="text-base font-semibold">PlaceWise</span>
        </div>
        <div className="mb-auto">
          <h2 className="text-2xl font-semibold leading-snug mb-3">
            Your campus placement, streamlined.
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed">
            AI-powered job matching, real-time notifications and skill gap analysis — all in one platform.
          </p>
        </div>
        <p className="text-brand-300 text-xs">Student Portal · PlaceWise 2025–26</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-ink">Student Login</h1>
            <p className="text-sm text-ink-secondary mt-1">Access your placement portal account</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-status-danger-bg border border-red-200 text-sm text-status-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                <input id="email" name="email" type="email" autoComplete="email"
                  placeholder="your.email@example.com"
                  value={form.email} onChange={handleChange}
                  className="form-input pl-9" required />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                <input id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password} onChange={handleChange}
                  className="form-input pl-9 pr-9" required />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} className="mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-ink-secondary mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
              Register here
            </Link>
          </p>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-xs text-ink-muted">not a student?</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <Link to="/admin-login"
            className="flex items-center justify-center gap-2 w-full h-9 text-sm font-medium rounded-lg border border-surface-border hover:bg-surface-subtle transition-colors text-ink-secondary">
            Recruiter / TPO / Admin Login
          </Link>
        </div>
      </div>
    </div>
  )
}