import { useEffect, useRef } from 'react'
import { Task } from '../types'
import { getTaskDiameter } from '../lib/task'

interface CollisionConfig {
  containerWidth: number
  containerHeight: number
  padding: number
}

const getTaskRadius = (task: Task) => getTaskDiameter(task) / 2

export function useCollisionResolution(
  tasks: Task[],
  setTasks: (tasks: Task[]) => void,
  config: CollisionConfig
) {
  const isResolvingRef = useRef(false)

  useEffect(() => {
    if (tasks.length === 0 || isResolvingRef.current) return

    let hasChanges = false
    const newTasks = [...tasks]
    const iterations = 10

    for (let i = 0; i < iterations; i++) {
      for (let j = 0; j < newTasks.length; j++) {
        const t1 = newTasks[j]
        if (t1.pos_x === undefined || t1.pos_y === undefined) continue

        const r1 = getTaskRadius(t1)

        const px = (t1.pos_x / 100) * config.containerWidth
        const py = (t1.pos_y / 100) * config.containerHeight
        let nPx = px
        let nPy = py

        nPx = Math.max(
          r1 + config.padding,
          Math.min(config.containerWidth - r1 - config.padding, nPx)
        )
        nPy = Math.max(
          r1 + config.padding,
          Math.min(config.containerHeight - r1 - config.padding, nPy)
        )

        for (let k = j + 1; k < newTasks.length; k++) {
          const t2 = newTasks[k]
          if (t2.pos_x === undefined || t2.pos_y === undefined) continue

          const r2 = getTaskRadius(t2)
          const px2 = (t2.pos_x / 100) * config.containerWidth
          const py2 = (t2.pos_y / 100) * config.containerHeight

          const dx = px2 - nPx
          const dy = py2 - nPy
          const distance = Math.sqrt(dx * dx + dy * dy)
          const minDist = r1 + r2 + 20

          if (distance < minDist) {
            hasChanges = true

            const overlap = minDist - distance
            const angle = Math.atan2(dy, dx)
            const force = overlap / 2

            const fdX = distance === 0 ? 1 : Math.cos(angle) * force
            const fdY = distance === 0 ? 0 : Math.sin(angle) * force

            nPx -= fdX
            nPy -= fdY

            const nPx2 = px2 + fdX
            const nPy2 = py2 + fdY

            newTasks[k] = {
              ...t2,
              pos_x: (nPx2 / config.containerWidth) * 100,
              pos_y: (nPy2 / config.containerHeight) * 100,
            }
          }
        }

        if (nPx !== px || nPy !== py) {
          hasChanges = true
          // Replace instead of mutating: t1 may still be the object held in React state.
          newTasks[j] = {
            ...t1,
            pos_x: (nPx / config.containerWidth) * 100,
            pos_y: (nPy / config.containerHeight) * 100,
          }
        }
      }
    }

    if (hasChanges) {
      isResolvingRef.current = true
      const timeoutId = setTimeout(() => {
        setTasks(newTasks)
        isResolvingRef.current = false
      }, 32)
      return () => clearTimeout(timeoutId)
    }
  }, [
    tasks,
    setTasks,
    config.containerWidth,
    config.containerHeight,
    config.padding,
  ])
}
