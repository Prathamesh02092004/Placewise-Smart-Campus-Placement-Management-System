import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowLeft, TrendingUp, Calendar, CheckCircle2, XCircle, ChevronDown, ChevronUp, Gift, Award, Upload } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Badge from '@/components/common/Badge'
import { StatusBadge } from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import { fetchJobById, selectSelectedJob, selectApplicantsForJob, fetchJobApplicants } from '@/features/jobs/jobsSlice'
import { updateApplicationStatus } from '@/features/applications/applicationsSlice'
import api, { getErrorMessage } from '@/services/api'
import { formatDate } from '@/utils/date'
import toast from 'react-hot-toast'

export default function CandidateView() {
  const { id: jobId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const job = useSelector(selectSelectedJob)
  const applicants = useSelector(selectApplicantsForJob(jobId))
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('ai_score')
  const [filterStatus, setFilterStatus] = useState('')

  // Interview modal state
  const [interviewModal, setInterviewModal] = useState(null) // { applicationId, studentName }
  const [interviewForm, setInterviewForm] = useState({ scheduled_at: '', mode: 'online', video_link: '', duration_minutes: 60 })
  const [scheduling, setScheduling] = useState(false)

  // Offer modal state
  const [offerModal, setOfferModal] = useState(null) // { applicationId, studentName }
  const [offerFile, setOfferFile] = useState(null)
  const [offerUploading, setOfferUploading] = useState(false)
  const offerFileRef = useRef(null)

  // Placed confirmation modal state
  const [placedModal, setPlacedModal] = useState(null) // { applicationId, studentName }
  const [placedLoading, setPlacedLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([
        dispatch(fetchJobById(jobId)),
        dispatch(fetchJobApplicants(jobId)),
      ])
      setLoading(false)
    }
    load()
  }, [jobId, dispatch])

  const handleStatusChange = async (applicationId, status) => {
    const result = await dispatch(updateApplicationStatus({ id: applicationId, status }))
    if (updateApplicationStatus.fulfilled.match(result)) {
      toast.success(`Application marked as ${status.replace(/_/g, ' ')}`)
    } else {
      toast.error('Could not update status.')
    }
  }

  const handleScheduleInterview = async () => {
    if (!interviewForm.scheduled_at) { toast.error('Please select date and time'); return }
    setScheduling(true)
    try {
      await api.post('/interviews', {
        application_id: interviewModal.applicationId,
        ...interviewForm,
      })
      await dispatch(updateApplicationStatus({ id: interviewModal.applicationId, status: 'interview_scheduled' }))
      toast.success('Interview scheduled!')
      setInterviewModal(null)
      setInterviewForm({ scheduled_at: '', mode: 'online', video_link: '', duration_minutes: 60 })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setScheduling(false)
    }
  }

  // Mark offer_received and optionally upload offer letter PDF
  const handleSendOffer = async () => {
    setOfferUploading(true)
    try {
      // First advance status to offer_received
      const result = await dispatch(updateApplicationStatus({ id: offerModal.applicationId, status: 'offer_received' }))
      if (!updateApplicationStatus.fulfilled.match(result)) {
        toast.error('Could not update status.')
        return
      }
      // If a PDF was attached, upload it
      if (offerFile) {
        const formData = new FormData()
        formData.append('offer_letter', offerFile)
        await api.post(`/applications/${offerModal.applicationId}/offer-letter`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      toast.success(`Offer sent to ${offerModal.studentName}!`)
      setOfferModal(null)
      setOfferFile(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setOfferUploading(false)
    }
  }

  // Mark placed
  const handleMarkPlaced = async () => {
    setPlacedLoading(true)
    try {
      const result = await dispatch(updateApplicationStatus({ id: placedModal.applicationId, status: 'placed' }))
      if (updateApplicationStatus.fulfilled.match(result)) {
        toast.success(`${placedModal.studentName} marked as placed! 🎉`)
        setPlacedModal(null)
      } else {
        toast.error('Could not confirm placement.')
      }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPlacedLoading(false)
    }
  }

  if (loading) return <DashboardLayout><PageLoader text="Loading candidates…" /></DashboardLayout>

  const sorted = [...applicants]
    .filter((a) => !filterStatus || a.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'ai_score') return (b.ai_score ?? 0) - (a.ai_score ?? 0)
      if (sortBy === 'cgpa') return (b.student?.cgpa ?? 0) - (a.student?.cgpa ?? 0)
      if (sortBy === 'name') return (a.student?.name ?? '').localeCompare(b.student?.name ?? '')
      return 0
    })

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in space-y-5">
        {/* Back */}
        <button onClick={() => navigate('/recruiter/jobs')}
          className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink transition-colors">
          <ArrowLeft size={15} /> Back to Jobs
        </button>

        {/* Header */}
        <div className="card-padded">
          <h1 className="text-lg font-semibold text-ink">{job?.title ?? 'Job'}</h1>
          <p className="text-sm text-ink-secondary mt-0.5">{applicants.length} applicant{applicants.length !== 1 ? 's' : ''} · AI-ranked by match score</p>
        </div>

        {/* Filter + sort bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-input bg-white sm:w-44">
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="offer_received">Offer Received</option>
            <option value="placed">Placed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input bg-white sm:w-44">
            <option value="ai_score">Sort: AI Score</option>
            <option value="cgpa">Sort: CGPA</option>
            <option value="name">Sort: Name</option>
          </select>
          <div className="ml-auto text-xs text-ink-muted self-center">
            Showing {sorted.length} of {applicants.length}
          </div>
        </div>

        {/* Candidate list */}
        {sorted.length === 0 ? (
          <EmptyState title="No candidates found" description="No applications match the current filter." />
        ) : (
          <div className="space-y-3">
            {sorted.map((app) => (
              <CandidateCard
                key={app.id}
                app={app}
                onShortlist={() => handleStatusChange(app.id, 'shortlisted')}
                onReject={() => handleStatusChange(app.id, 'rejected')}
                onSchedule={() => setInterviewModal({ applicationId: app.id, studentName: app.student?.name })}
                onSendOffer={() => setOfferModal({ applicationId: app.id, studentName: app.student?.name })}
                onMarkPlaced={() => setPlacedModal({ applicationId: app.id, studentName: app.student?.name })}
              />
            ))}
          </div>
        )}

        {/* ── Interview scheduling modal ── */}
        <Modal
          open={!!interviewModal}
          onClose={() => setInterviewModal(null)}
          title="Schedule Interview"
          description={interviewModal ? `Scheduling for ${interviewModal.studentName}` : ''}
          size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setInterviewModal(null)}>Cancel</Button>
              <Button loading={scheduling} onClick={handleScheduleInterview}>Confirm</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="form-label">Date & Time *</label>
              <input type="datetime-local" value={interviewForm.scheduled_at}
                onChange={(e) => setInterviewForm((p) => ({ ...p, scheduled_at: e.target.value }))}
                className="form-input" min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label className="form-label">Mode</label>
              <select value={interviewForm.mode}
                onChange={(e) => setInterviewForm((p) => ({ ...p, mode: e.target.value }))}
                className="form-input bg-white">
                <option value="online">Online</option>
                <option value="offline">In-Person</option>
              </select>
            </div>
            {interviewForm.mode === 'online' && (
              <div>
                <label className="form-label">Video Link</label>
                <input type="url" value={interviewForm.video_link}
                  onChange={(e) => setInterviewForm((p) => ({ ...p, video_link: e.target.value }))}
                  className="form-input" placeholder="https://meet.google.com/…" />
              </div>
            )}
            <div>
              <label className="form-label">Duration (minutes)</label>
              <input type="number" min="15" step="15" value={interviewForm.duration_minutes}
                onChange={(e) => setInterviewForm((p) => ({ ...p, duration_minutes: parseInt(e.target.value, 10) }))}
                className="form-input" />
            </div>
          </div>
        </Modal>

        {/* ── Send Offer modal ── */}
        <Modal
          open={!!offerModal}
          onClose={() => { setOfferModal(null); setOfferFile(null) }}
          title="Send Offer"
          description={offerModal ? `Sending offer to ${offerModal.studentName}` : ''}
          size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setOfferModal(null); setOfferFile(null) }}>Cancel</Button>
              <Button loading={offerUploading} onClick={handleSendOffer} leftIcon={<Gift size={14} />}>
                Send Offer
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-ink-secondary">
              This will mark the candidate as <strong>Offer Received</strong> and notify them immediately.
            </p>
            <div>
              <label className="form-label">Attach Offer Letter (optional · PDF)</label>
              <div
                className="mt-1 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-divider px-4 py-5 cursor-pointer hover:border-brand-400 transition-colors"
                onClick={() => offerFileRef.current?.click()}
              >
                <Upload size={18} className="text-ink-muted" />
                {offerFile
                  ? <span className="text-sm text-ink font-medium">{offerFile.name}</span>
                  : <span className="text-sm text-ink-muted">Click to upload PDF</span>
                }
                <input
                  ref={offerFileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setOfferFile(e.target.files?.[0] ?? null)}
                />
              </div>
              {offerFile && (
                <button
                  className="mt-1 text-xs text-status-danger hover:underline"
                  onClick={() => setOfferFile(null)}
                >
                  Remove file
                </button>
              )}
            </div>
          </div>
        </Modal>

        {/* ── Confirm Placed modal ── */}
        <Modal
          open={!!placedModal}
          onClose={() => setPlacedModal(null)}
          title="Confirm Placement"
          description={placedModal ? `Confirm placement for ${placedModal.studentName}` : ''}
          size="sm"
          footer={
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setPlacedModal(null)}>Cancel</Button>
              <Button loading={placedLoading} onClick={handleMarkPlaced} leftIcon={<Award size={14} />}>
                Confirm Placed
              </Button>
            </div>
          }
        >
          <p className="text-sm text-ink-secondary">
            This will mark <strong>{placedModal?.studentName}</strong> as <strong>Placed</strong> and
            create a permanent placement record. This action cannot be undone.
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  )
}

function CandidateCard({ app, onShortlist, onReject, onSchedule, onSendOffer, onMarkPlaced }) {
  const [expanded, setExpanded] = useState(false)
  const student = app.student ?? {}
  const skills = Array.isArray(student.skills) ? student.skills : []

  const canShortlist  = ['applied', 'under_review'].includes(app.status)
  const canSchedule   = app.status === 'shortlisted'
  const canSendOffer  = app.status === 'interview_scheduled'
  const canMarkPlaced = app.status === 'offer_received'
  const canReject     = !['rejected', 'placed'].includes(app.status)

  return (
    <div className="card-padded animate-fade-in space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-brand-700">
              {student.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-ink">{student.name ?? 'Unknown'}</p>
              <StatusBadge status={app.status} size="sm" />
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-ink-secondary">{student.branch ?? '—'}</span>
              {student.cgpa && <span className="text-xs text-ink-muted">CGPA: {student.cgpa}</span>}
              {app.ai_score != null && (
                <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
                  <TrendingUp size={10} /> {Number(app.ai_score).toFixed(0)}% match
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canShortlist && (
            <Button size="sm" variant="outline-brand" leftIcon={<CheckCircle2 size={13} />} onClick={onShortlist}>
              Shortlist
            </Button>
          )}
          {canSchedule && (
            <Button size="sm" leftIcon={<Calendar size={13} />} onClick={onSchedule}>
              Schedule
            </Button>
          )}
          {canSendOffer && (
            <Button size="sm" variant="outline-brand" leftIcon={<Gift size={13} />} onClick={onSendOffer}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50">
              Send Offer
            </Button>
          )}
          {canMarkPlaced && (
            <Button size="sm" leftIcon={<Award size={13} />} onClick={onMarkPlaced}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
              Mark Placed
            </Button>
          )}
          {canReject && (
            <Button size="sm" variant="ghost" onClick={onReject} className="text-status-danger hover:bg-status-danger-bg">
              <XCircle size={14} />
            </Button>
          )}
          <button onClick={() => setExpanded((v) => !v)} className="p-1 text-ink-muted hover:text-ink transition-colors">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="pt-3 border-t border-surface-divider space-y-3 animate-fade-in">
          {skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-muted mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => <Badge key={s} variant="default" size="sm">{s}</Badge>)}
              </div>
            </div>
          )}
          {app.interview && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 border border-purple-100 text-xs text-purple-700">
              <Calendar size={12} />
              Interview: {formatDate(app.interview.scheduled_at)} · {app.interview.mode}
            </div>
          )}
          {app.placementRecord?.offer_letter_url && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
              <Award size={12} />
              Offer letter uploaded ·{' '}
              <a href={app.placementRecord.offer_letter_url} target="_blank" rel="noopener noreferrer"
                className="underline">View</a>
            </div>
          )}
          {student.resume_url && (
            <a href={student.resume_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline">
              View Resume →
            </a>
          )}
        </div>
      )}
    </div>
  )
}