import { describe, expect, it } from 'vitest'
import {
  galaxyIndexForKey,
  summarizeBoard,
  summaryLabel,
} from '@/features/board/lib/boardSummary'

const HOUR = 60 * 60 * 1000
const now = Date.parse('2026-10-25T12:00:00Z')
const due = (offset: number) => ({
  deadline: new Date(now + offset).toISOString(),
})

describe('summarizeBoard', () => {
  it('counts every task and the overdue and due-today ones apart', () => {
    const summary = summarizeBoard(
      [
        {},
        due(-HOUR),
        due(-48 * HOUR),
        due(2 * HOUR),
        due(48 * HOUR), // soon, not today
        due(10 * 24 * HOUR),
      ],
      now
    )
    expect(summary).toEqual({ total: 6, overdue: 2, dueToday: 1 })
  })

  it('is all zeros for an empty galaxy', () => {
    expect(summarizeBoard([], now)).toEqual({
      total: 0,
      overdue: 0,
      dueToday: 0,
    })
  })
})

describe('summaryLabel', () => {
  it('names only what is pressing', () => {
    expect(summaryLabel({ total: 3, overdue: 2, dueToday: 1 })).toBe(
      '2 overdue, 1 due today'
    )
    expect(summaryLabel({ total: 3, overdue: 0, dueToday: 1 })).toBe(
      '1 due today'
    )
    expect(summaryLabel({ total: 3, overdue: 0, dueToday: 0 })).toBe('')
  })
})

describe('galaxyIndexForKey', () => {
  const key = (key: string, mods: Partial<KeyboardEvent> = {}) => ({
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    ...mods,
  })

  it('maps plain 1–9 to a zero-based index', () => {
    expect(galaxyIndexForKey(key('1'))).toBe(0)
    expect(galaxyIndexForKey(key('9'))).toBe(8)
  })

  it('ignores 0, letters and modified digits (⌘1 switches browser tabs)', () => {
    expect(galaxyIndexForKey(key('0'))).toBeNull()
    expect(galaxyIndexForKey(key('n'))).toBeNull()
    expect(galaxyIndexForKey(key('1', { metaKey: true }))).toBeNull()
    expect(galaxyIndexForKey(key('1', { altKey: true }))).toBeNull()
  })
})
