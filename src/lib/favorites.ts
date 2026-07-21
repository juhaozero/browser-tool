/** 收藏工具（localStorage） */

import { canonicalToolId } from '@/data/tool-redirects'

const STORAGE_KEY = 'browser-tool-favorites'

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]))
}

export function getFavoriteToolIds(): string[] {
  return readIds()
}

export function isFavoriteTool(id: string): boolean {
  const canonical = canonicalToolId(id)
  return readIds().includes(canonical)
}

export function toggleFavoriteTool(id: string): boolean {
  const canonical = canonicalToolId(id)
  const ids = readIds()
  const exists = ids.includes(canonical)
  writeIds(exists ? ids.filter((x) => x !== canonical) : [canonical, ...ids])
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('browser-tool-favorites-changed'))
  }
  return !exists
}

export function setFavoriteTool(id: string, favorite: boolean) {
  const canonical = canonicalToolId(id)
  const ids = readIds().filter((x) => x !== canonical)
  writeIds(favorite ? [canonical, ...ids] : ids)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('browser-tool-favorites-changed'))
  }
}
