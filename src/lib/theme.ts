export const THEME_STORAGE_KEY = 'browser-tool-theme'

/** 无用户偏好时，是否应使用深色主题 */
export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** 读取初始主题：localStorage 优先，否则跟随系统 */
export function readInitialDark(): boolean {
  if (typeof localStorage === 'undefined') return systemPrefersDark()
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'dark') return true
  if (stored === 'light') return false
  return systemPrefersDark()
}
