export interface Task {
  id: string
  title: string
  description?: string
  createdAt: string // ISO string from DB
  pos_x: number // DB column
  pos_y: number // DB column
  categoryId: string
  workspaceId: string
  completed: boolean
  deadline?: string
}

export interface Category {
  id: string
  name: string
  color: string
  workspaceId: string
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

