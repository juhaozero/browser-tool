/**
 * 部署路径工具（构建时与运行时共用，不依赖 import.meta）
 */

/** 默认部署路径，可被 .env 中 VITE_BASE_PATH 覆盖 */
export const DEFAULT_BASE_PATH = '/'

/** 规范为 Vite base 格式：以 / 开头、以 / 结尾（根路径为 `/`） */
export function normalizeBasePath(base: string): string {
  if (!base || base === '/') return '/'
  const withLeading = base.startsWith('/') ? base : `/${base}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

/** React Router basename：子路径 `/app`，根路径不设置 */
export function toRouterBasename(basePath: string): string | undefined {
  const normalized = normalizeBasePath(basePath)
  if (normalized === '/') return undefined
  return normalized.slice(0, -1)
}
