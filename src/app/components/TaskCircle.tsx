import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertOctagon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task } from '../types'

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

  const [status, setStatus] = useState<'chill' | 'urgent'>('chill')
  const [size, setSize] = useState(80)

  useEffect(() => {
    const calcTime = () => {
      const now = Date.now()
      const created = new Date(task.createdAt).getTime()
      const diff = now - created
      const hours = diff / (1000 * 60 * 60)

      let newStatus: 'chill' | 'urgent' = 'chill'

      // Priority affects base size: each level adds 100px (0=80px, 1=180px, 2=280px, 3=380px, etc.)
      const priorityNum = task.priority ?? 0
      const baseSize = 80 + priorityNum * 100
      let newSize = baseSize

      if (task.deadline) {
        const deadline = new Date(task.deadline).getTime()
        const hoursLeft = (deadline - now) / (1000 * 60 * 60)

        // Only show danger icon when due date is today (within 24 hours)
        if (hoursLeft < 24) {
          newStatus = 'urgent'
        } else {
          newStatus = 'chill'
        }
        // Circle grows over time from base size
        newSize = Math.min(400, baseSize + hours * 5)
      } else {
        // Without deadline, circle just grows over time from base size
        newStatus = 'chill'
        newSize = Math.min(300, baseSize + hours * 5)
      }

      setStatus(newStatus)
      setSize(newSize)
    }

    calcTime()
    const interval = setInterval(calcTime, 60000)
    return () => clearInterval(interval)
  }, [task.createdAt, task.deadline, task.priority])

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

  const isFresh = status === 'chill'
  const isUrgent = status === 'urgent'

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

        !color && isFresh && 'border-emerald-500 bg-emerald-400 text-white',
        !color &&
          isUrgent &&
          'animate-pulse-slow border-rose-500 bg-rose-500 text-white',

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
          <AlertOctagon className="h-8 w-8 animate-pulse text-white drop-shadow-sm" />
        )}

        <span className="line-clamp-3 leading-tight font-bold tracking-tight break-words drop-shadow-md">
          {task.title}
        </span>
      </div>
    </motion.button>
  )
}
