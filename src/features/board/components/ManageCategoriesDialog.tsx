'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { GlassCard } from '@/app/components/GlassCard'
import {
  CategoryCreator,
  CategoryIcon,
  ColorSwatches,
  CreateCategory,
  IconPicker,
} from '@/app/components/task-form/categoryOptions'
import { Category } from '@/app/types'
import { CategoryChanges } from '../data/types'

interface ManageCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  taskCounts: Map<string, number>
  onUpdate: (categoryId: string, changes: CategoryChanges) => void
  onDelete: (categoryId: string) => void
  onCreate: CreateCategory
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  taskCounts,
  onUpdate,
  onDelete,
  onCreate,
}: ManageCategoriesDialogProps) {
  const [isCreating, setIsCreating] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setIsCreating(false)
        onOpenChange(next)
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <GlassCard className="max-h-[85vh] space-y-4 overflow-y-auto p-5 sm:p-6">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight text-[#1C1C1E]">
              Categories
            </DialogTitle>
            <DialogDescription className="mt-1 text-[13px] text-[#8E8E93]">
              Rename, recolor or delete. Changes save as you go.
            </DialogDescription>
          </div>

          <ul className="space-y-1">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                taskCount={taskCounts.get(category.id) ?? 0}
                onUpdate={(changes) => onUpdate(category.id, changes)}
                onDelete={() => onDelete(category.id)}
              />
            ))}
          </ul>

          {isCreating ? (
            <CategoryCreator
              onCreate={onCreate}
              onCreated={() => setIsCreating(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-[#C7C7CC] px-3 text-[13px] font-semibold text-[#8E8E93] transition-colors hover:border-[#8E8E93] hover:text-[#1C1C1E]"
            >
              <Plus className="h-3.5 w-3.5" />
              New category
            </button>
          )}
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}

function CategoryRow({
  category,
  taskCount,
  onUpdate,
  onDelete,
}: {
  category: Category
  taskCount: number
  onUpdate: (changes: CategoryChanges) => void
  onDelete: () => void
}) {
  const [isConfirming, setIsConfirming] = useState(false)

  const saveName = (input: HTMLInputElement) => {
    const name = input.value.trim()
    if (name && name !== category.name) onUpdate({ name })
    else input.value = category.name
  }

  if (isConfirming) {
    return (
      <li className="flex items-center gap-2 rounded-xl bg-[#FFF2F2] px-3 py-2 text-[13px]">
        <span className="flex-1 text-[#3C3C43]">
          Delete <strong>{category.name}</strong>?
          {taskCount > 0 &&
            ` ${taskCount} ${taskCount === 1 ? 'task stays' : 'tasks stay'}, without a category.`}
        </span>
        <button
          type="button"
          onClick={() => setIsConfirming(false)}
          className="rounded-lg px-2.5 py-1 font-semibold text-[#3C3C43] hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg bg-[#FF3B30] px-2.5 py-1 font-semibold text-white hover:bg-[#E0352B]"
        >
          Delete
        </button>
      </li>
    )
  }

  return (
    <li className="group flex items-center gap-2 rounded-xl px-1 py-1 hover:bg-[#F2F2F7]">
      <Popover>
        <PopoverTrigger
          aria-label={`Color and icon for ${category.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] outline-none focus-visible:ring-2 focus-visible:ring-[#1C1C1E]/30"
          style={{ backgroundColor: category.color }}
        >
          <CategoryIcon icon={category.icon} className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto max-w-[calc(100vw-2rem)] space-y-3 rounded-2xl border-[#E5E5EA] bg-[#F2F2F7] p-3"
        >
          <ColorSwatches
            value={category.color}
            onChange={(color) => onUpdate({ color })}
          />
          <IconPicker
            value={category.icon}
            onChange={(icon) => onUpdate({ icon })}
          />
        </PopoverContent>
      </Popover>

      <input
        defaultValue={category.name}
        // Re-read the saved name when it changes elsewhere.
        key={category.name}
        aria-label={`Name of ${category.name}`}
        maxLength={50}
        onBlur={(e) => saveName(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 text-[15px] font-semibold text-[#1C1C1E] outline-none focus:bg-white"
      />

      <span className="shrink-0 text-[12px] text-[#8E8E93] tabular-nums">
        {taskCount > 0 && `${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`}
      </span>
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        aria-label={`Delete ${category.name}`}
        className="rounded-lg p-1.5 text-[#8E8E93] transition-colors hover:bg-white hover:text-[#FF3B30]"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}
