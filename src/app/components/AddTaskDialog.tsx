'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Category } from '../types'
import { GlassCard } from './GlassCard'

interface AddTaskDialogProps {
  categories: Category[]
  currentBoard?: { id: string; name: string } | null
  onDisconnect?: () => void
  onAddTask: (
    title: string,
    categoryId: string,
    durationMinutes?: number
  ) => void
  onAddCategory: (category: Omit<Category, 'workspaceId'>) => void
}

const VIBRANT_COLORS = [
  { name: 'Blue', value: '#007AFF' },
  { name: 'Green', value: '#34C759' },
  { name: 'Indigo', value: '#5856D6' },
  { name: 'Orange', value: '#FF9500' },
  { name: 'Pink', value: '#FF2D55' },
  { name: 'Purple', value: '#AF52DE' },
  { name: 'Red', value: '#FF3B30' },
  { name: 'Teal', value: '#5AC8FA' },
  { name: 'Yellow', value: '#FFCC00' },
  { name: 'Gray', value: '#8E8E93' },
]

export function AddTaskDialog({
  categories,
  currentBoard,
  onAddTask,
  onAddCategory,
}: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(VIBRANT_COLORS[0].value)

  const [durationVal, setDurationVal] = useState('')
  const [durationUnit, setDurationUnit] = useState<'min' | 'hour' | 'day'>(
    'hour'
  )
  const [showDurationInput, setShowDurationInput] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    let durationMins: number | undefined = undefined
    if (durationVal) {
      const val = parseFloat(durationVal)
      if (!isNaN(val) && val > 0) {
        if (durationUnit === 'min') durationMins = val
        if (durationUnit === 'hour') durationMins = val * 60
        if (durationUnit === 'day') durationMins = val * 60 * 24
      }
    }

    if (selectedCategoryId) {
      onAddTask(title, selectedCategoryId, durationMins)
      setOpen(false)
      reset()
    }
  }

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return
    const newCat: Omit<Category, 'workspaceId'> = {
      id: crypto.randomUUID(),
      name: newCatName.trim(),
      color: newCatColor,
    }
    onAddCategory(newCat)
    setSelectedCategoryId(newCat.id)
    setIsCreatingCategory(false)
    setNewCatName('')
    setNewCatColor(VIBRANT_COLORS[0].value)
  }

  const reset = () => {
    setTitle('')
    setSelectedCategoryId(null)
    setDurationVal('')
    setDurationUnit('hour')
    setShowDurationInput(false)
    setIsCreatingCategory(false)
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="items-cente flex flex-col">
          <Button className="h-24 w-48 rounded-t-full rounded-b-none border-t border-white/10 bg-black text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-slate-900 hover:shadow-black/50 active:scale-95 sm:h-28 sm:w-56 md:h-32 md:w-64">
            <span className="mb-2 text-[4rem] leading-none font-light sm:mb-3 sm:text-[5rem] md:text-[6rem]">
              +
            </span>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-xl">
        <form onSubmit={handleSubmit} className="relative w-full">
          <GlassCard className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
                className="h-auto min-w-0 flex-1 border-none bg-transparent px-0 text-xl font-medium placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />

              <Popover>
                {/* ... existing popover trigger ... */}
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                      selectedCategory
                        ? 'pr-4 text-white shadow-sm'
                        : 'bg-slate-100/50 text-slate-500 hover:bg-slate-100'
                    )}
                    style={{
                      backgroundColor: selectedCategory?.color,
                    }}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        !selectedCategory && 'bg-slate-400'
                      )}
                      style={{
                        backgroundColor: selectedCategory ? 'white' : undefined,
                      }}
                    />
                    {selectedCategory ? selectedCategory.name : 'Type'}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 rounded-2xl border-slate-200/50 bg-white/95 p-3 shadow-xl backdrop-blur-xl"
                  align="end"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryId(c.id)
                          }}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                            selectedCategoryId === c.id
                              ? 'scale-105 border-transparent text-white shadow-md'
                              : 'border-slate-100 bg-slate-50 text-slate-600 hover:scale-105 hover:border-slate-200'
                          )}
                          style={{
                            backgroundColor:
                              selectedCategoryId === c.id ? c.color : undefined,
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setIsCreatingCategory(!isCreatingCategory)
                        }
                        className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-slate-200"
                      >
                        <Plus size={12} />
                        New
                      </button>
                    </div>

                    {isCreatingCategory && (
                      <div className="animate-in fade-in zoom-in-95 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3 duration-200">
                        <Input
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Type name..."
                          className="h-8 bg-white text-sm"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {VIBRANT_COLORS.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => setNewCatColor(c.value)}
                              className={cn(
                                'h-5 w-5 rounded-full ring-1 ring-offset-1 transition-transform',
                                newCatColor === c.value
                                  ? 'scale-110 ring-slate-400'
                                  : 'ring-transparent hover:scale-110'
                              )}
                              style={{ backgroundColor: c.value }}
                              title={c.name}
                            />
                          ))}
                        </div>
                        <Button
                          type="button"
                          onClick={handleCreateCategory}
                          size="sm"
                          className="h-8 w-full bg-black text-xs text-white hover:bg-slate-800"
                        >
                          Create Type
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100/50 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDurationInput(!showDurationInput)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    showDurationInput || durationVal
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  )}
                >
                  <Clock className="h-4 w-4" />
                  {durationVal
                    ? `${durationVal} ${durationUnit}s`
                    : 'Duration?'}
                </button>

                {showDurationInput && (
                  <div className="animate-in slide-in-from-left-2 flex items-center gap-1 duration-200">
                    <Input
                      type="number"
                      value={durationVal}
                      onChange={(e) => setDurationVal(e.target.value)}
                      placeholder="0"
                      className="h-8 w-16 border-transparent bg-slate-50 text-center text-sm focus:bg-white focus:ring-1 focus:ring-indigo-100"
                      autoFocus
                    />
                    <div className="flex rounded-md bg-slate-100 p-0.5">
                      {(['min', 'hour'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setDurationUnit(unit)}
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium transition-colors',
                            durationUnit === unit
                              ? 'bg-white text-black shadow-sm'
                              : 'text-slate-500 hover:text-black'
                          )}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={!title.trim() || !selectedCategoryId}
                className="h-9 rounded-full bg-black px-6 text-sm font-medium text-white shadow-lg shadow-black/10 transition-all hover:scale-105 hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                Create
              </Button>
            </div>
          </GlassCard>
        </form>
      </DialogContent>
    </Dialog>
  )
}
