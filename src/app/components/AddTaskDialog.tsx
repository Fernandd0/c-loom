'use client'

import { useEffect, useRef, useState } from 'react'
import { AlignLeft, Calendar, Flag, Repeat, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { buildDeadline } from '@/lib/dates'
import { Category, NewTaskInput, TaskRecurrence } from '../types'
import { PRIORITY_LEVELS, RECURRENCE_OPTIONS } from '../lib/task'
import { useStickyState } from '../hooks/useStickyState'
import { GlassCard } from './GlassCard'
import { ChipGroup, FieldLabel } from './task-form/ChipGroup'
import { CategoryField } from './task-form/CategoryField'
import { DeadlineField, DeadlineValue } from './task-form/DeadlineField'
import { Kbd } from './Kbd'

interface AddTaskDialogProps {
  categories: Category[]
  onAddTask: (input: NewTaskInput) => void
  onAddCategory: (
    name: string,
    color: string,
    icon?: string
  ) => Promise<string | undefined>
}

const EMPTY_DEADLINE: DeadlineValue = { date: '', time: '' }
const KBD = 'px-1.5 py-0 text-[11px] shadow-none'

export function AddTaskDialog({
  categories,
  onAddTask,
  onAddCategory,
}: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  const [pickedCategoryId, setPickedCategoryId] = useState('')
  const [deadline, setDeadline] = useState<DeadlineValue>(EMPTY_DEADLINE)
  const [recurrence, setRecurrence] = useState<TaskRecurrence>('never')
  const [priority, setPriority] = useState<number>(PRIORITY_LEVELS[0].value)
  const [lastCategoryId, setLastCategoryId] = useStickyState(
    '',
    'c-loom-last-category'
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Default to the last category used, so a task can be created by typing a title and pressing Enter.
  const exists = (id: string) => categories.some((c) => c.id === id)
  const categoryId = exists(pickedCategoryId)
    ? pickedCategoryId
    : exists(lastCategoryId)
      ? lastCategoryId
      : (categories[0]?.id ?? '')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // The form handles ⌘↵ itself while open and marks the event as handled.
      if (e.defaultPrevented) return
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const reset = () => {
    setTitle('')
    setDescription('')
    setShowDescription(false)
    setPickedCategoryId('')
    setDeadline(EMPTY_DEADLINE)
    setRecurrence('never')
    setPriority(PRIORITY_LEVELS[0].value)
  }

  const canSubmit = !!title.trim() && !!categoryId

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    onAddTask({
      title: title.trim(),
      categoryId,
      description: description.trim(),
      deadline: buildDeadline(deadline.date, deadline.time),
      // Repeating only makes sense relative to a due date.
      recurrence: deadline.date ? recurrence : 'never',
      priority,
    })
    setLastCategoryId(categoryId)
    setOpen(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <div className="flex flex-col items-center">
          <Button
            aria-label="New task"
            className="h-24 w-48 rounded-t-full rounded-b-none border-t border-white/10 bg-[#1C1C1E] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15),0_12px_28px_rgba(0,0,0,0.2)] transition-all duration-200 hover:bg-[#2C2C2E] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2),0_16px_36px_rgba(0,0,0,0.25)] active:scale-[0.98] sm:h-28 sm:w-56 md:h-32 md:w-64"
          >
            <span className="mb-2 text-[4rem] leading-none font-light sm:mb-3 sm:text-[5rem] md:text-[6rem]">
              +
            </span>
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-xl">
        <DialogTitle className="sr-only">New task</DialogTitle>
        <DialogDescription className="sr-only">
          Name the task, then optionally pick a category, due date, repeat and
          priority.
        </DialogDescription>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
          className="relative w-full"
        >
          <GlassCard className="flex max-h-[85vh] flex-col overflow-hidden">
            <div className="flex flex-col gap-5 overflow-y-auto p-5 sm:p-6">
              {/* Title */}
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs doing?"
                  aria-label="Task title"
                  maxLength={500}
                  className="h-auto border-none bg-transparent px-0 py-1 text-xl font-semibold shadow-none placeholder:text-[#C7C7CC] focus:ring-0 sm:text-2xl"
                  autoFocus
                />
                {showDescription ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details…"
                    aria-label="Description"
                    rows={2}
                    autoFocus
                    className="mt-1 w-full resize-none bg-transparent text-[15px] text-[#3C3C43] outline-none placeholder:text-[#C7C7CC]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDescription(true)}
                    className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8E8E93] hover:text-[#1C1C1E]"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                    Add details
                  </button>
                )}
              </div>

              <div className="h-px bg-[#E5E5EA]" />

              <div>
                <FieldLabel icon={Tag}>Category</FieldLabel>
                <CategoryField
                  categories={categories}
                  value={categoryId}
                  onChange={setPickedCategoryId}
                  onCreate={onAddCategory}
                />
              </div>

              <div>
                <FieldLabel icon={Calendar}>Due</FieldLabel>
                <DeadlineField value={deadline} onChange={setDeadline} />
              </div>

              {deadline.date && (
                <div className="animate-in fade-in duration-150">
                  <FieldLabel icon={Repeat}>Repeat</FieldLabel>
                  <ChipGroup
                    label="Repeat"
                    options={RECURRENCE_OPTIONS}
                    value={recurrence}
                    onChange={setRecurrence}
                  />
                </div>
              )}

              <div>
                <FieldLabel icon={Flag}>Priority</FieldLabel>
                <ChipGroup
                  label="Priority"
                  options={PRIORITY_LEVELS}
                  value={priority}
                  onChange={setPriority}
                />
                <p className="mt-2 text-[12px] text-[#8E8E93]">
                  Higher priority starts as a bigger circle.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#E5E5EA] bg-[#FAFAFA] px-5 py-3 sm:px-6">
              <span className="hidden items-center gap-1 text-[12px] text-[#8E8E93] sm:flex">
                <Kbd className={KBD}>↵</Kbd> or <Kbd className={KBD}>⌘</Kbd>
                <Kbd className={KBD}>↵</Kbd> to create
              </span>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-[#1C1C1E] text-white hover:bg-[#2C2C2E] disabled:bg-[#1C1C1E] disabled:opacity-40 sm:w-auto sm:px-6"
              >
                Create task
              </Button>
            </div>
          </GlassCard>
        </form>
      </DialogContent>
    </Dialog>
  )
}
