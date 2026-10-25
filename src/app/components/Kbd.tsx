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
        'inline-flex items-center justify-center rounded-md border border-(--line) bg-(--surface-2) px-2.5 py-1 text-xs font-bold text-(--fg-2) shadow-sm',
        className
      )}
    >
      {children}
    </kbd>
  )
}
