'use client'

import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-[2rem] border border-white/20 bg-white/80 shadow-2xl backdrop-blur-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
