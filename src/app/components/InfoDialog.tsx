'use client'

import * as React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { GlassCard } from './GlassCard'
import { GuideTab } from './info-dialog/GuideTab'
import { HotkeysTab } from './info-dialog/HotkeysTab'
import { ContactTab } from './info-dialog/ContactTab'

export type InfoTab = 'guide' | 'hotkeys' | 'contact'

const HOTKEYS: Record<string, InfoTab> = { g: 'guide', k: 'hotkeys' }

// ⌘G opens the guide and ⌘K the shortcuts from anywhere, not only while the sidebar is open.
export function useInfoHotkeys(open: (tab: InfoTab) => void) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tab = e.metaKey ? HOTKEYS[e.key.toLowerCase()] : undefined
      if (!tab) return
      e.preventDefault()
      open(tab)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])
}

export function InfoDialog({
  tab,
  onClose,
}: {
  tab: InfoTab | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!tab} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <GlassCard className="max-h-[85vh] overflow-y-auto p-6">
          {tab === 'guide' && <GuideTab />}
          {tab === 'hotkeys' && <HotkeysTab />}
          {tab === 'contact' && <ContactTab />}
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
