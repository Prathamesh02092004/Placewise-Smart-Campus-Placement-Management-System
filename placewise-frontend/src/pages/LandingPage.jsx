import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Building2, ShieldCheck,
  ArrowRight, CheckCircle2,
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Top nav */}
      <header className="border-b border-surface-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <GraduationCap size={18} className="text-white" />
          </div>
          <span className="text-base font-semibold text-ink">PlaceWise</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="h-8 px-4 text-sm font-medium text-ink-secondary hover:text-ink transition-colors rounded-lg hover:bg-surface-subtle"
          >
            Student Login
          </button>
          <button
            onClick={() => navigate('/admin-login')}
            className="h-8 px-4 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            Staff Login
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 bg-surface-muted">
        <div className="max-w-2xl w-full text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-xs font-medium text-brand-700 mb-6">
            <CheckCircle2 size={12} /> Smart Campus Placement System
          </div>
          <h1 className="text-4xl font-semibold text-ink tracking-tight mb-4 text-balance">
            Your Gateway to<br />
            <span className="text-brand-600">Campus Placements</span>
          </h1>
          <p className="text-base text-ink-secondary max-w-md mx-auto text-balance">
            AI-powered job matching, real-time notifications, skill gap analysis,
            and seamless recruiter–student connections — all in one platform.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          <RoleCard
            icon={GraduationCap}
            iconBg="bg-brand-600"
            title="Students"
            description="Browse jobs, upload your resume, get AI skill gap analysis, and track every application."
            primaryLabel="Register"
            secondaryLabel="Login"
            onPrimary={() => navigate('/register')}
            onSecondary={() => navigate('/login')}
            accent="brand"
          />
          <RoleCard
            icon={Building2}
            iconBg="bg-emerald-600"
            title="Recruiters"
            description="Post jobs, review AI-ranked candidates, schedule interviews and release offer letters."
            primaryLabel="Register"
            secondaryLabel="Login"
            onPrimary={() => navigate('/recruiter-register')}
            onSecondary={() => navigate('/admin-login')}
            accent="emerald"
          />
          <RoleCard
            icon={ShieldCheck}
            iconBg="bg-purple-600"
            title="TPO / Admin"
            description="Verify students, approve companies, manage the full placement lifecycle with analytics."
            primaryLabel="Sign In"
            secondaryLabel={null}
            onPrimary={() => navigate('/admin-login')}
            onSecondary={null}
            accent="purple"
          />
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl mt-10">
          {[
            { label: 'AI Resume Parsing' },
            { label: 'Skill Gap Analysis' },
            { label: 'Real-time Notifications' },
            { label: 'Analytics Dashboard' },
          ].map((f) => (
            <div key={f.label}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-surface-border text-xs font-medium text-ink-secondary">
              <CheckCircle2 size={13} className="text-brand-500 shrink-0" />
              {f.label}
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-ink-muted border-t border-surface-border bg-white">
        PlaceWise &copy; {new Date().getFullYear()} — Smart Campus Placement &amp; Management System
      </footer>
    </div>
  )
}

function RoleCard({ icon: Icon, iconBg, title, description, primaryLabel, secondaryLabel, onPrimary, onSecondary, accent }) {
  const accentMap = {
    brand:   { ring: 'hover:border-brand-300',   btn: 'bg-brand-600 hover:bg-brand-700',   ghost: 'text-brand-600 hover:bg-brand-50' },
    emerald: { ring: 'hover:border-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700', ghost: 'text-emerald-600 hover:bg-emerald-50' },
    purple:  { ring: 'hover:border-purple-300',  btn: 'bg-purple-600 hover:bg-purple-700',  ghost: 'text-purple-600 hover:bg-purple-50' },
  }
  const a = accentMap[accent]

  return (
    <div className={`card p-5 flex flex-col gap-4 transition-all duration-200 ${a.ring}`}>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
        <p className="text-xs text-ink-secondary leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col gap-2 mt-auto">
        <button
          onClick={onPrimary}
          className={`w-full h-9 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-1.5 ${a.btn}`}
        >
          {primaryLabel} <ArrowRight size={14} />
        </button>
        {secondaryLabel && (
          <button
            onClick={onSecondary}
            className={`w-full h-9 rounded-lg text-sm font-medium border border-surface-border transition-colors ${a.ghost}`}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}