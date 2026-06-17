import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import type { ToolDefinition } from '@/types/tool'
import { getCategoryLabel } from '@/data/tools'
import { setLastToolId } from '@/lib/last-tool'

interface ToolLayoutProps {
  tool: ToolDefinition
  children: ReactNode
}

export function ToolLayout({ tool, children }: ToolLayoutProps) {
  const Icon = tool.icon

  useEffect(() => {
    setLastToolId(tool.id)
  }, [tool.id])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          to="/"
          state={{ scrollToTool: tool.id }}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition hover:text-[var(--accent)]"
        >
          <ArrowLeft size={16} />
          返回工具列表
        </Link>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)]">
            <Icon size={24} />
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
              <span className="rounded-full bg-[var(--bg-muted)] px-2.5 py-0.5 text-xs text-[var(--text-muted)]">
                {getCategoryLabel(tool.category)}
              </span>
            </div>
            <p className="text-[var(--text-muted)]">{tool.description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[color-mix(in_srgb,var(--success)_8%,transparent)] px-3 py-2 text-sm text-[var(--success)]">
        <ShieldCheck size={16} className="shrink-0" />
        所有处理均在浏览器本地完成，数据不会上传到任何服务器
      </div>

      {children}
    </div>
  )
}
