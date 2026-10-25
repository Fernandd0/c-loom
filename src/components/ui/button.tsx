import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[15px] font-semibold leading-tight transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[#D1D1D6]/40 focus-visible:ring-4",
  {
    variants: {
      variant: {
        default:
          'bg-(--surface-3) text-(--fg) shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.06)] hover:bg-(--surface-3) hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_3px_6px_rgba(0,0,0,0.08)] active:scale-[0.98] active:shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        destructive:
          'bg-[#FF3B30] text-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(255,59,48,0.15)] hover:bg-[#D70015] hover:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_3px_6px_rgba(255,59,48,0.2)] active:scale-[0.98]',
        outline:
          'border border-(--line-strong) bg-(--surface) text-(--fg) shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-(--surface-2) hover:border-(--line-strong) active:scale-[0.98]',
        secondary:
          'bg-(--surface-2) text-(--fg) shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-(--surface-3) active:scale-[0.98]',
        ghost:
          'text-(--fg-2) hover:bg-(--surface-2) active:bg-(--surface-3) active:scale-[0.98]',
        link: 'text-(--fg-2) underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-3',
        sm: 'h-9 rounded-xl gap-1.5 px-4 py-2 text-[13px]',
        lg: 'h-12 rounded-2xl px-6 py-3.5 text-base',
        icon: 'size-11',
        'icon-sm': 'size-9 rounded-xl',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
