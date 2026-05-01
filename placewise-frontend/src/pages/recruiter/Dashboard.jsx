import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Users, PlusCircle, ChevronRight, Clock, TrendingUp } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import StatCard        from '@/components/common/StatCard'
import { PageLoader }  from '@/components/common/Loader'
import EmptyState      from '@/components/common/EmptyState'
import Badge           from '@/components/common/Badge'
import Button          from '@/components/common/Button'
import {
  fetchMyJobs,
  selectMyJobs,
  selectMyJobsLoading,
} from '@/features/jobs/jobsSlice'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { formatDate }        from '@/utils/date'

export default function RecruiterDashboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user     = useSelector(selectCurrentUser)
  // Use the recruiter-specific selector so all own jobs appear,
  // including drafts and closed listings from previous sessions.
  const jobs     = useSelector(selectMyJobs)
  const loading  = useSelector(selectMyJobsLoading)

  useEffect(() => {
    // GET /jobs/my-jobs — returns this recruiter's jobs regardless of status
    dispatch(fetchMyJobs({ page: 1, limit: 50 }))
  }, [dispatch])

  const activeJobs       = jobs.filter((j) => j.status === 'active')
  const totalApplicants  = jobs.reduce((acc, j) => acc + (Number(j.applicant_count)  ?? 0), 0)
  const totalShortlisted = jobs.reduce((acc, j) => acc + (Number(j.shortlisted_count) ?? 0), 0)

  if (loading) return <DashboardLayout><PageLoader text="Loading dashboard…" /></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="page-container space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-ink">
              Welcome back, {user?.name?.split(' ')[0] ?? 'Recruiter'}
            </h1>
            <p className="text-sm text-ink-secondary mt-0.5">{user?.company_name ?? 'Your Company'}</p>
          </div>
          <Button
            leftIcon={<PlusCircle size={15} />}
            onClick={() => navigate('/recruiter/post-job')}
          >
            Post a Job
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Active Jobs"
            value={activeJobs.length}
            icon={Briefcase}
            iconBg="bg-brand-50"
            iconColor="text-brand-600"
          />
          <StatCard
            title="Total Applicants"
            value={totalApplicants}
            icon={Users}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            title="Shortlisted"
            value={totalShortlisted}
            icon={TrendingUp}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>

        {/* All job listings — shows every status so recruiters see their history */}
        <div className="card">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-divider">
            <div>
              <h2 className="section-title">Your Job Postings</h2>
              <p className="section-subtitle">All jobs — active, draft and closed</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/recruiter/jobs')}>
              View All
            </Button>
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No job postings yet"
              description="Post your first job to start receiving applications."
              action={
                <Button leftIcon={<PlusCircle size={14} />} onClick={() => navigate('/recruiter/post-job')}>
                  Post a Job
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-surface-divider">
              {jobs.slice(0, 10).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-muted cursor-pointer transition-colors"
                  onClick={() => navigate(`/recruiter/jobs/${job.id}/candidates`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{job.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-ink-muted flex items-center gap-1">
                        <Clock size={10} /> {job.deadline ? `Deadline: ${formatDate(job.deadline)}` : 'No deadline'}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {job.applicant_count ?? 0} applied
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <Badge
                      variant={job.status === 'active' ? 'success' : job.status === 'draft' ? 'warning' : 'default'}
                      size="sm"
                    >
                      {job.status}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {job.applicant_count ?? 0} applied
                    </Badge>
                    <ChevronRight size={15} className="text-ink-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}