/**
 * 工具页输入草稿 — localStorage 持久化
 * 键：browser-tool-draft:{toolId}:{field}
 */

const PREFIX = 'browser-tool-draft:'
const MAX_CHARS = 200_000

function storageKey(toolId: string, field: string) {
  return `${PREFIX}${toolId}:${field}`
}

export function loadToolDraft(toolId: string, field: string): string | null {
  try {
    return localStorage.getItem(storageKey(toolId, field))
  } catch {
    return null
  }
}

export function saveToolDraft(toolId: string, field: string, value: string) {
  try {
    if (!value) {
      localStorage.removeItem(storageKey(toolId, field))
      return
    }
    if (value.length > MAX_CHARS) return
    localStorage.setItem(storageKey(toolId, field), value)
  } catch {
    // quota / private mode
  }
}

export function clearToolDraft(toolId: string, field?: string) {
  try {
    if (field) {
      localStorage.removeItem(storageKey(toolId, field))
      return
    }
    const prefix = `${PREFIX}${toolId}:`
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
}
