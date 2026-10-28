import { describe, expect, it } from 'vitest'
import { sampleTasks } from '@/features/board/lib/sampleTasks'
import { getTaskDiameter, getTaskUrgency } from '@/app/lib/task'
import { splitDeadline } from '@/lib/dates'

const now = new Date(2026, 9, 27, 10, 0) // local time

describe('sampleTasks', () => {
  const tasks = sampleTasks('galaxy-1', 'cat-1', now)

  it('creates distinct tasks in the given galaxy and category', () => {
    expect(tasks.length).toBeGreaterThan(0)
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
    for (const t of tasks) {
      expect(t.workspaceId).toBe('galaxy-1')
      expect(t.categoryId).toBe('cat-1')
      expect(t.recurrence).toBe('never')
      expect(t.createdAt).toBe(now.toISOString())
    }
  })

  it('puts the task due today first and makes it the biggest', () => {
    const [first, ...rest] = tasks
    expect(splitDeadline(first.deadline)).toEqual({
      date: '2026-10-27',
      time: '',
    })
    expect(getTaskUrgency(first, now.getTime())).toBe('today')
    const size = (t: (typeof tasks)[number]) =>
      getTaskDiameter(t, now.getTime())
    for (const t of rest) expect(size(first)).toBeGreaterThan(size(t))
  })

  it('keeps every circle on the board', () => {
    for (const t of tasks) {
      expect(t.pos_x).toBeGreaterThanOrEqual(10)
      expect(t.pos_x).toBeLessThanOrEqual(90)
      expect(t.pos_y).toBeGreaterThanOrEqual(20)
      expect(t.pos_y).toBeLessThanOrEqual(80)
    }
  })
})
