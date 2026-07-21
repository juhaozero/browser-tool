/**
 * 运行时同步 document title / meta（SPA 站内跳转）
 * 构建预渲染负责首屏 HTML；此处负责客户端路由切换后的摘要一致。
 */

export const SITE_TITLE = 'Browser Tool — 浏览器工具箱'
export const SITE_DESCRIPTION =
  'Browser Tool — 纯浏览器本地运行的工具集：编解码、格式化、哈希、图片处理等，隐私优先。'

function ensureMetaByName(name: string): HTMLMetaElement {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  return el
}

function ensureMetaByProperty(property: string): HTMLMetaElement {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  return el
}

function ensureCanonical(): HTMLLinkElement {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  return el
}

function siteOrigin(): string {
  const fromEnv = (import.meta.env.VITE_SITE_ORIGIN as string | undefined)?.replace(/\/+$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return ''
}

/** 生成绝对 canonical；无 origin 时返回空 */
export function buildCanonicalPath(pathnameWithinApp: string): string {
  const origin = siteOrigin()
  if (!origin) return ''
  const base = import.meta.env.BASE_URL || '/'
  const baseNorm = base.endsWith('/') ? base : `${base}/`
  const path = pathnameWithinApp.replace(/^\/+/, '')
  return path ? `${origin}${baseNorm}${path}` : `${origin}${baseNorm === '/' ? '/' : baseNorm}`
}

export function setDocumentMeta(options: {
  title: string
  description: string
  /** 应用内路径，如 `` 或 `tool/json-formatter` */
  path?: string
}) {
  const { title, description, path = '' } = options
  document.title = title
  ensureMetaByName('description').setAttribute('content', description)
  ensureMetaByProperty('og:title').setAttribute('content', title)
  ensureMetaByProperty('og:description').setAttribute('content', description)

  const canonical = buildCanonicalPath(path)
  if (canonical) {
    ensureCanonical().setAttribute('href', canonical)
  }
}

export function setHomeDocumentMeta() {
  setDocumentMeta({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: '',
  })
}

export function setToolDocumentMeta(tool: { id: string; name: string; description: string }) {
  setDocumentMeta({
    title: `${tool.name} — Browser Tool`,
    description: tool.description,
    path: `tool/${tool.id}`,
  })
}
