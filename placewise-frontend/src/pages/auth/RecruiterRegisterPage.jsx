import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Building2, Eye, EyeOff, ArrowLeft, Info } from 'lucide-react'
import {
  register, selectAuthLoading, selectAuthError,
  clearAuthError, selectIsAuthenticated,
} from '@/features/auth/authSlice'
import Button from '@/components/common/Button'
import toast from 'react-hot-toast'

export default function RecruiterRegisterPage() {
  const dispatch        = useDispatch()
  const navigate        = useNavigate()
  const loading         = useSelector(selectAuthLoading)
  const error           = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const [form, setForm]               = useState({
    name: '', email: '', password: '', confirmPassword: '',
    company_name: '', designation: '', phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors,  setFieldErrors]  = useState({})

  useEffect(() => {
    if (isAuthenticated) navigate('/recruiter/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => () => { dispatch(clearAuthError()) }, [dispatch])

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
    setFieldErrors((p) => ({ ...p, [e.target.name]: '' }))
    if (error) dispatch(clearAuthError())
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim())         errs.name         = 'Full name is required'
    if (!form.email.includes('@')) errs.email        = 'Enter a valid email'
    if (!form.company_name.trim()) errs.company_name = 'Company name is required'
    if (form.password.length < 8)  errs.password     = 'Minimum 8 characters'
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    const result = await dispatch(register({
      role:         'recruiter',
      name:         form.name.trim(),
      email:        form.email.trim(),
      password:     form.password,
      company_name: form.company_name.trim(),
      ...(form.designation && { designation: form.designation.trim() }),
      ...(form.phone        && { phone:       form.phone.trim() }),
    }))

    if (register.fulfilled.match(result)) {
      toast.success('Account created! You can now log in and submit jobs for TPO approval.')
      navigate('/admin-login')
    } else {
      toast.error(result.payload || 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted flex">

      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-96 bg-emerald-600 p-10 text-white">
        <div className="flex items-center gap-2.5 mb-auto">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="text-base font-semibold">PlaceWise Recruiter</span>
        </div>
        <div className="mb-auto space-y-4">
          <h2 className="text-2xl font-semibold leading-snug">
            Reach the best campus talent.
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Post jobs, review AI-ranked candidates, schedule interviews and release offers — all from one dashboard.
          </p>
          <div className="space-y-2 pt-2">
            {['Post jobs in minutes', 'AI-ranked candidates', 'Real-time notifications', 'One-click interview scheduling'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-emerald-300 text-xs">Jobs require TPO approval before going live</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">

          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink mb-8 transition-colors">
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-ink">Recruiter Registration</h1>
            <p className="text-sm text-ink-secondary mt-1">Create your company account</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-status-danger-bg border border-red-200 text-sm text-status-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                className={`form-input ${fieldErrors.name ? 'border-status-danger' : ''}`}
                placeholder="Your full name" />
              {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="form-label">Work Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className={`form-input ${fieldErrors.email ? 'border-status-danger' : ''}`}
                placeholder="hr@company.com" />
              {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="form-label">Company Name *</label>
              <input name="company_name" value={form.company_name} onChange={handleChange}
                className={`form-input ${fieldErrors.company_name ? 'border-status-danger' : ''}`}
                placeholder="e.g. Google India Pvt. Ltd." />
              {fieldErrors.company_name && <p className="form-error">{fieldErrors.company_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Designation</label>
                <input name="designation" value={form.designation} onChange={handleChange}
                  className="form-input" placeholder="HR Manager" />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  className="form-input" placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <label className="form-label">Password *</label>
              <div className="relative">
                <input name="password" type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  className={`form-input pr-9 ${fieldErrors.password ? 'border-status-danger' : ''}`}
                  placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="form-label">Confirm Password *</label>
              <input name="confirmPassword" type="password" value={form.confirmPassword}
                onChange={handleChange}
                className={`form-input ${fieldErrors.confirmPassword ? 'border-status-danger' : ''}`}
                placeholder="Re-enter your password" />
              {fieldErrors.confirmPassword && <p className="form-error">{fieldErrors.confirmPassword}</p>}
            </div>

            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <Info size={13} className="shrink-0 mt-0.5" />
              Your account needs TPO approval before you can post jobs. After approval, job postings are also reviewed before going live to students.
            </div>

            <Button type="submit" fullWidth loading={loading}
              className="bg-emerald-600 hover:bg-emerald-700">
              Create Recruiter Account
            </Button>
          </form>

          <p className="text-center text-sm text-ink-secondary mt-5">
            Already have an account?{' '}
            <Link to="/admin-login" className="font-medium text-emerald-600 hover:text-emerald-700">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}