import { Inbox } from 'lucide-react'

/**
 * EmptyState — displayed when a list has no items.
 *
 * @param {{ icon, title, description, action }} props
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  action = null,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center mb-4 shadow-card">
        <Icon size={24} className="text-ink-muted" />
      </div>

      <p className="text-sm font-semibold text-ink mb-1">{title}</p>

      {description && (
        <p className="text-sm text-ink-secondary max-w-xs text-balance">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}