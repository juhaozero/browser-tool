/** 记录用户最近访问的工具，用于首页返回定位 */

import { canonicalToolId } from '@/data/tool-redirects'
import { pushRecentTool } from '@/lib/recent-tools'

const STORAGE_KEY = 'browser-tool-last-tool'

function scheduleWrite(fn: () => void) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(fn)
    return
  }
  setTimeout(fn, 0)
}

export function setLastToolId(id: string) {
  const canonical = canonicalToolId(id)
  // 延迟写 storage，避免点击导航时同步阻塞主线程
  scheduleWrite(() => {
    sessionStorage.setItem(STORAGE_KEY, canonical)
    pushRecentTool(canonical)
  })
}

export function getLastToolId(): string | null {
  const id = sessionStorage.getItem(STORAGE_KEY)
  return id ? canonicalToolId(id) : null
}

/** 生成工具卡片 DOM id，与 Home 页 scrollIntoView 配合 */
export function toolCardId(toolId: string) {
  return `tool-${toolId}`
}
