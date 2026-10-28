import { describe, expect, it, vi } from 'vitest'
import { overlayPositions } from '@/features/board/lib/positions'
import {
  createReloadGate,
  isRelevantChange,
} from '@/features/board/data/realtime'
import type { Task } from '@/app/types'

const task = (id: string, pos_x = 50, pos_y = 50): Task => ({
  id,
  title: id,
  createdAt: '2026-10-28T00:00:00.000Z',
  pos_x,
  pos_y,
  categoryId: '',
  workspaceId: 'w1',
  recurrence: 'never',
})

describe('overlayPositions', () => {
  it("uses the user's own position where there is one", () => {
    const tasks = [task('a', 10, 20), task('b', 30, 40)]
    expect(
      overlayPositions(tasks, [{ id: 'b', pos_x: 70, pos_y: 80 }])
    ).toEqual([task('a', 10, 20), task('b', 70, 80)])
  })

  it('returns the same tasks when there is nothing to lay over', () => {
    const tasks = [task('a')]
    expect(overlayPositions(tasks, [])).toBe(tasks)
  })
})

describe('isRelevantChange', () => {
  const known = new Set(['task-1', 'galaxy-1'])

  it('always reloads on inserts and updates (RLS already filtered them)', () => {
    expect(
      isRelevantChange({ eventType: 'INSERT', table: 'tasks', old: {} }, known)
    ).toBe(true)
    expect(
      isRelevantChange({ eventType: 'UPDATE', table: 'tasks', old: {} }, known)
    ).toBe(true)
  })

  it('ignores deletes of rows from other galaxies', () => {
    const del = (table: string, old: Record<string, unknown>) =>
      isRelevantChange({ eventType: 'DELETE', table, old }, known)
    expect(del('tasks', { id: 'task-1' })).toBe(true)
    expect(del('tasks', { id: 'someone-elses' })).toBe(false)
    expect(del('workspace_members', { workspace_id: 'galaxy-1' })).toBe(true)
    expect(del('workspace_members', { workspace_id: 'other' })).toBe(false)
    expect(del('tasks', {})).toBe(false)
  })
})

describe('createReloadGate', () => {
  it('reloads right away when nothing is saving', () => {
    const gate = createReloadGate()
    const reload = vi.fn()
    gate.request(reload)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('waits for every write in flight, then reloads once', () => {
    const gate = createReloadGate()
    const reload = vi.fn()
    gate.begin()
    gate.begin()
    gate.request(reload)
    gate.request(reload)
    gate.end()
    expect(reload).not.toHaveBeenCalled()
    gate.end()
    expect(reload).toHaveBeenCalledOnce()
    gate.end() // extra ends don't go negative or rerun
    expect(reload).toHaveBeenCalledOnce()
  })
})
