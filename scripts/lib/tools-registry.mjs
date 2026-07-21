/**
 * 从 tools.ts 解析工具元数据（不 import React / lucide）
 */
import { readFile } from 'node:fs/promises'
import { TOOLS_FILE } from './site-env.mjs'

function unescapeTsString(value) {
  return value.replace(/\\'/g, "'").replace(/\\\\/g, '\\')
}

/**
 * @returns {Promise<{ id: string, name: string, description: string }[]>}
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
    const window = slice.slice(match.index, match.index + 1200)
    const nameM = window.match(/name:\s*'((?:\\'|[^'])*)'/)
    const descM = window.match(/description:\s*'((?:\\'|[^'])*)'/)
    if (!nameM || !descM) {
      throw new Error(`工具 ${id} 缺少 name 或 description`)
    }
    tools.push({
      id,
      name: unescapeTsString(nameM[1]),
      description: unescapeTsString(descM[1]),
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
