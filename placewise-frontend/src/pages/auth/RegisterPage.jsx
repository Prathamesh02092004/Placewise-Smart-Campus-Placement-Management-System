import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import {
  register,
  selectAuthLoading,
  selectAuthError,
  clearAuthError,
  selectIsAuthenticated,
} from '@/features/auth/authSlice'
import Button from '@/components/common/Button'
import toast from 'react-hot-toast'

const BRANCHES = [
  'Computer Engineering', 'Electronics and Telecommunication',
  'Information Technology', 'Mechanical Engineering',
  'Civil Engineering', 'Electrical Engineering',
  'Chemical Engineering', 'Instrumentation Engineering',
]

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector(selectAuthLoading)
  const error   = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    branch: '', cgpa: '', year_of_study: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (isAuthenticated) navigate('/student/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => () => { dispatch(clearAuthError()) }, [dispatch])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    if (error) dispatch(clearAuthError())
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())         errs.name     = 'Full name is required'
    if (!form.email.includes('@')) errs.email    = 'Enter a valid email'
    if (form.password.length < 8)  errs.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    // Build payload that exactly matches the backend registerSchema
    const payload = {
      role:     'student',          // required by backend
      name:     form.name.trim(),
      email:    form.email.trim(),
      password: form.password,
    }

    // Only include optional fields if they have a value
    if (form.branch)        payload.branch        = form.branch
    if (form.year_of_study) payload.year_of_study = parseInt(form.year_of_study)
    if (form.cgpa)          payload.cgpa          = parseFloat(form.cgpa)

    const result = await dispatch(register(payload))

    if (register.fulfilled.match(result)) {
      toast.success('Account created! You can now log in.')
      navigate('/login')
    } else {
      toast.error(result.payload || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink transition-colors"
        >
          <span>←</span> Back to Home
        </Link>
      </div>

      <div className="w-full max-w-sm card p-8 animate-slide-up">
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center shadow-card mb-4">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-ink">Student Registration</h1>
          <p className="text-sm text-ink-secondary mt-1">Create your placement portal account</p>
        </div>

        {error && (
          <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-status-danger-bg border border-red-200 text-sm text-status-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name" name="name" type="text" autoComplete="name"
              placeholder="Enter your full name"
              value={form.name} onChange={handleChange}
              className={`form-input ${fieldErrors.name ? 'border-status-danger' : ''}`}
            />
            {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              placeholder="your.email@example.com"
              value={form.email} onChange={handleChange}
              className={`form-input ${fieldErrors.email ? 'border-status-danger' : ''}`}
            />
            {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
          </div>

          {/* Branch */}
          <div>
            <label className="form-label" htmlFor="branch">Branch</label>
            <select
              id="branch" name="branch"
              value={form.branch} onChange={handleChange}
              className="form-input bg-white"
            >
              <option value="">Select your branch</option>
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Year & CGPA side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label" htmlFor="year_of_study">Year</label>
              <select
                id="year_of_study" name="year_of_study"
                value={form.year_of_study} onChange={handleChange}
                className="form-input bg-white"
              >
                <option value="">Select</option>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="cgpa">CGPA</label>
              <input
                id="cgpa" name="cgpa" type="number"
                step="0.01" min="0" max="10"
                placeholder="e.g. 8.5"
                value={form.cgpa} onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="form-label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password" name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={form.password} onChange={handleChange}
                className={`form-input pr-9 ${fieldErrors.password ? 'border-status-danger' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword" name="confirmPassword"
              type="password" autoComplete="new-password"
              placeholder="Re-enter your password"
              value={form.confirmPassword} onChange={handleChange}
              className={`form-input ${fieldErrors.confirmPassword ? 'border-status-danger' : ''}`}
            />
            {fieldErrors.confirmPassword && (
              <p className="form-error">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-1">
            Register
          </Button>
        </form>

        <p className="text-center text-sm text-ink-secondary mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-medium">Login here</Link>
        </p>
      </div>
    </div>
  )
}