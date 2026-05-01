import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * StatCard — a KPI tile for dashboards.
 *
 * @param {{
 *   title: string,
 *   value: string | number,
 *   icon: LucideIcon,
 *   iconColor?: string,   // Tailwind text color class
 *   iconBg?: string,      // Tailwind bg color class
 *   trend?: 'up' | 'down' | 'neutral',
 *   trendValue?: string,
 *   trendLabel?: string,
 *   loading?: boolean,
 * }} props
 */
export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-brand-600',
  iconBg = 'bg-brand-50',
  trend,
  trendValue,
  trendLabel,
  loading = false,
  className = '',
}) {
  const trendConfig = {
    up:      { icon: TrendingUp,   color: 'text-status-success' },
    down:    { icon: TrendingDown, color: 'text-status-danger' },
    neutral: { icon: Minus,        color: 'text-ink-muted' },
  }

  const TrendIcon = trend ? trendConfig[trend]?.icon : null
  const trendColor = trend ? trendConfig[trend]?.color : ''

  return (
    <div className={`card-padded flex items-start gap-4 animate-fade-in ${className}`}>
      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {Icon && <Icon size={20} className={iconColor} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
          {title}
        </p>

        {loading ? (
          <div className="h-7 w-16 bg-surface-subtle rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-semibold text-ink leading-none">{value}</p>
        )}

        {(trendValue || trendLabel) && !loading && (
          <div className={`flex items-center gap-1 mt-1.5 ${trendColor}`}>
            {TrendIcon && <TrendIcon size={12} className="shrink-0" />}
            <span className="text-xs font-medium">
              {trendValue && <span>{trendValue}</span>}
              {trendLabel && (
                <span className="text-ink-muted font-normal ml-1">{trendLabel}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}