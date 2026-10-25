import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground h-11 w-full min-w-0 rounded-xl border border-(--line-strong) bg-(--surface) px-4 py-3 text-[15px] leading-tight text-(--fg) shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all outline-none selection:bg-(--surface-3) selection:text-(--fg) file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-(--fg-4) disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-(--line-strong) focus:ring-4 focus:ring-[#D1D1D6]/30',
        'aria-invalid:border-[#FF3B30] aria-invalid:ring-4 aria-invalid:ring-[#FF3B30]/20',
        className
      )}
      {...props}
    />
  )
}

export { Input }
