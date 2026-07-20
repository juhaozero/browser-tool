/** 记录用户最近访问的工具，用于首页返回定位 */

import { canonicalToolId } from '@/data/tool-redirects'

const STORAGE_KEY = 'browser-tool-last-tool'

export function setLastToolId(id: string) {
  sessionStorage.setItem(STORAGE_KEY, canonicalToolId(id))
}

export function getLastToolId(): string | null {
  const id = sessionStorage.getItem(STORAGE_KEY)
  return id ? canonicalToolId(id) : null
}

/** 生成工具卡片 DOM id，与 Home 页 scrollIntoView 配合 */
export function toolCardId(toolId: string) {
  return `tool-${toolId}`
}
