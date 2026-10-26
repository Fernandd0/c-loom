import { getTaskUrgency } from '@/app/lib/task'
import type { Task } from '@/app/types'

export interface BoardSummary {
  total: number
  overdue: number
  dueToday: number
}

// What the sidebar shows next to a galaxy: how many tasks, and how many need attention now.
export function summarizeBoard(
  tasks: Pick<Task, 'deadline'>[],
  now = Date.now()
): BoardSummary {
  let overdue = 0
  let dueToday = 0
  for (const task of tasks) {
    const urgency = getTaskUrgency(task, now)
    if (urgency === 'overdue') overdue++
    else if (urgency === 'today') dueToday++
  }
  return { total: tasks.length, overdue, dueToday }
}

// "2 overdue, 1 due today", or '' when nothing is pressing.
export function summaryLabel({ overdue, dueToday }: BoardSummary) {
  return [
    overdue > 0 && `${overdue} overdue`,
    dueToday > 0 && `${dueToday} due today`,
  ]
    .filter(Boolean)
    .join(', ')
}

// Plain 1–9 jumps to the n-th galaxy; anything else is not a galaxy shortcut.
export function galaxyIndexForKey(
  e: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey'>
) {
  if (e.metaKey || e.ctrlKey || e.altKey) return null
  return /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : null
}
