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
