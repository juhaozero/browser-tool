/**
 * 运行时同步 document title / meta（SPA 站内跳转）
 * 构建预渲染负责首屏 HTML；此处负责客户端路由切换后的摘要一致。
 */
import { resolveToolSeo } from '@/lib/resolve-tool-seo'
import { getCategoryLabel } from '@/data/tools'

export const SITE_TITLE = 'Browser Tool — 浏览器工具箱'
export const SITE_DESCRIPTION =
  'Browser Tool — 纯浏览器本地运行的工具集：编解码、格式化、哈希、图片处理等，隐私优先。'

const OG_WIDTH = '1200'
const OG_HEIGHT = '630'

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

/** OG 图绝对地址；优先 PNG，开发环境可能尚未生成时仍指向构建产物路径 */
export function buildOgImageUrl(kind: 'home' | { toolId: string }): string {
  const origin = siteOrigin()
  if (!origin) return ''
  const base = import.meta.env.BASE_URL || '/'
  const baseNorm = base.endsWith('/') ? base : `${base}/`
  const file = kind === 'home' ? 'og/home.png' : `og/tool-${kind.toolId}.png`
  return `${origin}${baseNorm}${file}`
}

function setSocialMeta(options: {
  title: string
  description: string
  canonical: string
  imageUrl: string
  imageAlt: string
}) {
  const { title, description, canonical, imageUrl, imageAlt } = options

  ensureMetaByProperty('og:type').setAttribute('content', 'website')
  ensureMetaByProperty('og:site_name').setAttribute('content', 'Browser Tool')
  ensureMetaByProperty('og:locale').setAttribute('content', 'zh_CN')
  ensureMetaByProperty('og:title').setAttribute('content', title)
  ensureMetaByProperty('og:description').setAttribute('content', description)
  if (canonical) ensureMetaByProperty('og:url').setAttribute('content', canonical)

  if (imageUrl) {
    ensureMetaByProperty('og:image').setAttribute('content', imageUrl)
    ensureMetaByProperty('og:image:width').setAttribute('content', OG_WIDTH)
    ensureMetaByProperty('og:image:height').setAttribute('content', OG_HEIGHT)
    ensureMetaByProperty('og:image:alt').setAttribute('content', imageAlt)
    ensureMetaByProperty('og:image:type').setAttribute('content', 'image/png')
  }

  ensureMetaByName('twitter:card').setAttribute('content', 'summary_large_image')
  ensureMetaByName('twitter:title').setAttribute('content', title)
  ensureMetaByName('twitter:description').setAttribute('content', description)
  if (imageUrl) {
    ensureMetaByName('twitter:image').setAttribute('content', imageUrl)
    ensureMetaByName('twitter:image:alt').setAttribute('content', imageAlt)
  }
}

export function setDocumentMeta(options: {
  title: string
  description: string
  /** 应用内路径，如 `` 或 `tool/json-formatter` */
  path?: string
  imageUrl?: string
  imageAlt?: string
}) {
  const { title, description, path = '', imageUrl = '', imageAlt = title } = options
  document.title = title
  ensureMetaByName('description').setAttribute('content', description)

  const canonical = buildCanonicalPath(path)
  if (canonical) {
    ensureCanonical().setAttribute('href', canonical)
  }

  setSocialMeta({
    title,
    description,
    canonical,
    imageUrl,
    imageAlt,
  })
}

export function setHomeDocumentMeta() {
  setDocumentMeta({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: '',
    imageUrl: buildOgImageUrl('home'),
    imageAlt: 'Browser Tool 浏览器工具箱',
  })
}

export function setToolDocumentMeta(tool: {
  id: string
  name: string
  description: string
  category?: string
  tags?: string[]
}) {
  const seo = resolveToolSeo(tool)
  const categoryLabel = tool.category ? getCategoryLabel(tool.category as never) : ''
  setDocumentMeta({
    title: seo.title,
    description: seo.description,
    path: `tool/${tool.id}`,
    imageUrl: buildOgImageUrl({ toolId: tool.id }),
    imageAlt: categoryLabel ? `${tool.name} · ${categoryLabel}` : `${tool.name} — Browser Tool`,
  })
}
