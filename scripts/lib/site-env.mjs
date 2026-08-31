/**
 * 构建脚本共用：读取 .env / 规范站点路径
 */
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(__dirname, '../..')
export const TOOLS_FILE = path.join(ROOT, 'src', 'data', 'tools.ts')
export const ENV_FILE = path.join(ROOT, '.env')
/** Vite build.outDir，与 build-out-dir.json 保持一致 */
export const BUILD_OUT_DIR = JSON.parse(
  readFileSync(path.join(ROOT, 'build-out-dir.json'), 'utf8'),
).outDir
/** @deprecated 使用 BUILD_OUT_DIR；保留别名供既有脚本引用 */
export const BUILD_OUTPUT_DIR = path.join(ROOT, BUILD_OUT_DIR)
export const DIST_DIR = BUILD_OUTPUT_DIR
export const PUBLIC_DIR = path.join(ROOT, 'public')

export const DEFAULT_SITE_ORIGIN = 'https://app.juhaozero.com'
export const DEFAULT_BASE_PATH = '/'

export const SITE_TITLE = 'Browser Tool — 浏览器工具箱'
export const SITE_DESCRIPTION = 'Browser Tool — 纯浏览器本地运行的工具集：编解码、格式化、哈希、图片处理等，隐私优先。'

/** 简易解析 .env（KEY=VALUE），忽略注释与空行 */
export async function loadEnvFile(filePath = ENV_FILE) {
  const env = {}
  try {
    const raw = await readFile(filePath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  } catch {
    // .env 不存在时使用默认值
  }
  return env
}

export function normalizeBasePath(base) {
  if (!base || base === '/') return '/'
  const withLeading = base.startsWith('/') ? base : `/${base}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

export function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, '')
}

export async function resolveSiteConfig() {
  const fileEnv = await loadEnvFile()
  const origin = normalizeOrigin(
    process.env.VITE_SITE_ORIGIN || fileEnv.VITE_SITE_ORIGIN || DEFAULT_SITE_ORIGIN,
  )
  const basePath = normalizeBasePath(
    process.env.VITE_BASE_PATH || fileEnv.VITE_BASE_PATH || DEFAULT_BASE_PATH,
  )
  return { origin, basePath }
}

export function joinUrl(origin, basePath, pathname = '') {
  const base = basePath === '/' ? '/' : basePath
  const cleanPath = pathname.replace(/^\/+/, '')
  if (!cleanPath) {
    return `${origin}${base === '/' ? '/' : base}`
  }
  return `${origin}${base}${cleanPath}`
}

export function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
