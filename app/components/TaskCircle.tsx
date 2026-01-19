import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, AlertOctagon } from 'lucide-react'
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
      const now = Date.now()
      const diff = now - task.createdAt
      const hours = diff / (1000 * 60 * 60)
      setHoursOld(hours)
    }

    calcTime()
    const interval = setInterval(calcTime, 60000)
    return () => clearInterval(interval)
  }, [task.createdAt])


  let size = 80
  let status: 'chill' | 'warning' | 'urgent' = 'chill'

  if (task.durationMinutes) {
    const durationHours = task.durationMinutes / 60
    

    const intervalsPassed = Math.floor(hoursOld / durationHours)
    

    if (hoursOld > 48) {
        status = 'urgent'
    } else if (hoursOld > 24) {
        status = 'warning'
    } else {
        status = 'chill'
    }


    size = Math.min(400, 80 + (intervalsPassed * 20))

  } else {

    size = Math.min(300, 80 + hoursOld * 5)
    status = hoursOld > 48 ? 'urgent' : hoursOld > 24 ? 'warning' : 'chill'
  }


  const isFresh = status === 'chill'
  const isWarning = status === 'warning'
  const isUrgent = status === 'urgent'


  const customStyle = task.color ? {
      backgroundColor: task.color,
      borderColor: task.color,
      color: '#fff',
  } : {}

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
            ease: "easeInOut"
        }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onComplete(task.id)}
      className={cn(
        'group relative flex cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 p-4 text-center transition-all duration-300 ease-in-out',

        !task.color && isFresh &&
          'border-emerald-500 bg-emerald-400 text-white',
        !task.color && isWarning &&
          'border-amber-500 bg-amber-400 text-white',
        !task.color && isUrgent &&
          'animate-pulse-slow border-rose-500 bg-rose-500 text-white',

         task.color && 'text-white font-bold'
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(12, size / 10),
        ...customStyle,
        boxShadow: 'none'
      }}
    >

      
      <div className="relative z-10 flex flex-col items-center gap-1">
        {isWarning && <AlertTriangle className="h-6 w-6 text-white drop-shadow-sm animate-bounce" />}
        {isUrgent && <AlertOctagon className="h-8 w-8 text-white drop-shadow-sm animate-pulse" />}
        
        <span className="line-clamp-3 leading-tight font-bold tracking-tight break-words drop-shadow-md">
            {task.title}
        </span>
      </div>
    </motion.button>
  )
}
