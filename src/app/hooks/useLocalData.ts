import { useMemo } from 'react'
import { useStickyState } from './useStickyState'
import { Board, Task, Category } from '../types'

const NO_BOARDS: Board[] = []
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Work', color: '#3b82f6', workspaceId: 'default' },
  { id: '2', name: 'Personal', color: '#10b981', workspaceId: 'default' },
  { id: '3', name: 'Urgent', color: '#ef4444', workspaceId: 'default' },
]

// Stable pseudo-random 0..1 from a string, so a task without a saved position always lands in the same spot.
const seeded = (seed: string) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return (Math.abs(h) % 1000) / 1000
}

// Guest data saved by older versions may lack positions or use numeric timestamps.
const normalizeTask = (task: Task, workspaceId: string): Task => {
  const createdAt = task.createdAt as string | number
  if (
    task.pos_x !== undefined &&
    task.pos_y !== undefined &&
    typeof createdAt === 'string' &&
    task.workspaceId
  ) {
    return task
  }
  return {
    ...task,
    pos_x: task.pos_x ?? seeded(`${task.id}x`) * 80 + 10,
    pos_y: task.pos_y ?? seeded(`${task.id}y`) * 60 + 20,
    createdAt: new Date(createdAt).toISOString(),
    workspaceId: task.workspaceId || workspaceId,
    recurrence: task.recurrence ?? 'never',
  }
}

export function useLocalData() {
  const [storedBoards, setBoards, isLoaded] = useStickyState(
    NO_BOARDS,
    'c-loom-boards'
  )
  const [categories, setCategories] = useStickyState(
    DEFAULT_CATEGORIES,
    'c-loom-categories'
  )

  const boards = useMemo(
    () =>
      storedBoards.map((b) => ({
        ...b,
        tasks: b.tasks.map((t) => normalizeTask(t, b.id)),
      })),
    [storedBoards]
  )

  const createBoard = async (name: string) => {
    const newBoard: Board = {
      id: crypto.randomUUID(),
      name,
      tasks: [],
      createdAt: new Date().toISOString(),
      userId: 'local',
    }
    setBoards((prev) => [...prev, newBoard])
    return newBoard
  }

  const deleteBoard = async (boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId))
    setCategories((prev) => prev.filter((c) => c.workspaceId !== boardId))
  }

  const updateBoard = async (boardId: string, name: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, name } : b))
    )
  }

  const createTask = async (task: Task) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === task.workspaceId ? { ...b, tasks: [...b.tasks, task] } : b
      )
    )
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        tasks: b.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      }))
    )
  }

  const deleteTask = async (taskId: string) => {
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        tasks: b.tasks.filter((t) => t.id !== taskId),
      }))
    )
  }

  const createCategory = async (category: Category) => {
    setCategories((prev) => [...prev, category])
  }

  const updateCategory = async (
    categoryId: string,
    updates: Partial<Category>
  ) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c))
    )
  }

  const deleteCategory = async (categoryId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId))
  }

  return {
    boards,
    categories,
    isLoaded,
    createBoard,
    deleteBoard,
    updateBoard,
    createTask,
    updateTask,
    deleteTask,
    createCategory,
    updateCategory,
    deleteCategory,
    setBoards, // Exposed for useCollisionResolution compatibility
    setCategories,
  }
}
