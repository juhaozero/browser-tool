import { useEffect } from 'react'

function isModK(e: KeyboardEvent) {
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
}

/** 注册全局 ⌘K / Ctrl+K 快捷键 */
export function useCommandPaletteHotkey(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isModK(e)) return
      e.preventDefault()
      onOpen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onOpen])
}
