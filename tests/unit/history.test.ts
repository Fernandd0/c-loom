import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { completedByLabel, groupByDay } from '@/features/sharing/lib/history'
import type { Completion } from '@/app/types'

const ZONES = ['America/Bogota', 'Europe/Madrid', 'Asia/Tokyo', 'UTC']
const originalTz = process.env.TZ

const done = (title: string, completedAt: Date): Completion => ({
  id: title,
  workspaceId: 'w1',
  taskId: title,
  title,
  categoryId: '',
  completedAt: completedAt.toISOString(),
})

describe.each(ZONES)('groupByDay in %s', (zone) => {
  beforeEach(() => {
    process.env.TZ = zone
  })
  afterEach(() => {
    process.env.TZ = originalTz
  })

  it('groups by local day, newest first', () => {
    // Local times, so the day boundaries are the user's own.
    const now = new Date(2026, 9, 28, 9, 0)
    const groups = groupByDay(
      [
        done('this morning', new Date(2026, 9, 28, 0, 30)),
        done('late last night', new Date(2026, 9, 27, 23, 50)),
        done('yesterday noon', new Date(2026, 9, 27, 12, 0)),
        done('monday', new Date(2026, 9, 26, 8, 0)),
        done('last year', new Date(2025, 11, 31, 8, 0)),
      ],
      now
    )
    expect(groups.map((g) => [g.label, g.items.map((c) => c.title)])).toEqual([
      ['Today', ['this morning']],
      ['Yesterday', ['late last night', 'yesterday noon']],
      ['Mon, Oct 26', ['monday']],
      ['Dec 31, 2025', ['last year']],
    ])
  })
})

describe('completedByLabel', () => {
  const c = (completedBy?: string, completedByName?: string) => ({
    ...done('x', new Date()),
    completedBy,
    completedByName,
  })

  it('says You, the saved name, or Someone', () => {
    expect(completedByLabel(c('me', 'Fer'), 'me')).toBe('You')
    expect(completedByLabel(c('ana', 'Ana'), 'me')).toBe('Ana')
    expect(completedByLabel(c('ana'), 'me')).toBe('Someone')
    expect(completedByLabel(c(undefined, 'Gone'), 'me')).toBe('Gone')
  })
})
