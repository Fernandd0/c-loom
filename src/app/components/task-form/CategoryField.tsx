'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Category } from '../../types'
import { CategoryCreator, CreateCategory, iconFor } from './categoryOptions'

interface CategoryFieldProps {
  categories: Category[]
  value: string
  onChange: (id: string) => void
  // Omit to hide the "New" button.
  onCreate?: CreateCategory
}

export function CategoryField({
  categories,
  value,
  onChange,
  onCreate,
}: CategoryFieldProps) {
  const [isCreating, setIsCreating] = useState(categories.length === 0)

  return (
    <div className="space-y-2.5">
      <div
        role="radiogroup"
        aria-label="Category"
        className="flex flex-wrap gap-2"
      >
        {categories.map((c) => {
          const selected = c.id === value
          const Icon = iconFor(c.icon)
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(c.id)}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                selected
                  ? 'text-white shadow-[0_1px_3px_rgba(0,0,0,0.15)]'
                  : 'bg-[#F2F2F7] text-[#3C3C43] hover:bg-[#E5E5EA]'
              )}
              style={selected ? { backgroundColor: c.color } : undefined}
            >
              {Icon ? (
                <Icon className="h-3.5 w-3.5" />
              ) : (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: selected ? 'white' : c.color }}
                />
              )}
              {c.name}
            </button>
          )
        })}
        {onCreate && (
          <button
            type="button"
            onClick={() => setIsCreating((v) => !v)}
            aria-expanded={isCreating}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-[#C7C7CC] px-3 text-[13px] font-semibold text-[#8E8E93] transition-colors hover:border-[#8E8E93] hover:text-[#1C1C1E]"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        )}
      </div>

      {onCreate && isCreating && (
        <CategoryCreator
          onCreate={onCreate}
          onCreated={(id) => {
            setIsCreating(false)
            onChange(id)
          }}
        />
      )}
    </div>
  )
}
