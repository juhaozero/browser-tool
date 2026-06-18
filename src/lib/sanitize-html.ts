/** Markdown / HTML 预览消毒，移除危险标签与属性 */

const BLOCKED_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'style',
  'meta',
  'link',
  'base',
  'svg',
  'math',
  'video',
  'audio',
  'frame',
  'frameset',
])

const UNSAFE_ATTR_PREFIXES = ['on']
const URL_ATTRS = new Set(['href', 'src', 'xlink:href', 'srcset', 'poster', 'background', 'formaction'])
/** style 内嵌 CSS 注入特征 */
const UNSAFE_STYLE_RE =
  /javascript:|vbscript:|data:|expression\s*\(|@import|behavior\s*:|-moz-binding/i

function isUnsafeUrl(value: string): boolean {
  const lower = value.trim().toLowerCase()
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) return true
  // 预览场景禁止 data: / blob: URI
  if (lower.startsWith('data:') || lower.startsWith('blob:')) return true
  return false
}

function isUnsafeStyle(value: string): boolean {
  return UNSAFE_STYLE_RE.test(value)
}

function isUnsafeAttribute(name: string, value: string): boolean {
  const lowerName = name.toLowerCase()
  if (UNSAFE_ATTR_PREFIXES.some((p) => lowerName.startsWith(p))) return true
  if (lowerName === 'style') return isUnsafeStyle(value)

  if (lowerName === 'srcset') {
    return value.split(',').some((part) => {
      const url = part.trim().split(/\s+/)[0]
      return url ? isUnsafeUrl(url) : false
    })
  }

  if (URL_ATTRS.has(lowerName)) return isUnsafeUrl(value)

  return isUnsafeUrl(value)
}

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('*').forEach((el) => {
    if (BLOCKED_TAGS.has(el.tagName.toLowerCase())) {
      el.remove()
      return
    }
    for (const attr of [...el.attributes]) {
      if (isUnsafeAttribute(attr.name, attr.value)) {
        el.removeAttribute(attr.name)
      }
    }
  })
  return doc.body.innerHTML
}
