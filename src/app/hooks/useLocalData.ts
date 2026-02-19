import { useStickyState } from './useStickyState'
import { Board, Task, Category } from '../types'

export function useLocalData() {
  const [boards, setBoards, isLoaded] = useStickyState<Board[]>(
    [],
    'c-loom-boards'
  )
  const [categories, setCategories] = useStickyState<Category[]>(
    [
      { id: '1', name: 'Work', color: '#3b82f6', workspaceId: 'default' },
      { id: '2', name: 'Personal', color: '#10b981', workspaceId: 'default' },
      { id: '3', name: 'Urgent', color: '#ef4444', workspaceId: 'default' },
    ],
    'c-loom-categories'
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
