import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { ToolDefinition } from '@/types/tool'
import { getCategoryLabel } from '@/data/tools'
import { setLastToolId, toolCardId } from '@/lib/last-tool'

interface ToolCardProps {
  tool: ToolDefinition
  highlighted?: boolean
}

/** 首页工具卡片，id 用于 scrollIntoView 定位 */
export function ToolCard({ tool, highlighted }: ToolCardProps) {
  const Icon = tool.icon

  return (
    <Link
      id={toolCardId(tool.id)}
      to={`/tool/${tool.id}`}
      onClick={() => setLastToolId(tool.id)}
      className={`group relative flex scroll-mt-28 flex-col overflow-hidden rounded-2xl border bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] hover:shadow-[var(--shadow-card-hover)] ${
        highlighted
          ? 'border-[var(--accent)] ring-2 ring-[color-mix(in_srgb,var(--accent)_25%,transparent)]'
          : 'border-[var(--border)]'
      }`}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[color-mix(in_srgb,var(--accent)_18%,transparent)] to-[color-mix(in_srgb,var(--accent)_6%,transparent)] text-[var(--accent)] ring-1 ring-[color-mix(in_srgb,var(--accent)_20%,transparent)] transition group-hover:scale-105">
          <Icon size={22} strokeWidth={2} />
        </div>
        <span className="rounded-lg bg-[var(--bg-muted)] px-2 py-1 text-[11px] font-medium text-[var(--text-muted)]">
          {getCategoryLabel(tool.category)}
        </span>
      </div>

      <h3 className="relative mb-2 text-base font-semibold tracking-tight text-[var(--text)] transition group-hover:text-[var(--accent)]">
        {tool.name}
      </h3>
      <p className="relative line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
        {tool.description}
      </p>

      <div className="relative mt-4 flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        打开工具
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
