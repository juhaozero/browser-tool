import { Suspense } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { getToolById } from '@/data/tools'
import { ToolLayout } from '@/components/ToolLayout'

export default function ToolPage() {
  const { toolId } = useParams<{ toolId: string }>()
  const tool = toolId ? getToolById(toolId) : undefined

  if (!tool) return <Navigate to="/" replace />

  const ToolComponent = tool.component

  return (
    <ToolLayout tool={tool}>
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
