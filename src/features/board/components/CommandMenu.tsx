'use client'

import { useId, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { filterCommands, type Searchable } from '../lib/commands'

export interface CommandItem extends Searchable {
  id: string
  group: 'Galaxies' | 'Actions'
  icon: React.ReactNode
  // Shown on the right: a shortcut or a task count.
  detail?: React.ReactNode
  run: () => void
}

const GROUPS: CommandItem['group'][] = ['Galaxies', 'Actions']

// ⌘K: jump to a galaxy or run an action by typing a few letters.
export function CommandMenu({
  open,
  onOpenChange,
  items,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CommandItem[]
}) {
  // An action may focus something new (a rename field, the task form); don't steal it back.
  const ran = useRef(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="top-[12vh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
        onOpenAutoFocus={() => {
          ran.current = false
        }}
        onCloseAutoFocus={(e) => ran.current && e.preventDefault()}
      >
        <DialogTitle className="sr-only">Jump to</DialogTitle>
        <CommandList
          items={items}
          onRun={(item) => {
            ran.current = true
            onOpenChange(false)
            item.run()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

// Mounted only while open, so every visit starts with an empty query.
function CommandList({
  items,
  onRun,
}: {
  items: CommandItem[]
  onRun: (item: CommandItem) => void
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const listRef = useRef<HTMLDivElement>(null)

  const grouped = GROUPS.map((group) => ({
    group,
    items: filterCommands(
      items.filter((i) => i.group === group),
      query
    ),
  })).filter((g) => g.items.length > 0)
  const flat = grouped.flatMap((g) => g.items)
  const current = Math.min(active, flat.length - 1)

  const move = (step: number) => {
    if (flat.length === 0) return
    const next = (current + step + flat.length) % flat.length
    setActive(next)
    listRef.current
      ?.querySelector(`[data-index="${next}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-(--hairline) px-4">
        <Search size={16} className="shrink-0 text-(--fg-3)" />
        <input
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={
            flat[current] ? `${listId}-${flat[current].id}` : undefined
          }
          aria-label="Search galaxies and actions"
          placeholder="Jump to a galaxy or action…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              move(1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              move(-1)
            } else if (e.key === 'Enter' && flat[current]) {
              e.preventDefault()
              onRun(flat[current])
            }
          }}
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-(--fg) outline-none placeholder:text-(--fg-3)"
        />
      </div>

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label="Results"
        className="max-h-[min(380px,60vh)] space-y-4 overflow-y-auto bg-(--surface-2) p-3"
      >
        {flat.length === 0 && (
          <p className="px-3 py-6 text-center text-[13px] text-(--fg-3)">
            No matches
          </p>
        )}
        {grouped.map(({ group, items }) => (
          <div key={group} role="group" aria-label={group}>
            <p
              aria-hidden
              className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.06em] text-(--fg-3) uppercase"
            >
              {group}
            </p>
            <div className="overflow-hidden rounded-xl bg-(--surface)">
              {items.map((item) => {
                const index = flat.indexOf(item)
                return (
                  <div
                    key={item.id}
                    id={`${listId}-${item.id}`}
                    role="option"
                    aria-selected={index === current}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => onRun(item)}
                    className={cn(
                      'relative flex h-10 cursor-pointer items-center gap-2.5 px-3 text-[14px] font-medium text-(--fg) after:absolute after:right-0 after:bottom-0 after:left-[37px] after:h-px after:bg-(--hairline) last:after:hidden [&>svg]:h-[15px] [&>svg]:w-[15px] [&>svg]:shrink-0 [&>svg]:text-(--fg-3)',
                      index === current && 'bg-(--hover)'
                    )}
                  >
                    {item.icon}
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    {item.detail !== undefined && (
                      <span className="shrink-0 text-[12px] font-normal text-(--fg-3) tabular-nums">
                        {item.detail}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
