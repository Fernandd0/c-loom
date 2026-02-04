import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface KbdProps {
  children: ReactNode
  className?: string
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm',
        className
      )}
    >
      {children}
    </kbd>
  )
}
