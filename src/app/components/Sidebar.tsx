'use client'

import { useState, useRef, useEffect } from 'react'
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
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Board } from '../types'
import { LoginButton } from '@/components/LoginButton'
import { InfoDialog, InfoTab, useInfoHotkeys } from './InfoDialog'
import { SettingsGroup, SettingsRow } from './SettingsRow'
import { signOut } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image'

function UserProfile({ user }: { user: User }) {
  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0]
  return (
    <SettingsGroup>
      <div className="relative flex items-center gap-3 px-2.5 py-2.5 after:absolute after:right-0 after:bottom-0 after:left-[46px] after:h-px after:bg-black/[0.07]">
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
          <p className="truncate text-[14px] font-medium text-[#1C1C1E]">
            {name}
          </p>
          <p className="truncate text-[12px] text-[#8E8E93]">{user.email}</p>
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
  onAddBoard: () => void
  onDeleteBoard?: (boardId: string) => void
  onRenameBoard?: (boardId: string, name: string) => void
}

interface SidebarContentProps {
  boards: Board[]
  currentBoardId: string
  user?: User | null
  onSelectBoard: (boardId: string) => void
  onAddBoard: () => void
  onDeleteBoard?: (boardId: string) => void
  isExpanded: boolean
  editingId: string | null
  setEditingId: (id: string | null) => void
  editName: string
  setEditName: (name: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  handleRename: (boardId: string) => void
  setIsExpanded: (expanded: boolean) => void
  setIsHovering: (hovering: boolean) => void
  onOpenInfo: (tab: InfoTab) => void
}

function SidebarContent({
  boards,
  currentBoardId,
  user,
  onSelectBoard,
  onAddBoard,
  onDeleteBoard,
  isExpanded,
  editingId,
  setEditingId,
  editName,
  setEditName,
  inputRef,
  handleRename,
  setIsExpanded,
  setIsHovering,
  onOpenInfo,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center justify-between px-4">
        <h2 className="text-[11px] font-semibold tracking-[0.06em] text-[#8E8E93] uppercase">
          Workspaces
        </h2>
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#8E8E93] transition-colors hover:bg-black/[0.05] hover:text-[#1C1C1E]"
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        <ul className="space-y-0.5">
          {boards.map((board) => {
            const selected = currentBoardId === board.id
            return (
              <li key={board.id} className="group relative">
                {editingId === board.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(board.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onBlur={() => handleRename(board.id)}
                    aria-label="Workspace name"
                    className="h-9 w-full rounded-lg bg-white px-2.5 text-[14px] font-medium text-[#1C1C1E] shadow-[0_0_0_2px_rgba(0,122,255,0.35)] outline-none"
                  />
                ) : (
                  <button
                    onClick={() => {
                      onSelectBoard(board.id)
                      if (!isExpanded) setIsHovering(false)
                    }}
                    aria-current={selected ? 'page' : undefined}
                    className={cn(
                      'flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 pr-14 text-left text-[14px] transition-colors',
                      selected
                        ? 'bg-black/[0.06] font-semibold text-[#1C1C1E]'
                        : 'font-medium text-[#3C3C43] hover:bg-black/[0.04]'
                    )}
                  >
                    <LayoutGrid
                      size={15}
                      className={selected ? 'text-[#1C1C1E]' : 'text-[#8E8E93]'}
                    />
                    <span className="truncate">{board.name}</span>
                  </button>
                )}

                {editingId !== board.id && (
                  <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingId(board.id)
                        setEditName(board.name)
                      }}
                      className="rounded-md p-1 text-[#8E8E93] transition-colors hover:bg-black/[0.06] hover:text-[#1C1C1E]"
                      aria-label="Rename workspace"
                    >
                      <Pencil size={12} />
                    </button>
                    {onDeleteBoard && (
                      <button
                        onClick={() => onDeleteBoard(board.id)}
                        className="rounded-md p-1 text-[#8E8E93] transition-colors hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]"
                        aria-label="Delete workspace"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <button
          onClick={onAddBoard}
          className="mt-0.5 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium text-[#8E8E93] transition-colors hover:bg-black/[0.04] hover:text-[#1C1C1E]"
        >
          <Plus size={15} />
          New Workspace
        </button>
      </nav>

      <div className="space-y-3 px-2 pt-2 pb-4 sm:pb-3">
        <SettingsGroup>
          <SettingsRow
            icon={<BookOpen />}
            tint="#007AFF"
            label="Guide"
            detail="⌘G"
            aria-keyshortcuts="Meta+G"
            onClick={() => onOpenInfo('guide')}
          />
          <SettingsRow
            icon={<Command />}
            tint="#8E8E93"
            label="Keyboard Shortcuts"
            detail="⌘K"
            aria-keyshortcuts="Meta+K"
            onClick={() => onOpenInfo('hotkeys')}
          />
          <SettingsRow
            icon={<Info />}
            tint="#5856D6"
            label="About"
            onClick={() => onOpenInfo('contact')}
          />
        </SettingsGroup>

        {user ? <UserProfile user={user} /> : <LoginButton />}
      </div>
    </div>
  )
}

export function Sidebar({
  boards,
  currentBoardId,
  user,
  onSelectBoard,
  onAddBoard,
  onDeleteBoard,
  onRenameBoard,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  // Lives here, always mounted, so the dialogs and their hotkeys work with the sidebar closed.
  const [infoTab, setInfoTab] = useState<InfoTab | null>(null)
  useInfoHotkeys(setInfoTab)
  const inputRef = useRef<HTMLInputElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingId])

  const handleRename = (boardId: string) => {
    if (editName.trim() && onRenameBoard) {
      onRenameBoard(boardId, editName.trim())
    }
    setEditingId(null)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !isExpanded &&
        isHovering &&
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsHovering(false)
      }
    }

    if (isHovering && !isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isHovering, isExpanded])

  return (
    <>
      {!isExpanded && (
        <div
          ref={triggerRef}
          className="fixed top-3 left-3 z-50"
          onMouseEnter={() => setIsHovering(true)}
        >
          <button
            onClick={() => setIsExpanded(true)}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md transition-colors',
              isHovering
                ? 'text-[#1C1C1E]'
                : 'text-[#8E8E93] hover:text-[#1C1C1E]'
            )}
            aria-label="Open sidebar"
          >
            <Menu size={16} />
          </button>
        </div>
      )}

      {/* Hover Overlay Sidebar */}
      <AnimatePresence>
        {isHovering && !isExpanded && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl"
            onMouseLeave={() => setIsHovering(false)}
          >
            <SidebarContent
              boards={boards}
              currentBoardId={currentBoardId}
              user={user}
              onSelectBoard={onSelectBoard}
              onAddBoard={onAddBoard}
              onDeleteBoard={setDeleteConfirmId}
              isExpanded={isExpanded}
              editingId={editingId}
              setEditingId={setEditingId}
              editName={editName}
              setEditName={setEditName}
              inputRef={inputRef}
              handleRename={handleRename}
              setIsExpanded={setIsExpanded}
              setIsHovering={setIsHovering}
              onOpenInfo={setInfoTab}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Sidebar (pushes content) */}
      {isExpanded && (
        <div className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-sm">
          <SidebarContent
            boards={boards}
            currentBoardId={currentBoardId}
            user={user}
            onSelectBoard={onSelectBoard}
            onAddBoard={onAddBoard}
            onDeleteBoard={setDeleteConfirmId}
            isExpanded={isExpanded}
            editingId={editingId}
            setEditingId={setEditingId}
            editName={editName}
            setEditName={setEditName}
            inputRef={inputRef}
            handleRename={handleRename}
            setIsExpanded={setIsExpanded}
            setIsHovering={setIsHovering}
            onOpenInfo={setInfoTab}
          />
        </div>
      )}

      <InfoDialog tab={infoTab} onClose={() => setInfoTab(null)} />

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center">Delete Workspace?</DialogTitle>
            <DialogDescription className="text-center">
              This action cannot be undone. All tasks in this workspace will be
              permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:outline-none sm:mt-0 sm:w-auto"
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
