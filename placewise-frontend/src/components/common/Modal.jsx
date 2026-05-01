import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

/**
 * Modal — accessible dialog overlay.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title: string,
 *   description?: string,
 *   children: React.ReactNode,
 *   footer?: React.ReactNode,
 *   size?: 'sm' | 'md' | 'lg' | 'xl',
 *   closeOnBackdrop?: boolean,
 * }} props
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const dialogRef = useRef(null)

  // Trap focus and handle Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={`relative w-full ${sizes[size] ?? sizes.md} bg-white rounded-2xl shadow-card-lg border border-surface-border animate-slide-up flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-surface-divider shrink-0">
          <div>
            <h2 id="modal-title" className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-ink-secondary mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-0.5 p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-surface-divider bg-surface-muted rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * ConfirmModal — a pre-built confirmation dialog.
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    />
  )
}