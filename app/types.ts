export interface Task {
  id: string
  title: string
  createdAt: number
  x: number
  y: number
  color?: string
  durationMinutes?: number
}

export interface Category {
  id: string
  name: string
  color: string
}
