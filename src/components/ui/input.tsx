import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground h-11 w-full min-w-0 rounded-xl border border-[#D1D1D6] bg-white px-4 py-3 text-[15px] leading-tight text-[#1C1C1E] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all outline-none selection:bg-[#D1D1D6] selection:text-[#1C1C1E] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#C7C7CC] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus:border-[#C7C7CC] focus:ring-4 focus:ring-[#D1D1D6]/30',
        'aria-invalid:border-[#FF3B30] aria-invalid:ring-4 aria-invalid:ring-[#FF3B30]/20',
        className
      )}
      {...props}
    />
  )
}

export { Input }
