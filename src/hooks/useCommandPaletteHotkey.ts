import { useEffect } from 'react'
import { isModK } from '@/lib/platform'

/** 全局 ⌘K / Ctrl+K 快捷键 */
export function useModKHotkey(onTrigger: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (!isModK(e)) return
      e.preventDefault()
      onTrigger()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTrigger, enabled])
}

/** 打开命令面板的 ⌘K / Ctrl+K 快捷键 */
export function useCommandPaletteHotkey(onOpen: () => void, enabled = true) {
  useModKHotkey(onOpen, enabled)
}
