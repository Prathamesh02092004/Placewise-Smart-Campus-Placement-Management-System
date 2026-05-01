import { useEffect, useState, useCallback } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from 'chart.js'
import {
  Users, Briefcase, CheckCircle2, TrendingUp, Building2,
  Download, Clock, UserCheck, RefreshCw, AlertCircle,
  FileText,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '@/components/common/DashboardLayout'
import StatCard from '@/components/common/StatCard'
import { PageLoader } from '@/components/common/Loader'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import api, { getErrorMessage } from '@/services/api'
import { formatDate } from '@/utils/date'
import toast from 'react-hot-toast'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function PlacementDashboard() {
  const navigate = useNavigate()

  const [stats,            setStats]            = useState(null)
  const [pendingStudents,  setPendingStudents]  = useState([])
  const [pendingCompanies, setPendingCompanies] = useState([])
  const [pendingJobs,      setPendingJobs]      = useState([])
  const [recentRecords,    setRecentRecords]    = useState([])
  const [loading,          setLoading]          = useState(true)
  const [verifying,        setVerifying]        = useState({})
  const [approving,        setApproving]        = useState({})
  const [approvingJob,     setApprovingJob]     = useState({})

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, studentsRes, companiesRes, jobsRes, recordsRes] =
        await Promise.allSettled([
          api.get('/placement/stats'),
          api.get('/students', { params: { is_verified: false, limit: 20 } }),
          api.get('/placement/companies/pending'),
          api.get('/jobs', { params: { status: 'draft', limit: 20 } }),
          api.get('/placement/records', { params: { limit: 5 } }),
        ])

      if (statsRes.status === 'fulfilled')
        setStats(statsRes.value.data.data ?? statsRes.value.data)
      if (studentsRes.status === 'fulfilled') {
        const d = studentsRes.value.data
        setPendingStudents(d.data ?? d.students ?? [])
      }
      if (companiesRes.status === 'fulfilled') {
        const d = companiesRes.value.data
        setPendingCompanies(d.data ?? d.companies ?? [])
      }
      if (jobsRes.status === 'fulfilled') {
        const d = jobsRes.value.data
        setPendingJobs(d.data ?? d.jobs ?? [])
      }
      if (recordsRes.status === 'fulfilled') {
        const d = recordsRes.value.data
        setRecentRecords(d.data ?? d.records ?? [])
      }
    } catch {
      toast.error('Failed to load some dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const refreshStats = async () => {
    try {
      const res = await api.get('/placement/stats')
      setStats(res.data.data ?? res.data)
    } catch { /* silent */ }
  }

  const handleVerifyStudent = async (studentId) => {
    setVerifying((p) => ({ ...p, [studentId]: true }))
    try {
      await api.patch(`/students/${studentId}/verify`)
      setPendingStudents((p) => p.filter((s) => s.id !== studentId))
      await refreshStats()
      toast.success('Student verified! They can now apply for jobs.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setVerifying((p) => ({ ...p, [studentId]: false }))
    }
  }

  const handleApproveCompany = async (recruiterId) => {
    setApproving((p) => ({ ...p, [recruiterId]: true }))
    try {
      await api.patch(`/placement/companies/${recruiterId}/approve`)
      setPendingCompanies((p) => p.filter((c) => c.id !== recruiterId))
      toast.success('Company approved! They can now post jobs.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setApproving((p) => ({ ...p, [recruiterId]: false }))
    }
  }

  const handleApproveJob = async (jobId) => {
    setApprovingJob((p) => ({ ...p, [jobId]: true }))
    try {
      await api.patch(`/placement/jobs/${jobId}/approve`)
      setPendingJobs((p) => p.filter((j) => j.id !== jobId))
      await refreshStats()
      toast.success('Job approved! It is now live for students.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setApprovingJob((p) => ({ ...p, [jobId]: false }))
    }
  }

  if (loading) return (
    <DashboardLayout><PageLoader text="Loading placement dashboard…" /></DashboardLayout>
  )

  const branchLabels = stats?.branchBreakdown?.map((b) => b.branch)               ?? []
  const branchCounts = stats?.branchBreakdown?.map((b) => parseInt(b.count ?? 0)) ?? []

  const chartData = {
    labels: branchLabels,
    datasets: [{
      label: 'Placed',
      data: branchCounts,
      backgroundColor: 'rgba(37, 99, 235, 0.85)',
      borderRadius: 6,
    }],
  }

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { size: 11 }, stepSize: 1 } },
    },
  }

  const totalPending = pendingStudents.length + pendingCompanies.length + pendingJobs.length

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">Placement Dashboard</h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              Live overview · Academic Year 2025–26
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" leftIcon={<RefreshCw size={13} />} onClick={loadAll}>
              Refresh
            </Button>
            <Button size="sm" variant="secondary" leftIcon={<Download size={14} />}
              onClick={() => window.open('http://localhost:5000/api/placement/report/export', '_blank')}>
              Export
            </Button>
          </div>
        </div>

        {/* Pending action banner */}
        {totalPending > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1">
              {pendingStudents.length > 0 && (
                <span className="text-sm text-amber-800">
                  <strong>{pendingStudents.length}</strong> student{pendingStudents.length > 1 ? 's' : ''} need verification
                </span>
              )}
              {pendingCompanies.length > 0 && (
                <span className="text-sm text-amber-800">
                  <strong>{pendingCompanies.length}</strong> company registration{pendingCompanies.length > 1 ? 's' : ''} to approve
                </span>
              )}
              {pendingJobs.length > 0 && (
                <span className="text-sm text-amber-800">
                  <strong>{pendingJobs.length}</strong> job posting{pendingJobs.length > 1 ? 's' : ''} awaiting approval
                </span>
              )}
            </div>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Total Students"     value={stats?.totalStudents ?? 0}
            icon={Users}        iconBg="bg-brand-50"   iconColor="text-brand-600" />
          <StatCard title="Verified Students"  value={stats?.verifiedStudents ?? 0}
            icon={UserCheck}    iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard title="Active Jobs"        value={stats?.activeJobs ?? 0}
            icon={Briefcase}    iconBg="bg-purple-50"  iconColor="text-purple-600" />
          <StatCard title="Placed"             value={stats?.totalPlaced ?? 0}
            icon={CheckCircle2} iconBg="bg-amber-50"   iconColor="text-amber-600"
            trend="up"
            trendValue={`${parseFloat(stats?.placementRate ?? 0).toFixed(1)}%`}
            trendLabel="rate" />
        </div>

        {/* Chart + company breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card-padded">
            <h2 className="section-title mb-4">Branch-wise Placements</h2>
            <div className="h-52">
              {branchLabels.length > 0
                ? <Bar data={chartData} options={chartOptions} />
                : <div className="flex items-center justify-center h-full text-sm text-ink-muted">
                    No placement records yet.
                  </div>
              }
            </div>
          </div>

          <div className="card">
            <div className="px-5 pt-5 pb-3 border-b border-surface-divider">
              <h2 className="section-title">Top Hiring Companies</h2>
            </div>
            <div className="divide-y divide-surface-divider">
              {(stats?.companyBreakdown ?? []).slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{c.company}</p>
                    {c.avg_package && (
                      <p className="text-xs text-ink-muted">Avg ₹{parseFloat(c.avg_package).toFixed(1)} LPA</p>
                    )}
                  </div>
                  <Badge variant="success" size="sm">{c.count} placed</Badge>
                </div>
              ))}
              {(stats?.companyBreakdown ?? []).length === 0 && (
                <p className="text-sm text-ink-muted px-5 py-6 text-center">No placements yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Pending Student Verifications ── */}
        <PendingSection
          id="pending-students"
          icon={<UserCheck size={15} className="text-amber-500" />}
          title="Pending Student Verifications"
          subtitle={pendingStudents.length === 0
            ? 'All profiles verified'
            : `${pendingStudents.length} profile${pendingStudents.length > 1 ? 's' : ''} awaiting review`}
          empty={pendingStudents.length === 0}
          emptyMessage="All student profiles are verified."
        >
          {pendingStudents.map((student) => (
            <div key={student.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-brand-600">
                  {student.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{student.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {student.user?.email && (
                    <p className="text-xs text-ink-muted">{student.user.email}</p>
                  )}
                  {student.branch && <Badge variant="default" size="sm">{student.branch}</Badge>}
                  {student.cgpa    && <span className="text-xs text-ink-muted">CGPA {student.cgpa}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="warning" size="sm">Unverified</Badge>
                <Button size="sm" variant="outline-brand"
                  loading={verifying[student.id]}
                  onClick={() => handleVerifyStudent(student.id)}>
                  Verify
                </Button>
              </div>
            </div>
          ))}
        </PendingSection>

        {/* ── Pending Company Approvals ── */}
        <PendingSection
          id="pending-companies"
          icon={<Building2 size={15} className="text-blue-500" />}
          title="Pending Company Approvals"
          subtitle={pendingCompanies.length === 0
            ? 'No pending registrations'
            : `${pendingCompanies.length} company${pendingCompanies.length > 1 ? 's' : ''} to approve`}
          empty={pendingCompanies.length === 0}
          emptyMessage="No pending company approvals."
        >
          {pendingCompanies.map((company) => (
            <div key={company.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <Building2 size={16} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{company.company_name}</p>
                <p className="text-xs text-ink-muted">
                  {company.name} · {company.user?.email}
                </p>
                {company.industry && <Badge variant="info" size="sm" className="mt-1">{company.industry}</Badge>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="warning" size="sm">Pending</Badge>
                <Button size="sm" variant="primary"
                  loading={approving[company.id]}
                  onClick={() => handleApproveCompany(company.id)}>
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </PendingSection>

        {/* ── Pending Job Approvals ── */}
        <PendingSection
          id="pending-jobs"
          icon={<FileText size={15} className="text-purple-500" />}
          title="Pending Job Approvals"
          subtitle={pendingJobs.length === 0
            ? 'No pending job postings'
            : `${pendingJobs.length} job${pendingJobs.length > 1 ? 's' : ''} submitted for review`}
          empty={pendingJobs.length === 0}
          emptyMessage="No job postings awaiting approval."
        >
          {pendingJobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <Briefcase size={15} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{job.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs text-ink-muted">{job.recruiter?.company_name ?? '—'}</p>
                  {job.package_lpa > 0 && (
                    <span className="text-xs font-medium text-status-success">₹{job.package_lpa} LPA</span>
                  )}
                  {job.deadline && (
                    <span className="text-xs text-ink-muted">Deadline: {formatDate(job.deadline)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="warning" size="sm">Draft</Badge>
                <Button size="sm" variant="primary"
                  loading={approvingJob[job.id]}
                  onClick={() => handleApproveJob(job.id)}>
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </PendingSection>

        {/* Recent placements */}
        {recentRecords.length > 0 && (
          <div className="card">
            <div className="px-5 pt-5 pb-3 border-b border-surface-divider">
              <h2 className="section-title">Recent Placements</h2>
            </div>
            <div className="divide-y divide-surface-divider">
              {recentRecords.map((record) => (
                <div key={record.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-emerald-600">
                      {record.student?.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{record.student?.name ?? '—'}</p>
                    <p className="text-xs text-ink-muted">
                      {record.job?.recruiter?.company_name ?? record.job?.title ?? '—'}
                      {record.package_lpa ? ` · ₹${record.package_lpa} LPA` : ''}
                    </p>
                  </div>
                  <Badge variant="success" size="sm">Placed</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avg package */}
        {parseFloat(stats?.avgPackage ?? 0) > 0 && (
          <div className="card-padded flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                Average Package: ₹{parseFloat(stats.avgPackage).toFixed(2)} LPA
              </p>
              <p className="text-xs text-ink-muted">
                Across {stats.totalPlaced} placed students
              </p>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}

// Reusable section wrapper
function PendingSection({ id, icon, title, subtitle, empty, emptyMessage, children }) {
  return (
    <div id={id} className="card">
      <div className="px-5 pt-5 pb-3 border-b border-surface-divider">
        <h2 className="section-title flex items-center gap-2">{icon}{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
      </div>
      {empty ? (
        <div className="px-5 py-6 flex items-center gap-2 text-sm text-ink-muted justify-center">
          <CheckCircle2 size={16} className="text-status-success" />
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-surface-divider">{children}</div>
      )}
    </div>
  )
}