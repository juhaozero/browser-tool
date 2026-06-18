import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ToolDefinition } from '@/types/tool'
import { getCategoryLabel } from '@/data/tools'
import { setLastToolId } from '@/lib/last-tool'

interface ToolLayoutProps {
  tool: ToolDefinition
  children: ReactNode
}

/** 工具页通用外壳：标题、返回链接、隐私提示条 */
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
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-muted)] shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <ArrowLeft size={16} />
          返回工具列表
        </Link>

        <div className="flex items-start gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_20%,transparent)] to-[color-mix(in_srgb,var(--accent)_6%,transparent)] text-[var(--accent)] ring-1 ring-[color-mix(in_srgb,var(--accent)_25%,transparent)] shadow-[var(--shadow-card)]">
            <Icon size={26} strokeWidth={2} />
          </div>
          <div className="min-w-0 pt-0.5">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
                {tool.name}
              </h1>
              <span className="rounded-lg bg-[var(--bg-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-muted)]">
                {getCategoryLabel(tool.category)}
              </span>
            </div>
            <p className="text-[var(--text-muted)]">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* <div className="flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--success)_25%,transparent)] bg-[color-mix(in_srgb,var(--success)_6%,transparent)] px-4 py-3 text-sm text-[var(--success)]">
        <ShieldCheck size={17} className="shrink-0" />
        所有处理均在浏览器本地完成
      </div> */}

      {children}
    </div>
  )
}
