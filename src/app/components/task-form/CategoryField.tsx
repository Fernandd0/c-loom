'use client'

import { useState } from 'react'
import {
  Briefcase,
  DollarSign,
  GraduationCap,
  Home,
  Plus,
  User,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Category } from '../../types'

const CATEGORY_COLORS = [
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
  { name: 'Work', value: 'briefcase', Icon: Briefcase },
  { name: 'Education', value: 'graduation-cap', Icon: GraduationCap },
  { name: 'Personal', value: 'user', Icon: User },
  { name: 'Finance', value: 'dollar', Icon: DollarSign },
  { name: 'Home', value: 'home', Icon: Home },
]

const iconFor = (value?: string) =>
  CATEGORY_ICONS.find((i) => i.value === value)?.Icon

interface CategoryFieldProps {
  categories: Category[]
  value: string
  onChange: (id: string) => void
  // Omit to hide the "New" button.
  onCreate?: (
    name: string,
    color: string,
    icon?: string
  ) => Promise<string | undefined>
}

export function CategoryField({
  categories,
  value,
  onChange,
  onCreate,
}: CategoryFieldProps) {
  const [isCreating, setIsCreating] = useState(categories.length === 0)
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0].value)
  const [icon, setIcon] = useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setName('')
    setColor(CATEGORY_COLORS[0].value)
    setIcon(undefined)
    setIsCreating(false)
  }

  const handleCreate = async () => {
    if (!onCreate || !name.trim() || isSaving) return
    setIsSaving(true)
    const id = await onCreate(name.trim(), color, icon)
    setIsSaving(false)
    if (id) onChange(id)
    resetForm()
  }

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
        <div className="animate-in fade-in zoom-in-95 space-y-3 rounded-2xl bg-[#F2F2F7] p-3 duration-150">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                // Keep Enter from submitting the task form.
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreate()
                }
              }}
              placeholder="Category name"
              maxLength={50}
              autoFocus
              className="h-9 bg-white text-[13px]"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || isSaving}
              className="h-9 shrink-0 rounded-xl bg-[#1C1C1E] px-4 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.name}
                aria-pressed={color === c.value}
                className={cn(
                  'h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-[#F2F2F7] transition-transform',
                  color === c.value
                    ? 'scale-110 ring-[#1C1C1E]/40'
                    : 'ring-transparent hover:scale-110'
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <span className="mx-1 h-5 w-px bg-[#D1D1D6]" />
            {CATEGORY_ICONS.map(({ name: label, value: iconValue, Icon }) => (
              <button
                key={iconValue}
                type="button"
                onClick={() =>
                  setIcon((current) =>
                    current === iconValue ? undefined : iconValue
                  )
                }
                aria-label={label}
                aria-pressed={icon === iconValue}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                  icon === iconValue
                    ? 'bg-white text-[#1C1C1E] shadow-sm'
                    : 'text-[#8E8E93] hover:bg-white/70'
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
