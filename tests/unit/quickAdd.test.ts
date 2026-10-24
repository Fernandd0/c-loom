import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseQuickAdd } from '@/features/board/lib/quickAdd'
import { Category } from '@/app/types'

const categories: Category[] = [
  { id: 'work', name: 'Work', color: '#000', workspaceId: 'w' },
  { id: 'personal', name: 'Personal', color: '#000', workspaceId: 'w' },
  { id: 'side', name: 'Side Project', color: '#000', workspaceId: 'w' },
  { id: 'shop', name: 'Shopping', color: '#000', workspaceId: 'w' },
]

const ZONES = [
  'America/Bogota',
  'America/Los_Angeles',
  'Europe/Madrid',
  'Asia/Tokyo',
  'UTC',
]
const originalTz = process.env.TZ

// Saturday 2026-10-24, 22:30 local: late enough that a UTC-based date would be tomorrow.
describe.each(ZONES)('parseQuickAdd in %s', (zone) => {
  beforeEach(() => {
    process.env.TZ = zone
  })
  afterEach(() => {
    process.env.TZ = originalTz
  })
  const now = () => new Date(2026, 9, 24, 22, 30)
  const parse = (text: string) => parseQuickAdd(text, categories, now())

  it('reads every field and keeps the rest as the title', () => {
    expect(parse('Pay rent tomorrow 9am #personal !high every month')).toEqual({
      title: 'Pay rent',
      date: '2026-10-25',
      time: '09:00',
      recurrence: 'monthly',
      priority: 7,
      categoryId: 'personal',
      matched: ['tomorrow', '9am', '#personal', '!high', 'every month'],
    })
  })

  it('reads dates on the local calendar', () => {
    expect(parse('A today').date).toBe('2026-10-24')
    expect(parse('A mañana').date).toBe('2026-10-25')
    expect(parse('A next week').date).toBe('2026-10-26') // Monday
    expect(parse('A this weekend').date).toBe('2026-10-24') // already Saturday
    expect(parse('A fri').date).toBe('2026-10-30')
    expect(parse('A saturday').date).toBe('2026-10-24') // today
  })

  it('reads 12h and 24h times, with or without "at"', () => {
    expect(parse('A tomorrow at 9:30 pm').time).toBe('21:30')
    expect(parse('A tomorrow 12am').time).toBe('00:00')
    expect(parse('A tomorrow 12pm').time).toBe('12:00')
    expect(parse('A tomorrow 18:05').time).toBe('18:05')
    expect(parse('A tomorrow 25:00').title).toBe('A 25:00')
  })

  it('puts a bare time on its next occurrence', () => {
    expect(parse('A 23:00')).toMatchObject({
      date: '2026-10-24',
      time: '23:00',
    })
    expect(parse('A 9am')).toMatchObject({ date: '2026-10-25', time: '09:00' })
  })

  it('starts a repeat on its weekday, or today', () => {
    expect(parse('Standup every tuesday')).toMatchObject({
      recurrence: 'weekly',
      date: '2026-10-27',
    })
    expect(parse('Water plants daily')).toMatchObject({
      recurrence: 'daily',
      date: '2026-10-24',
    })
  })
})

describe('parseQuickAdd', () => {
  const now = new Date(2026, 9, 24, 10, 0)
  const parse = (text: string) => parseQuickAdd(text, categories, now)

  it('reads priority words and numbers', () => {
    expect(parse('A !low').priority).toBe(0)
    expect(parse('A !medium').priority).toBe(4)
    expect(parse('A !urgent').priority).toBe(10)
    expect(parse('A !3').priority).toBe(7)
    expect(parse('A !important').title).toBe('A !important')
  })

  it('matches categories by name, ignoring case and spaces, or a unique prefix', () => {
    expect(parse('A #WORK').categoryId).toBe('work')
    expect(parse('A #sideproject').categoryId).toBe('side')
    expect(parse('A #pers').categoryId).toBe('personal')
    // "s" starts both Side Project and Shopping.
    expect(parse('A #s').categoryId).toBeUndefined()
    expect(parse('Fix #1 bug').title).toBe('Fix #1 bug')
  })

  it('reads each field once and leaves repeats in the title', () => {
    expect(parse('Move meeting from monday to friday')).toMatchObject({
      title: 'Move meeting from to friday',
      date: '2026-10-26',
    })
  })

  it('leaves plain text and lone numbers alone', () => {
    expect(parse('Call mom at 5')).toEqual({
      title: 'Call mom at 5',
      matched: [],
    })
  })

  it('reads plain words only after the title starts', () => {
    expect(parse('Daily standup')).toEqual({
      title: 'Daily standup',
      matched: [],
    })
    expect(parse('Friday drinks')).toEqual({
      title: 'Friday drinks',
      matched: [],
    })
    expect(parse('#work Daily standup').categoryId).toBe('work')
    expect(parse('Daily standup daily')).toMatchObject({
      title: 'Daily standup',
      recurrence: 'daily',
    })
  })

  it('keeps everything as the title when nothing else is left', () => {
    expect(parse('Tomorrow')).toEqual({ title: 'Tomorrow', matched: [] })
  })
})
