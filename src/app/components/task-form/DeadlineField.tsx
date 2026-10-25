'use client'

import { Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  addDays,
  buildDeadline,
  formatDeadline,
  isOverdue,
  nextWeekday,
  parseDeadline,
  toLocalDateValue,
  weekendStart,
} from '@/lib/dates'
import { chipClass } from './ChipGroup'

export interface DeadlineValue {
  date: string // 'YYYY-MM-DD', local
  time: string // 'HH:mm', local, '' = end of day
}

const DEFAULT_TIME = '09:00'

interface DeadlineFieldProps {
  value: DeadlineValue
  onChange: (value: DeadlineValue) => void
}

export function DeadlineField({ value, onChange }: DeadlineFieldProps) {
  const now = new Date()
  // On a weekend "This weekend" is today, so drop picks that repeat an earlier date.
  const quickPicks = [
    { label: 'Today', date: toLocalDateValue(now) },
    { label: 'Tomorrow', date: toLocalDateValue(addDays(now, 1)) },
    { label: 'This weekend', date: toLocalDateValue(weekendStart(now)) },
    { label: 'Next week', date: toLocalDateValue(nextWeekday(now, 1)) },
  ].filter((pick, i, all) => all.findIndex((p) => p.date === pick.date) === i)
  const isQuickPick = quickPicks.some((p) => p.date === value.date)
  const deadline = parseDeadline(buildDeadline(value.date, value.time))

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ date: '', time: '' })}
          className={chipClass(!value.date)}
        >
          No date
        </button>
        {quickPicks.map((pick) => (
          <button
            key={pick.label}
            type="button"
            onClick={() => onChange({ ...value, date: pick.date })}
            className={chipClass(value.date === pick.date)}
          >
            {pick.label}
          </button>
        ))}
        <input
          type="date"
          aria-label="Pick a date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className={cn(
            chipClass(!!value.date && !isQuickPick),
            'cursor-pointer',
            // Light calendar icon on the dark selected chip.
            value.date && !isQuickPick
              ? '[color-scheme:dark]'
              : '[color-scheme:light]'
          )}
        />
      </div>

      {deadline && (
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span
            className={cn(
              'font-medium',
              isOverdue(deadline) ? 'text-[#FF3B30]' : 'text-(--fg-2)'
            )}
          >
            Due {formatDeadline(deadline)}
            {isOverdue(deadline) && ' · already passed'}
          </span>
          {value.time ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-(--surface-2) py-0.5 pr-1 pl-2.5">
              <Clock className="h-3.5 w-3.5 text-(--fg-3)" />
              <input
                type="time"
                aria-label="Time"
                value={value.time}
                onChange={(e) => onChange({ ...value, time: e.target.value })}
                className="bg-transparent text-[13px] font-semibold text-(--fg) outline-none"
              />
              <button
                type="button"
                aria-label="Remove time"
                onClick={() => onChange({ ...value, time: '' })}
                className="rounded-full p-0.5 text-(--fg-3) hover:bg-(--surface-3) hover:text-(--fg)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onChange({ ...value, time: DEFAULT_TIME })}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-(--accent) hover:bg-[#007AFF]/10"
            >
              <Clock className="h-3.5 w-3.5" />
              Add time
            </button>
          )}
        </div>
      )}
    </div>
  )
}
