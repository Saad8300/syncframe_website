import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'

interface AdminModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  onConfirm?: () => void
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  loading?: boolean
  error?: string | null
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function AdminModal({
  open, title, description, onClose, onConfirm, confirmLabel = 'Save Changes',
  cancelLabel = 'Cancel', confirmVariant = 'primary', loading = false,
  error, children, size = 'md'
}: AdminModalProps) {
  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]
  const confirmClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-slate-900'
    : 'bg-indigo-600 hover:bg-indigo-700 text-slate-900'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !loading && onClose()}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className={`relative w-full ${maxW} bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]`}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
              </div>
              <button
                onClick={() => !loading && onClose()}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors ml-4 flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 mb-5">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
              {children}
            </div>

            {/* Footer */}
            {onConfirm && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-100 rounded-b-2xl">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50 transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${confirmClass}`}
                >
                  {loading ? 'Saving…' : confirmLabel}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Reusable form field components for admin modals
export function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

export const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
export const selectCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all'
