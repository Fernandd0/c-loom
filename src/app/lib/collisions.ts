import { Task } from '../types'
import { getTaskDiameter } from './task'

export interface CollisionConfig {
  containerWidth: number
  containerHeight: number
  padding: number
}

const ITERATIONS = 10
const GAP_PX = 20
// Circles grow continuously, so touching circles overlap by a sliver more on every pass.
// Ignoring sub-pixel overlaps and moves lets the layout settle instead of nudging forever.
export const SETTLE_PX = 0.5

// Pushes overlapping circles apart and keeps them inside the container.
// Returns the moved tasks, or null when nothing needs to move. Never mutates its input.
export function resolveCollisions(
  tasks: Task[],
  config: CollisionConfig,
  now = Date.now()
): Task[] | null {
  const { containerWidth: width, containerHeight: height, padding } = config
  // Before the container is measured, positions can't be converted to pixels.
  if (tasks.length === 0 || width <= 0 || height <= 0) return null

  const radius = (task: Task) => getTaskDiameter(task, now) / 2
  const next = [...tasks]
  let hasChanges = false

  for (let i = 0; i < ITERATIONS; i++) {
    for (let j = 0; j < next.length; j++) {
      const t1 = next[j]
      const r1 = radius(t1)

      const px = (t1.pos_x / 100) * width
      const py = (t1.pos_y / 100) * height
      let nPx = Math.max(r1 + padding, Math.min(width - r1 - padding, px))
      let nPy = Math.max(r1 + padding, Math.min(height - r1 - padding, py))

      for (let k = j + 1; k < next.length; k++) {
        const t2 = next[k]
        const px2 = (t2.pos_x / 100) * width
        const py2 = (t2.pos_y / 100) * height

        const dx = px2 - nPx
        const dy = py2 - nPy
        const distance = Math.sqrt(dx * dx + dy * dy)
        const minDist = r1 + radius(t2) + GAP_PX

        if (distance < minDist - SETTLE_PX) {
          hasChanges = true
          const force = (minDist - distance) / 2
          const angle = Math.atan2(dy, dx)
          // Exactly stacked circles have no direction; push them apart horizontally.
          const fdX = distance === 0 ? force : Math.cos(angle) * force
          const fdY = distance === 0 ? 0 : Math.sin(angle) * force

          nPx -= fdX
          nPy -= fdY
          next[k] = {
            ...t2,
            pos_x: ((px2 + fdX) / width) * 100,
            pos_y: ((py2 + fdY) / height) * 100,
          }
        }
      }

      if (Math.abs(nPx - px) > SETTLE_PX || Math.abs(nPy - py) > SETTLE_PX) {
        hasChanges = true
        next[j] = {
          ...t1,
          pos_x: (nPx / width) * 100,
          pos_y: (nPy / height) * 100,
        }
      }
    }
  }

  return hasChanges ? next : null
}
