'use client'

import { cn } from '@/lib/utils'

export const chipClass = (selected: boolean) =>
  cn(
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#1C1C1E]/30',
    selected
      ? 'bg-[#1C1C1E] text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
      : 'bg-[#F2F2F7] text-[#3C3C43] hover:bg-[#E5E5EA]'
  )

interface ChipGroupProps<T extends string | number> {
  label: string
  options: readonly { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
}

export function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={chipClass(option.value === value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function FieldLabel({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-[#8E8E93] uppercase">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  )
}
