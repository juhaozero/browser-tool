/**
 * 从 tools.ts / tool-seo.json / related-tools.ts 解析构建期元数据
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ROOT, TOOLS_FILE } from './site-env.mjs'

export const TOOL_SEO_FILE = path.join(ROOT, 'src', 'data', 'tool-seo.json')
export const RELATED_TOOLS_FILE = path.join(ROOT, 'src', 'data', 'related-tools.ts')

function unescapeTsString(value) {
  return value.replace(/\\'/g, "'").replace(/\\\\/g, '\\')
}

function parseStringArray(raw) {
  if (!raw) return []
  const items = []
  const re = /'((?:\\'|[^'])*)'/g
  let m
  while ((m = re.exec(raw)) !== null) {
    items.push(unescapeTsString(m[1]))
  }
  return items
}

/**
 * @returns {Promise<{ id: string, name: string, description: string, category: string, tags: string[] }[]>}
 */
export async function extractTools(filePath = TOOLS_FILE) {
  const source = await readFile(filePath, 'utf8')
  const marker = 'export const tools'
  const start = source.indexOf(marker)
  if (start === -1) {
    throw new Error(`未在 ${filePath} 中找到 "export const tools"`)
  }

  const slice = source.slice(start)
  const tools = []
  const idRe = /^\s+id:\s*'([^']+)'/gm
  let match
  while ((match = idRe.exec(slice)) !== null) {
    const id = match[1]
    const window = slice.slice(match.index, match.index + 1600)
    const nameM = window.match(/name:\s*'((?:\\'|[^'])*)'/)
    const descM = window.match(/description:\s*'((?:\\'|[^'])*)'/)
    const catM = window.match(/category:\s*'([^']+)'/)
    const tagsM = window.match(/tags:\s*\[([^\]]*)\]/)
    if (!nameM || !descM) {
      throw new Error(`工具 ${id} 缺少 name 或 description`)
    }
    tools.push({
      id,
      name: unescapeTsString(nameM[1]),
      description: unescapeTsString(descM[1]),
      category: catM?.[1] ?? '',
      tags: parseStringArray(tagsM?.[1] ?? ''),
    })
  }

  if (tools.length === 0) {
    throw new Error('未能从 tools 数组解析出任何工具')
  }

  return tools
}

export async function extractToolIds(filePath = TOOLS_FILE) {
  const tools = await extractTools(filePath)
  return tools.map((t) => t.id)
}

/**
 * 解析 categories 元数据
 * @returns {Promise<{ id: string, label: string, description: string }[]>}
 */
export async function extractCategories(filePath = TOOLS_FILE) {
  const source = await readFile(filePath, 'utf8')
  const marker = 'export const categories'
  const start = source.indexOf(marker)
  if (start === -1) return []

  const end = source.indexOf('export const tools', start)
  const slice = source.slice(start, end === -1 ? undefined : end)
  const categories = []
  const blockRe =
    /\{\s*id:\s*'([^']+)'\s*,\s*label:\s*'((?:\\'|[^'])*)'\s*,\s*description:\s*'((?:\\'|[^'])*)'\s*\}/g
  let m
  while ((m = blockRe.exec(slice)) !== null) {
    categories.push({
      id: m[1],
      label: unescapeTsString(m[2]),
      description: unescapeTsString(m[3]),
    })
  }
  return categories
}

export function categoryLabelOf(categories, categoryId) {
  return categories.find((c) => c.id === categoryId)?.label ?? categoryId
}

export async function loadToolSeoMap(filePath = TOOL_SEO_FILE) {
  try {
    const raw = await readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

/** 解析 relatedToolMap：id → string[] */
export async function loadRelatedToolMap(filePath = RELATED_TOOLS_FILE) {
  try {
    const source = await readFile(filePath, 'utf8')
    const map = {}
    const entryRe = /^\s+(?:'([^']+)'|([A-Za-z0-9_-]+)):\s*\[([^\]]*)\]/gm
    let m
    while ((m = entryRe.exec(source)) !== null) {
      const id = m[1] || m[2]
      map[id] = parseStringArray(m[3])
    }
    return map
  } catch {
    return {}
  }
}

export function resolveToolSeo(tool, seoMap = {}) {
  const custom = seoMap[tool.id] ?? {}
  const bullets =
    Array.isArray(custom.bullets) && custom.bullets.length > 0
      ? custom.bullets.filter(Boolean)
      : tool.tags?.length
        ? tool.tags.slice(0, 4).map((tag) => `支持 ${tag}`)
        : [`在线使用「${tool.name}」`, '浏览器本地运行，隐私优先']

  const faqs = Array.isArray(custom.faqs)
    ? custom.faqs.filter((item) => item && item.q && item.a)
    : []

  return {
    title: (custom.title && String(custom.title).trim()) || `${tool.name} — Browser Tool`,
    description: (custom.description && String(custom.description).trim()) || tool.description,
    intro: (custom.intro && String(custom.intro).trim()) || tool.description,
    bullets,
    faqs,
  }
}

export function relatedIdsFor(toolId, relatedMap, allTools, limit = 4) {
  const mapped = relatedMap[toolId] ?? []
  if (mapped.length > 0) return mapped.slice(0, limit)

  const current = allTools.find((t) => t.id === toolId)
  if (!current?.category) return []
  return allTools
    .filter((t) => t.id !== toolId && t.category === current.category)
    .slice(0, limit)
    .map((t) => t.id)
}
