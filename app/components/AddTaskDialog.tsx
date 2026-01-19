'use client'

import { useState } from 'react'
import { Plus, Clock, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Category } from '../types'

interface AddTaskDialogProps {
  categories: Category[]
  onDisconnect?: () => void 
  onAddTask: (title: string, color?: string, durationMinutes?: number) => void
  onAddCategory: (category: Category) => void
}


const VIBRANT_COLORS = [
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

export function AddTaskDialog({ categories, onAddTask, onAddCategory }: AddTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  

  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(VIBRANT_COLORS[0].value)


  const [durationVal, setDurationVal] = useState('')
  const [durationUnit, setDurationUnit] = useState<'min' | 'hour' | 'day'>('hour')
  const [showDurationInput, setShowDurationInput] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return


    let durationMins: number | undefined = undefined
    if (durationVal) {
        const val = parseFloat(durationVal)
        if (!isNaN(val) && val > 0) {
            if (durationUnit === 'min') durationMins = val
            if (durationUnit === 'hour') durationMins = val * 60
            if (durationUnit === 'day') durationMins = val * 60 * 24
        }
    }


    const category = categories.find(c => c.id === selectedCategoryId)
    const color = category?.color

    onAddTask(title, color, durationMins)
    setOpen(false)
    reset()
  }

  const handleCreateCategory = () => {
      if (!newCatName.trim()) return
      const newCat: Category = {
          id: crypto.randomUUID(),
          name: newCatName.trim(),
          color: newCatColor
      }
      onAddCategory(newCat)
      setSelectedCategoryId(newCat.id)
      setIsCreatingCategory(false)
      setNewCatName('')
      setNewCatColor(VIBRANT_COLORS[0].value)
  }

  const reset = () => {
    setTitle('')
    setSelectedCategoryId(null)
    setDurationVal('')
    setDurationUnit('hour')
    setShowDurationInput(false)
    setIsCreatingCategory(false)
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="h-32 w-64 rounded-t-full rounded-b-none bg-black text-white shadow-2xl transition-all hover:scale-105 hover:bg-slate-900 active:scale-95 hover:shadow-black/50 border-t border-white/10"
        >
          <span className="text-[6rem] leading-none mb-3 font-light">+</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl border-0 bg-transparent shadow-none p-0 overflow-visible">

        <form onSubmit={handleSubmit} className="relative w-full">
            <div className="flex flex-col gap-4 bg-white/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-2xl border border-white/50">
                

                <div className="flex items-center gap-3">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="New Task..."
                        className="h-auto border-none bg-transparent px-0 text-2xl font-semibold placeholder:text-slate-300 focus-visible:ring-0 flex-1 min-w-0"
                        autoFocus
                    />
                    

                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all shrink-0",
                                    selectedCategory 
                                        ? "text-white shadow-sm pr-4" 
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                                style={{ 
                                    backgroundColor: selectedCategory?.color 
                                }}
                            >
                                <span className={cn("h-2 w-2 rounded-full", !selectedCategory && "bg-slate-400")} 
                                      style={{ backgroundColor: selectedCategory ? 'white' : undefined}} 
                                />
                                {selectedCategory ? selectedCategory.name : "Type"}
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 rounded-2xl bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-xl" align="end">
                           <div className="space-y-3">
                               <div className="flex flex-wrap gap-2">
                                  {categories.map(c => (
                                      <button
                                          key={c.id}
                                          type="button"
                                          onClick={() => {
                                              setSelectedCategoryId(c.id)
                                          }}
                                          className={cn(
                                              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
                                              selectedCategoryId === c.id 
                                                ? "border-transparent text-white shadow" 
                                                : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200"
                                          )}
                                          style={{
                                              backgroundColor: selectedCategoryId === c.id ? c.color : undefined
                                          }}
                                      >
                                          {c.name}
                                      </button>
                                  ))}
                                  <button
                                      type="button"
                                      onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center gap-1"
                                  >
                                      <Plus className="h-3 w-3"/> New
                                  </button>
                               </div>

                               {isCreatingCategory && (
                                   <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                                       <Input 
                                          value={newCatName}
                                          onChange={(e) => setNewCatName(e.target.value)}
                                          placeholder="Type name..."
                                          className="h-8 text-sm bg-white"
                                       />
                                       <div className="flex flex-wrap gap-1.5">
                                           {VIBRANT_COLORS.map(c => (
                                               <button
                                                  key={c.value}
                                                  type="button"
                                                  onClick={() => setNewCatColor(c.value)}
                                                  className={cn(
                                                      "h-5 w-5 rounded-full transition-transform ring-1 ring-offset-1 ",
                                                      newCatColor === c.value ? "scale-110 ring-slate-400" : "ring-transparent hover:scale-110"
                                                  )}
                                                  style={{ backgroundColor: c.value }}
                                                  title={c.name}
                                               />
                                           ))}
                                       </div>
                                       <Button type="button" onClick={handleCreateCategory} size="sm" className="w-full h-8 text-xs bg-black text-white hover:bg-slate-800">
                                           Create Type
                                       </Button>
                                   </div>
                               )}
                           </div>
                        </PopoverContent>
                    </Popover>
                </div>


                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                     <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowDurationInput(!showDurationInput)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                (showDurationInput || durationVal) ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <Clock className="h-4 w-4" />
                            {(durationVal) ? `${durationVal} ${durationUnit}s` : "Duration"}
                        </button>
                        
                        {showDurationInput && (
                            <div className="flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                                <Input
                                    type="number"
                                    value={durationVal}
                                    onChange={(e) => setDurationVal(e.target.value)}
                                    placeholder="0"
                                    className="w-16 h-8 text-center bg-slate-50 border-transparent focus:bg-white text-sm"
                                    autoFocus
                                />
                                <div className="flex bg-slate-100 rounded-md p-0.5">
                                    {(['min', 'hour'] as const).map(unit => (
                                        <button
                                            key={unit}
                                            type="button"
                                            onClick={() => setDurationUnit(unit)}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                                                durationUnit === unit ? "bg-white shadow text-black" : "text-slate-500 hover:text-black"
                                            )}
                                        >
                                            {unit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>

                     <Button 
                         type="submit" 
                         disabled={!title.trim() || !selectedCategoryId || !durationVal}
                         className="rounded-full bg-black text-white hover:bg-slate-800 px-6"
                     >
                         Create
                     </Button>
                </div>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
