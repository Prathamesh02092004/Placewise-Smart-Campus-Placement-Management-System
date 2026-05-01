import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase, FileText, Upload, Search,
  User, CheckCircle2, Clock, Bell,
  TrendingUp, ChevronRight, AlertCircle,
} from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import StatCard from '@/components/common/StatCard'
import Badge from '@/components/common/Badge'
import { StatusBadge } from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { selectCurrentUser } from '@/features/auth/authSlice'
import { fetchJobs, selectJobs, selectJobsTotal } from '@/features/jobs/jobsSlice'
import { fetchMyApplications, selectApplications } from '@/features/applications/applicationsSlice'
import { fetchNotifications, selectNotifications, selectUnreadCount } from '@/features/notifications/notificationSlice'
import { formatDistanceToNow, formatDate } from '@/utils/date'

export default function StudentDashboard() {
  const dispatch      = useDispatch()
  const navigate      = useNavigate()
  const user          = useSelector(selectCurrentUser)
  const jobs          = useSelector(selectJobs)
  const jobsTotal     = useSelector(selectJobsTotal)
  const applications  = useSelector(selectApplications)
  const notifications = useSelector(selectNotifications)
  const unreadCount   = useSelector(selectUnreadCount)

  useEffect(() => {
    dispatch(fetchJobs({ page: 1, limit: 6 }))
    dispatch(fetchMyApplications())
    dispatch(fetchNotifications({ page: 1, limit: 5 }))
  }, [dispatch])

  const profileFields = [user?.name, user?.email, user?.branch, user?.cgpa, user?.resume_url]
  const completion    = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)

  const activeApps   = applications.filter((a) => !['rejected','placed'].includes(a.status))
  const interviewApps= applications.filter((a) => a.status === 'interview_scheduled')
  const offeredApps  = applications.filter((a) => ['offer_received','placed'].includes(a.status))

  return (
    <DashboardLayout>
      <div className="page-container space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-ink">
              Hello, {user?.name?.split(' ')[0] ?? 'Student'} 👋
            </h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              {user?.branch ? `${user.branch} ·` : ''}
              {user?.cgpa   ? ` CGPA ${user.cgpa} ·` : ''}
              {jobsTotal > 0 ? ` ${jobsTotal} jobs available` : ' Welcome to PlaceWise'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Link to="/student/notifications"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-200 text-sm text-brand-700 hover:bg-brand-100 transition-colors">
              <Bell size={14} />
              <span className="font-medium">{unreadCount} new notification{unreadCount > 1 ? 's' : ''}</span>
            </Link>
          )}
        </div>

        {/* Profile incomplete or unverified warning */}
        {completion < 80 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">Complete your profile to apply for jobs</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Profile is {completion}% complete — add your branch, CGPA and upload your resume.
              </p>
            </div>
            <Button size="sm" variant="secondary"
              onClick={() => navigate('/student/profile')}>
              Complete Profile
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Jobs Available"  value={jobsTotal}
            icon={Briefcase}    iconBg="bg-brand-50"   iconColor="text-brand-600" />
          <StatCard title="Applied"         value={applications.length}
            icon={FileText}     iconBg="bg-purple-50"  iconColor="text-purple-600" />
          <StatCard title="Interviews"      value={interviewApps.length}
            icon={Clock}        iconBg="bg-amber-50"   iconColor="text-amber-600" />
          <StatCard title="Offers"          value={offeredApps.length}
            icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Recent Applications */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-surface-divider">
              <div>
                <h2 className="section-title">My Applications</h2>
                <p className="section-subtitle">{applications.length} total submitted</p>
              </div>
              <Link to="/student/applications"
                className="text-xs text-brand-600 hover:underline font-medium">
                View all →
              </Link>
            </div>
            {applications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Briefcase size={24} className="text-ink-muted mx-auto mb-2" />
                <p className="text-sm text-ink-muted">No applications yet</p>
                <Button size="sm" className="mt-3" onClick={() => navigate('/student/jobs')}>
                  Browse Jobs
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-surface-divider">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted transition-colors">
                    <div className="w-8 h-8 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-ink-secondary">
                        {(app.job?.recruiter?.company_name || app.job?.title || 'J')[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {app.job?.title ?? 'Job'}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        {app.job?.recruiter?.company_name ?? '—'} · {formatDistanceToNow(app.applied_at)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Profile completion */}
            <div className="card-padded space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Profile</h2>
                <Link to="/student/profile" className="text-xs text-brand-600 hover:underline">Edit →</Link>
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-ink-secondary mb-1.5">
                  <span>Completion</span>
                  <span>{completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                  <div className="h-full rounded-full bg-brand-500 transition-all duration-500"
                    style={{ width: `${completion}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'Name',   done: !!user?.name },
                  { label: 'Branch', done: !!user?.branch },
                  { label: 'CGPA',   done: !!user?.cgpa },
                  { label: 'Resume', done: !!user?.resume_url },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 size={12}
                      className={f.done ? 'text-status-success' : 'text-surface-border'} />
                    <span className={f.done ? 'text-ink-secondary' : 'text-ink-muted'}>{f.label}</span>
                    {!f.done && <Badge variant="warning" size="sm">Missing</Badge>}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="card-padded space-y-1">
              <h2 className="section-title mb-2">Quick Actions</h2>
              {[
                { icon: Search, label: 'Browse Jobs',        to: '/student/jobs',         color: 'text-brand-600 bg-brand-50' },
                { icon: Upload, label: 'Upload Resume',      to: '/student/profile',       color: 'text-emerald-600 bg-emerald-50' },
                { icon: FileText, label: 'My Applications',  to: '/student/applications',  color: 'text-purple-600 bg-purple-50' },
                { icon: Bell,   label: 'Notifications',      to: '/student/notifications', color: 'text-amber-600 bg-amber-50' },
              ].map((a) => (
                <Link key={a.to} to={a.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-subtle transition-colors group">
                  <div className={`w-7 h-7 rounded-lg ${a.color.split(' ')[1]} flex items-center justify-center shrink-0`}>
                    <a.icon size={14} className={a.color.split(' ')[0]} />
                  </div>
                  <span className="text-sm text-ink group-hover:text-brand-600 transition-colors flex-1">{a.label}</span>
                  <ChevronRight size={13} className="text-ink-muted" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Available jobs */}
        {jobs.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-surface-divider">
              <h2 className="section-title">Latest Job Openings</h2>
              <Link to="/student/jobs" className="text-xs text-brand-600 hover:underline font-medium">
                View all {jobsTotal} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-surface-divider">
              {jobs.slice(0, 4).map((job) => (
                <Link key={job.id} to={`/student/jobs/${job.id}`}
                  className="flex flex-col gap-2 px-5 py-4 hover:bg-surface-muted transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{job.title}</p>
                      <p className="text-xs text-ink-secondary truncate">
                        {job.recruiter?.company_name ?? '—'}
                      </p>
                    </div>
                    {job.package_lpa > 0 && (
                      <span className="text-xs font-semibold text-emerald-600 shrink-0">
                        ₹{job.package_lpa} LPA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {job.role_category && (
                      <Badge variant="info" size="sm">
                        {job.role_category.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    {job.min_cgpa > 0 && (
                      <Badge variant="default" size="sm">Min CGPA {job.min_cgpa}</Badge>
                    )}
                    {job.deadline && (
                      <span className="text-xs text-ink-muted flex items-center gap-1">
                        <Clock size={10} /> {formatDate(job.deadline)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}