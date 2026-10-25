'use client'

import { useEffect, useRef, useState } from 'react'
import { AlignLeft, Plus, Sparkles } from 'lucide-react'
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
import { PRIORITY_LEVELS } from '../lib/task'
import { useStickyState } from '../hooks/useStickyState'
import { GlassCard } from './GlassCard'
import { DeadlineValue } from './task-form/DeadlineField'
import { TaskFields, TaskFieldsValue } from './task-form/TaskFields'
import { Kbd } from './Kbd'
import { parseQuickAdd } from '@/features/board/lib/quickAdd'

interface AddTaskDialogProps {
  categories: Category[]
  // Starts new tasks in this category (e.g. the one the board is focused on).
  preferredCategoryId?: string
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
  preferredCategoryId = '',
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
  // Fields picked by hand win over what's typed in the title.
  const [touched, setTouched] = useState({ due: false, priority: false })
  const [plainText, setPlainText] = useState(false)
  const [lastCategoryId, setLastCategoryId] = useStickyState(
    '',
    'c-loom-last-category'
  )
  const formRef = useRef<HTMLFormElement>(null)
  const justCreated = useRef(false)

  // "Pay rent tomorrow 9am #personal !high" fills the fields as you type.
  const parsed = parseQuickAdd(title, categories)
  const quick = plainText ? { title: title.trim(), matched: [] } : parsed

  // A picked category wins, then a #tag, then the focused category, then the last one
  // used, so a task can be created by typing a title and pressing Enter.
  const categoryId =
    [
      pickedCategoryId,
      quick.categoryId,
      preferredCategoryId,
      lastCategoryId,
    ].find((id) => categories.some((c) => c.id === id)) ??
    categories[0]?.id ??
    ''
  const useTyped = !touched.due && !!quick.date
  const fields: TaskFieldsValue = {
    categoryId,
    deadline: useTyped
      ? { date: quick.date!, time: quick.time ?? '' }
      : deadline,
    recurrence: useTyped ? (quick.recurrence ?? recurrence) : recurrence,
    priority: touched.priority ? priority : (quick.priority ?? priority),
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // The form handles ⌘↵ itself while open and marks the event as handled.
      if (e.defaultPrevented) return
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        setOpen(true)
        return
      }
      // Plain "N" opens it too, unless typing or another dialog is open.
      if (e.key.toLowerCase() !== 'n' || e.metaKey || e.ctrlKey || e.altKey)
        return
      const target = e.target as HTMLElement | null
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]') ||
        document.querySelector('[role="dialog"]')
      )
        return
      e.preventDefault()
      setOpen(true)
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
    setTouched({ due: false, priority: false })
    setPlainText(false)
  }

  // A category is optional: with none left, the task is created without one.
  const canSubmit = !!quick.title

  const handleFieldsChange = (changes: Partial<TaskFieldsValue>) => {
    if (changes.categoryId !== undefined)
      setPickedCategoryId(changes.categoryId)
    if (changes.deadline || changes.recurrence) {
      // Start from what's shown, which may have come from the title.
      setDeadline(changes.deadline ?? fields.deadline)
      setRecurrence(changes.recurrence ?? fields.recurrence)
      setTouched((t) => ({ ...t, due: true }))
    }
    if (changes.priority !== undefined) {
      setPriority(changes.priority)
      setTouched((t) => ({ ...t, priority: true }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    onAddTask({
      title: quick.title,
      categoryId,
      description: description.trim(),
      deadline: buildDeadline(fields.deadline.date, fields.deadline.time),
      // Repeating only makes sense relative to a due date.
      recurrence: fields.deadline.date ? fields.recurrence : 'never',
      priority: fields.priority,
    })
    setLastCategoryId(categoryId)
    justCreated.current = true
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
        <button
          type="button"
          aria-label="New task"
          aria-keyshortcuts="N Meta+Enter Control+Enter"
          className="group flex h-24 w-48 items-center justify-center rounded-t-full border-t border-white/10 bg-(--ink) text-white shadow-[0_2px_8px_rgba(0,0,0,0.15),0_12px_28px_rgba(0,0,0,0.2)] transition-all duration-200 outline-none hover:bg-(--ink-hover) hover:shadow-[0_4px_12px_rgba(0,0,0,0.2),0_16px_36px_rgba(0,0,0,0.25)] focus-visible:ring-2 focus-visible:ring-(--fg)/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.98] sm:h-28 sm:w-56 md:h-32 md:w-64"
        >
          {/* An SVG, not a "+" glyph: text metrics put its center off-axis when it turns. */}
          <Plus
            aria-hidden
            strokeWidth={1.25}
            className="mb-2 h-14 w-14 transition-transform duration-300 ease-out group-hover:rotate-90 sm:mb-3 sm:h-16 sm:w-16 md:h-20 md:w-20"
          />
        </button>
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100vw-2rem)] overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-xl"
        // After creating, leave focus on the board instead of ringing the button every time.
        onCloseAutoFocus={(e) => {
          if (justCreated.current) e.preventDefault()
          justCreated.current = false
        }}
      >
        <DialogTitle className="sr-only">New task</DialogTitle>
        <DialogDescription className="sr-only">
          Name the task, then optionally change its category, due date and
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
            <div className="flex flex-col gap-4 overflow-y-auto p-5 sm:p-6">
              {/* Title */}
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs doing?"
                  aria-label="Task title"
                  maxLength={500}
                  className="h-auto border-none bg-transparent px-0 py-1 text-xl font-semibold shadow-none placeholder:text-(--fg-4) focus:ring-0 sm:text-2xl"
                  autoFocus
                />
                {parsed.matched.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-(--fg-3)">
                    <Sparkles className="h-3.5 w-3.5" />
                    {plainText ? (
                      <span>Kept as text</span>
                    ) : (
                      <>
                        <span>Read</span>
                        {parsed.matched.map((word) => (
                          <span
                            key={word}
                            className="rounded-md bg-(--surface-2) px-1.5 py-0.5 font-medium text-(--fg-2)"
                          >
                            {word}
                          </span>
                        ))}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setPlainText((v) => !v)}
                      className="font-semibold text-(--accent) hover:underline"
                    >
                      {plainText ? 'Read it again' : 'Keep as text'}
                    </button>
                  </div>
                )}
                {showDescription ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details…"
                    aria-label="Description"
                    rows={2}
                    autoFocus
                    className="mt-1 w-full resize-none bg-transparent text-[15px] text-(--fg-2) outline-none placeholder:text-(--fg-4)"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDescription(true)}
                    className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium text-(--fg-3) hover:text-(--fg)"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                    Add details
                  </button>
                )}
              </div>

              <TaskFields
                value={fields}
                onChange={handleFieldsChange}
                categories={categories}
                onCreateCategory={onAddCategory}
              />
              {!title && (
                <p className="-mt-1 text-[12px] text-(--fg-3)">
                  Tip: type “tomorrow 9am #work !high every week” in the title
                  to fill these in.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-(--line) bg-(--hover) px-5 py-3 sm:px-6">
              <span className="hidden items-center gap-1 text-[12px] text-(--fg-3) sm:flex">
                <Kbd className={KBD}>↵</Kbd> or <Kbd className={KBD}>⌘</Kbd>
                <Kbd className={KBD}>↵</Kbd> to create
              </span>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full bg-(--ink) text-white hover:bg-(--ink-hover) disabled:bg-(--ink) disabled:opacity-40 sm:w-auto sm:px-6"
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
