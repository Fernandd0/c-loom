import { addDays, addMonths, parseDeadline } from '@/lib/dates'
import { Task, TaskRecurrence } from '../types'

// Single source of truth for task size, priority and urgency.
// TaskCircle and the collision resolver must use these so they agree on geometry.

export const PRIORITY_LEVELS = [
  { label: 'Low', value: 0 },
  { label: 'Medium', value: 4 },
  { label: 'High', value: 7 },
  { label: 'Critical', value: 10 },
] as const

// Maps any stored 0–10 priority to the closest level shown in the UI.
export function priorityLevel(priority = 0) {
  return [...PRIORITY_LEVELS].reverse().find((l) => priority >= l.value - 1)!
}

export const RECURRENCE_OPTIONS: { label: string; value: TaskRecurrence }[] = [
  { label: "Don't repeat", value: 'never' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const weekdayFormat = new Intl.DateTimeFormat('en', { weekday: 'long' })
const monthDayFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
})
const ordinalRules = new Intl.PluralRules('en', { type: 'ordinal' })
const ORDINAL_SUFFIX: Record<string, string> = {
  one: 'st',
  two: 'nd',
  few: 'rd',
  other: 'th',
}
const ordinal = (n: number) => `${n}${ORDINAL_SUFFIX[ordinalRules.select(n)]}`

// "Every Tuesday" rather than "Weekly": says when it repeats, read from the local deadline.
export function recurrenceLabel(recurrence: TaskRecurrence, deadline: Date) {
  switch (recurrence) {
    case 'never':
      return "Doesn't repeat"
    case 'daily':
      return 'Every day'
    case 'weekly':
      return `Every ${weekdayFormat.format(deadline)}`
    case 'monthly':
      return `Monthly on the ${ordinal(deadline.getDate())}`
    case 'yearly':
      return `Every year on ${monthDayFormat.format(deadline)}`
  }
}

const HOUR_MS = 60 * 60 * 1000
const MIN_DIAMETER = 80
const START_PER_PRIORITY = 12 // 0 → 80px, 10 → 200px
const GROWTH_PER_HOUR = 4 // scaled by priority: ×0.5 (Low) to ×2 (Critical)
const MAX_DIAMETER = 200 // + 10px per priority point: 200–300px
const MAX_DIAMETER_WITH_DEADLINE = 300 // + 10px per priority point: 300–400px
const SOON_WITHIN_MS = 3 * 24 * HOUR_MS
const TODAY_WITHIN_MS = 24 * HOUR_MS

// Priority sets where a circle starts, how fast it grows and how big it can get, so a
// Low task never catches up with a Critical one. A deadline adds a second pull: the
// circle fills toward a larger maximum as the due date approaches, reaching it on time.
export function getTaskDiameter(
  task: Pick<Task, 'createdAt' | 'priority' | 'deadline'>,
  now = Date.now()
) {
  const priority = Math.min(10, Math.max(0, task.priority ?? 0))
  const createdAt = new Date(task.createdAt).getTime()
  const hoursOld = Math.max(0, (now - createdAt) / HOUR_MS)

  const start = MIN_DIAMETER + priority * START_PER_PRIORITY
  const rate = GROWTH_PER_HOUR * (0.5 + priority * 0.15)
  const byAge = Math.min(MAX_DIAMETER + priority * 10, start + hoursOld * rate)

  const deadline = parseDeadline(task.deadline)
  if (!deadline) return byAge

  const span = deadline.getTime() - createdAt
  const progress =
    span <= 0 ? 1 : Math.min(1, Math.max(0, (now - createdAt) / span))
  const max = MAX_DIAMETER_WITH_DEADLINE + priority * 10
  return Math.max(byAge, start + (max - start) * progress)
}

export type TaskUrgency = 'none' | 'soon' | 'today' | 'overdue'

// How close the deadline is: within 3 days, within 24 hours, or already passed.
export function getTaskUrgency(
  task: Pick<Task, 'deadline'>,
  now = Date.now()
): TaskUrgency {
  const deadline = parseDeadline(task.deadline)
  if (!deadline) return 'none'
  const left = deadline.getTime() - now
  if (left <= 0) return 'overdue'
  if (left < TODAY_WITHIN_MS) return 'today'
  if (left < SOON_WITHIN_MS) return 'soon'
  return 'none'
}

// The k-th occurrence after `anchor`. Always counted from the anchor, never from the
// previous occurrence, so a clamped short month (Jan 31 → Feb 28) doesn't stick.
const occurrence: Record<
  Exclude<TaskRecurrence, 'never'>,
  (anchor: Date, k: number) => Date
> = {
  daily: (anchor, k) => addDays(anchor, k),
  weekly: (anchor, k) => addDays(anchor, 7 * k),
  monthly: (anchor, k) => addMonths(anchor, k),
  yearly: (anchor, k) => addMonths(anchor, 12 * k),
}

// First occurrence after the current deadline that is still in the future (missed ones are skipped).
export function nextOccurrence(
  deadline: Date,
  recurrence: Exclude<TaskRecurrence, 'never'>,
  now = new Date(),
  anchor = deadline
) {
  const after = Math.max(deadline.getTime(), now.getTime())
  let next = occurrence[recurrence](anchor, 1)
  for (let k = 2; next.getTime() <= after && k < 100_000; k++) {
    next = occurrence[recurrence](anchor, k)
  }
  return next
}

// What completing a task does: recurring tasks move to their next due date and start
// small again; everything else is deleted (returns null).
export function completionUpdate(
  task: Pick<Task, 'deadline' | 'recurrence' | 'recurrenceAnchor'>,
  now = new Date()
): Partial<Task> | null {
  const deadline = parseDeadline(task.deadline)
  if (task.recurrence === 'never' || !deadline) return null
  const anchor = parseDeadline(task.recurrenceAnchor) ?? deadline
  return {
    deadline: nextOccurrence(
      deadline,
      task.recurrence,
      now,
      anchor
    ).toISOString(),
    recurrenceAnchor: anchor.toISOString(),
    createdAt: now.toISOString(),
  }
}

// Changing the due date or the repeat by hand starts counting from the new deadline.
export function scheduleUpdate(
  changes: Pick<Partial<Task>, 'deadline' | 'recurrence'>
): Partial<Task> {
  return { ...changes, recurrenceAnchor: undefined }
}
