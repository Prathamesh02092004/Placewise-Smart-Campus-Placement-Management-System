/**
 * Lightweight date utilities — no external dependency needed.
 */

/**
 * formatDate — formats an ISO date string to "Jan 15, 2025"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * formatDistanceToNow — returns a human-readable relative time string.
 * e.g. "2 hours ago", "3 days ago", "just now"
 */
export function formatDistanceToNow(dateStr) {
  if (!dateStr) return ''
  try {
    const ms = Date.now() - new Date(dateStr).getTime()
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(dateStr)
  } catch {
    return ''
  }
}

/**
 * formatDateTime — formats to "Jan 15, 2025 · 10:30 AM"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}