import { normalizeBasePath, toRouterBasename } from './base-path'

/** 运行时配置（base 由 Vite 根据 VITE_BASE_PATH 注入为 import.meta.env.BASE_URL） */
export const appConfig = {
  basePath: normalizeBasePath(import.meta.env.BASE_URL),
  routerBasename: toRouterBasename(import.meta.env.BASE_URL),
} as const

export { DEFAULT_BASE_PATH, normalizeBasePath, toRouterBasename } from './base-path'
