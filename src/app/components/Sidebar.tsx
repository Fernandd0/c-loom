'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  BookOpen,
  Settings,
  Command,
  Info,
  LogOut,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Plus,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Board } from '../types'
import { LoginButton } from '@/components/LoginButton'
import { InfoDialog, InfoTab, useInfoHotkeys } from './InfoDialog'
import { SettingsGroup, SettingsRow } from './SettingsRow'
import { useStickyState } from '../hooks/useStickyState'
import { signOut } from '@/lib/auth'
import { GalaxyRow } from '@/features/board/components/GalaxyRow'
import { galaxyIndexForKey } from '@/features/board/lib/boardSummary'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image'

const PINNED_KEY = 'c-loom-sidebar-pinned'
// Pinning pushes the board aside, so it's only offered where there's room for both.
const DESKTOP_QUERY = '(min-width: 1024px)'

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', callback)
      return () => list.removeEventListener('change', callback)
    },
    [query]
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}

function UserProfile({ user }: { user: User }) {
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0]
  return (
    <SettingsGroup>
      <div className="relative flex items-center gap-3 px-2.5 py-2.5 after:absolute after:right-0 after:bottom-0 after:left-[46px] after:h-px after:bg-(--hairline)">
        {user.user_metadata?.avatar_url ? (
          <Image
            src={user.user_metadata.avatar_url}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded-full"
          />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8E8E93] text-[11px] font-semibold text-white">
            {(name || 'U')[0].toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[14px] font-medium text-(--fg)">{name}</p>
          <p className="truncate text-[12px] text-(--fg-3)">{user.email}</p>
        </div>
      </div>
      <SettingsRow
        icon={<LogOut />}
        tint="#FF3B30"
        label="Sign out"
        destructive
        onClick={signOut}
      />
    </SettingsGroup>
  )
}

interface SidebarProps {
  boards: Board[]
  currentBoardId: string
  user?: User | null
  onSelectBoard: (boardId: string) => void
  // Returns the new galaxy's id so it can be named right away.
  onAddBoard: () => string
  onDeleteBoard?: (boardId: string) => void
  onRenameBoard?: (boardId: string, name: string) => void
}

const iconButton =
  'flex h-7 w-7 items-center justify-center rounded-md text-(--fg-3) transition-colors hover:bg-(--hover) hover:text-(--fg)'

export function Sidebar({
  boards,
  currentBoardId,
  user,
  onSelectBoard,
  onAddBoard,
  onDeleteBoard,
  onRenameBoard,
}: SidebarProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [pinnedPref, setPinnedPref] = useStickyState(false, PINNED_KEY)
  const pinned = isDesktop && pinnedPref
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  // Lives here, always mounted, so the dialogs and their hotkeys work with the sidebar closed.
  const [infoTab, setInfoTab] = useState<InfoTab | null>(null)
  useInfoHotkeys(setInfoTab)
  const reduceMotion = useReducedMotion()

  const toggle = useCallback(() => {
    if (pinned) setPinnedPref(false)
    else setDrawerOpen((open) => !open)
  }, [pinned, setPinnedPref])

  const selectBoard = (boardId: string) => {
    onSelectBoard(boardId)
    // On phones the drawer covers the board, so get out of the way.
    if (!isDesktop) setDrawerOpen(false)
  }

  // ⌘B toggles the sidebar; plain 1–9 jumps to a galaxy unless typing or in another dialog.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggle()
        return
      }
      const index = galaxyIndexForKey(e)
      const board = index === null ? undefined : boards[index]
      if (!board) return
      const target = e.target as HTMLElement | null
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]') ||
        document.querySelector('[role="dialog"]:not([data-sidebar])')
      )
        return
      e.preventDefault()
      onSelectBoard(board.id)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle, boards, onSelectBoard])

  const openInfo = (tab: InfoTab) => {
    setDrawerOpen(false)
    setInfoTab(tab)
  }

  const finishRename = (boardId: string, name: string | null) => {
    setEditingId(null)
    const trimmed = name?.trim()
    const board = boards.find((b) => b.id === boardId)
    if (trimmed && trimmed !== board?.name) onRenameBoard?.(boardId, trimmed)
  }

  const boardToDelete = boards.find((b) => b.id === deleteConfirmId)
  const deleteTaskCount = boardToDelete?.tasks.length ?? 0

  const Title = pinned ? 'h2' : DialogPrimitive.Title

  const panel = (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center justify-between pr-2.5 pl-4">
        <Title className="text-[11px] font-semibold tracking-[0.06em] text-(--fg-3) uppercase">
          Galaxies
        </Title>
        <div className="flex gap-0.5">
          {pinned ? (
            <button
              onClick={() => setPinnedPref(false)}
              className={iconButton}
              aria-label="Close sidebar"
              aria-keyshortcuts="Meta+B"
            >
              <PanelLeftClose size={16} />
            </button>
          ) : (
            <>
              {isDesktop && (
                <button
                  onClick={() => {
                    setPinnedPref(true)
                    setDrawerOpen(false)
                  }}
                  className={iconButton}
                  aria-label="Keep sidebar open"
                  title="Keep sidebar open"
                >
                  <PanelLeft size={16} />
                </button>
              )}
              <DialogPrimitive.Close
                className={iconButton}
                aria-label="Close sidebar"
              >
                <X size={16} />
              </DialogPrimitive.Close>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2" aria-label="Galaxies">
        <ul className="space-y-0.5">
          {boards.map((board) => (
            <GalaxyRow
              key={board.id}
              board={board}
              selected={currentBoardId === board.id}
              editing={editingId === board.id}
              onSelect={() => selectBoard(board.id)}
              onStartRename={() => setEditingId(board.id)}
              onRenameDone={(name) => finishRename(board.id, name)}
              onDelete={
                onDeleteBoard ? () => setDeleteConfirmId(board.id) : undefined
              }
            />
          ))}
        </ul>

        <button
          onClick={() => setEditingId(onAddBoard())}
          className="mt-0.5 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium text-(--fg-3) transition-colors hover:bg-(--hover) hover:text-(--fg)"
        >
          <Plus size={15} />
          New Galaxy
        </button>
      </nav>

      <div className="space-y-3 px-2 pt-2 pb-4 sm:pb-3">
        <SettingsGroup>
          <SettingsRow
            icon={<Settings />}
            tint="#8E8E93"
            label="Settings"
            detail="⌘,"
            aria-keyshortcuts="Meta+Comma"
            onClick={() => openInfo('settings')}
          />
          <SettingsRow
            icon={<BookOpen />}
            tint="#007AFF"
            label="Guide"
            detail="⌘G"
            aria-keyshortcuts="Meta+G"
            onClick={() => openInfo('guide')}
          />
          <SettingsRow
            icon={<Command />}
            tint="#30B0C7"
            label="Keyboard Shortcuts"
            detail="⌘K"
            aria-keyshortcuts="Meta+K"
            onClick={() => openInfo('hotkeys')}
          />
          <SettingsRow
            icon={<Info />}
            tint="#5856D6"
            label="About"
            onClick={() => openInfo('contact')}
          />
        </SettingsGroup>

        {user ? <UserProfile user={user} /> : <LoginButton />}
      </div>
    </div>
  )

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }

  return (
    <>
      {!pinned && (
        <button
          onClick={toggle}
          className="fixed top-3 left-3 z-50 flex h-8 w-8 items-center justify-center rounded-lg bg-(--glass) text-(--fg-3) shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md transition-colors hover:text-(--fg)"
          aria-label="Open sidebar"
          aria-expanded={drawerOpen}
          aria-keyshortcuts="Meta+B"
          title="Galaxies (⌘B)"
        >
          <Menu size={16} />
        </button>
      )}

      {pinned ? (
        <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-(--line) bg-(--glass-strong) backdrop-blur-sm">
          {panel}
        </aside>
      ) : (
        <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <AnimatePresence>
            {drawerOpen && (
              <DialogPrimitive.Portal forceMount>
                <DialogPrimitive.Overlay asChild forceMount>
                  <motion.div
                    className="fixed inset-0 z-50 bg-black/30 lg:bg-black/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                  />
                </DialogPrimitive.Overlay>
                <DialogPrimitive.Content
                  asChild
                  forceMount
                  aria-describedby={undefined}
                  data-sidebar
                  // Esc while renaming cancels the rename, not the drawer.
                  onEscapeKeyDown={(e) => {
                    if (editingId) e.preventDefault()
                  }}
                >
                  <motion.div
                    className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-(--line) bg-(--glass-strong) shadow-2xl backdrop-blur-xl outline-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={transition}
                  >
                    {panel}
                  </motion.div>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            )}
          </AnimatePresence>
        </DialogPrimitive.Root>
      )}

      <InfoDialog tab={infoTab} onClose={() => setInfoTab(null)} />

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#FF3B30]/12">
              <AlertTriangle className="h-6 w-6 text-[#FF3B30]" />
            </div>
            <DialogTitle className="text-center">
              Delete “{boardToDelete?.name}”?
            </DialogTitle>
            <DialogDescription className="text-center">
              {deleteTaskCount === 0
                ? 'It has no tasks.'
                : `Its ${deleteTaskCount} ${deleteTaskCount === 1 ? 'task goes' : 'tasks go'} with it.`}{' '}
              This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-(--line) bg-(--surface) px-4 py-2 text-sm font-medium text-(--fg-2) transition-colors hover:bg-(--page) focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteConfirmId && onDeleteBoard) {
                  onDeleteBoard(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none sm:w-auto"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
