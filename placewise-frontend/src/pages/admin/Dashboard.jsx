import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Briefcase, CheckCircle2, Clock,
  ChevronRight, Building2, RefreshCw, ScrollText,
} from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import StatCard from '@/components/common/StatCard'
import { PageLoader } from '@/components/common/Loader'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import api from '@/services/api'
import { formatDistanceToNow } from '@/utils/date'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/features/auth/authSlice'

const ROLE_VARIANT = { student: 'info', recruiter: 'success', placement: 'purple', admin: 'warning' }

export default function AdminDashboard() {
  const navigate = useNavigate()
  const user     = useSelector(selectCurrentUser)

  const [stats,        setStats]        = useState(null)
  const [recentUsers,  setRecentUsers]  = useState([])
  const [recentJobs,   setRecentJobs]   = useState([])
  const [loading,      setLoading]      = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, jobsRes] = await Promise.allSettled([
        api.get('/placement/stats'),   // reuse placement stats — same data
        api.get('/admin/users', { params: { limit: 6, page: 1 } }),
        api.get('/jobs', { params: { limit: 5, page: 1 } }),
      ])

      if (statsRes.status === 'fulfilled')
        setStats(statsRes.value.data.data ?? statsRes.value.data)

      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data
        setRecentUsers(d.data ?? d.users ?? [])
      }

      if (jobsRes.status === 'fulfilled') {
        const d = jobsRes.value.data
        setRecentJobs(d.data ?? d.jobs ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  if (loading) return (
    <DashboardLayout><PageLoader text="Loading admin dashboard…" /></DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-ink">Admin Dashboard</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Welcome back, {user?.name ?? 'Admin'} · System overview
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total Students"     value={stats?.totalStudents ?? 0}
            icon={Users}        iconBg="bg-brand-50"   iconColor="text-brand-600" />
          <StatCard title="Active Jobs"        value={stats?.activeJobs ?? 0}
            icon={Briefcase}    iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard title="Total Applications" value={stats?.totalApplications ?? 0}
            icon={Clock}        iconBg="bg-amber-50"   iconColor="text-amber-600" />
          <StatCard title="Placed Students"    value={stats?.totalPlaced ?? 0}
            icon={CheckCircle2} iconBg="bg-purple-50"  iconColor="text-purple-600" />
        </div>

        {/* Two column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent users */}
          <div className="card">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-surface-divider">
              <div>
                <h2 className="section-title">Recent Users</h2>
                <p className="section-subtitle">Latest registrations across all roles</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/admin/users')}>
                View All
              </Button>
            </div>
            <div className="divide-y divide-surface-divider">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted transition-colors">
                  <div className="w-8 h-8 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-ink-secondary">
                      {u.email?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{u.email}</p>
                    <p className="text-xs text-ink-muted">{formatDistanceToNow(u.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={ROLE_VARIANT[u.role] ?? 'default'} size="sm">{u.role}</Badge>
                    <Badge variant={u.is_active ? 'success' : 'danger'} size="sm">
                      {u.is_active ? 'active' : 'off'}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-sm text-ink-muted px-5 py-6 text-center">No users yet.</p>
              )}
            </div>
          </div>

          {/* Recent jobs */}
          <div className="card">
            <div className="px-5 pt-5 pb-3 border-b border-surface-divider">
              <h2 className="section-title">Recent Job Postings</h2>
              <p className="section-subtitle">Latest jobs across all companies</p>
            </div>
            <div className="divide-y divide-surface-divider">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{job.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <Building2 size={10} />
                        {job.recruiter?.company_name ?? '—'}
                      </span>
                      {job.package_lpa && (
                        <span className="text-xs text-status-success font-medium">
                          ₹{job.package_lpa} LPA
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={job.status === 'active' ? 'success' : job.status === 'draft' ? 'warning' : 'default'} size="sm">
                    {job.status}
                  </Badge>
                </div>
              ))}
              {recentJobs.length === 0 && (
                <p className="text-sm text-ink-muted px-5 py-6 text-center">No jobs posted yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AdminQuickLink title="Manage Users"
            description="Activate, suspend or delete accounts across all roles."
            icon={Users} onClick={() => navigate('/admin/users')} />
          <AdminQuickLink title="Audit Logs"
            description="View complete log of all system write actions."
            icon={ScrollText} onClick={() => navigate('/admin/audit-logs')} />
          <AdminQuickLink title="Refresh Stats"
            description="Reload all dashboard statistics from the database."
            icon={RefreshCw} onClick={loadAll} />
        </div>

      </div>
    </DashboardLayout>
  )
}

function AdminQuickLink({ title, description, icon: Icon, onClick }) {
  return (
    <button onClick={onClick}
      className="card-padded text-left flex items-center gap-4 hover:shadow-card-md transition-all group">
      <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-center shrink-0 group-hover:bg-brand-50 group-hover:border-brand-200 transition-colors">
        <Icon size={18} className="text-ink-muted group-hover:text-brand-600 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-xs text-ink-secondary mt-0.5 leading-snug">{description}</p>
      </div>
      <ChevronRight size={15} className="text-ink-muted shrink-0" />
    </button>
  )
}