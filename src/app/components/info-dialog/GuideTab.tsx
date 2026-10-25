'use client'

import {
  AlertOctagon,
  CalendarClock,
  Circle,
  Clock,
  Flag,
  MousePointerClick,
  Sparkles,
} from 'lucide-react'
import { sphereStyle } from '../TaskCircle'
import { SettingsCaption, SettingsGroup, SettingsItem } from '../SettingsRow'

// Three stages of one task, to show growth at a glance.
const STAGES = [
  { size: 36, label: 'New' },
  { size: 56, label: 'Waiting' },
  { size: 80, label: 'Due', overdue: true },
]

export function GuideTab() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight text-(--fg)">
          How C-LOOM works
        </h2>
        <p className="mt-1 text-[14px] text-(--fg-3)">
          The longer a task waits, the bigger it gets.
        </p>
      </div>

      <div
        aria-hidden
        className="flex items-end justify-center gap-6 rounded-xl bg-(--surface-2) px-4 pt-6 pb-4"
      >
        {STAGES.map(({ size, label, overdue }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <span
              className={
                overdue
                  ? 'rounded-full ring-2 ring-[#FF3B30] ring-offset-2 ring-offset-(--surface-2)'
                  : 'rounded-full'
              }
              style={{
                width: size,
                height: size,
                ...sphereStyle('#007AFF', size),
              }}
            />
            <span className="text-[11px] font-medium text-(--fg-3)">
              {label}
            </span>
          </div>
        ))}
      </div>

      <SettingsGroup>
        <SettingsItem
          icon={<Circle />}
          tint="#007AFF"
          title="Every task is a circle"
          note="It starts small and grows every hour it waits."
        />
        <SettingsItem
          icon={<Flag />}
          tint="#FF9500"
          title="Priority sets the pace"
          note="High and Critical start bigger and grow faster."
        />
        <SettingsItem
          icon={<CalendarClock />}
          tint="#5856D6"
          title="Due dates pull it in"
          note="It fills up as the date gets close."
        />
        <SettingsItem
          icon={<MousePointerClick />}
          tint="#34C759"
          title="Double-click when it's done"
          note="Repeating tasks jump to their next date."
        />
      </SettingsGroup>

      <div>
        <SettingsCaption>Signals</SettingsCaption>
        <SettingsGroup>
          <SettingsItem
            title="Due within 3 days"
            trailing={<Signal kind="soon" />}
          />
          <SettingsItem title="Due today" trailing={<Signal kind="today" />} />
          <SettingsItem title="Overdue" trailing={<Signal kind="overdue" />} />
        </SettingsGroup>
      </div>

      <div>
        <SettingsCaption>Tip</SettingsCaption>
        <SettingsGroup>
          <SettingsItem
            icon={<Sparkles />}
            tint="#AF52DE"
            title="Type it all in the title"
            note={
              <>
                <code className="rounded bg-(--surface) px-1 py-0.5 font-mono text-[12px] text-(--fg-2)">
                  Pay rent tomorrow 9am #personal !high
                </code>{' '}
                fills in the date, category and priority.
              </>
            }
          />
        </SettingsGroup>
      </div>
    </div>
  )
}

// The same marks the circles show on the board.
function Signal({ kind }: { kind: 'soon' | 'today' | 'overdue' }) {
  return (
    <span
      className={
        kind === 'overdue'
          ? 'flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-[#FF3B30] ring-offset-2 ring-offset-(--surface-2)'
          : 'flex h-7 w-7 items-center justify-center rounded-full'
      }
      style={sphereStyle('#007AFF', 28)}
    >
      {kind === 'soon' ? (
        <Clock className="h-3.5 w-3.5 text-white" />
      ) : (
        <AlertOctagon className="h-3.5 w-3.5 text-white" />
      )}
    </span>
  )
}
