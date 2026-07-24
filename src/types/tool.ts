/**
 * 工具系统核心类型定义
 * 新增工具时需在 data/tools.ts 注册，并满足 ToolDefinition 结构
 */
import type { LucideIcon } from 'lucide-react'
import type { ComponentType, LazyExoticComponent } from 'react'

/** 工具分类，与 categories 配置一一对应 */
export type ToolCategory =
  | 'encode'
  | 'format'
  | 'generate'
  | 'crypto'
  | 'text'
  | 'datetime'
  | 'dev'
  | 'image'
  | 'game'
  | 'health'

/** 工具页 SEO 文案（预渲染 + 页面可见正文共用） */
export interface ToolSeoFaq {
  q: string
  a: string
}

export interface ToolSeo {
  /** 覆盖默认 title；缺省为「{name} — Browser Tool」 */
  title?: string
  /** meta / og description，建议 80–160 字 */
  description?: string
  /** 页面可见长介绍，承接长尾搜索意图 */
  intro?: string
  /** 功能要点列表 */
  bullets?: string[]
  /** 常见问题，可生成 FAQPage JSON-LD */
  faqs?: ToolSeoFaq[]
}

/** 解析后的完整 SEO（字段均已填好默认值） */
export interface ResolvedToolSeo {
  title: string
  description: string
  intro: string
  bullets: string[]
  faqs: ToolSeoFaq[]
}

export interface ToolDefinition {
  id: string // 路由标识，对应 /tool/:toolId
  name: string
  description: string
  category: ToolCategory
  tags: string[] // 首页搜索匹配用
  icon: LucideIcon
  component: LazyExoticComponent<ComponentType<object>> // lazy 懒加载，减小首屏体积
  /** immersive：全宽沉浸布局，适合编辑器类工具 */
  layout?: 'default' | 'immersive'
}

export interface CategoryMeta {
  id: ToolCategory
  label: string
  description: string
}
