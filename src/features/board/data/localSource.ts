import { Board, Category, Task } from '@/app/types'
import { BoardDataSource, BoardSnapshot } from './types'

const BOARDS_KEY = 'c-loom-boards'
const CATEGORIES_KEY = 'c-loom-categories'

// Guest boards share these; workspace 'default' means "every board".
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Work', color: '#3b82f6', workspaceId: 'default' },
  { id: '2', name: 'Personal', color: '#10b981', workspaceId: 'default' },
]

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch (e) {
    console.error(`Error reading ${key}`, e)
    return fallback
  }
}

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
    task.workspaceId &&
    task.recurrence
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

const done = async () => {}

// Removes guest data after it has been imported into an account.
export function clearGuestData() {
  try {
    window.localStorage.removeItem(BOARDS_KEY)
    window.localStorage.removeItem(CATEGORIES_KEY)
  } catch (e) {
    console.error('Error clearing guest data', e)
  }
}

export const localSource: BoardDataSource = {
  async load() {
    const boards = read<Board[]>(BOARDS_KEY, []).map((b) => ({
      ...b,
      tasks: b.tasks.map((t) => normalizeTask(t, b.id)),
    }))
    return { boards, categories: read(CATEGORIES_KEY, DEFAULT_CATEGORIES) }
  },

  // State lives in memory and is written whole by saveSnapshot, so individual writes have nothing to do.
  createBoard: async () => [],
  deleteBoard: done,
  renameBoard: done,
  createTask: done,
  updateTask: done,
  deleteTask: done,
  createCategory: done,
  updateCategory: done,
  deleteCategory: done,
  savePositions: done,

  saveSnapshot({ boards, categories }: BoardSnapshot) {
    try {
      window.localStorage.setItem(BOARDS_KEY, JSON.stringify(boards))
      window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    } catch (e) {
      console.error('Error saving guest data', e)
    }
  },

  subscribe(onChange) {
    const onStorage = (event: StorageEvent) => {
      if (event.key === BOARDS_KEY || event.key === CATEGORIES_KEY) onChange()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  },
}
