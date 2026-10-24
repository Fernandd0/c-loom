import { beforeEach, describe, expect, it } from 'vitest'
import { clearGuestData, localSource } from '@/features/board/data/localSource'

// Minimal in-memory localStorage; the source only touches window.localStorage.
beforeEach(() => {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    },
  })
})

const legacyBoards = [
  {
    id: 'b1',
    name: 'Old board',
    createdAt: '2025-01-01T00:00:00.000Z',
    userId: 'local',
    tasks: [
      // Saved by an older version: numeric timestamp, no position, no recurrence.
      {
        id: 'legacy-task',
        title: 'Old',
        createdAt: 1735689600000,
        categoryId: '1',
      },
    ],
  },
]

describe('localSource', () => {
  it('starts empty with the three default categories', async () => {
    const { boards, categories } = await localSource.load()
    expect(boards).toEqual([])
    expect(categories.map((c) => c.name)).toEqual([
      'Work',
      'Personal',
      'Urgent',
    ])
  })

  it('repairs guest data saved by older versions', async () => {
    window.localStorage.setItem('c-loom-boards', JSON.stringify(legacyBoards))
    const [task] = (await localSource.load()).boards[0].tasks
    expect(task.createdAt).toBe('2025-01-01T00:00:00.000Z')
    expect(task.workspaceId).toBe('b1')
    expect(task.recurrence).toBe('never')
    expect(task.pos_x).toBeGreaterThanOrEqual(10)
    expect(task.pos_x).toBeLessThanOrEqual(90)
  })

  it('places a task without a saved position in the same spot every load', async () => {
    window.localStorage.setItem('c-loom-boards', JSON.stringify(legacyBoards))
    const first = (await localSource.load()).boards[0].tasks[0]
    const second = (await localSource.load()).boards[0].tasks[0]
    expect([second.pos_x, second.pos_y]).toEqual([first.pos_x, first.pos_y])
  })

  it('saves snapshots and clears them after an import', async () => {
    const snapshot = await localSource.load()
    snapshot.boards.push({
      id: 'b2',
      name: 'New',
      tasks: [],
      createdAt: '',
      userId: 'local',
    })
    localSource.saveSnapshot!(snapshot)
    expect((await localSource.load()).boards.map((b) => b.id)).toEqual(['b2'])
    clearGuestData()
    expect((await localSource.load()).boards).toEqual([])
  })
})
