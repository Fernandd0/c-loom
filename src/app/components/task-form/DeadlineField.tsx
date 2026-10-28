'use client'

import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  addDays,
  buildDeadline,
  formatDeadline,
  formatTimeValue,
  isOverdue,
  nextWeekday,
  parseDeadline,
  timeOptions,
  toLocalDateValue,
  weekendStart,
} from '@/lib/dates'
import { chipClass, FieldLabel } from './ChipGroup'

export interface DeadlineValue {
  date: string // 'YYYY-MM-DD', local
  time: string // 'HH:mm', local, '' = end of day
}

// The usual times one tap away; anything else comes from the list. Nothing to type,
// and it works the same in every browser (the native time field didn't).
const QUICK_TIMES = [
  { label: '9 AM', value: '09:00' },
  { label: '12 PM', value: '12:00' },
  { label: '6 PM', value: '18:00' },
]

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
  const isOtherTime =
    !!value.time && !QUICK_TIMES.some((t) => t.value === value.time)

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

      {value.date && (
        <div role="group" aria-label="Time" className="pt-1.5">
          <FieldLabel icon={Clock}>Time</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...value, time: '' })}
              className={chipClass(!value.time)}
            >
              No time
            </button>
            {QUICK_TIMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange({ ...value, time: t.value })}
                className={chipClass(value.time === t.value)}
              >
                {t.label}
              </button>
            ))}
            <select
              aria-label="Other time"
              value={isOtherTime ? value.time : ''}
              onChange={(e) => onChange({ ...value, time: e.target.value })}
              className={cn(chipClass(isOtherTime), 'cursor-pointer')}
            >
              <option value="" disabled>
                Other…
              </option>
              {timeOptions(value.time).map((t) => (
                <option key={t} value={t}>
                  {formatTimeValue(t)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {deadline && (
        <p
          className={cn(
            'text-[13px] font-medium',
            isOverdue(deadline) ? 'text-[#FF3B30]' : 'text-(--fg-2)'
          )}
        >
          Due {formatDeadline(deadline)}
          {/* In its own element: browser translation replaces loose text nodes,
              and React crashes removing one it no longer finds. */}
          {isOverdue(deadline) && <span> · already passed</span>}
        </p>
      )}
    </div>
  )
}
