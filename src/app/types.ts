export type TaskRecurrence = 'never' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Task {
  id: string
  title: string
  description?: string
  createdAt: string // ISO string from DB
  pos_x: number // DB column
  pos_y: number // DB column
  categoryId: string
  workspaceId: string
  deadline?: string
  recurrence: TaskRecurrence
  priority?: number // 0 (normal) to 10 (highest priority)
}

export type NewTaskInput = Pick<
  Task,
  'title' | 'categoryId' | 'description' | 'deadline' | 'recurrence' | 'priority'
>

export interface Category {
  id: string
  name: string
  color: string
  workspaceId: string
  icon?: string
}

export interface Board {
  id: string
  name: string
  tasks: Task[]
  createdAt: string
  userId: string
}

export interface Profile {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
}

