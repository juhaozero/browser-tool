/** 最近使用的工具（localStorage，跨会话） */

import { canonicalToolId } from '@/data/tool-redirects'

const STORAGE_KEY = 'browser-tool-recent-tools'
const MAX_RECENT = 8

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string').map(canonicalToolId)
  } catch {
    return []
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)))
}

/** 记录一次访问，移到最前 */
export function pushRecentTool(id: string) {
  const canonical = canonicalToolId(id)
  const next = [canonical, ...readIds().filter((x) => x !== canonical)]
  writeIds(next)
}

export function getRecentToolIds(): string[] {
  return readIds()
}

export function clearRecentTools() {
  localStorage.removeItem(STORAGE_KEY)
}
