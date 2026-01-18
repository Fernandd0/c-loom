'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Task } from '../types'

interface TaskCircleProps {
  task: Task
  onComplete: (id: string) => void
}

export default function TaskCircle({ task, onComplete }: TaskCircleProps) {
  const [hoursOld, setHoursOld] = useState(0)

  useEffect(() => {
    const calcTime = () => {
      const diff = Date.now() - task.createdAt
      const hours = diff / (1000 * 60 * 60)
      setHoursOld(hours)
    }

    calcTime()
    const interval = setInterval(calcTime, 60000)
    return () => clearInterval(interval)
  }, [task.createdAt])

  const size = Math.min(300, 80 + hoursOld * 5)

  const isUrgent = hoursOld > 48
  const isWarning = hoursOld > 24 && !isUrgent
  const isFresh = !isWarning && !isUrgent

  return (
    <motion.button
      layout
      initial={{ scale: 0, opacity: 0, rotate: -10 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 1.2, opacity: 0, filter: 'blur(10px)' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onComplete(task.id)}
      className={cn(
        'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full border p-4 text-center transition-all duration-700 ease-in-out',
        isFresh &&
          'border-emerald-500/30 bg-emerald-400/20 text-emerald-900 shadow-md backdrop-blur-md',
        isWarning &&
          'border-amber-500/40 bg-amber-400/30 text-amber-900 shadow-lg backdrop-blur-md',
        isUrgent &&
          'animate-pulse-slow border-rose-500/50 bg-rose-500/30 text-rose-950 shadow-2xl backdrop-blur-xl'
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, size / 10),
        boxShadow: isUrgent
          ? '0 20px 40px -10px rgba(244, 63, 94, 0.5), inset 0 2px 20px rgba(255,255,255,0.4)'
          : isWarning
            ? '0 10px 20px -5px rgba(251, 191, 36, 0.4), inset 0 2px 10px rgba(255,255,255,0.3)'
            : '0 4px 6px -1px rgba(52, 211, 153, 0.3), inset 0 2px 4px rgba(255,255,255,0.4)',
      }}
    >
      <div className="pointer-events-none absolute top-0 left-0 h-1/2 w-full rounded-t-full bg-gradient-to-b from-white/40 to-transparent" />

      <span className="relative z-10 line-clamp-3 leading-tight font-medium tracking-tight break-words">
        {task.title}
      </span>
    </motion.button>
  )
}
