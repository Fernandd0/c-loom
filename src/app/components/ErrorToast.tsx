'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { useIsHydrated } from '../hooks/useStickyState'

const AUTO_DISMISS_MS = 6000

export function ErrorToast({
  message,
  onDismiss,
}: {
  message: string | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  const isHydrated = useIsHydrated()
  if (!isHydrated) return null

  // Portaled to <body> and mounted only when shown: an open dialog marks its siblings aria-hidden,
  // which would hide the alert from screen readers.
  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-4 left-1/2 z-[60] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-2xl bg-(--ink) px-4 py-3 text-[14px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF453A]" />
          <p className="flex-1">{message}</p>
          <button
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded-full p-0.5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
