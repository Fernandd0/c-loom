'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { GlassCard } from '@/app/components/GlassCard'
import { tone } from '@/app/components/task-form/categoryOptions'
import type { Board, Category, Completion } from '@/app/types'
import type { SharingApi } from '@/features/board/data/types'
import { completedByLabel, groupByDay } from '../lib/history'

const timeFormat = new Intl.DateTimeFormat('en', {
  hour: 'numeric',
  minute: '2-digit',
})

interface CompletedDialogProps {
  board: Board | undefined
  categories: Category[]
  meId: string
  sharing: SharingApi
  onClose: () => void
}

// A galaxy's history: what was completed, by whom (when it's shared) and when.
export function CompletedDialog({
  board,
  categories,
  meId,
  sharing,
  onClose,
}: CompletedDialogProps) {
  return (
    <Dialog open={!!board} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        {board && (
          <History
            key={board.id}
            board={board}
            categories={categories}
            meId={meId}
            sharing={sharing}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function History({
  board,
  categories,
  meId,
  sharing,
}: {
  board: Board
  categories: Category[]
  meId: string
  sharing: SharingApi
}) {
  const [completions, setCompletions] = useState<Completion[] | null>(null)
  const [failed, setFailed] = useState(false)
  const shared = (board.memberCount ?? 1) > 1

  useEffect(() => {
    sharing
      .completions(board.id)
      .then(setCompletions)
      .catch((e) => {
        console.error('Error loading history:', e)
        setFailed(true)
      })
  }, [sharing, board.id])

  return (
    <GlassCard className="max-h-[85vh] space-y-4 overflow-y-auto p-5 sm:p-6">
      <div>
        <DialogTitle className="text-xl font-bold tracking-tight text-(--fg)">
          Completed
        </DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-(--fg-3)">
          {shared
            ? `Who finished what in ${board.name}.`
            : `What you've finished in ${board.name}.`}
        </DialogDescription>
      </div>

      {failed ? (
        <p role="alert" className="text-[13px] text-[#FF3B30]">
          Couldn&apos;t load the history. Check your connection.
        </p>
      ) : completions === null ? (
        <p className="text-[13px] text-(--fg-3)">Loading…</p>
      ) : completions.length === 0 ? (
        <p className="text-[13px] text-(--fg-3)">
          Nothing yet. Double-click a circle when it&apos;s done.
        </p>
      ) : (
        groupByDay(completions).map((day) => (
          <section key={day.label} aria-label={day.label}>
            <h3 className="mb-1.5 px-1 text-[11px] font-semibold tracking-[0.06em] text-(--fg-3) uppercase">
              {day.label}
            </h3>
            <ul className="overflow-hidden rounded-xl bg-(--surface-2)">
              {day.items.map((c) => {
                const category = categories.find((x) => x.id === c.categoryId)
                return (
                  <li
                    key={c.id}
                    className="relative flex min-h-10 items-center gap-2.5 px-3 py-2 after:absolute after:right-0 after:bottom-0 after:left-[30px] after:h-px after:bg-(--hairline) last:after:hidden"
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: category
                          ? tone(category.color)
                          : 'var(--fg-3)',
                      }}
                    />
                    <span className="min-w-0 flex-1 text-[14px] text-(--fg) line-through decoration-(--fg-3)/50">
                      {c.title}
                    </span>
                    <span className="shrink-0 text-[12px] text-(--fg-3) tabular-nums">
                      {shared && `${completedByLabel(c, meId)} · `}
                      {timeFormat.format(new Date(c.completedAt))}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </GlassCard>
  )
}
