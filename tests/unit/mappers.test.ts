import { describe, expect, it } from 'vitest'
import {
  categoryFromRow,
  categoryToInsert,
  categoryToUpdate,
  taskFromRow,
  taskToInsert,
  taskToUpdate,
} from '@/features/board/data/mappers'
import type { Tables } from '@/lib/supabase/database.types'
import { Task } from '@/app/types'

const task: Task = {
  id: 't1',
  title: 'Write report',
  description: 'details',
  createdAt: '2026-10-24T12:00:00.000Z',
  pos_x: 40,
  pos_y: 60,
  categoryId: 'c1',
  workspaceId: 'w1',
  deadline: '2026-10-25T23:30:00.000Z',
  recurrence: 'weekly',
  priority: 7,
}

describe('task mappers', () => {
  it('round-trips every field through a database row', () => {
    const insert = taskToInsert(task)
    const row = { ...insert } as Tables<'tasks'>
    expect(taskFromRow(row)).toEqual(task)
  })

  it('stores a missing category and deadline as null', () => {
    const insert = taskToInsert({
      ...task,
      categoryId: '',
      deadline: undefined,
    })
    expect(insert.category_id).toBeNull()
    expect(insert.deadline).toBeNull()
  })

  it('normalizes legacy YYYY-MM-DD deadlines to the local end of day', () => {
    // TZ is America/Bogota (UTC-5) in vitest.config.ts.
    expect(taskToInsert({ ...task, deadline: '2026-10-24' }).deadline).toBe(
      '2026-10-25T04:59:00.000Z'
    )
  })

  it('only sends the fields being updated, and clears a removed deadline', () => {
    expect(taskToUpdate({ title: 'New' })).toEqual({ title: 'New' })
    expect(taskToUpdate({ deadline: undefined })).toEqual({ deadline: null })
    expect(taskToUpdate({ priority: 0, categoryId: '' })).toEqual({
      priority: 0,
      category_id: null,
    })
  })
})

describe('category mappers', () => {
  it('round-trips name, color and icon', () => {
    const category = {
      id: 'c1',
      name: 'Gym',
      color: '#FF9500',
      icon: 'home',
      workspaceId: 'w1',
    }
    const row = {
      ...categoryToInsert(category),
      created_at: '',
    } as Tables<'categories'>
    expect(categoryFromRow(row)).toEqual(category)
    expect(categoryToUpdate({ icon: undefined })).toEqual({ icon: null })
  })
})
