import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

type ToolModule = { default: ComponentType<object> }

export type PreloadableLazy = LazyExoticComponent<ComponentType<object>> & {
  preload: () => Promise<ToolModule>
}

/** lazy + 悬停预加载，减少点击后的白屏等待 */
export function lazyTool(loader: () => Promise<ToolModule>): PreloadableLazy {
  const Comp = lazy(loader) as PreloadableLazy
  Comp.preload = loader
  return Comp
}

export function preloadToolComponent(component: LazyExoticComponent<ComponentType<object>>) {
  const preloadable = component as PreloadableLazy
  if (typeof preloadable.preload === 'function') {
    void preloadable.preload()
  }
}
