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
  // The deadline the repeat counts from, so the 31st stays the 31st; unset = deadline.
  recurrenceAnchor?: string
  priority?: number // 0 (normal) to 10 (highest priority)
}

export type NewTaskInput = Pick<
  Task,
  | 'title'
  | 'categoryId'
  | 'description'
  | 'deadline'
  | 'recurrence'
  | 'priority'
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
  // The owner. Others may be members of a shared galaxy.
  userId: string
  // People with access, the owner included. Unset for guest boards.
  memberCount?: number
}

export type MemberRole = 'owner' | 'editor'

export interface Member {
  userId: string
  name?: string
  avatarUrl?: string
  role: MemberRole
  joinedAt: string
}

// A line in a galaxy's history: who completed which task, and when.
export interface Completion {
  id: string
  workspaceId: string
  taskId: string
  title: string
  categoryId: string
  deadline?: string
  completedBy?: string
  completedByName?: string
  completedAt: string
}

export interface Profile {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
}
