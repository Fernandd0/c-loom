import { useEffect } from 'react'
import { Task } from '../types'
import { CollisionConfig, resolveCollisions } from '../lib/collisions'

// Re-runs collision resolution whenever tasks or the container change, until nothing moves.
export function useCollisionResolution(
  tasks: Task[],
  setTasks: (tasks: Task[]) => void,
  config: CollisionConfig
) {
  const { containerWidth, containerHeight, padding } = config

  useEffect(() => {
    const resolved = resolveCollisions(tasks, {
      containerWidth,
      containerHeight,
      padding,
    })
    if (!resolved) return
    // Short delay so the movement animates in steps instead of jumping.
    const timeoutId = setTimeout(() => setTasks(resolved), 32)
    return () => clearTimeout(timeoutId)
  }, [tasks, setTasks, containerWidth, containerHeight, padding])
}
