import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboard, Briefcase, FileText, User, Bell,
  PlusCircle, Users, BarChart3, ShieldCheck,
  ScrollText, LogOut, GraduationCap, Building2,
} from 'lucide-react'
import { logoutThunk, selectCurrentUser } from '@/features/auth/authSlice'
import { selectUnreadCount } from '@/features/notifications/notificationSlice'
import toast from 'react-hot-toast'

const NAV = {
  student: [
    { label: 'Overview',      icon: LayoutDashboard, to: '/student/dashboard' },
    { label: 'Job Openings',  icon: Briefcase,       to: '/student/jobs' },
    { label: 'Applications',  icon: FileText,        to: '/student/applications' },
    { label: 'My Profile',    icon: User,            to: '/student/profile' },
    { label: 'Notifications', icon: Bell,            to: '/student/notifications', badge: true },
  ],
  recruiter: [
    { label: 'Dashboard',  icon: LayoutDashboard, to: '/recruiter/dashboard' },
    { label: 'Post a Job', icon: PlusCircle,      to: '/recruiter/post-job' },
    { label: 'My Jobs',    icon: Briefcase,       to: '/recruiter/jobs' },
  ],
  placement: [
    { label: 'Dashboard',  icon: BarChart3, to: '/placement/dashboard' },
  ],
  admin: [
    { label: 'Dashboard',  icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Users',      icon: Users,           to: '/admin/users' },
    { label: 'Audit Logs', icon: ScrollText,      to: '/admin/audit-logs' },
  ],
}

const ROLE_META = {
  student:   { label: 'Student Portal',   color: 'bg-brand-600',   Icon: GraduationCap },
  recruiter: { label: 'Recruiter Portal', color: 'bg-emerald-600', Icon: Building2 },
  placement: { label: 'Placement Cell',   color: 'bg-purple-600',  Icon: BarChart3 },
  admin:     { label: 'Admin Panel',      color: 'bg-orange-600',  Icon: ShieldCheck },
}

export default function Sidebar() {
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const user         = useSelector(selectCurrentUser)
  const unreadCount  = useSelector(selectUnreadCount)

  const role      = user?.role ?? 'student'
  const navItems  = NAV[role]  ?? []
  const meta      = ROLE_META[role] ?? ROLE_META.student
  const RoleIcon  = meta.Icon

  const handleLogout = async () => {
    try { await dispatch(logoutThunk()).unwrap() } catch { /* ignore */ }
    toast.success('Logged out successfully')
    navigate('/')
  }

  return (
    <aside className="w-56 shrink-0 h-screen flex flex-col bg-white border-r border-surface-border overflow-hidden">

      {/* Brand header */}
      <div className="px-4 py-4 border-b border-surface-divider">
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}>
            <RoleIcon size={15} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink leading-none truncate">
              {meta.label}
            </p>
            {user?.email && (
              <p className="text-[11px] text-ink-muted mt-0.5 truncate">{user.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={16} className="shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && unreadCount > 0 && (
              <span className="ml-auto shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-600 text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-3 border-t border-surface-divider">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-ink-secondary">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-ink truncate">{user?.name ?? 'User'}</p>
            <p className="text-[11px] text-ink-muted truncate capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-link w-full text-status-danger hover:text-status-danger hover:bg-status-danger-bg"
        >
          <LogOut size={15} className="shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  )
}