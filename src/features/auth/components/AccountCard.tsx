'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronRight, Cloud, LogOut } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Loader } from '@/components/ui/loader'
import { MenuItem } from '@/components/ui/menu-item'
import { signInWithGoogle, signOut } from '@/lib/auth'

const card =
  'flex w-full items-center gap-3 rounded-xl bg-(--surface-2) px-3 py-2.5 text-left transition-colors outline-none hover:bg-(--hover) focus-visible:bg-(--hover) data-[state=open]:bg-(--hover)'

// Top of the sidebar, like the account card at the top of iOS Settings.
export function AccountCard({
  user,
  galaxyCount,
}: {
  user?: User | null
  galaxyCount: number
}) {
  return user ? (
    <SignedInCard user={user} galaxyCount={galaxyCount} />
  ) : (
    <GuestCard />
  )
}

function SignedInCard({
  user,
  galaxyCount,
}: {
  user: User
  galaxyCount: number
}) {
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0]
  const avatar = user.user_metadata?.avatar_url as string | undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button aria-label="Account" className={card}>
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full"
            />
          ) : (
            <Avatar>{(name || 'U')[0].toUpperCase()}</Avatar>
          )}
          <CardText
            title={name}
            note={`Synced · ${galaxyCount} ${galaxyCount === 1 ? 'galaxy' : 'galaxies'}`}
          />
          <ChevronRight size={16} className="shrink-0 text-(--fg-3)" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) rounded-xl border-(--line) bg-(--surface) p-1"
      >
        <p className="truncate px-2 pt-1.5 pb-2 text-[12px] text-(--fg-3)">
          {user.email}
        </p>
        <MenuItem icon={<LogOut />} destructive onClick={signOut}>
          Sign out
        </MenuItem>
      </PopoverContent>
    </Popover>
  )
}

// For guests the card is the way in, like "Sign in to your iPhone".
function GuestCard() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign-in failed:', error)
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-(--glass) backdrop-blur-sm">
          <Loader />
        </div>
      )}
      <button
        onClick={handleLogin}
        aria-label="Sign in to sync"
        className={card}
      >
        <Avatar>
          <Cloud size={16} />
        </Avatar>
        <CardText title="Sign in to sync" note="Saved only on this device" />
        <ChevronRight size={16} className="shrink-0 text-(--fg-3)" />
      </button>
    </>
  )
}

function Avatar({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--surface-3) text-[14px] font-semibold text-(--fg-2)">
      {children}
    </span>
  )
}

function CardText({ title, note }: { title?: string; note: string }) {
  return (
    <span className="min-w-0 flex-1 leading-tight">
      <span className="block truncate text-[15px] font-semibold text-(--fg)">
        {title}
      </span>
      <span className="mt-0.5 block truncate text-[12px] text-(--fg-3)">
        {note}
      </span>
    </span>
  )
}
