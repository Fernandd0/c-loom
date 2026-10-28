import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addMonths,
  buildDeadline,
  calendarDaysFrom,
  formatAge,
  formatDeadline,
  formatTimeValue,
  isOverdue,
  nextWeekday,
  parseDeadline,
  splitDeadline,
  timeOptions,
  toLocalDateValue,
  toLocalTimeValue,
  weekendStart,
} from '@/lib/dates'

const ZONES = [
  'America/Bogota',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Asia/Tokyo',
  'UTC',
]
const originalTz = process.env.TZ

// Date arithmetic must hold in every zone, especially negative UTC offsets.
describe.each(ZONES)('deadlines in %s', (zone) => {
  beforeEach(() => {
    process.env.TZ = zone
  })
  // Restore the zone from vitest.config so later tests aren't affected.
  afterEach(() => {
    process.env.TZ = originalTz
  })
  const OFFSETS: Record<string, number> = {
    'America/Bogota': 300,
    'America/Los_Angeles': 420,
    'Europe/Madrid': -120,
    'Asia/Tokyo': -540,
    UTC: 0,
  }

  it('actually runs in the requested zone', () => {
    expect(new Date(2026, 6, 1).getTimezoneOffset()).toBe(OFFSETS[zone])
  })

  it('survives repeated edit/save without drifting', () => {
    let iso = buildDeadline('2026-10-24', '18:30')!
    for (let i = 0; i < 5; i++) {
      const { date, time } = splitDeadline(iso)
      iso = buildDeadline(date, time)!
    }
    expect(splitDeadline(iso)).toEqual({ date: '2026-10-24', time: '18:30' })
  })

  it('keeps a date without time on the chosen local day, at 23:59', () => {
    const date = parseDeadline(buildDeadline('2026-10-24'))!
    expect(toLocalDateValue(date)).toBe('2026-10-24')
    expect(toLocalTimeValue(date)).toBe('23:59')
    expect(splitDeadline(date.toISOString())).toEqual({
      date: '2026-10-24',
      time: '',
    })
  })

  it('reads legacy YYYY-MM-DD values as local end of day', () => {
    const date = parseDeadline('2026-10-24')!
    expect(toLocalDateValue(date)).toBe('2026-10-24')
    expect(toLocalTimeValue(date)).toBe('23:59')
  })

  // 2026-10-24 is a Saturday; late evening is when a UTC-based weekday would be wrong.
  it('finds next Monday and this weekend on the local calendar', () => {
    const day = (d: number, h = 23) => new Date(2026, 9, d, h, 30)
    const value = (d: Date) => toLocalDateValue(d)
    expect(value(nextWeekday(day(24), 1))).toBe('2026-10-26')
    expect(value(nextWeekday(day(26), 1))).toBe('2026-11-02') // Monday → next Monday
    expect(value(weekendStart(day(22)))).toBe('2026-10-24') // Thursday
    expect(value(weekendStart(day(24)))).toBe('2026-10-24') // Saturday
    expect(value(weekendStart(day(25)))).toBe('2026-10-25') // Sunday
  })

  it('counts calendar days across a DST change', () => {
    expect(
      calendarDaysFrom(new Date(2026, 10, 3), new Date(2026, 9, 24, 23))
    ).toBe(10)
  })
})

describe('buildDeadline / parseDeadline', () => {
  it('returns undefined or null for empty and invalid input', () => {
    expect(buildDeadline('')).toBeUndefined()
    expect(buildDeadline('not-a-date')).toBeUndefined()
    expect(parseDeadline(undefined)).toBeNull()
    expect(parseDeadline('garbage')).toBeNull()
  })
})

describe('addMonths', () => {
  it('clamps to the length of the target month', () => {
    expect(toLocalDateValue(addMonths(new Date(2027, 0, 31), 1))).toBe(
      '2027-02-28'
    )
    expect(toLocalDateValue(addMonths(new Date(2028, 0, 31), 1))).toBe(
      '2028-02-29'
    )
    expect(toLocalDateValue(addMonths(new Date(2028, 1, 29), 12))).toBe(
      '2029-02-28'
    )
  })
})

describe('formatDeadline', () => {
  const now = new Date(2026, 9, 24, 10, 0)

  it.each([
    [new Date(2026, 9, 24, 23, 59), 'Today'],
    [new Date(2026, 9, 25, 18, 0), 'Tomorrow, 6:00 PM'],
    [new Date(2026, 9, 23, 23, 59), 'Yesterday'],
    [new Date(2026, 9, 28, 23, 59), 'Wednesday'],
    [new Date(2026, 11, 3, 23, 59), 'Thu, Dec 3'],
    [new Date(2027, 0, 15, 23, 59), 'Jan 15, 2027'],
  ])('%s -> %s', (date, label) => {
    expect(formatDeadline(date, now)).toBe(label)
  })

  it('flags past deadlines as overdue', () => {
    expect(isOverdue(new Date(2026, 9, 24, 9, 0), now)).toBe(true)
    expect(isOverdue(new Date(2026, 9, 24, 11, 0), now)).toBe(false)
  })
})

describe('formatAge', () => {
  const now = new Date('2026-10-24T12:00:00Z')
  it.each([
    ['2026-10-24T11:59:40Z', 'just now'],
    ['2026-10-24T11:55:00Z', '5 min ago'],
    ['2026-10-24T09:00:00Z', '3 h ago'],
    ['2026-10-23T11:00:00Z', '1 day ago'],
    ['2026-10-21T12:00:00Z', '3 days ago'],
  ])('%s -> %s', (iso, label) => {
    expect(formatAge(iso, now)).toBe(label)
  })
})

describe('time picker options', () => {
  it('offers every 15 minutes of the day', () => {
    const options = timeOptions()
    expect(options).toHaveLength(96)
    expect(options.slice(0, 3)).toEqual(['00:00', '00:15', '00:30'])
    expect(options.at(-1)).toBe('23:45')
  })

  it('keeps a saved time that is off the grid, in order', () => {
    const options = timeOptions('18:40')
    expect(options).toHaveLength(97)
    expect(
      options.slice(options.indexOf('18:30'), options.indexOf('18:30') + 3)
    ).toEqual(['18:30', '18:40', '18:45'])
    expect(timeOptions('09:00')).toHaveLength(96)
  })

  it('labels times on a 12-hour clock', () => {
    expect(formatTimeValue('00:00')).toBe('12:00 AM')
    expect(formatTimeValue('09:05')).toBe('9:05 AM')
    expect(formatTimeValue('18:30')).toBe('6:30 PM')
  })
})
