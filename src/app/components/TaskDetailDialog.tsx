'use client'

import * as React from 'react'
import { Task, Category } from '../types'
import { GlassCard } from './GlassCard'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlignLeft, Clock, Repeat, Trash2 } from 'lucide-react'
import {
  buildDeadline,
  formatAge,
  isOverdue,
  parseDeadline,
  splitDeadline,
} from '@/lib/dates'
import { priorityLevel, recurrenceLabel, scheduleUpdate } from '../lib/task'
import { TaskFields, TaskFieldsValue } from './task-form/TaskFields'
import { tone } from './task-form/categoryOptions'

interface TaskDetailDialogProps {
  task: Task
  category?: Category
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
}

// A text draft readable synchronously, so a save triggered twice in one tick (blur
// right after Enter, or after closing the dialog) only saves once.
function useDraft() {
  const ref = React.useRef<string | null>(null)
  const [, rerender] = React.useState(0)
  const set = (value: string | null) => {
    ref.current = value
    rerender((n) => n + 1)
  }
  return [ref, set] as const
}

// Every field edits in place and saves on change; there is no separate edit mode.
export function TaskDetailDialog({
  task,
  category,
  categories,
  open,
  onOpenChange,
  onDelete,
  onUpdate,
}: TaskDetailDialogProps) {
  // Text drafts exist only while their field is being edited; otherwise the saved task shows.
  const [titleDraft, setTitleDraft] = useDraft()
  const [descriptionDraft, setDescriptionDraft] = useDraft()

  const saveTitle = () => {
    const title = titleDraft.current?.trim()
    if (title && title !== task.title) onUpdate(task.id, { title })
    setTitleDraft(null)
  }

  const saveDescription = () => {
    const draft = descriptionDraft.current
    if (draft !== null && draft.trim() !== (task.description ?? ''))
      onUpdate(task.id, { description: draft.trim() })
    setDescriptionDraft(null)
  }

  const handleFieldsChange = (changes: Partial<TaskFieldsValue>) => {
    const schedule: Partial<Task> = {}
    if (changes.deadline)
      schedule.deadline = buildDeadline(
        changes.deadline.date,
        changes.deadline.time
      )
    if (changes.recurrence) schedule.recurrence = changes.recurrence
    const updates: Partial<Task> =
      changes.deadline || changes.recurrence ? scheduleUpdate(schedule) : {}
    if (changes.categoryId !== undefined)
      updates.categoryId = changes.categoryId
    if (changes.priority !== undefined) updates.priority = changes.priority
    onUpdate(task.id, updates)
  }

  const deadline = parseDeadline(task.deadline)
  const overdue = !!deadline && isOverdue(deadline)
  const color = category ? tone(category.color) : '#374151'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          saveTitle()
          saveDescription()
        }
        onOpenChange(next)
      }}
    >
      <DialogContent
        className="w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-lg"
        // Radix sees Escape before the input does: cancel a title edit instead of closing.
        onEscapeKeyDown={(e) => {
          if (titleDraft.current === null) return
          e.preventDefault()
          setTitleDraft(null)
        }}
      >
        <GlassCard className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <div className="space-y-5">
            <div className="pr-6">
              {titleDraft.current !== null ? (
                <>
                  <DialogTitle className="sr-only">{task.title}</DialogTitle>
                  <input
                    value={titleDraft.current}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                    }}
                    aria-label="Task title"
                    maxLength={500}
                    autoFocus
                    className="-mx-2 w-full rounded-lg bg-(--surface-2) px-2 py-1 text-3xl font-bold tracking-tight outline-none sm:text-4xl"
                    style={{ color }}
                  />
                </>
              ) : (
                <DialogTitle asChild>
                  <h2>
                    <button
                      type="button"
                      onClick={() => setTitleDraft(task.title)}
                      title="Edit title"
                      className="-mx-2 w-full rounded-lg px-2 py-1 text-left text-3xl font-bold tracking-tight break-words transition-colors hover:bg-(--surface-2) sm:text-4xl"
                      style={{ color }}
                    >
                      {task.title}
                    </button>
                  </h2>
                </DialogTitle>
              )}
            </div>

            <TaskFields
              value={{
                categoryId: task.categoryId,
                deadline: splitDeadline(task.deadline),
                recurrence: task.recurrence,
                priority: priorityLevel(task.priority).value,
              }}
              onChange={handleFieldsChange}
              categories={categories}
            />

            {(overdue || (deadline && task.recurrence !== 'never')) && (
              <div className="space-y-1.5 text-[13px]">
                {overdue && (
                  <p className="font-medium text-[#FF3B30]">Overdue</p>
                )}
                {deadline && task.recurrence !== 'never' && (
                  <p className="flex items-center gap-1.5 text-(--fg-2)">
                    <Repeat className="h-3.5 w-3.5 text-(--fg-3)" />
                    {recurrenceLabel(task.recurrence, deadline)}
                  </p>
                )}
              </div>
            )}

            {descriptionDraft.current !== null || task.description ? (
              <textarea
                value={descriptionDraft.current ?? task.description ?? ''}
                onFocus={() => setDescriptionDraft(task.description ?? '')}
                onChange={(e) => setDescriptionDraft(e.target.value)}
                onBlur={saveDescription}
                placeholder="Add details…"
                aria-label="Description"
                rows={3}
                autoFocus={
                  descriptionDraft.current !== null && !task.description
                }
                className="-mx-2 w-full resize-none rounded-lg bg-transparent px-2 py-1 text-[15px] whitespace-pre-wrap text-(--fg-2) outline-none placeholder:text-(--fg-4) hover:bg-(--surface-2) focus:bg-(--surface-2)"
              />
            ) : (
              <button
                type="button"
                onClick={() => setDescriptionDraft('')}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-(--fg-3) hover:text-(--fg)"
              >
                <AlignLeft className="h-3.5 w-3.5" />
                Add details
              </button>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-(--line) pt-4">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-(--fg-3)">
                <Clock className="h-3.5 w-3.5" />
                Created {formatAge(task.createdAt)}
              </span>
              <Button
                onClick={() => {
                  onDelete(task.id)
                  onOpenChange(false)
                }}
                className="h-9 rounded-md border border-(--line) bg-(--surface) px-4 text-sm text-(--fg-2) shadow-sm transition-colors hover:border-[#FF3B30]/30 hover:bg-(--page) hover:text-[#FF3B30]"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
