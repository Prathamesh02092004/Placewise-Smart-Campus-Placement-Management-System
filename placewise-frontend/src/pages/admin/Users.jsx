import { useEffect, useState, useCallback } from 'react'
import { Search, UserPlus, Shield, ShieldOff, RefreshCw } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { ConfirmModal } from '@/components/common/Modal'
import api, { getErrorMessage } from '@/services/api'
import useDebounce from '@/hooks/useDebounce'
import { formatDistanceToNow } from '@/utils/date'
import toast from 'react-hot-toast'

const ROLE_VARIANT = { student: 'info', recruiter: 'success', placement: 'purple', admin: 'warning' }

export default function AdminUsers() {
  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [roleFilter,    setRoleFilter]    = useState('')
  const [page,          setPage]          = useState(1)
  const [total,         setTotal]         = useState(0)
  const [confirmModal,  setConfirmModal]  = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const debouncedSearch = useDebounce(search, 350)
  const PAGE_SIZE = 20

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/users', {
        params: {
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(roleFilter      && { role: roleFilter }),
          page,
          limit: PAGE_SIZE,
        },
      })
      const d = res.data
      setUsers(d.data ?? d.users ?? [])
      setTotal(d.pagination?.total ?? d.total ?? 0)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, roleFilter, page])

  useEffect(() => { loadUsers() }, [loadUsers])

  const handleToggleSuspend = async (user) => {
    setActionLoading(true)
    try {
      // Backend uses PATCH /admin/users/:id/status
      await api.patch(`/admin/users/${user.id}/status`, { is_active: !user.is_active })
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ))
      toast.success(user.is_active ? 'User suspended.' : 'User reactivated.')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setActionLoading(false)
      setConfirmModal(null)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">User Management</h1>
            <p className="text-sm text-ink-secondary mt-0.5">{total} total users registered</p>
          </div>
          <Button size="sm" variant="secondary"
            leftIcon={<RefreshCw size={13} />}
            onClick={loadUsers}>
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input type="text" placeholder="Search by email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="form-input pl-9 w-full" />
          </div>
          <select value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="form-input bg-white sm:w-44">
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="recruiter">Recruiter</option>
            <option value="placement">Placement Officer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <PageLoader text="Loading users…" />
        ) : users.length === 0 ? (
          <EmptyState icon={UserPlus} title="No users found"
            description="Try adjusting your search or filters." />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-muted">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden md:table-cell">Joined</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-divider">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-subtle border border-surface-border flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-ink-secondary">
                              {user.email?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{user.email}</p>
                            <p className="text-xs text-ink-muted">
                              {user.email_verified ? '✓ verified' : '✗ unverified'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_VARIANT[user.role] ?? 'default'} size="sm">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
                          {user.is_active ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-muted hidden md:table-cell">
                        {formatDistanceToNow(user.created_at)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setConfirmModal({ type: 'suspend', user })}
                            title={user.is_active ? 'Suspend user' : 'Reactivate user'}
                            className="p-1.5 rounded-lg hover:bg-surface-subtle text-ink-muted hover:text-ink transition-colors"
                          >
                            {user.is_active
                              ? <ShieldOff size={14} />
                              : <Shield size={14} className="text-status-success" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-surface-divider bg-surface-muted">
                <p className="text-xs text-ink-muted">
                  Page {page} of {totalPages} · {total} users
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}>
                    ← Prev
                  </Button>
                  <Button size="sm" variant="secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}>
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmModal?.type === 'suspend'}
        onClose={() => setConfirmModal(null)}
        onConfirm={() => handleToggleSuspend(confirmModal.user)}
        loading={actionLoading}
        title={confirmModal?.user?.is_active ? 'Suspend User?' : 'Reactivate User?'}
        description={`This will ${confirmModal?.user?.is_active ? 'prevent' : 'allow'} ${confirmModal?.user?.email} from accessing the platform.`}
        confirmLabel={confirmModal?.user?.is_active ? 'Suspend' : 'Reactivate'}
        confirmVariant={confirmModal?.user?.is_active ? 'danger' : 'primary'}
      />
    </DashboardLayout>
  )
}