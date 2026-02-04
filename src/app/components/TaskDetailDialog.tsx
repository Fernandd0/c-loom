'use client'

import * as React from 'react'
import { Task, Category } from '../types'
import { GlassCard } from './GlassCard'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface TaskDetailDialogProps {
  task: Task | null
  category?: Category
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
}

export function TaskDetailDialog({
  task,
  category,
  open,
  onOpenChange,
  onDelete,
}: TaskDetailDialogProps) {
  const [hoursOld, setHoursOld] = React.useState<string>('0.0')

  React.useEffect(() => {
    if (task) {
      const diff = Date.now() - task.createdAt
      setHoursOld((diff / (1000 * 60 * 60)).toFixed(1))
    }
  }, [task, open])

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <GlassCard className="p-8">
          <div className="space-y-6">
            <h2
              className="text-left text-4xl font-bold tracking-tight break-words"
              style={{ color: category?.color || '#374151' }}
            >
              {task.title}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-slate-500">
                  Type
                </span>
                {category ? (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: category.color
                        ? `${category.color}20`
                        : '#f1f5f9',
                      color: category.color || '#475569',
                    }}
                  >
                    <span>{category.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">No type</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-slate-500">
                  Created
                </span>
                <span className="text-sm text-slate-700">
                  {hoursOld} hours ago
                </span>
              </div>

              {task.durationMinutes && (
                <div className="flex items-center gap-3">
                  <span className="w-20 text-sm font-medium text-slate-500">
                    Duration
                  </span>
                  <span className="text-sm text-slate-700">
                    {task.durationMinutes < 60
                      ? `${task.durationMinutes} min`
                      : `${(task.durationMinutes / 60).toFixed(1)} hours`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-start pt-4">
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
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
