import type { ToolDefinition } from '@/types/tool'

export type ToolSearchEntry = {
  tool: ToolDefinition
  /** 预拼接小写检索串，避免每次按键 toLowerCase */
  haystack: string
}

export function buildToolSearchIndex(list: ToolDefinition[]): ToolSearchEntry[] {
  return list.map((tool) => ({
    tool,
    haystack: `${tool.name}\n${tool.description}\n${tool.tags.join(' ')}\n${tool.id}`.toLowerCase(),
  }))
}

export function matchToolQuery(entry: ToolSearchEntry, query: string): boolean {
  if (!query) return true
  return entry.haystack.includes(query)
}
