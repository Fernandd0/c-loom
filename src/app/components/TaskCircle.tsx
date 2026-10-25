import { useState, useEffect, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { AlertOctagon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task } from '../types'
import { getTaskDiameter, getTaskUrgency, TaskUrgency } from '../lib/task'
import { CategoryIcon } from './task-form/categoryOptions'

interface TaskCircleProps {
  task: Task
  color?: string
  // The category's icon id, shown above the title.
  icon?: string
  onComplete: (id: string) => void
  onSelect: (task: Task) => void
}

export default function TaskCircle({
  task,
  color,
  icon,
  onComplete,
  onSelect,
}: TaskCircleProps) {
  const [clickCount, setClickCount] = useState(0)

  const [urgency, setUrgency] = useState<TaskUrgency>('none')
  const [size, setSize] = useState(80)

  useEffect(() => {
    const calcTime = () => {
      const now = Date.now()
      setUrgency(getTaskUrgency(task, now))
      setSize(getTaskDiameter(task, now))
    }

    calcTime()
    const interval = setInterval(calcTime, 60000)
    return () => clearInterval(interval)
  }, [task])

  useEffect(() => {
    if (clickCount === 0) return

    const timer = setTimeout(() => {
      if (clickCount === 1) {
        onSelect(task)
      } else if (clickCount === 2) {
        onComplete(task.id)
      }
      setClickCount(0)
    }, 250)

    return () => clearTimeout(timer)
  }, [clickCount, onSelect, onComplete, task])

  const isUrgent = urgency === 'today' || urgency === 'overdue'

  // Without a category: green, or red once the deadline is close.
  const base = color ?? (isUrgent ? '#F43F5E' : '#34D399')
  const iconSize = Math.round(Math.min(28, Math.max(14, size / 7)))

  return (
    <motion.button
      layout
      initial={{ scale: 0, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 1.2, opacity: 0, filter: 'blur(10px)' }}
      whileHover={{
        scale: [1.1, 1.15, 1.1],
        transition: {
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setClickCount((prev) => prev + 1)}
      className={cn(
        'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full p-4 text-center font-bold text-white transition-[width,height,box-shadow] duration-300 ease-in-out',
        urgency === 'overdue' &&
          'ring-4 ring-[#FF3B30] ring-offset-2 ring-offset-transparent'
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, size / 10),
        ...sphereStyle(base, size),
      }}
    >
      {/* Soft highlight, as if lit from the top left. */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-[6%] left-[14%] h-[38%] w-[52%] rotate-[-20deg] rounded-full bg-gradient-to-b from-white/20 to-white/0 blur-sm"
      />
      <div className="relative z-10 flex flex-col items-center gap-1">
        {isUrgent && (
          <AlertOctagon
            aria-label={urgency === 'overdue' ? 'Overdue' : 'Due today'}
            className={cn(
              'h-8 w-8 text-white drop-shadow-sm',
              urgency === 'overdue' && 'animate-pulse'
            )}
          />
        )}
        {urgency === 'soon' && (
          <Clock
            aria-label="Due soon"
            className="h-5 w-5 text-white/90 drop-shadow-sm"
          />
        )}
        {/* The category's icon, unless a deadline signal needs the spot. */}
        {urgency === 'none' && icon && (
          <span style={{ width: iconSize, height: iconSize }}>
            <CategoryIcon
              icon={icon}
              className="h-full w-full text-white/90 drop-shadow-sm"
            />
          </span>
        )}

        <span className="line-clamp-3 leading-tight font-bold tracking-tight break-words drop-shadow-md">
          {task.title}
        </span>
      </div>
    </motion.button>
  )
}

// Lit from the top left, darker underneath, floating on a shadow of its own color.
// Shadows scale with the circle so small and big ones look the same depth.
export function sphereStyle(color: string, size: number): CSSProperties {
  const d = size / 100
  return {
    background: `radial-gradient(circle at 32% 26%, color-mix(in srgb, ${color} 65%, white) 0%, ${color} 48%, color-mix(in srgb, ${color} 78%, black) 100%)`,
    boxShadow: [
      `inset 0 ${-6 * d}px ${16 * d}px rgba(0, 0, 0, 0.18)`,
      `inset 0 ${3 * d}px ${8 * d}px rgba(255, 255, 255, 0.25)`,
      `0 ${12 * d}px ${28 * d}px ${-6 * d}px color-mix(in srgb, ${color} 55%, transparent)`,
      `0 ${2 * d}px ${6 * d}px rgba(0, 0, 0, 0.12)`,
    ].join(', '),
  }
}
