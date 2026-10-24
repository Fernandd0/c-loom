import { describe, expect, it } from 'vitest'
import {
  completionUpdate,
  getTaskDiameter,
  getTaskUrgency,
  nextOccurrence,
  priorityLevel,
  PRIORITY_LEVELS,
  recurrenceLabel,
  scheduleUpdate,
} from '@/app/lib/task'
import { buildDeadline, parseDeadline, splitDeadline } from '@/lib/dates'

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
    const defaultCategories = ['Work', 'Personal']
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
  const ago = (hours: number) => new Date(now - hours * HOUR).toISOString()
  const inHours = (hours: number) => new Date(now + hours * HOUR).toISOString()
  const size = (priority: number, hoursOld: number, deadline?: string) =>
    getTaskDiameter({ createdAt: ago(hoursOld), priority, deadline }, now)

  it('starts at 80px and bigger with priority, not at the maximum', () => {
    expect(size(0, 0)).toBe(80)
    expect(size(4, 0)).toBe(128)
    expect(size(10, 0)).toBe(200)
  })

  it('grows faster with priority', () => {
    expect(size(0, 10) - size(0, 0)).toBe(20)
    expect(size(10, 10) - size(10, 0)).toBe(80)
  })

  // Regression: growth used to be the same for every priority, so after a day or
  // two every task without a deadline reached the same 300px.
  it('keeps priority visible however old the task is', () => {
    const levels = PRIORITY_LEVELS.map((l) => size(l.value, 1000))
    expect(levels).toEqual([200, 240, 270, 300])
  })

  it('fills toward a larger maximum as the deadline approaches', () => {
    // Created 12h ago, due in 12h: halfway between start and 300px.
    expect(size(0, 12, inHours(12))).toBe(190)
    expect(size(0, 12, inHours(12))).toBeGreaterThan(size(0, 12))
    expect(size(0, 1, inHours(-1))).toBe(300)
    expect(size(10, 1, inHours(-1))).toBe(400)
  })

  it('never shrinks a task because its deadline is far away', () => {
    expect(size(0, 100, inHours(24 * 365))).toBe(size(0, 100))
  })

  it('treats a deadline before creation as already reached', () => {
    expect(
      getTaskDiameter({ createdAt: ago(0), priority: 0, deadline: ago(1) }, now)
    ).toBe(300)
  })
})

describe('getTaskUrgency', () => {
  const now = Date.parse('2026-10-24T12:00:00Z')
  const due = (hours: number) =>
    getTaskUrgency(
      { deadline: new Date(now + hours * HOUR).toISOString() },
      now
    )

  it('rates the deadline as soon, today or overdue', () => {
    expect(due(100)).toBe('none')
    expect(due(71)).toBe('soon')
    expect(due(23)).toBe('today')
    expect(due(0)).toBe('overdue')
    expect(due(-1)).toBe('overdue')
    expect(getTaskUrgency({ deadline: undefined }, now)).toBe('none')
  })
})

describe('recurrenceLabel', () => {
  it('says when the task repeats, from the local deadline', () => {
    const due = at('2026-10-27', '22:00') // Tuesday
    expect(recurrenceLabel('never', due)).toBe("Doesn't repeat")
    expect(recurrenceLabel('daily', due)).toBe('Every day')
    expect(recurrenceLabel('weekly', due)).toBe('Every Tuesday')
    expect(recurrenceLabel('monthly', due)).toBe('Monthly on the 27th')
    expect(recurrenceLabel('monthly', at('2026-11-01'))).toBe(
      'Monthly on the 1st'
    )
    expect(recurrenceLabel('monthly', at('2026-11-22'))).toBe(
      'Monthly on the 22nd'
    )
    expect(recurrenceLabel('monthly', at('2026-11-13'))).toBe(
      'Monthly on the 13th'
    )
    expect(recurrenceLabel('yearly', due)).toBe('Every year on Oct 27')
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

// Regression: each step used to start from the previous, already clamped date, so a
// task due on the 31st drifted to the 28th for good after February.
describe('monthly and yearly repeats keep their day', () => {
  const complete = (
    task: { deadline?: string; recurrenceAnchor?: string },
    recurrence: 'monthly' | 'yearly',
    now: Date
  ) => ({ ...task, ...completionUpdate({ ...task, recurrence }, now)! })
  const day = (task: { deadline?: string }) => splitDeadline(task.deadline).date

  it('returns to the 31st after a short month, completion after completion', () => {
    let task: { deadline?: string; recurrenceAnchor?: string } = {
      deadline: at('2027-01-31').toISOString(),
    }
    const dates = []
    for (let i = 0; i < 4; i++) {
      task = complete(task, 'monthly', parseDeadline(task.deadline)!)
      dates.push(day(task))
    }
    expect(dates).toEqual([
      '2027-02-28',
      '2027-03-31',
      '2027-04-30',
      '2027-05-31',
    ])
  })

  it('skips missed months without losing the day', () => {
    expect(
      splitDeadline(
        nextOccurrence(
          at('2027-01-31'),
          'monthly',
          at('2027-04-01')
        ).toISOString()
      ).date
    ).toBe('2027-04-30')
  })

  it('brings Feb 29 back in the next leap year', () => {
    let task: { deadline?: string; recurrenceAnchor?: string } = {
      deadline: at('2028-02-29').toISOString(),
    }
    const dates = []
    for (let i = 0; i < 4; i++) {
      task = complete(task, 'yearly', parseDeadline(task.deadline)!)
      dates.push(day(task))
    }
    expect(dates).toEqual([
      '2029-02-28',
      '2030-02-28',
      '2031-02-28',
      '2032-02-29',
    ])
  })

  it('counts from the new date once the schedule is edited by hand', () => {
    expect(scheduleUpdate({ deadline: undefined })).toEqual({
      deadline: undefined,
      recurrenceAnchor: undefined,
    })
    expect('recurrenceAnchor' in scheduleUpdate({ recurrence: 'daily' })).toBe(
      true
    )
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
