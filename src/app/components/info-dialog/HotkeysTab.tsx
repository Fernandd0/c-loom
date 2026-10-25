'use client'

import { SettingsCaption, SettingsGroup, SettingsItem } from '../SettingsRow'

const SHORTCUTS: { action: string; keys: string[] }[] = [
  { action: 'New task', keys: ['N'] },
  { action: 'New task, from anywhere', keys: ['⌘', '↵'] },
  { action: 'Create the task', keys: ['↵'] },
  { action: 'Guide', keys: ['⌘', 'G'] },
  { action: 'Keyboard shortcuts', keys: ['⌘', 'K'] },
  { action: 'Close or cancel', keys: ['esc'] },
]

const GESTURES: { action: string; how: string }[] = [
  { action: 'Open a task', how: 'Click' },
  { action: 'Complete a task', how: 'Double-click' },
]

export function HotkeysTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
      <h2 className="text-center text-xl font-semibold tracking-tight text-[#1C1C1E]">
        Keyboard Shortcuts
      </h2>

      <SettingsGroup>
        {SHORTCUTS.map(({ action, keys }) => (
          <SettingsItem
            key={action}
            title={<span className="font-normal">{action}</span>}
            trailing={
              <span className="flex gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-white px-1.5 font-sans text-[12px] font-medium text-[#3C3C43] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12),0_1px_1px_rgba(0,0,0,0.08)]"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            }
          />
        ))}
      </SettingsGroup>

      <div>
        <SettingsCaption>On the board</SettingsCaption>
        <SettingsGroup>
          {GESTURES.map(({ action, how }) => (
            <SettingsItem
              key={action}
              title={<span className="font-normal">{action}</span>}
              trailing={
                <span className="text-[13px] text-[#8E8E93]">{how}</span>
              }
            />
          ))}
        </SettingsGroup>
      </div>
    </div>
  )
}
