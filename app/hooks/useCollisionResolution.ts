import { useEffect, useRef } from 'react'
import { Task } from '../types'

interface CollisionConfig {
  containerWidth: number
  containerHeight: number
  padding: number
}


const getTaskRadius = (createdAt: number) => {
  const hoursOld = (Date.now() - createdAt) / (1000 * 60 * 60)
  const diameter = Math.min(300, 80 + hoursOld * 5)
  return diameter / 2
}

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
        if (t1.x === undefined || t1.y === undefined) continue

        const r1 = getTaskRadius(t1.createdAt)


        const px = (t1.x / 100) * config.containerWidth
        const py = (t1.y / 100) * config.containerHeight
        let nPx = px
        let nPy = py


        nPx = Math.max(r1 + config.padding, Math.min(config.containerWidth - r1 - config.padding, nPx))
        nPy = Math.max(r1 + config.padding, Math.min(config.containerHeight - r1 - config.padding, nPy))


        for (let k = j + 1; k < newTasks.length; k++) {
          const t2 = newTasks[k]
          if (t2.x === undefined || t2.y === undefined) continue

          const r2 = getTaskRadius(t2.createdAt)
          const px2 = (t2.x / 100) * config.containerWidth
          const py2 = (t2.y / 100) * config.containerHeight

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
                x: (nPx2 / config.containerWidth) * 100,
                y: (nPy2 / config.containerHeight) * 100
            }
          }
        }


        if (nPx !== px || nPy !== py) {
          hasChanges = true
          t1.x = (nPx / config.containerWidth) * 100
          t1.y = (nPy / config.containerHeight) * 100
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

  }, [tasks, setTasks, config.containerWidth, config.containerHeight, config.padding])
}
