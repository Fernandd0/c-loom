import { useState, useEffect, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { AlertOctagon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task } from '../types'
import { getTaskDiameter, getTaskUrgency, TaskUrgency } from '../lib/task'
import { CategoryIcon, tone } from './task-form/categoryOptions'

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
  const base = color ?? (isUrgent ? '#B5544B' : '#6B8F71')
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
        'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full p-4 text-center font-bold text-[#FFF8EC] transition-[width,height,box-shadow] duration-300 ease-in-out',
        urgency === 'overdue' &&
          'ring-4 ring-[#B5544B] ring-offset-2 ring-offset-transparent'
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, size / 10),
        ...sphereStyle(base, size),
      }}
    >
      {/* Paper grain, for a matte, printed look instead of a glossy one. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full opacity-60 mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
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

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.17 0 0 0 0 0.13 0 0 0 0 0.09 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`

// Matte and warm, like a printed planet: cream light from the top left, sepia shade
// underneath and a soft neutral shadow, no colored glow. Shadows scale with the size.
export function sphereStyle(color: string, size: number): CSSProperties {
  const d = size / 100
  const c = tone(color)
  return {
    background: `radial-gradient(circle at 34% 28%, color-mix(in oklab, ${c} 72%, #fff4e0) 0%, ${c} 52%, color-mix(in oklab, ${c} 76%, #2b2118) 100%)`,
    boxShadow: [
      `inset 0 ${-5 * d}px ${14 * d}px rgba(43, 33, 24, 0.22)`,
      `inset 0 ${2 * d}px ${6 * d}px rgba(255, 244, 224, 0.22)`,
      `0 ${8 * d}px ${18 * d}px ${-6 * d}px rgba(43, 33, 24, 0.35)`,
      `0 ${1 * d}px ${3 * d}px rgba(43, 33, 24, 0.15)`,
    ].join(', '),
  }
}
