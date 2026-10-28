'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import type { Completion } from '@/app/types'
import type { SharingApi } from '@/features/board/data/types'
import { useIsHydrated } from '@/app/hooks/useStickyState'
import { completedByLabel } from '../lib/history'

const SHOW_MS = 4000

// "Ana completed “Buy bread”" for a few seconds when someone else finishes a task.
export function CompletionNotice({
  sharing,
  boardName,
}: {
  sharing: SharingApi
  // Names the galaxy when the completion isn't in the one on screen.
  boardName: (boardId: string) => string | undefined
}) {
  const [latest, setLatest] = useState<Completion | null>(null)

  useEffect(() => sharing.watchCompletions(setLatest), [sharing])

  useEffect(() => {
    if (!latest) return
    const timer = setTimeout(() => setLatest(null), SHOW_MS)
    return () => clearTimeout(timer)
  }, [latest])

  const isHydrated = useIsHydrated()
  if (!isHydrated) return null

  const galaxy = latest ? boardName(latest.workspaceId) : undefined
  return createPortal(
    <AnimatePresence>
      {latest && (
        <motion.div
          key={latest.id}
          role="status"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="fixed top-4 left-1/2 z-[60] flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-(--ink) px-4 py-3 text-[14px] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#30D158]" />
          <p className="min-w-0 flex-1">
            {completedByLabel(latest)} completed “{latest.title}”
            {galaxy && <span className="text-white/60"> in {galaxy}</span>}
          </p>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
