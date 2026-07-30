/**
 * YAML / XML / TOML 格式化、压缩与校验
 */
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'

export type MarkupLang = 'yaml' | 'xml' | 'toml'

export function formatMarkup(lang: MarkupLang, input: string, indent = 2): string {
  const text = input.trim()
  if (!text) return ''

  switch (lang) {
    case 'yaml': {
      const value = parseYaml(text)
      return stringifyYaml(value, { indent }).trimEnd()
    }
    case 'toml': {
      const value = parseToml(text)
      return stringifyToml(value).trimEnd()
    }
    case 'xml':
      return formatXml(text, indent)
  }
}

export function minifyMarkup(lang: MarkupLang, input: string): string {
  const text = input.trim()
  if (!text) return ''

  switch (lang) {
    case 'yaml': {
      const value = parseYaml(text)
      return stringifyYaml(value, { indent: 0, lineWidth: 0 }).replace(/\n+/g, ' ').trim()
    }
    case 'toml': {
      // TOML 无标准 minify；校验后去掉空行与行尾空白
      parseToml(text)
      return text
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.trim() !== '')
        .join('\n')
    }
    case 'xml':
      return minifyXml(text)
  }
}

export function validateMarkup(lang: MarkupLang, input: string): { ok: true } | { ok: false; error: string } {
  const text = input.trim()
  if (!text) return { ok: true }
  try {
    formatMarkup(lang, text)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : '解析失败' }
  }
}

function formatXml(input: string, indentSize = 2): string {
  const doc = parseXmlDocument(input)
  const pad = ' '.repeat(Math.max(0, indentSize))
  const parts: string[] = []
  const decl = extractXmlDeclaration(input)
  if (decl) parts.push(decl)

  for (const node of Array.from(doc.childNodes)) {
    const formatted = formatXmlNode(node, 0, pad)
    if (formatted) parts.push(formatted)
  }

  return parts.join('\n')
}

function minifyXml(input: string): string {
  const doc = parseXmlDocument(input)
  const serializer = new XMLSerializer()
  let out = extractXmlDeclaration(input) ?? ''
  for (const node of Array.from(doc.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      out += serializer.serializeToString(node)
    }
  }
  return out.replace(/>\s+</g, '><').trim()
}

function extractXmlDeclaration(input: string): string | null {
  const match = input.match(/^\s*(<\?xml\b[^?]*\?>)/i)
  return match?.[1] ?? null
}

function parseXmlDocument(input: string): XMLDocument {
  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'application/xml')
  const err = doc.querySelector('parsererror')
  if (err) {
    const msg = err.textContent?.replace(/\s+/g, ' ').trim() || 'XML 解析失败'
    throw new Error(msg)
  }
  return doc
}

function formatXmlNode(node: Node, depth: number, pad: string): string {
  if (node.nodeType === Node.COMMENT_NODE) {
    return `${pad.repeat(depth)}<!--${node.nodeValue ?? ''}-->`
  }
  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    const pi = node as ProcessingInstruction
    return `${pad.repeat(depth)}<?${pi.target} ${pi.data}?>`
  }
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.nodeValue ?? '').trim()
    return text ? `${pad.repeat(depth)}${escapeXmlText(text)}` : ''
  }
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${pad.repeat(depth)}<![CDATA[${node.nodeValue ?? ''}]]>`
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as Element
  const indent = pad.repeat(depth)
  const attrs = Array.from(el.attributes)
    .map((a) => ` ${a.name}="${escapeXmlAttr(a.value)}"`)
    .join('')

  const children = Array.from(el.childNodes)
  const meaningful = children.filter((c) => {
    if (c.nodeType === Node.TEXT_NODE) return (c.nodeValue ?? '').trim() !== ''
    return c.nodeType !== Node.DOCUMENT_TYPE_NODE
  })

  if (meaningful.length === 0) {
    return `${indent}<${el.tagName}${attrs} />`
  }

  const onlyText =
    meaningful.length === 1 && meaningful[0].nodeType === Node.TEXT_NODE
  if (onlyText) {
    const text = escapeXmlText((meaningful[0].nodeValue ?? '').trim())
    return `${indent}<${el.tagName}${attrs}>${text}</${el.tagName}>`
  }

  const lines = [`${indent}<${el.tagName}${attrs}>`]
  for (const child of meaningful) {
    const formatted = formatXmlNode(child, depth + 1, pad)
    if (formatted) lines.push(formatted)
  }
  lines.push(`${indent}</${el.tagName}>`)
  return lines.join('\n')
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeXmlAttr(value: string): string {
  return escapeXmlText(value).replace(/"/g, '&quot;')
}
