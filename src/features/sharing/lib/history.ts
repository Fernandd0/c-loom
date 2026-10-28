import type { Completion } from '@/app/types'
import { calendarDaysFrom } from '@/lib/dates'

export interface HistoryDay {
  label: string
  items: Completion[]
}

// Completions (newest first) grouped by local day: "Today", "Yesterday", "Mon, Oct 26".
export function groupByDay(
  completions: Completion[],
  now = new Date()
): HistoryDay[] {
  // Built per call so the label follows the current time zone.
  const sameYear = new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  const otherYear = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const label = (date: Date) => {
    const days = calendarDaysFrom(date, now)
    if (days === 0) return 'Today'
    if (days === -1) return 'Yesterday'
    return date.getFullYear() === now.getFullYear()
      ? sameYear.format(date)
      : otherYear.format(date)
  }

  const groups: HistoryDay[] = []
  for (const completion of completions) {
    const day = label(new Date(completion.completedAt))
    const last = groups.at(-1)
    if (last?.label === day) last.items.push(completion)
    else groups.push({ label: day, items: [completion] })
  }
  return groups
}

// "You", the name saved at the time, or "Someone" for an account without one.
export function completedByLabel(completion: Completion, meId?: string) {
  if (meId && completion.completedBy === meId) return 'You'
  return completion.completedByName || 'Someone'
}
