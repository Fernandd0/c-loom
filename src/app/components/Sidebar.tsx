'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
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
  Command,
  Info,
  Menu,
  Orbit,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Settings,
  SquarePen,
  X,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Board } from '../types'
import { InfoDialog, InfoTab, useInfoHotkeys } from './InfoDialog'
import { useStickyState } from '../hooks/useStickyState'
import { shouldIgnorePlainKey } from '@/lib/keyboard'
import { AccountCard } from '@/features/auth/components/AccountCard'
import {
  GalaxyRow,
  row as galaxyRow,
} from '@/features/board/components/GalaxyRow'
import {
  CommandMenu,
  type CommandItem,
} from '@/features/board/components/CommandMenu'
import { galaxyIndexForKey } from '@/features/board/lib/boardSummary'
import type { User } from '@supabase/supabase-js'

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

interface SidebarProps {
  boards: Board[]
  currentBoardId: string
  user?: User | null
  onSelectBoard: (boardId: string) => void
  // Returns the new galaxy's id so it can be named right away.
  onAddBoard: () => string
  onDeleteBoard?: (boardId: string) => void
  onRenameBoard?: (boardId: string, name: string) => void
  onNewTask: () => void
}

const QUICK_LINKS: {
  tab: InfoTab
  label: string
  icon: React.ReactNode
  shortcut?: string
  keys?: string
}[] = [
  {
    tab: 'settings',
    label: 'Settings',
    icon: <Settings />,
    shortcut: '⌘,',
    keys: 'Meta+Comma',
  },
  {
    tab: 'guide',
    label: 'Guide',
    icon: <BookOpen />,
    shortcut: '⌘G',
    keys: 'Meta+G',
  },
  {
    tab: 'hotkeys',
    label: 'Shortcuts',
    icon: <Command />,
    shortcut: '?',
    keys: '?',
  },
  { tab: 'contact', label: 'About', icon: <Info /> },
]

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
  onNewTask,
}: SidebarProps) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [pinnedPref, setPinnedPref] = useStickyState(false, PINNED_KEY)
  const pinned = isDesktop && pinnedPref
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
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

  const selectBoard = useCallback(
    (boardId: string) => {
      onSelectBoard(boardId)
      // On phones the drawer covers the board, so get out of the way.
      if (!isDesktop) setDrawerOpen(false)
    },
    [onSelectBoard, isDesktop]
  )

  const addBoard = useCallback(() => {
    // The name field lives in the sidebar, so make sure it's showing.
    if (!pinned) setDrawerOpen(true)
    setEditingId(onAddBoard())
  }, [pinned, onAddBoard])

  const openInfo = useCallback((tab: InfoTab) => {
    setDrawerOpen(false)
    setInfoTab(tab)
  }, [])

  // ⌘B toggles the sidebar, ⌘K opens the jump menu; plain 1–9 jumps to a galaxy.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggle()
        return
      }
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandsOpen((open) => !open)
        return
      }
      const index = galaxyIndexForKey(e)
      const board = index === null ? undefined : boards[index]
      if (!board || shouldIgnorePlainKey(e, 'data-sidebar')) return
      e.preventDefault()
      onSelectBoard(board.id)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle, boards, onSelectBoard])

  const commands = useMemo<CommandItem[]>(
    () => [
      ...boards.map((board, i) => ({
        id: `galaxy-${board.id}`,
        group: 'Galaxies' as const,
        label: board.name,
        icon: <Orbit />,
        detail: i < 9 ? `${i + 1}` : undefined,
        run: () => selectBoard(board.id),
      })),
      {
        id: 'new-task',
        group: 'Actions',
        label: 'New task',
        keywords: ['add', 'create', 'todo'],
        icon: <SquarePen />,
        detail: 'N',
        run: onNewTask,
      },
      {
        id: 'new-galaxy',
        group: 'Actions',
        label: 'New galaxy',
        keywords: ['add', 'create', 'workspace'],
        icon: <Plus />,
        run: addBoard,
      },
      {
        id: 'toggle-sidebar',
        group: 'Actions',
        label: pinned || drawerOpen ? 'Hide galaxies' : 'Show galaxies',
        keywords: ['sidebar'],
        icon: <PanelLeft />,
        detail: '⌘B',
        run: toggle,
      },
      {
        id: 'settings',
        group: 'Actions',
        label: 'Settings',
        keywords: ['preferences', 'theme', 'appearance', 'dark'],
        icon: <Settings />,
        detail: '⌘,',
        run: () => openInfo('settings'),
      },
      {
        id: 'guide',
        group: 'Actions',
        label: 'Guide',
        keywords: ['help', 'how'],
        icon: <BookOpen />,
        detail: '⌘G',
        run: () => openInfo('guide'),
      },
      {
        id: 'hotkeys',
        group: 'Actions',
        label: 'Keyboard shortcuts',
        keywords: ['hotkeys', 'keys'],
        icon: <Command />,
        detail: '?',
        run: () => openInfo('hotkeys'),
      },
      {
        id: 'about',
        group: 'Actions',
        label: 'About',
        keywords: ['contact'],
        icon: <Info />,
        run: () => openInfo('contact'),
      },
    ],
    [
      boards,
      selectBoard,
      onNewTask,
      addBoard,
      pinned,
      drawerOpen,
      toggle,
      openInfo,
    ]
  )

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
      <div className="flex h-11 shrink-0 items-center justify-end gap-0.5 px-2.5">
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

      <div className="px-3">
        <AccountCard user={user} galaxyCount={boards.length} />
      </div>

      <nav className="mt-5 flex-1 overflow-y-auto px-3" aria-label="Galaxies">
        <Title className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.06em] text-(--fg-3) uppercase">
          Galaxies
        </Title>
        <ul className="overflow-hidden rounded-xl bg-(--surface-2)">
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
          <li className={galaxyRow}>
            <button
              onClick={addBoard}
              className="flex h-10 w-full items-center gap-2.5 px-3 text-[14px] font-medium text-(--fg-2) transition-colors outline-none hover:bg-(--hover) focus-visible:bg-(--hover)"
            >
              <Plus size={15} className="text-(--fg-3)" />
              New Galaxy
            </button>
          </li>
        </ul>
      </nav>

      <div className="shrink-0 px-3 pt-3 pb-4 sm:pb-3">
        <div className="grid grid-cols-4 overflow-hidden rounded-xl bg-(--surface-2)">
          {QUICK_LINKS.map(({ tab, label, icon, shortcut, keys }) => (
            <button
              key={tab}
              onClick={() => openInfo(tab)}
              aria-keyshortcuts={keys}
              title={shortcut ? `${label} (${shortcut})` : label}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-(--fg-2) transition-colors outline-none hover:bg-(--hover) focus-visible:bg-(--hover) [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-(--fg-3)"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
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

      <CommandMenu
        open={commandsOpen}
        onOpenChange={setCommandsOpen}
        items={commands}
      />

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
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-(--line) bg-(--surface) px-4 py-2 text-sm font-medium text-(--fg-2) transition-colors outline-none hover:bg-(--hover) focus-visible:ring-2 focus-visible:ring-(--fg-3) sm:mt-0 sm:w-auto"
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
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#FF3B30] px-4 py-2 text-sm font-semibold text-white transition-colors outline-none hover:bg-[#FF3B30]/90 focus-visible:ring-2 focus-visible:ring-[#FF3B30]/40 sm:w-auto"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
