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
  { label: 'Never', value: 'never' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const MIN_DIAMETER = 80
const PRIORITY_STEP = 12 // px per priority point: 0 → 80px, 10 → 200px
const GROWTH_PER_HOUR = 5
const MAX_DIAMETER = 300
const MAX_DIAMETER_WITH_DEADLINE = 400
const URGENT_WITHIN_MS = 24 * 60 * 60 * 1000

export function getTaskDiameter(
  task: Pick<Task, 'createdAt' | 'priority' | 'deadline'>,
  now = Date.now()
) {
  const hoursOld = Math.max(
    0,
    (now - new Date(task.createdAt).getTime()) / (1000 * 60 * 60)
  )
  const base = MIN_DIAMETER + (task.priority ?? 0) * PRIORITY_STEP
  const max = task.deadline ? MAX_DIAMETER_WITH_DEADLINE : MAX_DIAMETER
  return Math.min(max, base + hoursOld * GROWTH_PER_HOUR)
}

// Urgent when the deadline is less than 24 hours away (or already passed).
export function isTaskUrgent(task: Pick<Task, 'deadline'>, now = Date.now()) {
  const deadline = parseDeadline(task.deadline)
  return !!deadline && deadline.getTime() - now < URGENT_WITHIN_MS
}

const advance: Record<Exclude<TaskRecurrence, 'never'>, (d: Date) => Date> = {
  daily: (d) => addDays(d, 1),
  weekly: (d) => addDays(d, 7),
  monthly: (d) => addMonths(d, 1),
  yearly: (d) => addMonths(d, 12),
}

// First occurrence after the current deadline that is still in the future (missed ones are skipped).
export function nextOccurrence(
  deadline: Date,
  recurrence: Exclude<TaskRecurrence, 'never'>,
  now = new Date()
) {
  let next = advance[recurrence](deadline)
  for (let i = 0; next <= now && i < 10_000; i++) {
    next = advance[recurrence](next)
  }
  return next
}

// What completing a task does: recurring tasks move to their next due date and start
// small again; everything else is deleted (returns null).
export function completionUpdate(
  task: Pick<Task, 'deadline' | 'recurrence'>,
  now = new Date()
): Partial<Task> | null {
  const deadline = parseDeadline(task.deadline)
  if (task.recurrence === 'never' || !deadline) return null
  return {
    deadline: nextOccurrence(deadline, task.recurrence, now).toISOString(),
    createdAt: now.toISOString(),
  }
}
