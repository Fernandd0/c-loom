'use client'

import { useState } from 'react'
import {
  Briefcase,
  Dumbbell,
  DollarSign,
  GraduationCap,
  Heart,
  Home,
  ShoppingCart,
  User,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export const CATEGORY_COLORS = [
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

export const CATEGORY_ICONS = [
  { name: 'Work', value: 'briefcase', Icon: Briefcase },
  { name: 'Education', value: 'graduation-cap', Icon: GraduationCap },
  { name: 'Personal', value: 'user', Icon: User },
  { name: 'Finance', value: 'dollar', Icon: DollarSign },
  { name: 'Home', value: 'home', Icon: Home },
  { name: 'Health', value: 'heart', Icon: Heart },
  { name: 'Fitness', value: 'dumbbell', Icon: Dumbbell },
  { name: 'Shopping', value: 'cart', Icon: ShoppingCart },
]

export const iconFor = (value?: string) =>
  CATEGORY_ICONS.find((i) => i.value === value)?.Icon

export function CategoryIcon({
  icon,
  className,
}: {
  icon?: string
  className?: string
}) {
  const match = CATEGORY_ICONS.find((i) => i.value === icon)
  return match ? <match.Icon className={className} /> : null
}

export function ColorSwatches({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (color: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          aria-label={c.name}
          aria-pressed={value === c.value}
          className={cn(
            'h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-[#F2F2F7] transition-transform',
            value === c.value
              ? 'scale-110 ring-[#1C1C1E]/40'
              : 'ring-transparent hover:scale-110'
          )}
          style={{ backgroundColor: c.value }}
        />
      ))}
    </div>
  )
}

// Picking the selected icon again clears it.
export function IconPicker({
  value,
  onChange,
}: {
  value?: string
  onChange: (icon: string | undefined) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {CATEGORY_ICONS.map(({ name, value: iconValue, Icon }) => (
        <button
          key={iconValue}
          type="button"
          onClick={() => onChange(value === iconValue ? undefined : iconValue)}
          aria-label={name}
          aria-pressed={value === iconValue}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
            value === iconValue
              ? 'bg-white text-[#1C1C1E] shadow-sm'
              : 'text-[#8E8E93] hover:bg-white/70'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  )
}

export type CreateCategory = (
  name: string,
  color: string,
  icon?: string
) => Promise<string | undefined>

// Name, color and optional icon for a new category. Calls onCreated with the new id.
export function CategoryCreator({
  onCreate,
  onCreated,
  autoFocus = true,
}: {
  onCreate: CreateCategory
  onCreated?: (id: string) => void
  autoFocus?: boolean
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(CATEGORY_COLORS[0].value)
  const [icon, setIcon] = useState<string | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || isSaving) return
    setIsSaving(true)
    const id = await onCreate(name.trim(), color, icon)
    setIsSaving(false)
    setName('')
    setColor(CATEGORY_COLORS[0].value)
    setIcon(undefined)
    if (id) onCreated?.(id)
  }

  return (
    <div className="animate-in fade-in zoom-in-95 space-y-3 rounded-2xl bg-[#F2F2F7] p-3 duration-150">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            // Keep Enter from submitting a surrounding form.
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCreate()
            }
          }}
          placeholder="Category name"
          maxLength={50}
          autoFocus={autoFocus}
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
      <ColorSwatches value={color} onChange={setColor} />
      <IconPicker value={icon} onChange={setIcon} />
    </div>
  )
}
