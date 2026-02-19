'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { GlassCard } from './GlassCard'
import { GuideTab } from './info-dialog/GuideTab'
import { HotkeysTab } from './info-dialog/HotkeysTab'
import { ContactTab } from './info-dialog/ContactTab'

interface InfoDialogProps {
  defaultTab: 'guide' | 'hotkeys' | 'contact'
  triggerLabel: string
  triggerIcon?: React.ReactNode
  hotkey?: string
}

export function InfoDialog({
  defaultTab,
  triggerLabel,
  triggerIcon,
  hotkey,
}: InfoDialogProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!hotkey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key.toLowerCase() === hotkey.toLowerCase()) {
        e.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkey])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[15px] font-medium text-[#3C3C43] transition-all hover:bg-[#F2F2F7]">
          {triggerIcon}
          <span>{triggerLabel}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <GlassCard className="p-6">
          <div className="min-h-[300px]">
            {defaultTab === 'guide' && <GuideTab />}
            {defaultTab === 'hotkeys' && <HotkeysTab />}
            {defaultTab === 'contact' && <ContactTab />}
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
