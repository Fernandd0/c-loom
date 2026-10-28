'use client'

import { useEffect, useState } from 'react'
import type { Presence, SharingApi } from '@/features/board/data/types'
import { MemberAvatar } from './MemberAvatar'

const MAX_SHOWN = 4

// The other people who have this galaxy open right now, top right of the board.
export function PresenceAvatars({
  boardId,
  me,
  sharing,
}: {
  boardId: string
  me: Presence
  sharing: SharingApi
}) {
  const [people, setPeople] = useState<Presence[]>([])
  const { userId, name, avatarUrl } = me

  // Mounted per galaxy (keyed by id), so the list starts empty for each one.
  useEffect(() => {
    return sharing.watchPresence(
      boardId,
      { userId, name, avatarUrl },
      setPeople
    )
  }, [sharing, boardId, userId, name, avatarUrl])

  const others = people.filter((p) => p.userId !== userId)
  if (others.length === 0) return null

  const names = others.map((p) => p.name || 'Someone')
  const label =
    names.length === 1 ? `${names[0]} is here` : `${names.join(', ')} are here`

  return (
    <div
      role="status"
      aria-label={label}
      title={label}
      className="fixed top-3 right-3 z-40 flex items-center rounded-full bg-(--glass) p-1 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md"
    >
      {others.slice(0, MAX_SHOWN).map((p, i) => (
        <MemberAvatar
          key={p.userId}
          name={p.name}
          avatarUrl={p.avatarUrl}
          size={24}
          className={
            i > 0 ? '-ml-1.5 ring-2 ring-(--page)' : 'ring-2 ring-(--page)'
          }
        />
      ))}
      {others.length > MAX_SHOWN && (
        <span className="px-1.5 text-[12px] font-medium text-(--fg-3)">
          +{others.length - MAX_SHOWN}
        </span>
      )}
    </div>
  )
}
