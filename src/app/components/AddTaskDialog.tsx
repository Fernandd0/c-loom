'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  ChevronDown,
  Repeat,
  Calendar,
  Briefcase,
  GraduationCap,
  User,
  DollarSign,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Category, TaskRecurrence, Board } from '../types'
import { GlassCard } from './GlassCard'

interface AddTaskDialogProps {
  categories: Category[]
  currentBoard: Board | null
  onDisconnect?: () => void
  onAddTask: (
    title: string,
    categoryId: string,
    dueDate?: string,
    recurrence?: TaskRecurrence,
    priority?: number,
    icon?: string
  ) => void
  onAddCategory: (name: string, color: string, icon?: string) => void
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

const CATEGORY_ICONS = [
  { name: 'Briefcase', value: 'briefcase', Icon: Briefcase },
  { name: 'Education', value: 'graduation-cap', Icon: GraduationCap },
  { name: 'Personal', value: 'user', Icon: User },
  { name: 'Finance', value: 'dollar', Icon: DollarSign },
  { name: 'Home', value: 'home', Icon: Home },
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
  const [newCatIcon, setNewCatIcon] = useState(CATEGORY_ICONS[0].value)

  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('never')
  const [priority, setPriority] = useState(0) // 0-10 scale, default 0 (low)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (selectedCategoryId) {
      const selectedCategory = categories.find(
        (c) => c.id === selectedCategoryId
      )
      onAddTask(
        title,
        selectedCategoryId,
        dueDate || undefined,
        recurrence,
        priority,
        selectedCategory?.icon
      )
      setOpen(false)
      reset()
    }
  }

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return
    onAddCategory(newCatName.trim(), newCatColor, newCatIcon)
    setSelectedCategoryId(crypto.randomUUID()) // Will be replaced by actual ID from parent
    setIsCreatingCategory(false)
    setNewCatName('')
    setNewCatColor(VIBRANT_COLORS[0].value)
    setNewCatIcon(CATEGORY_ICONS[0].value)
  }

  const reset = () => {
    setTitle('')
    setSelectedCategoryId(null)
    setDueDate('')
    setIsCreatingCategory(false)
    setRecurrence('never')
    setPriority(0)
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
        <DialogTitle className="sr-only">Create New Task</DialogTitle>
        <DialogDescription className="sr-only">
          Fill in the task details including title, category, priority, due
          date, and recurrence.
        </DialogDescription>
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
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_ICONS.map((iconItem) => {
                            const IconComponent = iconItem.Icon
                            return (
                              <button
                                key={iconItem.value}
                                type="button"
                                onClick={() => setNewCatIcon(iconItem.value)}
                                className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-lg border-2 transition-all',
                                  newCatIcon === iconItem.value
                                    ? 'scale-110 border-slate-400 bg-slate-200'
                                    : 'border-transparent bg-white hover:scale-110 hover:border-slate-200'
                                )}
                                title={iconItem.name}
                              >
                                <IconComponent className="h-4 w-4" />
                              </button>
                            )
                          })}
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

            {/* Priority Slider */}
            <div className="space-y-3 border-t border-slate-100/50 pt-4">
              <label className="block text-sm font-semibold text-slate-700">
                Priority
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 transition-all outline-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-slate-700 [&::-moz-range-thumb]:shadow-md [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-700 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-110"
                  style={{
                    background: `linear-gradient(to right, #cbd5e1 0%, #94a3b8 50%, #475569 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span
                    className={cn(
                      priority <= 2 && 'font-semibold text-slate-700'
                    )}
                  >
                    0 (Low)
                  </span>
                  <span
                    className={cn(
                      priority >= 3 &&
                        priority <= 7 &&
                        'font-semibold text-slate-700'
                    )}
                  >
                    5 (Medium)
                  </span>
                  <span
                    className={cn(
                      priority >= 8 && 'font-semibold text-slate-700'
                    )}
                  >
                    10 (High)
                  </span>
                </div>
                <div className="text-center text-xs font-semibold text-slate-600">
                  Current: {priority}
                </div>
              </div>
            </div>

            {/* Due Date & Recurrence */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100/50 pt-4">
              {/* Due Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Recurrence
                </label>
                <div className="relative">
                  <Repeat className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={recurrence}
                    onChange={(e) =>
                      setRecurrence(e.target.value as TaskRecurrence)
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pr-10 pl-10 text-sm transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:outline-none"
                  >
                    <option value="never">Never</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="border-t border-slate-100/50 pt-4">
              <Button
                type="submit"
                disabled={!title.trim() || !selectedCategoryId}
                className="h-11 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-slate-900"
              >
                Create Task
              </Button>
            </div>
          </GlassCard>
        </form>
      </DialogContent>
    </Dialog>
  )
}
