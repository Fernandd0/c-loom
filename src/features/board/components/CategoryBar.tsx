'use client'

import { useMemo, useState } from 'react'
import { Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CreateCategory,
  iconFor,
  tone,
} from '@/app/components/task-form/categoryOptions'
import { Category, Task } from '@/app/types'
import { CategoryChanges } from '../data/types'
import { ManageCategoriesDialog } from './ManageCategoriesDialog'

interface CategoryBarProps {
  categories: Category[]
  tasks: Task[]
  // '' shows every task.
  filterId: string
  onFilterChange: (categoryId: string) => void
  onUpdate: (categoryId: string, changes: CategoryChanges) => void
  onDelete: (categoryId: string) => void
  onCreate: CreateCategory
}

const chip =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-(--fg)/30'

// Focus on one category (the rest of the board dims) and get to category management.
export function CategoryBar({
  categories,
  tasks,
  filterId,
  onFilterChange,
  onUpdate,
  onDelete,
  onCreate,
}: CategoryBarProps) {
  const [isManaging, setIsManaging] = useState(false)

  const taskCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const t of tasks)
      counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1)
    return counts
  }, [tasks])

  return (
    <>
      <div className="flex max-w-full items-center gap-1 rounded-full bg-(--glass) p-1 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div
          role="radiogroup"
          aria-label="Show category"
          // Only the chips scroll, so the edit button stays reachable on narrow screens.
          className="flex min-w-0 [scrollbar-width:none] items-center gap-1 overflow-x-auto rounded-full"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!filterId}
            onClick={() => onFilterChange('')}
            className={cn(
              chip,
              !filterId
                ? 'bg-(--ink) text-white'
                : 'text-(--fg-2) hover:bg-(--surface-2)'
            )}
          >
            All
          </button>
          {categories.map((c) => {
            const selected = c.id === filterId
            const Icon = iconFor(c.icon)
            const count = taskCounts.get(c.id) ?? 0
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={selected}
                // Picking the active category again shows everything.
                onClick={() => onFilterChange(selected ? '' : c.id)}
                className={cn(
                  chip,
                  selected
                    ? 'text-white'
                    : 'text-(--fg-2) hover:bg-(--surface-2)'
                )}
                style={
                  selected ? { backgroundColor: tone(c.color) } : undefined
                }
              >
                {Icon ? (
                  <Icon
                    className="h-3.5 w-3.5"
                    style={selected ? undefined : { color: tone(c.color) }}
                  />
                ) : (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: selected ? 'white' : tone(c.color),
                    }}
                  />
                )}
                {c.name}
                {count > 0 && (
                  <span
                    className={cn(
                      'tabular-nums',
                      selected ? 'text-white/80' : 'text-(--fg-3)'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setIsManaging(true)}
          aria-label="Edit categories"
          className={cn(chip, 'px-2 text-(--fg-3) hover:bg-(--surface-2)')}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      <ManageCategoriesDialog
        open={isManaging}
        onOpenChange={setIsManaging}
        categories={categories}
        taskCounts={taskCounts}
        onUpdate={onUpdate}
        onDelete={(id) => {
          if (id === filterId) onFilterChange('')
          onDelete(id)
        }}
        onCreate={onCreate}
      />
    </>
  )
}
