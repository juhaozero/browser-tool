import toolSeoJson from '@/data/tool-seo.json'
import type { ResolvedToolSeo, ToolSeo, ToolSeoFaq } from '@/types/tool'

type ToolSeoSource = {
  id: string
  name: string
  description: string
  tags?: string[]
}

const seoMap = toolSeoJson as Record<string, ToolSeo>

function asFaqs(value: ToolSeo['faqs']): ToolSeoFaq[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ToolSeoFaq => Boolean(item?.q && item?.a))
}

/** 合并 tool-seo.json 与工具基础字段，得到可直接用于 meta / 正文的 SEO */
export function resolveToolSeo(tool: ToolSeoSource): ResolvedToolSeo {
  const custom = seoMap[tool.id] ?? {}
  const bullets =
    custom.bullets?.filter(Boolean) ??
    (tool.tags?.length
      ? tool.tags.slice(0, 4).map((tag) => `支持 ${tag}`)
      : [`在线使用「${tool.name}」`, '浏览器本地运行，隐私优先'])

  return {
    title: custom.title?.trim() || `${tool.name} — Browser Tool`,
    description: custom.description?.trim() || tool.description,
    intro: custom.intro?.trim() || tool.description,
    bullets,
    faqs: asFaqs(custom.faqs),
  }
}

export function hasCustomToolSeo(toolId: string): boolean {
  return Object.prototype.hasOwnProperty.call(seoMap, toolId)
}

export function getToolSeoMap(): Record<string, ToolSeo> {
  return seoMap
}
