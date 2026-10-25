'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemePreference } from '@/lib/theme'
import { useTheme } from '../../hooks/useTheme'
import { useStickyState } from '../../hooks/useStickyState'
import { HINTS_KEY } from '@/features/board/components/OnboardingHints'
import { sphereStyle } from '../TaskCircle'
import { SettingsCaption, SettingsGroup, SettingsSwitch } from '../SettingsRow'

const APPEARANCES: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'galaxy', label: 'Galaxy' },
  { value: 'system', label: 'Automatic' },
]

export function SettingsTab() {
  const [preference, setPreference] = useTheme()
  const [hintsOn, setHintsOn] = useStickyState(true, HINTS_KEY)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
      <h2 className="text-center text-xl font-semibold tracking-tight text-(--fg)">
        Settings
      </h2>

      <div>
        <SettingsCaption>Appearance</SettingsCaption>
        <div
          role="radiogroup"
          aria-label="Appearance"
          className="grid grid-cols-3 gap-3"
        >
          {APPEARANCES.map(({ value, label }) => {
            const selected = preference === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPreference(value)}
                className="group flex flex-col items-center gap-2 outline-none"
              >
                <span
                  className={cn(
                    'block aspect-[4/3] w-full overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-(--surface) transition-shadow',
                    selected
                      ? 'ring-(--ink)'
                      : 'ring-transparent group-hover:ring-(--line-strong) group-focus-visible:ring-(--line-strong)'
                  )}
                >
                  <Preview kind={value} />
                </span>
                <span
                  className={cn(
                    'text-[13px]',
                    selected ? 'font-semibold text-(--fg)' : 'text-(--fg-3)'
                  )}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mt-3 px-1 text-[12px] text-(--fg-3)">
          Automatic switches to Galaxy when your device is in dark mode.
        </p>
      </div>

      <div>
        <SettingsCaption>Help</SettingsCaption>
        <SettingsGroup>
          <SettingsSwitch
            icon={<Sparkles />}
            tint="#AF52DE"
            label="First-run hints"
            checked={hintsOn}
            onChange={setHintsOn}
          />
        </SettingsGroup>
        <p className="mt-2 px-1 text-[12px] text-(--fg-3)">
          Hand-drawn notes on an empty galaxy. They hide after your first click.
        </p>
      </div>
    </div>
  )
}

// A tiny board in each theme: a few planets on its background.
function Preview({ kind }: { kind: ThemePreference }) {
  if (kind === 'system') {
    return (
      <span className="relative block h-full w-full">
        <span className="absolute inset-0">
          <Scene kind="light" />
        </span>
        <span className="absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]">
          <Scene kind="galaxy" />
        </span>
      </span>
    )
  }
  return <Scene kind={kind} />
}

function Scene({ kind }: { kind: 'light' | 'galaxy' }) {
  const galaxy = kind === 'galaxy'
  return (
    <span
      className="relative block h-full w-full"
      style={{
        background: galaxy
          ? 'radial-gradient(ellipse 70% 60% at 20% 15%, rgb(124 92 255 / 0.45), transparent 70%), radial-gradient(1px 1px at 30% 70%, #fff, transparent), radial-gradient(1px 1px at 70% 20%, #fff, transparent), radial-gradient(1px 1px at 85% 60%, #fff, transparent), #05060f'
          : '#f2f2f7',
      }}
    >
      {[
        { left: '18%', top: '30%', size: 22, color: '#007AFF' },
        { left: '55%', top: '20%', size: 14, color: '#34C759' },
        { left: '62%', top: '52%', size: 30, color: '#AF52DE' },
      ].map((p) => (
        <span
          key={p.left}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            ...sphereStyle(p.color, p.size),
          }}
        />
      ))}
    </span>
  )
}
