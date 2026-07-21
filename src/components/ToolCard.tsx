import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { ToolDefinition } from '@/types/tool'
import { getCategoryLabel } from '@/data/tools'
import { toolCardId } from '@/lib/last-tool'
import { FavoriteButton } from '@/components/FavoriteButton'
import { isFavoriteTool } from '@/lib/favorites'
import { preloadToolComponent } from '@/lib/lazy-tool'

interface ToolCardProps {
  tool: ToolDefinition
  highlighted?: boolean
  compact?: boolean
}

/** 首页工具卡片 */
export const ToolCard = memo(function ToolCard({
  tool,
  highlighted,
  compact = false,
}: ToolCardProps) {
  const Icon = tool.icon
  const [favorite, setFavorite] = useState(() => isFavoriteTool(tool.id))

  return (
    <Link
      id={toolCardId(tool.id)}
      to={`/tool/${tool.id}`}
      onPointerEnter={() => preloadToolComponent(tool.component)}
      className={`tool-card group relative flex scroll-mt-28 flex-col rounded-xl border bg-[var(--bg-elevated)] transition duration-150 hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] ${
        compact ? 'p-3.5' : 'p-4'
      } ${highlighted ? 'tool-card-highlight' : 'border-[var(--border)]'}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={`flex items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--accent)] transition group-hover:text-[var(--accent-hover)] ${
            compact ? 'h-9 w-9' : 'h-10 w-10'
          }`}
        >
          <Icon size={compact ? 18 : 20} strokeWidth={2} />
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton toolId={tool.id} favorite={favorite} onChange={setFavorite} />
          <span className={`cat-dot cat-${tool.category}`} title={getCategoryLabel(tool.category)} />
        </div>
      </div>

      <h3 className="mb-1 text-[15px] font-semibold tracking-tight text-[var(--text)] transition group-hover:text-[var(--accent)]">
        {tool.name}
      </h3>
      <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
        {tool.description}
      </p>

      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[var(--accent)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        打开
        <ArrowUpRight size={13} />
      </div>
    </Link>
  )
})
