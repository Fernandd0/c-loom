'use client'

import * as React from 'react'
import { Task, Category, TaskRecurrence } from '../types'
import { GlassCard } from './GlassCard'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Edit2, Save, X, Calendar, Repeat } from 'lucide-react'

interface TaskDetailDialogProps {
  task: Task | null
  category?: Category
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
}

export function TaskDetailDialog({
  task,
  category,
  categories,
  open,
  onOpenChange,
  onDelete,
  onUpdate,
}: TaskDetailDialogProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedTitle, setEditedTitle] = React.useState('')
  const [editedCategoryId, setEditedCategoryId] = React.useState('')
  const [editedDeadline, setEditedDeadline] = React.useState('')
  const [editedRecurrence, setEditedRecurrence] =
    React.useState<TaskRecurrence>('never')
  const [editedDescription, setEditedDescription] = React.useState('')
  const [hoursOld, setHoursOld] = React.useState<string>('0.0')

  React.useEffect(() => {
    if (task) {
      const diff = Date.now() - new Date(task.createdAt).getTime()
      setHoursOld((diff / (1000 * 60 * 60)).toFixed(1))

      // Initialize edit state
      setEditedTitle(task.title)
      setEditedCategoryId(task.categoryId)
      setEditedDeadline(
        task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
      )
      setEditedRecurrence(task.recurrence)
      setEditedDescription(task.description || '')
    }
  }, [task, open])

  if (!task) return null

  const handleSave = () => {
    const updates: Partial<Task> = {
      title: editedTitle.trim(),
      categoryId: editedCategoryId,
      deadline: editedDeadline
        ? new Date(editedDeadline).toISOString()
        : undefined,
      recurrence: editedRecurrence,
      description: editedDescription.trim(),
    }

    onUpdate(task.id, updates)
    setIsEditing(false)
  }

  const handleCancel = () => {
    // Reset to original values
    setEditedTitle(task.title)
    setEditedCategoryId(task.categoryId)
    setEditedDeadline(
      task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''
    )
    setEditedRecurrence(task.recurrence)
    setEditedDescription(task.description || '')
    setIsEditing(false)
  }

  const selectedCategory = categories.find(
    (c) => c.id === (isEditing ? editedCategoryId : task.categoryId)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-lg">
        <GlassCard className="p-6 sm:p-8">
          <div className="space-y-6">
            {/* Header with Edit/Save buttons */}
            <div className="flex items-start justify-between gap-4">
              {isEditing ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="border-2 border-indigo-200 text-3xl font-bold focus:border-indigo-500 sm:text-4xl"
                  style={{ color: selectedCategory?.color || '#374151' }}
                />
              ) : (
                <h2
                  className="flex-1 text-3xl font-bold tracking-tight break-words sm:text-4xl"
                  style={{ color: selectedCategory?.color || '#374151' }}
                >
                  {task.title}
                </h2>
              )}

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={!editedTitle.trim()}
                      className="h-9 w-9 rounded-md bg-indigo-500 p-0 text-white shadow-sm transition-colors hover:bg-indigo-600"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleCancel}
                      className="h-9 w-9 rounded-md border border-slate-200 bg-white p-0 text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="h-9 w-9 rounded-md border border-slate-200 bg-white p-0 text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Category */}
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-slate-500">
                  Category
                </span>
                {isEditing ? (
                  <select
                    value={editedCategoryId}
                    onChange={(e) => setEditedCategoryId(e.target.value)}
                    className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                ) : selectedCategory ? (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: selectedCategory.color
                        ? `${selectedCategory.color}20`
                        : '#f1f5f9',
                      color: selectedCategory.color || '#475569',
                    }}
                  >
                    <span>{selectedCategory.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">
                    No category
                  </span>
                )}
              </div>

              {/* Created */}
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium text-slate-500">
                  Created
                </span>
                <span className="text-sm text-slate-700">
                  {hoursOld} hours ago
                </span>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-3">
                <span className="flex w-24 items-center gap-1 text-sm font-medium text-slate-500">
                  <Calendar className="h-3 w-3" />
                  Due Date
                </span>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={editedDeadline}
                    onChange={(e) => setEditedDeadline(e.target.value)}
                    className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                ) : task.deadline ? (
                  <span className="text-sm text-slate-700">
                    {new Date(task.deadline).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 italic">
                    No deadline
                  </span>
                )}
              </div>

              {/* Recurrence */}
              <div className="flex items-center gap-3">
                <span className="flex w-24 items-center gap-1 text-sm font-medium text-slate-500">
                  <Repeat className="h-3 w-3" />
                  Recurrence
                </span>
                {isEditing ? (
                  <select
                    value={editedRecurrence}
                    onChange={(e) =>
                      setEditedRecurrence(e.target.value as TaskRecurrence)
                    }
                    className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="never">Never</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                ) : (
                  <span className="text-sm text-slate-700 capitalize">
                    {task.recurrence}
                  </span>
                )}
              </div>

              {/* Description */}
              {(isEditing || task.description) && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-500">
                    Description
                  </span>
                  {isEditing ? (
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={3}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap text-slate-700">
                      {task.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Delete Button */}
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
