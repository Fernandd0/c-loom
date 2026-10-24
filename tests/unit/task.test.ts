import { describe, expect, it } from 'vitest'
import {
  completionUpdate,
  getTaskDiameter,
  isTaskUrgent,
  nextOccurrence,
  priorityLevel,
  PRIORITY_LEVELS,
} from '@/app/lib/task'
import { buildDeadline, splitDeadline } from '@/lib/dates'

const HOUR = 60 * 60 * 1000
const at = (date: string, time = '23:59') =>
  new Date(buildDeadline(date, time)!)

describe('priorityLevel', () => {
  it('maps every stored 0–10 value to a UI level', () => {
    const labels = Array.from({ length: 11 }, (_, p) => priorityLevel(p).label)
    expect(labels).toEqual([
      'Low',
      'Low',
      'Low',
      'Medium',
      'Medium',
      'Medium',
      'High',
      'High',
      'High',
      'Critical',
      'Critical',
    ])
  })

  // Both show as chips in the task form; the same word twice was confusing.
  it('never reuses a default category name', () => {
    const defaultCategories = ['Work', 'Personal', 'Urgent']
    for (const level of PRIORITY_LEVELS) {
      expect(defaultCategories).not.toContain(level.label)
    }
  })

  it('round-trips each level value', () => {
    for (const level of PRIORITY_LEVELS) {
      expect(priorityLevel(level.value)).toEqual(level)
    }
  })
})

describe('getTaskDiameter', () => {
  const now = Date.parse('2026-10-24T12:00:00Z')
  const createdAt = new Date(now).toISOString()

  it('starts at 80px and grows with priority, not to the maximum', () => {
    expect(getTaskDiameter({ createdAt, priority: 0 }, now)).toBe(80)
    expect(getTaskDiameter({ createdAt, priority: 4 }, now)).toBe(128)
    expect(getTaskDiameter({ createdAt, priority: 10 }, now)).toBe(200)
  })

  it('grows 5px per hour and caps at 300px, or 400px with a deadline', () => {
    const old = new Date(now - 100 * HOUR).toISOString()
    expect(getTaskDiameter({ createdAt: old, priority: 0 }, now)).toBe(300)
    expect(
      getTaskDiameter(
        { createdAt: old, priority: 0, deadline: '2026-12-01T00:00:00Z' },
        now
      )
    ).toBe(400)
  })
})

describe('isTaskUrgent', () => {
  const now = Date.parse('2026-10-24T12:00:00Z')
  it('is urgent within 24 hours of the deadline or after it', () => {
    expect(
      isTaskUrgent({ deadline: new Date(now + 23 * HOUR).toISOString() }, now)
    ).toBe(true)
    expect(
      isTaskUrgent({ deadline: new Date(now - HOUR).toISOString() }, now)
    ).toBe(true)
    expect(
      isTaskUrgent({ deadline: new Date(now + 25 * HOUR).toISOString() }, now)
    ).toBe(false)
    expect(isTaskUrgent({ deadline: undefined }, now)).toBe(false)
  })
})

describe('nextOccurrence', () => {
  const now = at('2026-10-24', '10:00')
  const next = (
    date: string,
    rec: 'daily' | 'weekly' | 'monthly' | 'yearly',
    from = now,
    time = '23:59'
  ) => splitDeadline(nextOccurrence(at(date, time), rec, from).toISOString())

  it('moves an early-completed daily task to tomorrow', () => {
    expect(next('2026-10-24', 'daily')).toEqual({
      date: '2026-10-25',
      time: '',
    })
  })

  it('skips missed occurrences to the first one still ahead', () => {
    expect(next('2026-10-21', 'daily')).toEqual({
      date: '2026-10-24',
      time: '',
    })
  })

  it('keeps the chosen time, including across a DST change', () => {
    expect(next('2026-10-24', 'weekly', now, '18:30')).toEqual({
      date: '2026-10-31',
      time: '18:30',
    })
    expect(next('2026-10-30', 'weekly', now, '09:00')).toEqual({
      date: '2026-11-06',
      time: '09:00',
    })
  })

  it('clamps monthly and yearly steps to short months', () => {
    expect(next('2027-01-31', 'monthly', at('2027-01-01'))).toEqual({
      date: '2027-02-28',
      time: '',
    })
    expect(next('2028-02-29', 'yearly', at('2028-01-01'))).toEqual({
      date: '2029-02-28',
      time: '',
    })
  })
})

describe('completionUpdate', () => {
  const now = at('2026-10-24', '10:00')

  it('deletes one-off tasks and recurring tasks without a deadline', () => {
    expect(
      completionUpdate(
        { recurrence: 'never', deadline: at('2026-10-24').toISOString() },
        now
      )
    ).toBeNull()
    expect(
      completionUpdate({ recurrence: 'daily', deadline: undefined }, now)
    ).toBeNull()
  })

  it('moves recurring tasks forward and restarts their age', () => {
    const update = completionUpdate(
      { recurrence: 'daily', deadline: at('2026-10-24').toISOString() },
      now
    )!
    expect(splitDeadline(update.deadline)).toEqual({
      date: '2026-10-25',
      time: '',
    })
    expect(update.createdAt).toBe(now.toISOString())
  })
})
