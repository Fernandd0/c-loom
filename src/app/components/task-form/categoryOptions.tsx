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

// Faded, printed-ink tones rather than bright screen colors.
export const CATEGORY_COLORS = [
  { name: 'Denim', value: '#4A6FA5' },
  { name: 'Sage', value: '#6B8F71' },
  { name: 'Indigo', value: '#5B5F97' },
  { name: 'Terracotta', value: '#C9774E' },
  { name: 'Rose', value: '#C97B84' },
  { name: 'Plum', value: '#8E6C8A' },
  { name: 'Brick', value: '#B5544B' },
  { name: 'Teal', value: '#5E9C9A' },
  { name: 'Mustard', value: '#D1A94F' },
  { name: 'Stone', value: '#8A8478' },
]

// How a category color is shown everywhere: softened toward a warm khaki, so colors saved
// before (or bright defaults) look vintage too, without changing stored data.
export const tone = (color: string) =>
  `color-mix(in oklab, ${color} 64%, #b3a283)`

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
            'h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-(--surface-2) transition-transform',
            value === c.value
              ? 'scale-110 ring-(--fg)/40'
              : 'ring-transparent hover:scale-110'
          )}
          style={{ backgroundColor: tone(c.value) }}
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
              ? 'bg-(--surface) text-(--fg) shadow-sm'
              : 'text-(--fg-3) hover:bg-(--hover)'
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
    <div className="animate-in fade-in zoom-in-95 space-y-3 rounded-2xl bg-(--surface-2) p-3 duration-150">
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
          className="h-9 bg-(--surface) text-[13px]"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={!name.trim() || isSaving}
          className="h-9 shrink-0 rounded-xl bg-(--ink) px-4 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Add
        </button>
      </div>
      <ColorSwatches value={color} onChange={setColor} />
      <IconPicker value={icon} onChange={setIcon} />
    </div>
  )
}
