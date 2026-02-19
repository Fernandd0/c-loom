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
  Plus,
  Check,
  Trash2,
  Pencil,
  HelpCircle,
  Keyboard,
  Mail,
  Menu,
  LogOut,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import { Board } from '../types'
import { LoginButton } from '@/components/LoginButton'
import { InfoDialog } from './InfoDialog'
import { createClient } from '@/lib/supabase/client'

function UserProfile({ user }: { user: any }) {
  const supabase = createClient()

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <div className="rounded-2xl border-0 bg-[#F2F2F7] p-3">
      <div className="mb-2 flex items-center gap-2">
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            className="h-10 w-10 rounded-full border-0 shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[15px] font-semibold text-[#3C3C43] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {(user.user_metadata?.full_name ||
              user.email ||
              'U')[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[#000000]">
            {user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0]}
          </p>
          <p className="truncate text-[13px] text-[#8E8E93]">{user.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-[#8E8E93] shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:text-[#FF3B30] hover:shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
      >
        <LogOut size={14} />
        Sign out
      </button>
    </div>
  )
}

interface SidebarProps {
  boards: Board[]
  currentBoardId: string
  user?: any
  onSelectBoard: (boardId: string) => void
  onAddBoard: () => void
  onDeleteBoard?: (boardId: string) => void
  onRenameBoard?: (boardId: string, name: string) => void
}

interface SidebarContentProps {
  boards: Board[]
  currentBoardId: string
  user?: any
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
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
        <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
          Workspaces
        </h2>
        {isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-700 hover:shadow-md"
            aria-label="Close sidebar"
          >
            <Menu size={14} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-0.5">
          {boards.map((board) => (
            <div
              key={board.id}
              className="group flex w-full items-center gap-1"
            >
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
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    onSelectBoard(board.id)
                    if (!isExpanded) setIsHovering(false)
                  }}
                  className={cn(
                    'flex flex-1 items-center justify-between rounded-xl px-3 py-2 text-[15px] font-semibold transition-all',
                    currentBoardId === board.id
                      ? 'bg-[#E5E5EA] text-[#1C1C1E] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                      : 'text-[#1C1C1E] hover:bg-[#F2F2F7]'
                  )}
                >
                  <span className="truncate">{board.name}</span>
                  {currentBoardId === board.id && (
                    <Check size={14} className="ml-2" />
                  )}
                </button>
              )}

              <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => {
                    setEditingId(board.id)
                    setEditName(board.name)
                  }}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Rename workspace"
                >
                  <Pencil size={12} />
                </button>
                {onDeleteBoard && (
                  <button
                    onClick={() => onDeleteBoard(board.id)}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
                    aria-label="Delete workspace"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="my-3 h-px bg-slate-200/60" />

        <button
          onClick={onAddBoard}
          className="flex w-full items-center gap-2 rounded-xl bg-[#E5E5EA] px-3 py-2 text-[15px] font-semibold text-[#1C1C1E] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:bg-[#D1D1D6]"
        >
          <Plus size={16} />
          <span>New Workspace</span>
        </button>
      </div>

      <div className="space-y-0.5 border-t border-slate-200/60 px-3 py-2 pb-4 sm:pb-2">
        <InfoDialog
          defaultTab="guide"
          triggerLabel="Guide"
          triggerIcon={<HelpCircle size={14} />}
          hotkey="g"
        />
        <InfoDialog
          defaultTab="hotkeys"
          triggerLabel="Hotkeys"
          triggerIcon={<Keyboard size={14} />}
          hotkey="k"
        />
        <InfoDialog
          defaultTab="contact"
          triggerLabel="Contact"
          triggerIcon={<Mail size={14} />}
        />

        <div className="my-2 h-px bg-slate-200/60" />

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
              'flex h-7 w-7 items-center justify-center rounded-md border transition-all',
              isHovering
                ? 'border-slate-300 bg-white text-slate-700 shadow-md'
                : 'border-slate-200 bg-white/90 text-slate-500 shadow-sm hover:border-slate-300 hover:shadow-md'
            )}
            aria-label="Open sidebar"
          >
            <Menu size={14} />
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
          />
        </div>
      )}

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
