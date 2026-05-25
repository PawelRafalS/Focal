import { useEffect, useRef } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

// ── Single toast ──────────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }) {
  const barRef = useRef(null)

  // Shrink the progress bar over the toast lifetime
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    // Start full-width then animate to 0 over 3 s
    bar.style.transition = 'none'
    bar.style.width = '100%'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = 'width 3000ms linear'
        bar.style.width = '0%'
      })
    })
  }, [])

  return (
    <div className="toast-enter flex items-center gap-3 bg-gray-900 text-white text-sm
                    px-4 pt-3 pb-2 rounded-2xl shadow-xl min-w-[220px] max-w-xs overflow-hidden">
      <CheckCircle size={15} className="flex-shrink-0 text-violet-400" />
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors ml-1"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
      {/* Progress bar */}
      <div
        ref={barRef}
        className="absolute bottom-0 left-0 h-0.5 bg-violet-500 rounded-full"
      />
    </div>
  )
}

// ── Container — rendered once in App.jsx ──────────────────────────────────────

export default function ToastContainer() {
  const { toasts, dismissToast } = useApp()

  if (!toasts.length) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
