import * as React from 'react'
import { cn } from '@/lib/utils'

// A row in a small popover menu: icon, label and an optional shortcut on the right.
export function MenuItem({
  icon,
  detail,
  destructive,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactNode
  detail?: React.ReactNode
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] font-medium transition-colors outline-none [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:shrink-0',
        destructive
          ? 'text-[#FF3B30] hover:bg-[#FF3B30]/10 focus-visible:bg-[#FF3B30]/10'
          : 'text-(--fg) hover:bg-(--hover) focus-visible:bg-(--hover) [&>svg]:text-(--fg-3)',
        className
      )}
      {...props}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {detail && (
        <span className="shrink-0 text-[12px] font-normal text-(--fg-3) tabular-nums">
          {detail}
        </span>
      )}
    </button>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="mx-2 my-1 h-px bg-(--hairline)" />
}
