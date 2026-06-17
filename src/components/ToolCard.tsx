import { Link } from 'react-router-dom'
import type { ToolDefinition } from '@/types/tool'
import { getCategoryLabel } from '@/data/tools'
import { setLastToolId, toolCardId } from '@/lib/last-tool'

interface ToolCardProps {
  tool: ToolDefinition
  highlighted?: boolean
}

export function ToolCard({ tool, highlighted }: ToolCardProps) {
  const Icon = tool.icon

  return (
    <Link
      id={toolCardId(tool.id)}
      to={`/tool/${tool.id}`}
      onClick={() => setLastToolId(tool.id)}
      className={`group flex scroll-mt-24 flex-col rounded-xl border bg-[var(--bg-elevated)] p-4 transition hover:border-[var(--accent)] hover:shadow-[0_8px_30px_color-mix(in_srgb,var(--accent)_12%,transparent)] ${
        highlighted
          ? 'border-[var(--accent)] ring-2 ring-[color-mix(in_srgb,var(--accent)_30%,transparent)]'
          : 'border-[var(--border)]'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] transition group-hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]">
          <Icon size={20} />
        </div>
        <span className="rounded-full bg-[var(--bg-muted)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
          {getCategoryLabel(tool.category)}
        </span>
      </div>
      <h3 className="mb-1 font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
        {tool.name}
      </h3>
      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
        {tool.description}
      </p>
    </Link>
  )
}
