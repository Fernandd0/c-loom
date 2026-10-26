'use client'

import * as React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { GlassCard } from './GlassCard'
import { shouldIgnorePlainKey } from '@/lib/keyboard'
import { GuideTab } from './info-dialog/GuideTab'
import { HotkeysTab } from './info-dialog/HotkeysTab'
import { ContactTab } from './info-dialog/ContactTab'
import { SettingsTab } from './info-dialog/SettingsTab'

export type InfoTab = 'settings' | 'guide' | 'hotkeys' | 'contact'

const HOTKEYS: Record<string, InfoTab> = {
  ',': 'settings',
  g: 'guide',
}

// ⌘, opens settings and ⌘G the guide from anywhere; "?" the shortcuts, unless typing.
export function useInfoHotkeys(open: (tab: InfoTab) => void) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (shouldIgnorePlainKey(e, 'data-sidebar')) return
        e.preventDefault()
        open('hotkeys')
        return
      }
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
          {tab === 'settings' && <SettingsTab />}
          {tab === 'guide' && <GuideTab />}
          {tab === 'hotkeys' && <HotkeysTab />}
          {tab === 'contact' && <ContactTab />}
        </GlassCard>
      </DialogContent>
    </Dialog>
  )
}
