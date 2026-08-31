/** 是否为 Apple 平台（Mac / iOS） */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
}

/** ⌘K / Ctrl+K 展示文案 */
export function modKShortcutLabel(): string {
  return isApplePlatform() ? '⌘K' : 'Ctrl+K'
}

export function isModK(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
}
