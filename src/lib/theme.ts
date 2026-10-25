// Appearance: light, dark (clean, solid), galaxy (dark, deep space) or automatic,
// which follows the system between light and dark.
// The choice is stored per device; the resolved theme lives on <html data-theme>.

export type ThemePreference = 'light' | 'dark' | 'galaxy' | 'system'
export type Theme = 'light' | 'dark' | 'galaxy'

export const THEME_KEY = 'c-loom-theme'
export const DEFAULT_THEME: ThemePreference = 'system'

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): Theme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

// Inlined in <head> so the first paint already has the right theme (no light flash in
// the dark themes). Mirrors resolveTheme; the stored value is JSON, as useStickyState writes it.
export const THEME_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('${THEME_KEY}')||'"${DEFAULT_THEME}"');var d=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=p==='system'?(d?'dark':'light'):p}catch(e){document.documentElement.dataset.theme='light'}})()`
