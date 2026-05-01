import { Loader2 } from 'lucide-react'

/**
 * Loader — full-area loading spinner.
 * @param {{ size, text, fullPage }} props
 */
export function Loader({ size = 20, text = '', fullPage = false }) {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-600" />
          {text && <p className="text-sm text-ink-secondary">{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={size} className="animate-spin text-brand-500" />
        {text && <p className="text-sm text-ink-secondary">{text}</p>}
      </div>
    </div>
  )
}

/**
 * SkeletonLine — a shimmer placeholder for a single line of text.
 */
export function SkeletonLine({ className = '' }) {
  return (
    <div
      className={`bg-surface-subtle rounded animate-pulse ${className}`}
    />
  )
}

/**
 * SkeletonCard — a generic shimmer card placeholder.
 */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-5 space-y-3 animate-fade-in">
      <SkeletonLine className="h-4 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={`h-3 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}

/**
 * PageLoader — centered spinner for full page transitions.
 */
export function PageLoader({ text = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-brand-500" />
        <p className="text-sm text-ink-secondary">{text}</p>
      </div>
    </div>
  )
}

export default Loader