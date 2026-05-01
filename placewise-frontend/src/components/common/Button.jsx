import { Loader2 } from 'lucide-react'

/**
 * Button — primary UI action component.
 *
 * variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
 * size:    'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  className = '',
  type = 'button',
  fullWidth = false,
  onClick,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg ' +
    'transition-all duration-150 focus:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-offset-2 focus-visible:ring-brand-500 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  }

  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
    secondary:
      'bg-surface-subtle text-ink hover:bg-surface-border active:bg-surface-border/80 border border-surface-border',
    danger:
      'bg-status-danger text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
    ghost:
      'bg-transparent text-ink-secondary hover:bg-surface-subtle hover:text-ink active:bg-surface-border',
    outline:
      'bg-white text-ink border border-surface-border hover:bg-surface-subtle active:bg-surface-subtle shadow-sm',
    'outline-brand':
      'bg-white text-brand-600 border border-brand-300 hover:bg-brand-50 active:bg-brand-100 shadow-sm',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        base,
        sizes[size] ?? sizes.md,
        variants[variant] ?? variants.primary,
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  )
}