import { Suspense } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getToolById } from '@/data/tools'
import { toolRedirects } from '@/data/tool-redirects'
import { ToolLayout } from '@/components/ToolLayout'

/**
 * 通用工具页：根据 URL 中的 toolId 动态加载对应工具组件
 * 工具组件通过 React.lazy 分包，Suspense 负责加载态
 */
export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>()

  if (toolId && toolRedirects[toolId]) {
    return <Navigate to={`/tool/${toolRedirects[toolId]}`} replace />
  }

  const tool = toolId ? getToolById(toolId) : undefined

  if (!tool) return <Navigate to="/" replace />

  const ToolComponent = tool.component

  return (
    <ToolLayout tool={tool} immersive={tool.layout === 'immersive'}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
            <Loader2 size={24} className="animate-spin" />
          </div>
        }
      >
        <ToolComponent />
      </Suspense>
    </ToolLayout>
  )
}
