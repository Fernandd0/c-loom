import type { Task } from '@/app/types'
import type { TaskPosition } from '../data/types'

// Lays a user's own layout over the tasks' starting positions.
export function overlayPositions(
  tasks: Task[],
  positions: Iterable<TaskPosition>
): Task[] {
  const byId = new Map(Array.from(positions, (p) => [p.id, p]))
  if (byId.size === 0) return tasks
  return tasks.map((t) => {
    const p = byId.get(t.id)
    return p ? { ...t, pos_x: p.pos_x, pos_y: p.pos_y } : t
  })
}
