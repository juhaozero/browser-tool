import type { LucideIcon } from 'lucide-react'
import type { ComponentType, LazyExoticComponent } from 'react'

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
  id: string
  name: string
  description: string
  category: ToolCategory
  tags: string[]
  icon: LucideIcon
  component: LazyExoticComponent<ComponentType<object>>
}

export interface CategoryMeta {
  id: ToolCategory
  label: string
  description: string
}
