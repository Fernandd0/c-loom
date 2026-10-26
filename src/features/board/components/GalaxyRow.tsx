'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Orbit, Pencil, Trash2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Board } from '@/app/types'
import { summarizeBoard, summaryLabel } from '../lib/boardSummary'

interface GalaxyRowProps {
  board: Board
  selected: boolean
  editing: boolean
  onSelect: () => void
  onStartRename: () => void
  // null when the rename was cancelled.
  onRenameDone: (name: string | null) => void
  onDelete?: () => void
}

export function GalaxyRow({
  board,
  selected,
  editing,
  onSelect,
  onStartRename,
  onRenameDone,
  onDelete,
}: GalaxyRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const summary = summarizeBoard(board.tasks)
  const pressing = summaryLabel(summary)

  if (editing) {
    return (
      <li>
        <RenameInput initial={board.name} onDone={onRenameDone} />
      </li>
    )
  }

  return (
    <li className="group relative">
      <button
        onClick={onSelect}
        onDoubleClick={onStartRename}
        aria-current={selected ? 'page' : undefined}
        className={cn(
          'flex h-9 w-full items-center gap-2.5 rounded-lg pr-10 pl-2.5 text-left text-[14px] transition-colors',
          selected
            ? 'bg-(--hover) font-semibold text-(--fg)'
            : 'font-medium text-(--fg-2) hover:bg-(--hover)'
        )}
      >
        <Orbit
          size={15}
          className={cn('shrink-0', selected ? 'text-(--fg)' : 'text-(--fg-3)')}
        />
        <span className="min-w-0 flex-1 truncate">{board.name}</span>
        {pressing && (
          <span
            aria-hidden
            title={pressing}
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              summary.overdue > 0 ? 'bg-[#FF3B30]' : 'bg-[#FF9500]'
            )}
          />
        )}
        {summary.total > 0 && (
          <span className="shrink-0 text-[12px] font-normal text-(--fg-3) tabular-nums">
            {summary.total}
          </span>
        )}
        {pressing && <span className="sr-only">, {pressing}</span>}
      </button>

      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button
            aria-label={`${board.name} options`}
            className="absolute top-1/2 right-1 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-(--fg-3) opacity-0 transition-[opacity,color,background-color] group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-(--hover) hover:text-(--fg) data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
          >
            <MoreHorizontal size={15} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-44 rounded-xl border-(--line) bg-(--surface) p-1"
          // Keep focus on the rename field instead of jumping back to this button.
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <MenuItem
            icon={<Pencil size={14} />}
            onClick={() => {
              setMenuOpen(false)
              onStartRename()
            }}
          >
            Rename
          </MenuItem>
          {onDelete && (
            <MenuItem
              icon={<Trash2 size={14} />}
              destructive
              onClick={() => {
                setMenuOpen(false)
                onDelete()
              }}
            >
              Delete
            </MenuItem>
          )}
        </PopoverContent>
      </Popover>
    </li>
  )
}

function MenuItem({
  icon,
  destructive,
  onClick,
  children,
}: {
  icon: React.ReactNode
  destructive?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] font-medium transition-colors',
        destructive
          ? 'text-[#FF3B30] hover:bg-[#FF3B30]/10'
          : 'text-(--fg) hover:bg-(--hover)'
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function RenameInput({
  initial,
  onDone,
}: {
  initial: string
  onDone: (name: string | null) => void
}) {
  const [value, setValue] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  // Enter and the blur that follows it must not save twice.
  const done = useRef(false)
  const finish = (name: string | null) => {
    if (done.current) return
    done.current = true
    onDone(name)
  }

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(value)
        if (e.key === 'Escape') finish(null)
      }}
      onBlur={() => finish(value)}
      aria-label="Galaxy name"
      className="h-9 w-full rounded-lg bg-(--surface) px-2.5 text-[14px] font-medium text-(--fg) shadow-[0_0_0_2px_var(--line)] outline-none focus:shadow-[0_0_0_2px_var(--fg-3)]"
    />
  )
}
