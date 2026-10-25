'use client'

import { useEffect } from 'react'
import {
  DEFAULT_THEME,
  resolveTheme,
  THEME_KEY,
  ThemePreference,
} from '@/lib/theme'
import { useStickyState } from './useStickyState'

// The stored appearance, kept in sync with <html data-theme> and with the system setting.
export function useTheme() {
  const [preference, setPreference] = useStickyState<ThemePreference>(
    DEFAULT_THEME,
    THEME_KEY
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.dataset.theme = resolveTheme(
        preference,
        media.matches
      )
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  return [preference, setPreference] as const
}

// Mounted once in the root layout so every page follows the setting.
export function ThemeSync() {
  useTheme()
  return null
}
