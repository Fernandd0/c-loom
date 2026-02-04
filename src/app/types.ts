export interface Task {
  id: string
  title: string
  createdAt: number
  x: number
  y: number
  categoryId: string
  durationMinutes?: number
}

export interface Category {
  id: string
  name: string
  color: string
}

export interface Board {
  id: string
  name: string
  tasks: Task[]
  createdAt: number
}
