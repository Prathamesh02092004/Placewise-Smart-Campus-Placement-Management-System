import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Users, Clock, PlusCircle,
  ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { fetchMyJobs, updateJob, selectJobs, selectJobsLoading } from '@/features/jobs/jobsSlice'
import { formatDate } from '@/utils/date'
import toast from 'react-hot-toast'

export default function RecruiterJobs() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const jobs    = useSelector(selectJobs)
  const loading = useSelector(selectJobsLoading)

  useEffect(() => {
    // Fetch only this recruiter's own jobs
    dispatch(fetchMyJobs({ page: 1, limit: 50 }))
  }, [dispatch])

  const handleToggleStatus = async (job) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active'
    const result = await dispatch(updateJob({ id: job.id, data: { status: newStatus } }))
    if (updateJob.fulfilled.match(result)) {
      toast.success(`Job marked as ${newStatus}`)
    } else {
      toast.error('Could not update job status.')
    }
  }

  if (loading) return (
    <DashboardLayout>
      <PageLoader text="Loading your jobs…" />
    </DashboardLayout>
  )

  const active = jobs.filter((j) => j.status === 'active')
  const draft  = jobs.filter((j) => j.status === 'draft')
  const closed = jobs.filter((j) => j.status === 'closed')

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in space-y-6">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">My Job Postings</h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              {active.length} active · {draft.length} pending approval · {closed.length} closed
            </p>
          </div>
          <Button
            leftIcon={<PlusCircle size={15} />}
            onClick={() => navigate('/recruiter/post-job')}
          >
            Post a Job
          </Button>
        </div>

        {jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs posted yet"
            description="Create your first job posting to start receiving applications from students."
            action={
              <Button
                leftIcon={<PlusCircle size={14} />}
                onClick={() => navigate('/recruiter/post-job')}
              >
                Post a Job
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {[...active, ...draft, ...closed].map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onViewCandidates={() => navigate(`/recruiter/jobs/${job.id}/candidates`)}
                onToggle={() => handleToggleStatus(job)}
              />
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}

function JobRow({ job, onViewCandidates, onToggle }) {
  const isActive = job.status === 'active'
  const isDraft  = job.status === 'draft'

  return (
    <div className="card-padded hover:shadow-card-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-ink">{job.title}</h3>
            <Badge
              variant={isActive ? 'success' : isDraft ? 'warning' : 'default'}
              size="sm"
            >
              {isActive ? 'Active' : isDraft ? 'Pending Approval' : 'Closed'}
            </Badge>
            {job.role_category && (
              <Badge variant="info" size="sm">
                {job.role_category.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Users size={11} /> {job.applicant_count ?? 0} applicants
            </span>
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Clock size={11} /> Deadline: {formatDate(job.deadline)}
            </span>
            {job.min_cgpa > 0 && (
              <span className="text-xs text-ink-muted">Min CGPA: {job.min_cgpa}</span>
            )}
            {job.package_lpa > 0 && (
              <span className="text-xs font-medium text-status-success">
                ₹{job.package_lpa} LPA
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={onViewCandidates}
            rightIcon={<ChevronRight size={13} />}
          >
            Candidates
          </Button>
          {/* Only allow toggle for active/closed — not draft (needs placement approval) */}
          {!isDraft && (
            <button
              onClick={onToggle}
              title={isActive ? 'Close job' : 'Reopen job'}
              className="p-1.5 rounded-lg hover:bg-surface-subtle transition-colors text-ink-muted hover:text-ink"
            >
              {isActive
                ? <ToggleRight size={20} className="text-status-success" />
                : <ToggleLeft size={20} />
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}