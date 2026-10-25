'use client'

import { motion } from 'framer-motion'
import { Download } from 'lucide-react'

export function GuestImportBanner({
  taskCount,
  isImporting,
  onImport,
  onDismiss,
}: {
  taskCount: number
  isImporting: boolean
  onImport: () => void
  onDismiss: () => void
}) {
  return (
    <motion.div
      role="region"
      aria-label="Import guest tasks"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 flex-col gap-3 rounded-2xl bg-(--surface) p-4 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_12px_28px_rgba(0,0,0,0.12)] sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-start gap-3">
        <Download className="mt-0.5 h-4 w-4 shrink-0 text-(--accent)" />
        <p className="text-[14px] text-(--fg-2)">
          You have{' '}
          <strong>
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </strong>{' '}
          from before you signed in. Bring {taskCount === 1 ? 'it' : 'them'}{' '}
          into your account?
        </p>
      </div>
      <div className="flex shrink-0 gap-2 self-end sm:self-auto">
        <button
          onClick={onDismiss}
          disabled={isImporting}
          className="h-9 rounded-xl px-3 text-[13px] font-semibold text-(--fg-3) hover:bg-(--surface-2) hover:text-(--fg) disabled:opacity-40"
        >
          Not now
        </button>
        <button
          onClick={onImport}
          disabled={isImporting}
          className="h-9 rounded-xl bg-(--ink) px-4 text-[13px] font-semibold text-white hover:bg-(--ink-hover) disabled:opacity-60"
        >
          {isImporting ? 'Importing…' : 'Import'}
        </button>
      </div>
    </motion.div>
  )
}
