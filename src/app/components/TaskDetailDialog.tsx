'use client'

import * as React from 'react'
import { Task, Category, TaskRecurrence } from '../types'
import { GlassCard } from './GlassCard'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlignLeft,
  Calendar,
  Clock,
  Edit2,
  Flag,
  Repeat,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buildDeadline,
  formatAge,
  formatDeadline,
  isOverdue,
  parseDeadline,
  splitDeadline,
} from '@/lib/dates'
import { PRIORITY_LEVELS, RECURRENCE_OPTIONS, priorityLevel } from '../lib/task'
import { ChipGroup, FieldLabel } from './task-form/ChipGroup'
import { CategoryField } from './task-form/CategoryField'
import { DeadlineField, DeadlineValue } from './task-form/DeadlineField'

interface TaskDetailDialogProps {
  task: Task
  category?: Category
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
}

interface Draft {
  title: string
  description: string
  categoryId: string
  deadline: DeadlineValue
  recurrence: TaskRecurrence
  priority: number
}

const draftFrom = (task: Task): Draft => ({
  title: task.title,
  description: task.description ?? '',
  categoryId: task.categoryId,
  deadline: splitDeadline(task.deadline),
  recurrence: task.recurrence,
  priority: priorityLevel(task.priority).value,
})

export function TaskDetailDialog({
  task,
  category,
  categories,
  open,
  onOpenChange,
  onDelete,
  onUpdate,
}: TaskDetailDialogProps) {
  const [draft, setDraft] = React.useState<Draft | null>(null)
  const isEditing = draft !== null

  const update = (changes: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...changes } : d))

  const handleSave = () => {
    if (!draft || !draft.title.trim()) return
    onUpdate(task.id, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId,
      deadline: buildDeadline(draft.deadline.date, draft.deadline.time),
      recurrence: draft.deadline.date ? draft.recurrence : 'never',
      priority: draft.priority,
    })
    setDraft(null)
  }

  const shownCategory = isEditing
    ? categories.find((c) => c.id === draft.categoryId)
    : category
  const deadline = parseDeadline(task.deadline)
  const overdue = !!deadline && isOverdue(deadline)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setDraft(null)
        onOpenChange(next)
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-lg">
        <GlassCard className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 pr-6">
              {isEditing ? (
                <>
                  <DialogTitle className="sr-only">Edit task</DialogTitle>
                  <Input
                    value={draft.title}
                    onChange={(e) => update({ title: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    aria-label="Task title"
                    maxLength={500}
                    autoFocus
                    className="text-2xl font-bold sm:text-3xl"
                    style={{ color: shownCategory?.color || '#374151' }}
                  />
                </>
              ) : (
                <DialogTitle
                  className="flex-1 text-3xl font-bold tracking-tight break-words sm:text-4xl"
                  style={{ color: shownCategory?.color || '#374151' }}
                >
                  {task.title}
                </DialogTitle>
              )}

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={!draft.title.trim()}
                      aria-label="Save"
                      className="h-9 w-9 rounded-md bg-[#1C1C1E] p-0 text-white shadow-sm hover:bg-[#2C2C2E]"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setDraft(null)}
                      aria-label="Cancel"
                      className="h-9 w-9 rounded-md border border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setDraft(draftFrom(task))}
                    aria-label="Edit"
                    className="h-9 w-9 rounded-md border border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-5">
                <div>
                  <FieldLabel icon={AlignLeft}>Details</FieldLabel>
                  <textarea
                    value={draft.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Add details…"
                    rows={3}
                    className="w-full rounded-xl border border-[#D1D1D6] bg-white px-3 py-2 text-sm outline-none focus:border-[#C7C7CC] focus:ring-4 focus:ring-[#D1D1D6]/30"
                  />
                </div>
                <div>
                  <FieldLabel icon={Tag}>Category</FieldLabel>
                  <CategoryField
                    categories={categories}
                    value={draft.categoryId}
                    onChange={(categoryId) => update({ categoryId })}
                  />
                </div>
                <div>
                  <FieldLabel icon={Calendar}>Due</FieldLabel>
                  <DeadlineField
                    value={draft.deadline}
                    onChange={(deadline) => update({ deadline })}
                  />
                </div>
                {draft.deadline.date && (
                  <div>
                    <FieldLabel icon={Repeat}>Repeat</FieldLabel>
                    <ChipGroup
                      label="Repeat"
                      options={RECURRENCE_OPTIONS}
                      value={draft.recurrence}
                      onChange={(recurrence) => update({ recurrence })}
                    />
                  </div>
                )}
                <div>
                  <FieldLabel icon={Flag}>Priority</FieldLabel>
                  <ChipGroup
                    label="Priority"
                    options={PRIORITY_LEVELS}
                    value={draft.priority}
                    onChange={(priority) => update({ priority })}
                  />
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Row icon={Tag} label="Category">
                  {category ? (
                    <span
                      className="inline-flex items-center rounded-md px-2 py-0.5 font-medium"
                      style={{
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                      }}
                    >
                      {category.name}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No category</span>
                  )}
                </Row>
                <Row icon={Calendar} label="Due">
                  {deadline ? (
                    <span
                      className={cn(
                        overdue
                          ? 'font-medium text-[#FF3B30]'
                          : 'text-slate-700'
                      )}
                    >
                      {formatDeadline(deadline)}
                      {overdue && ' · overdue'}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No due date</span>
                  )}
                </Row>
                {task.recurrence !== 'never' && (
                  <Row icon={Repeat} label="Repeat">
                    <span className="text-slate-700 capitalize">
                      {task.recurrence}
                    </span>
                  </Row>
                )}
                <Row icon={Flag} label="Priority">
                  <span className="text-slate-700">
                    {priorityLevel(task.priority).label}
                  </span>
                </Row>
                <Row icon={Clock} label="Created">
                  <span className="text-slate-700">
                    {formatAge(task.createdAt)}
                  </span>
                </Row>
                {task.description && (
                  <p className="pt-1 whitespace-pre-wrap text-slate-700">
                    {task.description}
                  </p>
                )}
              </dl>
            )}

            {!isEditing && (
              <div className="flex justify-start border-t border-slate-200 pt-4">
                <Button
                  onClick={() => {
                    onDelete(task.id)
                    onOpenChange(false)
                  }}
                  className="h-9 rounded-md border border-slate-200 bg-white px-4 text-sm text-slate-600 shadow-sm transition-colors hover:border-red-100 hover:bg-slate-50 hover:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <dt className="flex w-24 shrink-0 items-center gap-1.5 font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}
