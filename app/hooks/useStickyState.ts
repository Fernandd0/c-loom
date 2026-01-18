'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

export function useStickyState<T>(defaultValue: T, key: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          callback()
        }
      }

      const onCustomUpdate = (event: CustomEvent) => {
        if (event.detail.key === key) {
          callback()
        }
      }

      window.addEventListener('storage', onStorage)
      window.addEventListener(
        'loom-storage-update',
        onCustomUpdate as EventListener
      )

      return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener(
          'loom-storage-update',
          onCustomUpdate as EventListener
        )
      }
    },
    [key]
  )

  const getSnapshot = () => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(key)
  }

  const getServerSnapshot = () => null

  const stickyValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const value = useMemo(() => {
    if (stickyValue === null) return defaultValue
    try {
      return JSON.parse(stickyValue) as T
    } catch (e) {
      console.error('Error parsing stored value', e)
      return defaultValue
    }
  }, [stickyValue, defaultValue])

  const setValue = useCallback(
    (newValue: T | ((val: T) => T)) => {
      const valueToStore =
        newValue instanceof Function ? (newValue as any)(value) : newValue

      try {
        const stringified = JSON.stringify(valueToStore)
        window.localStorage.setItem(key, stringified)

        window.dispatchEvent(
          new CustomEvent('loom-storage-update', { detail: { key } })
        )
      } catch (e) {
        console.error('Error saving value', e)
      }
    },
    [key, value]
  )

  return [value, setValue, isLoaded] as const
}
