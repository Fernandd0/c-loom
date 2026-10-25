import * as React from 'react'
import { cn } from '@/lib/utils'

// Apple-style grouped list: rounded group, hairline separators inset past the icon.
export function SettingsGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-[#F2F2F7] [&>*:last-child]:after:hidden',
        className
      )}
    >
      {children}
    </div>
  )
}

interface SettingsRowProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  // Background of the small rounded icon tile, like Settings on iOS.
  tint: string
  label: string
  // Shown in gray on the right, e.g. "⌘G".
  detail?: React.ReactNode
  destructive?: boolean
}

export const SettingsRow = React.forwardRef<
  HTMLButtonElement,
  SettingsRowProps
>(function SettingsRow(
  { icon, tint, label, detail, destructive, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'relative flex h-10 w-full items-center gap-3 px-2.5 text-left text-[14px] font-medium transition-colors outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.05] active:bg-black/[0.07]',
        'after:absolute after:right-0 after:bottom-0 after:left-[46px] after:h-px after:bg-black/[0.07]',
        destructive ? 'text-[#FF3B30]' : 'text-[#1C1C1E]',
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-white [&>svg]:h-3.5 [&>svg]:w-3.5"
        style={{ backgroundColor: tint }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {detail && (
        <span className="shrink-0 text-[12px] text-[#8E8E93] tabular-nums">
          {detail}
        </span>
      )}
    </button>
  )
})

// A read-only row for the same grouped lists: icon tile, title, optional note and trailing content.
export function SettingsItem({
  icon,
  tint,
  title,
  note,
  trailing,
  href,
}: {
  icon?: React.ReactNode
  tint?: string
  title: React.ReactNode
  note?: React.ReactNode
  trailing?: React.ReactNode
  // Makes the whole row an external link.
  href?: string
}) {
  const content = (
    <>
      {icon && (
        <span
          aria-hidden
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] text-white [&>svg]:h-3.5 [&>svg]:w-3.5"
          style={{ backgroundColor: tint }}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-[#1C1C1E]">
          {title}
        </span>
        {note && (
          <span className="mt-0.5 block text-[13px] leading-snug text-[#8E8E93]">
            {note}
          </span>
        )}
      </span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </>
  )
  const className = cn(
    'relative flex min-h-11 items-center gap-3 px-3 py-2.5 text-left',
    'after:absolute after:right-0 after:bottom-0 after:h-px after:bg-black/[0.07]',
    icon ? 'after:left-[48px]' : 'after:left-3'
  )
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        className,
        'transition-colors outline-none hover:bg-black/[0.04] focus-visible:bg-black/[0.05]'
      )}
    >
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  )
}

// Small gray caption above a group, like iOS section headers.
export function SettingsCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.06em] text-[#8E8E93] uppercase">
      {children}
    </p>
  )
}
