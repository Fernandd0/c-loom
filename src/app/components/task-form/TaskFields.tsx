'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Flag, Repeat, Tag } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  buildDeadline,
  formatDeadline,
  isOverdue,
  parseDeadline,
} from '@/lib/dates'
import { Category, TaskRecurrence } from '../../types'
import {
  PRIORITY_LEVELS,
  RECURRENCE_OPTIONS,
  priorityLevel,
  recurrenceLabel,
} from '../../lib/task'
import { ChipGroup, FieldLabel } from './ChipGroup'
import { CategoryField } from './CategoryField'
import { tone } from './categoryOptions'
import { DeadlineField, DeadlineValue } from './DeadlineField'

export interface TaskFieldsValue {
  categoryId: string
  deadline: DeadlineValue
  recurrence: TaskRecurrence
  priority: number
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: '#8E8E93',
  Medium: '#007AFF',
  High: '#FF9500',
  Critical: '#FF3B30',
}

type Field = 'category' | 'due' | 'priority'

interface TaskFieldsProps {
  value: TaskFieldsValue
  onChange: (changes: Partial<TaskFieldsValue>) => void
  categories: Category[]
  onCreateCategory?: (
    name: string,
    color: string,
    icon?: string
  ) => Promise<string | undefined>
}

// One compact pill per attribute; each opens its own picker.
export function TaskFields({
  value,
  onChange,
  categories,
  onCreateCategory,
}: TaskFieldsProps) {
  const [openField, setOpenField] = useState<Field | null>(null)
  const toggle = (field: Field) => (open: boolean) =>
    setOpenField(open ? field : null)
  const close = () => setOpenField(null)

  const category = categories.find((c) => c.id === value.categoryId)
  const deadline = parseDeadline(
    buildDeadline(value.deadline.date, value.deadline.time)
  )
  const overdue = !!deadline && isOverdue(deadline)
  const level = priorityLevel(value.priority)
  const repeats = !!deadline && value.recurrence !== 'never'

  return (
    <div className="flex flex-wrap gap-2">
      <Popover
        open={openField === 'category'}
        onOpenChange={toggle('category')}
      >
        <PopoverTrigger
          aria-label={`Category: ${category?.name ?? 'none'}`}
          className={pillClass}
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: category ? tone(category.color) : '#C7C7CC',
            }}
          />
          {category?.name ?? 'No category'}
          <ChevronDown className="h-3.5 w-3.5 text-(--fg-3)" />
        </PopoverTrigger>
        <PopoverContent align="start" className={panelClass}>
          <FieldLabel icon={Tag}>Category</FieldLabel>
          <CategoryField
            categories={categories}
            value={value.categoryId}
            onChange={(categoryId) => {
              onChange({ categoryId })
              close()
            }}
            onCreate={onCreateCategory}
          />
        </PopoverContent>
      </Popover>

      <Popover open={openField === 'due'} onOpenChange={toggle('due')}>
        <PopoverTrigger
          aria-label={`Due: ${deadline ? formatDeadline(deadline) : 'no date'}`}
          className={cn(pillClass, overdue && 'text-[#FF3B30]')}
        >
          <Calendar className="h-3.5 w-3.5" />
          {deadline ? formatDeadline(deadline) : 'No date'}
          {repeats && <Repeat className="h-3.5 w-3.5 text-(--fg-3)" />}
          <ChevronDown className="h-3.5 w-3.5 text-(--fg-3)" />
        </PopoverTrigger>
        <PopoverContent align="start" className={cn(panelClass, 'space-y-4')}>
          <div>
            <FieldLabel icon={Calendar}>Due</FieldLabel>
            <DeadlineField
              value={value.deadline}
              onChange={(next) =>
                onChange({
                  deadline: next,
                  // Repeating only makes sense relative to a due date.
                  ...(next.date ? {} : { recurrence: 'never' }),
                })
              }
            />
          </div>
          {deadline && (
            <div className="animate-in fade-in duration-150">
              <FieldLabel icon={Repeat}>Repeat</FieldLabel>
              <ChipGroup
                label="Repeat"
                options={RECURRENCE_OPTIONS}
                value={value.recurrence}
                onChange={(recurrence) => onChange({ recurrence })}
              />
              {repeats && (
                <p className="mt-2 text-[12px] text-(--fg-3)">
                  {recurrenceLabel(value.recurrence, deadline)}
                </p>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Popover
        open={openField === 'priority'}
        onOpenChange={toggle('priority')}
      >
        <PopoverTrigger
          aria-label={`Priority: ${level.label}`}
          className={pillClass}
        >
          <Flag
            className="h-3.5 w-3.5"
            style={{ color: PRIORITY_COLORS[level.label] }}
          />
          {level.label}
          <ChevronDown className="h-3.5 w-3.5 text-(--fg-3)" />
        </PopoverTrigger>
        <PopoverContent align="start" className={panelClass}>
          <FieldLabel icon={Flag}>Priority</FieldLabel>
          <ChipGroup
            label="Priority"
            options={PRIORITY_LEVELS}
            value={level.value}
            onChange={(priority) => {
              onChange({ priority })
              close()
            }}
          />
          <p className="mt-2 text-[12px] text-(--fg-3)">
            Higher priority starts bigger and grows faster.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

const pillClass =
  'inline-flex h-8 items-center gap-1.5 rounded-full bg-(--surface-2) px-3 text-[13px] font-semibold text-(--fg) outline-none transition-colors hover:bg-(--surface-3) focus-visible:ring-2 focus-visible:ring-(--fg)/30 data-[state=open]:bg-(--surface-3)'

const panelClass =
  'w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-(--line) bg-(--surface) p-4 shadow-[0_4px_16px_rgba(0,0,0,0.12),0_12px_32px_rgba(0,0,0,0.12)]'
