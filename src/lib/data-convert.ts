/**
 * JSON ↔ YAML / CSV / XML 互转
 */
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

export type ConvertPair =
  | 'json-yaml'
  | 'yaml-json'
  | 'json-xml'
  | 'xml-json'
  | 'json-csv'
  | 'csv-json'

export function convertData(pair: ConvertPair, input: string, indent = 2): string {
  const text = input.trim()
  if (!text) return ''

  switch (pair) {
    case 'json-yaml':
      return stringifyYaml(JSON.parse(text), { indent }).trimEnd()
    case 'yaml-json':
      return JSON.stringify(parseYaml(text), null, indent)
    case 'json-xml':
      return jsonToXml(JSON.parse(text), indent)
    case 'xml-json':
      return JSON.stringify(xmlToJson(text), null, indent)
    case 'json-csv':
      return jsonToCsv(JSON.parse(text))
    case 'csv-json':
      return JSON.stringify(csvToJson(text), null, indent)
  }
}

/** 将任意 JSON 值包成简单 XML；对象用字段名作标签，数组用 item */
export function jsonToXml(value: unknown, indent = 2, rootName = 'root'): string {
  const pad = ' '.repeat(Math.max(0, indent))
  const body = renderXmlValue(value, rootName, 0, pad)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`
}

function renderXmlValue(value: unknown, tag: string, depth: number, pad: string): string {
  const indent = pad.repeat(depth)
  const safeTag = sanitizeXmlTag(tag)

  if (value === null || value === undefined) {
    return `${indent}<${safeTag} />`
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return `${indent}<${safeTag}>${escapeXml(String(value))}</${safeTag}>`
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return `${indent}<${safeTag} />`
    const lines = [`${indent}<${safeTag}>`]
    for (const item of value) {
      lines.push(renderXmlValue(item, 'item', depth + 1, pad))
    }
    lines.push(`${indent}</${safeTag}>`)
    return lines.join('\n')
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return `${indent}<${safeTag} />`
    const lines = [`${indent}<${safeTag}>`]
    for (const [key, child] of entries) {
      lines.push(renderXmlValue(child, key, depth + 1, pad))
    }
    lines.push(`${indent}</${safeTag}>`)
    return lines.join('\n')
  }
  return `${indent}<${safeTag}>${escapeXml(String(value))}</${safeTag}>`
}

export function xmlToJson(input: string): unknown {
  const parser = new DOMParser()
  const doc = parser.parseFromString(input.trim(), 'application/xml')
  const err = doc.querySelector('parsererror')
  if (err) {
    throw new Error(err.textContent?.replace(/\s+/g, ' ').trim() || 'XML 解析失败')
  }
  const root = doc.documentElement
  if (!root) throw new Error('XML 缺少根元素')
  return { [root.tagName]: elementToJson(root) }
}

function elementToJson(el: Element): unknown {
  const attrs: Record<string, string> = {}
  for (const attr of Array.from(el.attributes)) {
    attrs[`@${attr.name}`] = attr.value
  }

  const children = Array.from(el.childNodes).filter((n) => {
    if (n.nodeType === Node.TEXT_NODE) return (n.nodeValue ?? '').trim() !== ''
    return n.nodeType === Node.ELEMENT_NODE
  })

  if (children.length === 0) {
    return Object.keys(attrs).length > 0 ? attrs : ''
  }

  const onlyText =
    children.length === 1 && children[0].nodeType === Node.TEXT_NODE
  if (onlyText) {
    const text = (children[0].nodeValue ?? '').trim()
    if (Object.keys(attrs).length === 0) return coerceScalar(text)
    return { ...attrs, '#text': coerceScalar(text) }
  }

  const result: Record<string, unknown> = { ...attrs }
  for (const child of children) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const childEl = child as Element
    const value = elementToJson(childEl)
    const key = childEl.tagName
    if (key in result) {
      const existing = result[key]
      result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
    } else {
      result[key] = value
    }
  }
  return result
}

/** 对象数组 → CSV；也支持二维数组 */
export function jsonToCsv(value: unknown): string {
  if (!Array.isArray(value)) {
    throw new Error('CSV 转换需要 JSON 数组（对象数组或二维数组）')
  }
  if (value.length === 0) return ''

  if (Array.isArray(value[0])) {
    return (value as unknown[][])
      .map((row) => row.map((cell) => csvEscape(cell)).join(','))
      .join('\n')
  }

  if (typeof value[0] !== 'object' || value[0] === null) {
    throw new Error('CSV 转换需要对象数组或二维数组')
  }

  const rows = value as Record<string, unknown>[]
  const headers: string[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        headers.push(key)
      }
    }
  }

  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','))
  }
  return lines.join('\n')
}

export function csvToJson(input: string): Record<string, string>[] {
  const rows = parseCsv(input)
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())
  if (headers.every((h) => h === '')) {
    throw new Error('CSV 表头不能为空')
  }
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {}
    headers.forEach((header, i) => {
      if (!header) return
      obj[header] = cells[i] ?? ''
    })
    return obj
  })
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    const next = input[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (ch === '\r') {
      // skip CR; LF handled separately
    } else {
      cell += ch
    }
  }

  if (inQuotes) throw new Error('CSV 引号未闭合')
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text =
    typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function sanitizeXmlTag(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_.-]/g, '_')
  if (!/^[A-Za-z_]/.test(cleaned)) return `n_${cleaned}`
  return cleaned || 'item'
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function coerceScalar(text: string): string | number | boolean {
  if (text === 'true') return true
  if (text === 'false') return false
  if (text !== '' && !Number.isNaN(Number(text)) && /^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text)
  }
  return text
}
