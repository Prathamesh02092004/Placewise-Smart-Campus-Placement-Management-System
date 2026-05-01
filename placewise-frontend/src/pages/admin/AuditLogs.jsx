import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, ScrollText } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import api, { getErrorMessage } from '@/services/api'
import { formatDateTime } from '@/utils/date'
import toast from 'react-hot-toast'

const ACTION_VARIANT = {
  CREATE:        'success',
  UPDATE:        'info',
  DELETE:        'danger',
  STATUS_CHANGE: 'warning',
  LOGIN:         'default',
  LOGOUT:        'default',
  APPROVE:       'success',
  REJECT:        'danger',
}

const ENTITIES = [
  '', 'User', 'Student', 'Job', 'Application',
  'Interview', 'SkillTaxonomy', 'PlacementRecord',
  'CompanyApproval', 'StudentVerification', 'OfferLetter',
]

const ACTIONS = [
  '', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'APPROVE', 'REJECT',
]

export default function AdminAuditLogs() {
  const [logs,     setLogs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [entity,   setEntity]   = useState('')
  const [action,   setAction]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const [expanded, setExpanded] = useState(null)

  const PAGE_SIZE = 25

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          ...(entity   && { entity }),
          ...(action   && { action }),
          ...(dateFrom && { from: dateFrom }),
          page,
          limit: PAGE_SIZE,
        },
      })
      const d = res.data
      // Real backend: { success, data: [...], pagination: { total } }
      setLogs(d.data ?? d.logs ?? [])
      setTotal(d.pagination?.total ?? d.total ?? 0)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [entity, action, dateFrom, page])

  useEffect(() => { loadLogs() }, [loadLogs])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <DashboardLayout>
      <div className="page-container animate-fade-in space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">Audit Logs</h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              Complete record of all system write actions · {total} entries
            </p>
          </div>
          <Button size="sm" variant="secondary"
            leftIcon={<RefreshCw size={13} />}
            onClick={loadLogs}>
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <select value={entity}
            onChange={(e) => { setEntity(e.target.value); setPage(1) }}
            className="form-input bg-white sm:w-44">
            {ENTITIES.map((e) => (
              <option key={e} value={e}>{e || 'All Entities'}</option>
            ))}
          </select>
          <select value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1) }}
            className="form-input bg-white sm:w-44">
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a || 'All Actions'}</option>
            ))}
          </select>
          <input type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="form-input bg-white sm:w-44"
            title="Filter from date" />
          {(entity || action || dateFrom) && (
            <button
              onClick={() => { setEntity(''); setAction(''); setDateFrom(''); setPage(1) }}
              className="text-xs text-brand-600 hover:underline self-center">
              Clear filters
            </button>
          )}
        </div>

        {/* Log list */}
        {loading ? (
          <PageLoader text="Loading audit logs…" />
        ) : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit logs found"
            description="Try adjusting your filters or check back after some activity." />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-muted">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Action</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Entity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden sm:table-cell">Actor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide hidden md:table-cell">IP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">When</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wide">Diff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-divider">
                  {logs.map((log) => (
                    <>
                      <tr key={log.id} className="hover:bg-surface-muted transition-colors">
                        <td className="px-5 py-3">
                          <Badge variant={ACTION_VARIANT[log.action] ?? 'default'} size="sm">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink text-xs">{log.entity}</p>
                          <p className="text-[10px] text-ink-muted font-mono truncate max-w-[100px]">
                            {log.entity_id?.slice(0, 8)}…
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <p className="text-xs text-ink">{log.user?.email ?? '—'}</p>
                          <p className="text-[10px] text-ink-muted capitalize">{log.user?.role}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted font-mono hidden md:table-cell">
                          {log.ip_address ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {(log.old_value || log.new_value) && (
                            <button
                              onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                              className="text-xs text-brand-600 hover:underline font-medium"
                            >
                              {expanded === log.id ? 'Hide' : 'View'}
                            </button>
                          )}
                        </td>
                      </tr>

                      {expanded === log.id && (
                        <tr key={`${log.id}-exp`} className="bg-surface-muted">
                          <td colSpan={6} className="px-5 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {log.old_value && (
                                <div>
                                  <p className="text-[10px] font-semibold text-red-500 uppercase mb-1.5">Before</p>
                                  <pre className="text-[11px] text-ink bg-white border border-red-100 rounded-lg p-3 overflow-x-auto max-h-40">
                                    {JSON.stringify(log.old_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_value && (
                                <div>
                                  <p className="text-[10px] font-semibold text-green-600 uppercase mb-1.5">After</p>
                                  <pre className="text-[11px] text-ink bg-white border border-green-100 rounded-lg p-3 overflow-x-auto max-h-40">
                                    {JSON.stringify(log.new_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-surface-divider bg-surface-muted">
                <p className="text-xs text-ink-muted">
                  Page {page} of {totalPages} · {total} entries
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
    </DashboardLayout>
  )
}