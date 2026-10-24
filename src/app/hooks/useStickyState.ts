'use client'

import { useCallback, useMemo, useSyncExternalStore } from 'react'

const UPDATE_EVENT = 'c-loom-storage-update'

const noopSubscribe = () => () => {}

// true in the browser after hydration, false during SSR and the hydration pass.
export function useIsHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

function readRaw(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch (e) {
    console.error('Error parsing stored value', e)
    return fallback
  }
}

// localStorage-backed state, synced across hooks and tabs. Pass a stable defaultValue (module constant).
export function useStickyState<T>(defaultValue: T, key: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) callback()
      }
      const onCustomUpdate = (event: Event) => {
        if ((event as CustomEvent<{ key: string }>).detail.key === key)
          callback()
      }

      window.addEventListener('storage', onStorage)
      window.addEventListener(UPDATE_EVENT, onCustomUpdate)
      return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener(UPDATE_EVENT, onCustomUpdate)
      }
    },
    [key]
  )

  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null
  )
  const isLoaded = useIsHydrated()

  const value = useMemo(() => parse(raw, defaultValue), [raw, defaultValue])

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      // Read the latest stored value so back-to-back updates don't overwrite each other.
      const next =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(parse(readRaw(key), defaultValue))
          : newValue

      try {
        window.localStorage.setItem(key, JSON.stringify(next))
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: { key } }))
      } catch (e) {
        console.error('Error saving value', e)
      }
    },
    [key, defaultValue]
  )

  return [value, setValue, isLoaded] as const
}
