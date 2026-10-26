'use client'

import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Orbit, Pencil, Trash2 } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MenuItem } from '@/components/ui/menu-item'
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

// A row in the sidebar's grouped list, with a hairline inset past the icon like iOS Settings.
export const row =
  'relative after:absolute after:right-0 after:bottom-0 after:left-[37px] after:h-px after:bg-(--hairline) last:after:hidden'

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
      <li className={row}>
        <RenameInput initial={board.name} onDone={onRenameDone} />
      </li>
    )
  }

  return (
    <li className={cn('group', row)}>
      <button
        onClick={onSelect}
        onDoubleClick={onStartRename}
        aria-current={selected ? 'page' : undefined}
        className={cn(
          'flex h-10 w-full items-center gap-2.5 pr-10 pl-3 text-left text-[14px] text-(--fg) transition-colors outline-none hover:bg-(--hover) focus-visible:bg-(--hover)',
          selected ? 'bg-(--hover) font-semibold' : 'font-medium'
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
            icon={<Pencil />}
            onClick={() => {
              setMenuOpen(false)
              onStartRename()
            }}
          >
            Rename
          </MenuItem>
          {onDelete && (
            <MenuItem
              icon={<Trash2 />}
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
      className="h-10 w-full bg-(--surface) px-3 text-[14px] font-medium text-(--fg) shadow-[inset_0_0_0_2px_var(--fg-3)] outline-none"
    />
  )
}
