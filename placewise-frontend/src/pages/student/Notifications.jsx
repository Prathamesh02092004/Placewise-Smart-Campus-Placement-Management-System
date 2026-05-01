import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, CheckCheck, CheckCircle2, FileText, Clock, Gift } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Button from '@/components/common/Button'
import {
  fetchNotifications, markNotificationRead, markAllRead,
  selectNotifications, selectNotificationsLoading, selectUnreadCount,
} from '@/features/notifications/notificationSlice'
import { formatDistanceToNow } from '@/utils/date'

const TYPE_CONFIG = {
  application_status:  { icon: CheckCircle2, iconBg: 'bg-brand-50',    iconColor: 'text-brand-500',  label: 'Application Update' },
  interview_scheduled: { icon: Clock,        iconBg: 'bg-purple-50',   iconColor: 'text-purple-500', label: 'Interview' },
  offer_received:      { icon: Gift,         iconBg: 'bg-green-50',    iconColor: 'text-green-500',  label: 'Offer Received' },
  skill_gap_ready:     { icon: FileText,     iconBg: 'bg-amber-50',    iconColor: 'text-amber-500',  label: 'Skill Gap Ready' },
  profile_verified:    { icon: CheckCircle2, iconBg: 'bg-emerald-50',  iconColor: 'text-emerald-500',label: 'Profile Verified' },
  company_approved:    { icon: CheckCircle2, iconBg: 'bg-blue-50',     iconColor: 'text-blue-500',   label: 'Company Approved' },
  system:              { icon: Bell,         iconBg: 'bg-surface-subtle', iconColor: 'text-ink-muted', label: 'System' },
  default:             { icon: Bell,         iconBg: 'bg-surface-subtle', iconColor: 'text-ink-muted', label: 'Notification' },
}

export default function StudentNotifications() {
  const dispatch     = useDispatch()
  const notifications = useSelector(selectNotifications)
  const loading      = useSelector(selectNotificationsLoading)
  const unreadCount  = useSelector(selectUnreadCount)

  useEffect(() => {
    // Real backend uses 'limit' not 'pageSize'
    dispatch(fetchNotifications({ page: 1, limit: 50 }))
  }, [dispatch])

  if (loading) return <DashboardLayout><PageLoader text="Loading notifications…" /></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">Notifications</h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              size="sm" variant="secondary"
              leftIcon={<CheckCheck size={14} />}
              onClick={() => dispatch(markAllRead())}
            >
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="You'll be notified here about application updates, interviews, and offers."
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={() => !n.read && dispatch(markNotificationRead(n.id))}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function NotificationItem({ notification: n, onRead }) {
  const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default
  const Icon   = config.icon

  return (
    <div
      onClick={onRead}
      className={`card-padded flex items-start gap-3 cursor-pointer transition-all duration-150 hover:shadow-card-md ${
        n.read ? 'opacity-70' : 'border-brand-200 bg-brand-50/30'
      }`}
    >
      <div className={`w-9 h-9 rounded-xl ${config.iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={16} className={config.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-muted">{config.label}</span>
          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />}
        </div>
        {n.title && n.title !== n.message && (
          <p className="text-sm font-medium text-ink mt-0.5">{n.title}</p>
        )}
        <p className="text-sm text-ink mt-0.5 leading-snug">{n.message}</p>
        <p className="text-xs text-ink-muted mt-1">{formatDistanceToNow(n.created_at)}</p>
      </div>
    </div>
  )
}