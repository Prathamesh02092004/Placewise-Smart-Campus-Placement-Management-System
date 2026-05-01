import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, MapPin, Clock, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import SkillGapAlert from '@/components/student/SkillGapAlert'
import { fetchJobById, selectSelectedJob, selectJobLoading } from '@/features/jobs/jobsSlice'
import {
  submitApplication, selectApplicationsSubmitting,
  selectHasAppliedToJob, selectApplicationsError,
} from '@/features/applications/applicationsSlice'
import { formatDate } from '@/utils/date'
import toast from 'react-hot-toast'

export default function JobDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const job = useSelector(selectSelectedJob)
  const loading = useSelector(selectJobLoading)
  const submitting = useSelector(selectApplicationsSubmitting)
  const hasApplied = useSelector(selectHasAppliedToJob(id))
  const appError = useSelector(selectApplicationsError)

  useEffect(() => {
    if (id) dispatch(fetchJobById(id))
  }, [id, dispatch])

  const handleApply = async () => {
    const result = await dispatch(submitApplication({ job_id: id }))
    if (submitApplication.fulfilled.match(result)) {
      toast.success('Application submitted!')
    } else {
      toast.error(result.payload || 'Could not submit application.')
    }
  }

  if (loading) return <DashboardLayout><PageLoader text="Loading job…" /></DashboardLayout>
  if (!job) return <DashboardLayout><div className="page-container"><p className="text-ink-secondary text-sm">Job not found.</p></div></DashboardLayout>

  const skills = Array.isArray(job.required_skills) ? job.required_skills : []
  const branches = Array.isArray(job.eligible_branches) ? job.eligible_branches : []

  return (
    <DashboardLayout>
      <div className="page-container max-w-3xl animate-fade-in space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate('/student/jobs')}
          className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} /> Back to Jobs
        </button>

        {/* Header card */}
        <div className="card-padded space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-ink">{job.title}</h1>
              <p className="text-sm font-medium text-ink-secondary mt-0.5">
                {job.company_name ?? job.recruiter?.company_name}
              </p>
            </div>
            <div className="shrink-0">
              {hasApplied ? (
                <Badge variant="success" size="md">
                  <CheckCircle2 size={12} /> Applied
                </Badge>
              ) : (
                <Button onClick={handleApply} loading={submitting} disabled={hasApplied}>
                  Apply Now
                </Button>
              )}
            </div>
          </div>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            {job.location && (
              <Badge variant="default"><MapPin size={11} /> {job.location}</Badge>
            )}
            {job.deadline && (
              <Badge variant="warning"><Clock size={11} /> {formatDate(job.deadline)}</Badge>
            )}
            {job.min_cgpa && (
              <Badge variant="default">Min CGPA {job.min_cgpa}</Badge>
            )}
            {job.package_lpa && (
              <Badge variant="success">₹{job.package_lpa} LPA</Badge>
            )}
            {job.slots && (
              <Badge variant="default"><Briefcase size={11} /> {job.slots} opening{job.slots !== 1 ? 's' : ''}</Badge>
            )}
          </div>

          {/* Eligible branches */}
          {branches.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1.5">Eligible Branches</p>
              <div className="flex flex-wrap gap-1.5">
                {branches.map((b) => <Badge key={b} variant="info" size="sm">{b}</Badge>)}
              </div>
            </div>
          )}
        </div>

        {/* Skill Gap Alert */}
        <SkillGapAlert jobId={id} />

        {/* Description */}
        {job.description && (
          <div className="card-padded">
            <h2 className="section-title mb-3">Job Description</h2>
            <p className="text-sm text-ink-secondary whitespace-pre-line leading-relaxed">{job.description}</p>
          </div>
        )}

        {/* Required skills */}
        {skills.length > 0 && (
          <div className="card-padded">
            <h2 className="section-title mb-3">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => <Badge key={s} variant="default">{s}</Badge>)}
            </div>
          </div>
        )}

        {/* Apply CTA footer */}
        {!hasApplied && (
          <div className="card-padded flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Ready to apply?</p>
              <p className="text-xs text-ink-secondary mt-0.5">Your profile will be shared with the recruiter.</p>
            </div>
            {appError && (
              <p className="text-xs text-status-danger flex items-center gap-1">
                <AlertCircle size={12} /> {appError}
              </p>
            )}
            <Button onClick={handleApply} loading={submitting}>Apply Now</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}