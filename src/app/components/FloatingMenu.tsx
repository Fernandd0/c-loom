'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Plus,
  Check,
  Menu,
  Trash2,
  LogOut,
  Pencil,
  HelpCircle,
  Keyboard,
  Mail,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Board } from '../types'
import { createClient } from '@/lib/supabase/client'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { LoginButton } from '@/components/LoginButton'
import { InfoDialog } from './InfoDialog'

interface FloatingMenuProps {
  boards: Board[]
  currentBoardId: string
  onSelectBoard: (boardId: string) => void
  onAddBoard: () => void
  onDeleteBoard?: (boardId: string) => void
  onRenameBoard?: (boardId: string, name: string) => void
}

export function FloatingMenu({
  boards,
  currentBoardId,
  onSelectBoard,
  onAddBoard,
  onDeleteBoard,
  onRenameBoard,
}: FloatingMenuProps) {
  const [isPinned, setIsPinned] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

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
    if (!supabase) return

    // Check active session
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }
    checkSession()

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogin = async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
  }

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  // Toggle pin state
  const togglePin = () => {
    setIsPinned(!isPinned)
  }

  // Compute if sidebar should be open
  const shouldBeOpen = isPinned || isHovering

  // Close when clicking outside (only if not pinned)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !isPinned &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsHovering(false)
      }
    }

    if (shouldBeOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [shouldBeOpen, isPinned])

  return (
    <>
      {/* Hover Trigger Area - invisible area on left edge */}
      <div
        className="fixed top-0 left-0 z-40 h-full w-12"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => !isPinned && setIsHovering(false)}
      />

      <div
        className="fixed top-6 left-6 z-50 flex flex-col gap-2"
        ref={menuRef}
      >
        {/* Toggle Button */}
        <button
          onClick={togglePin}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200',
            isPinned
              ? 'border-slate-400 bg-slate-100 text-slate-900'
              : 'border-slate-200 bg-white/80 text-slate-700 backdrop-blur-sm hover:border-slate-300 hover:bg-white'
          )}
        >
          <Menu size={20} />
        </button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {shouldBeOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-12 left-0 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-xl"
            >
              <div className="mb-2 px-2 py-1.5 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Workspaces
              </div>

              <div className="max-h-[60vh] space-y-0.5 overflow-y-auto">
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
                        onBlur={() => handleRename(board.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(board.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 rounded-lg border border-indigo-500 bg-white px-2.5 py-1.5 text-sm outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => onSelectBoard(board.id)}
                        className={cn(
                          'flex flex-1 items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors',
                          currentBoardId === board.id
                            ? 'bg-black/5 font-medium text-black'
                            : 'text-slate-600 hover:bg-black/5 hover:text-black'
                        )}
                      >
                        <span className="truncate">{board.name}</span>
                        {currentBoardId === board.id && (
                          <Check size={14} className="text-black" />
                        )}
                      </button>
                    )}

                    {!editingId && (
                      <>
                        {onRenameBoard && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingId(board.id)
                              setEditName(board.name)
                            }}
                            className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-indigo-50 hover:text-indigo-500"
                            title="Rename Workspace"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {onDeleteBoard && boards.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteBoard(board.id)
                            }}
                            className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                            title="Delete Workspace"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="my-2 h-px bg-slate-100" />

              <button
                onClick={onAddBoard}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-black/5 hover:text-black"
              >
                <Plus size={16} />
                <span>New Workspace</span>
              </button>

              <div className="my-2 h-px bg-slate-100" />

              {/* Footer Section */}
              <div className="space-y-1 px-2 pb-2">
                <InfoDialog
                  defaultTab="guide"
                  triggerLabel="Guide"
                  triggerIcon={<HelpCircle size={16} />}
                />
                <InfoDialog
                  defaultTab="hotkeys"
                  triggerLabel="Hotkeys"
                  triggerIcon={<Keyboard size={16} />}
                />
                <InfoDialog
                  defaultTab="contact"
                  triggerLabel="Contact"
                  triggerIcon={<Mail size={16} />}
                />

                <div className="my-2 h-px bg-slate-100" />

                <LoginButton />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
