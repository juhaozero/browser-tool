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
])

const UNSAFE_ATTR_PREFIXES = ['on']
const UNSAFE_ATTR_VALUES = ['javascript:', 'vbscript:', 'data:text/html']

function isUnsafeAttribute(name: string, value: string): boolean {
  const lowerName = name.toLowerCase()
  const lowerValue = value.trim().toLowerCase()
  if (UNSAFE_ATTR_PREFIXES.some((p) => lowerName.startsWith(p))) return true
  if (lowerName === 'href' || lowerName === 'src' || lowerName === 'xlink:href') {
    return UNSAFE_ATTR_VALUES.some((v) => lowerValue.startsWith(v))
  }
  return lowerValue.startsWith('javascript:') || lowerValue.startsWith('data:text/html')
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
