'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Check, Menu, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Board } from '../types'

interface FloatingMenuProps {
  boards: Board[]
  currentBoardId: string
  onSelectBoard: (boardId: string) => void
  onAddBoard: () => void
  onDeleteBoard?: (boardId: string) => void
}

export function FloatingMenu({
  boards,
  currentBoardId,
  onSelectBoard,
  onAddBoard,
  onDeleteBoard,
}: FloatingMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="fixed top-6 left-6 z-50 flex flex-col gap-2" ref={menuRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition-all',
          isOpen
            ? 'border-slate-300 bg-black text-white'
            : 'border-slate-200 bg-white/80 text-slate-700 backdrop-blur-sm hover:border-slate-300 hover:bg-white'
        )}
      >
        <Menu size={20} />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
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
                  <button
                    onClick={() => {
                      onSelectBoard(board.id)
                      setIsOpen(false)
                    }}
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
                </div>
              ))}
            </div>

            <div className="my-2 h-px bg-slate-100" />

            <button
              onClick={() => {
                onAddBoard()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-black/5 hover:text-black"
            >
              <Plus size={16} />
              <span>New Workspace</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
