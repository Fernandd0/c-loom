'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Link2, LogOut, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { GlassCard } from '@/app/components/GlassCard'
import { SettingsGroup, SettingsSwitch } from '@/app/components/SettingsRow'
import type { Board, Member } from '@/app/types'
import type { SharingApi } from '@/features/board/data/types'
import { inviteUrl } from '../lib/pendingInvite'
import { MemberAvatar } from './MemberAvatar'

const LOAD_FAILED = "Couldn't load who's in this galaxy. Check your connection."
const SAVE_FAILED = "Couldn't save that change. Try again."
const COPIED_MS = 2000

const button =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--fg-3) disabled:opacity-50 [&>svg]:h-3.5 [&>svg]:w-3.5'
const quiet = `${button} bg-(--surface-2) text-(--fg-2) hover:bg-(--hover) hover:text-(--fg)`

interface ShareDialogProps {
  board: Board | undefined
  meId: string
  sharing: SharingApi
  onLeave: (boardId: string) => void
  onClose: () => void
}

// Who's in a galaxy and, for its owner, the invite link. Editors can leave from here.
export function ShareDialog({
  board,
  meId,
  sharing,
  onLeave,
  onClose,
}: ShareDialogProps) {
  return (
    <Dialog open={!!board} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        {board && (
          // Keyed so switching galaxies starts from a clean state.
          <ShareContent
            key={board.id}
            board={board}
            meId={meId}
            sharing={sharing}
            onLeave={() => {
              onLeave(board.id)
              onClose()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ShareContent({
  board,
  meId,
  sharing,
  onLeave,
}: {
  board: Board
  meId: string
  sharing: SharingApi
  onLeave: () => void
}) {
  const isOwner = board.userId === meId
  const [members, setMembers] = useState<Member[] | null>(null)
  // undefined while loading, null when the galaxy has no link.
  const [token, setToken] = useState<string | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)

  const loadMembers = useCallback(
    () =>
      sharing
        .members(board.id)
        .then(setMembers)
        .catch((e) => {
          console.error('Error loading members:', e)
          setError(LOAD_FAILED)
        }),
    [sharing, board.id]
  )

  useEffect(() => {
    loadMembers()
    if (!isOwner) return
    sharing
      .invite(board.id)
      .then(setToken)
      .catch((e) => {
        console.error('Error loading invite:', e)
        setError(LOAD_FAILED)
      })
  }, [loadMembers, sharing, board.id, isOwner])

  // Runs a sharing change, with one error message for all of them.
  const run = async (change: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await change()
    } catch (e) {
      console.error('Error changing sharing:', e)
      setError(SAVE_FAILED)
    } finally {
      setBusy(false)
    }
  }

  const copy = (value: string) =>
    navigator.clipboard
      .writeText(inviteUrl(value))
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), COPIED_MS)
      })
      .catch(() => setError("Couldn't copy. Select the link and copy it."))

  const createLink = () =>
    run(async () => {
      const fresh = await sharing.resetInvite(board.id)
      setToken(fresh)
      await copy(fresh)
    })

  return (
    <GlassCard className="max-h-[85vh] space-y-5 overflow-y-auto p-5 sm:p-6">
      <div>
        <DialogTitle className="text-xl font-bold tracking-tight text-(--fg)">
          Share “{board.name}”
        </DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-(--fg-3)">
          {isOwner
            ? 'Only you can delete the galaxy or remove people.'
            : 'Everyone here can add, edit and complete tasks.'}
        </DialogDescription>
      </div>

      {isOwner && (
        <section aria-label="Invite link" className="space-y-2">
          {/* Hidden until we know whether there is a link, so it doesn't flip on load. */}
          {token !== undefined && (
            <SettingsGroup>
              <SettingsSwitch
                icon={<Link2 />}
                tint="#5856D6"
                label="Share with a link"
                checked={!!token}
                onChange={(on) => {
                  if (busy) return
                  if (on) createLink()
                  else
                    run(async () => {
                      await sharing.stopSharing(board.id)
                      setToken(null)
                    })
                }}
              />
            </SettingsGroup>
          )}
          {token ? (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-(--surface-2) p-1.5 pl-3">
                <input
                  readOnly
                  value={inviteUrl(token)}
                  aria-label="Invite link"
                  onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-(--fg-2) outline-none"
                />
                <button
                  onClick={() => copy(token)}
                  className={`${button} bg-(--ink) text-white hover:bg-(--ink-hover)`}
                >
                  {copied ? <Check /> : <Copy />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-[12px] text-(--fg-3)">
                  Anyone with it can join and edit.
                </p>
                <button
                  onClick={createLink}
                  disabled={busy}
                  className={quiet}
                  title="The current link stops working"
                >
                  <RefreshCw />
                  Reset link
                </button>
              </div>
            </>
          ) : (
            token === null && (
              <p className="px-1 text-[12px] text-(--fg-3)">
                {(members?.length ?? 0) > 1
                  ? 'Nobody new can join. People already here stay until you remove them.'
                  : 'Only you can see this galaxy.'}
              </p>
            )
          )}
        </section>
      )}

      <section aria-label="Members">
        <h3 className="mb-1.5 px-1 text-[11px] font-semibold tracking-[0.06em] text-(--fg-3) uppercase">
          In this galaxy
        </h3>
        <ul className="overflow-hidden rounded-xl bg-(--surface-2)">
          {members === null && !error && (
            <li className="px-3 py-2.5 text-[13px] text-(--fg-3)">Loading…</li>
          )}
          {members?.map((m) => (
            <li
              key={m.userId}
              className="relative flex h-11 items-center gap-2.5 px-3 after:absolute after:right-0 after:bottom-0 after:left-[46px] after:h-px after:bg-(--hairline) last:after:hidden"
            >
              <MemberAvatar name={m.name} avatarUrl={m.avatarUrl} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-(--fg)">
                {m.name || 'Member'}
                {m.userId === meId && (
                  <span className="font-normal text-(--fg-3)"> (you)</span>
                )}
              </span>
              {m.role === 'owner' ? (
                <span className="text-[12px] text-(--fg-3)">Owner</span>
              ) : (
                isOwner && (
                  <button
                    onClick={() =>
                      run(async () => {
                        await sharing.removeMember(board.id, m.userId)
                        await loadMembers()
                      })
                    }
                    disabled={busy}
                    aria-label={`Remove ${m.name || 'member'}`}
                    className="rounded-md px-2 py-1 text-[12px] font-medium text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/10 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
      </section>

      {error && (
        <p role="alert" className="text-[13px] text-[#FF3B30]">
          {error}
        </p>
      )}

      {!isOwner &&
        (confirmLeave ? (
          <div className="space-y-2 rounded-xl bg-[#FF3B30]/8 p-3">
            <p className="text-[13px] text-(--fg-2)">
              Leave “{board.name}”? You&apos;ll need a new link to come back.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmLeave(false)} className={quiet}>
                Cancel
              </button>
              <button
                onClick={onLeave}
                className={`${button} bg-[#FF3B30] text-white hover:bg-[#FF3B30]/90`}
              >
                Leave
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmLeave(true)}
            className={`${button} text-[#FF3B30] hover:bg-[#FF3B30]/10`}
          >
            <LogOut />
            Leave galaxy
          </button>
        ))}
    </GlassCard>
  )
}
