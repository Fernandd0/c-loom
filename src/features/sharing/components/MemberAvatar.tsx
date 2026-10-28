import Image from 'next/image'
import { cn } from '@/lib/utils'

// A member's Google picture, or their initial on a neutral disc.
export function MemberAvatar({
  name,
  avatarUrl,
  size = 28,
  className,
}: {
  name?: string
  avatarUrl?: string
  size?: number
  className?: string
}) {
  const style = { width: size, height: size }
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        style={style}
        className={cn('shrink-0 rounded-full', className)}
      />
    )
  }
  return (
    <span
      aria-hidden
      style={{ ...style, fontSize: size * 0.42 }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-(--hover) font-semibold text-(--fg-2)',
        className
      )}
    >
      {(name || '?')[0].toUpperCase()}
    </span>
  )
}
