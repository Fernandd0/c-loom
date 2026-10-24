import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertOctagon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task } from '../types'
import { getTaskDiameter, getTaskUrgency, TaskUrgency } from '../lib/task'

interface TaskCircleProps {
  task: Task
  color?: string
  onComplete: (id: string) => void
  onSelect: (task: Task) => void
}

export default function TaskCircle({
  task,
  color,
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

  const customStyle = color
    ? {
        backgroundColor: color,
        borderColor: color,
        color: '#fff',
      }
    : {}

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
        'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 p-4 text-center transition-all duration-300 ease-in-out',

        !color && !isUrgent && 'border-emerald-500 bg-emerald-400 text-white',
        !color && isUrgent && 'border-rose-500 bg-rose-500 text-white',
        urgency === 'overdue' && 'ring-4 ring-[#FF3B30] ring-offset-2',

        color && 'font-bold text-white'
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, size / 10),
        ...customStyle,
        boxShadow: 'none',
      }}
    >
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

        <span className="line-clamp-3 leading-tight font-bold tracking-tight break-words drop-shadow-md">
          {task.title}
        </span>
      </div>
    </motion.button>
  )
}
