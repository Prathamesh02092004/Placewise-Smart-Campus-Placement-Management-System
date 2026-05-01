import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, Building2 } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/Badge'
import Button from '@/components/common/Button'
import {
  fetchMyApplications,
  selectApplications,
  selectApplicationsLoading,
} from '@/features/applications/applicationsSlice'
import { formatDate, formatDistanceToNow, formatDateTime } from '@/utils/date'

const STATUS_ORDER = [
  'applied', 'under_review', 'shortlisted',
  'interview_scheduled', 'offer_received', 'placed', 'rejected',
]

const TIMELINE_STEPS = [
  { key: 'applied',             label: 'Applied' },
  { key: 'under_review',        label: 'Under Review' },
  { key: 'shortlisted',         label: 'Shortlisted' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'offer_received',      label: 'Offer' },
  { key: 'placed',              label: 'Placed' },
]

const BACKEND_URL = 'http://localhost:5000'

export default function StudentApplications() {
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const applications = useSelector(selectApplications)
  const loading      = useSelector(selectApplicationsLoading)

  useEffect(() => { dispatch(fetchMyApplications()) }, [dispatch])

  if (loading) return <DashboardLayout><PageLoader text="Loading applications…" /></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-ink">My Applications</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            {applications.length} application{applications.length !== 1 ? 's' : ''} submitted
          </p>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Browse available jobs and apply to get started."
            action={<Button onClick={() => navigate('/student/jobs')}>Browse Jobs</Button>}
          />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function ApplicationCard({ app }) {
  const isRejected    = app.status === 'rejected'
  const timelineIndex = TIMELINE_STEPS.findIndex((s) => s.key === app.status)

  // company_name comes from job.recruiter.company_name in the real backend response
  const companyName =
    app.job?.recruiter?.company_name ??
    app.job?.company_name ??
    '—'

  const offerUrl = app.placementRecord?.offer_letter_url
  const fullOfferUrl = offerUrl
    ? (offerUrl.startsWith('http') ? offerUrl : `${BACKEND_URL}${offerUrl}`)
    : null

  return (
    <div className="card-padded animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate">
            {app.job?.title ?? 'Job Title'}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-ink-secondary">
              <Building2 size={11} /> {companyName}
            </span>
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Clock size={11} /> Applied {formatDistanceToNow(app.applied_at)}
            </span>
            {app.job?.package_lpa && (
              <span className="text-xs font-medium text-status-success">
                ₹{app.job.package_lpa} LPA
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={app.status} />
          {app.ai_score != null && (
            <span className="text-xs text-ink-muted font-mono">
              {parseFloat(app.ai_score).toFixed(0)}% match
            </span>
          )}
        </div>
      </div>

      {/* Timeline */}
      {!isRejected && (
        <div className="flex items-center">
          {TIMELINE_STEPS.map((step, i) => {
            const done   = i <= timelineIndex
            const active = i === timelineIndex
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-center">
                  {i > 0 && (
                    <div className={`flex-1 h-0.5 ${done ? 'bg-brand-500' : 'bg-surface-border'}`} />
                  )}
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                    active ? 'bg-brand-500 border-brand-500' :
                    done   ? 'bg-brand-400 border-brand-400' :
                             'bg-white border-surface-border'
                  }`} />
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 ${done && i < timelineIndex ? 'bg-brand-500' : 'bg-surface-border'}`} />
                  )}
                </div>
                <span className={`text-[10px] mt-1 ${
                  active ? 'text-brand-600 font-medium' :
                  done   ? 'text-ink-secondary' : 'text-ink-muted'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {isRejected && (
        <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
          Your application was not selected for this position.
        </div>
      )}

      {/* Interview info */}
      {app.interview && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-purple-50 border border-purple-100">
          <Clock size={13} className="text-purple-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-purple-700">Interview Scheduled</p>
            <p className="text-xs text-purple-600">
              {formatDateTime(app.interview.scheduled_at)} ·{' '}
              {app.interview.mode === 'online' ? 'Online' : 'In-person'}
            </p>
            {app.interview.video_link && (
              <a href={app.interview.video_link} target="_blank" rel="noopener noreferrer"
                className="text-xs text-purple-700 underline mt-0.5 inline-block">
                Join meeting link →
              </a>
            )}
            {app.interview.venue && (
              <p className="text-xs text-purple-600 mt-0.5">Venue: {app.interview.venue}</p>
            )}
          </div>
        </div>
      )}

      {/* Offer letter */}
      {fullOfferUrl && (
        <a href={fullOfferUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-status-success font-medium hover:underline">
          <FileText size={12} /> View Offer Letter
        </a>
      )}
    </div>
  )
}