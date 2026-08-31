import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ToolDefinition } from '@/types/tool'
import { toolCardId } from '@/lib/last-tool'
import { FavoriteButton } from '@/components/FavoriteButton'
import { isFavoriteTool } from '@/lib/favorites'
import { preloadToolComponent } from '@/lib/lazy-tool'

interface ToolCardProps {
  tool: ToolDefinition
  highlighted?: boolean
  compact?: boolean
}

/** 首页工具卡片 — 极简深色风格 */
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
      className={`tool-card group relative flex scroll-mt-28 flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm transition-all duration-200 ease-out hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:bg-[var(--bg-muted)] dark:hover:bg-slate-800 ${
        compact ? 'p-3.5' : 'p-4'
      } ${highlighted ? 'tool-card-highlight' : ''}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={`flex items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)] transition-colors duration-200 ease-out group-hover:text-[var(--accent-hover)] ${
            compact ? 'h-8 w-8' : 'h-9 w-9'
          }`}
        >
          <Icon size={compact ? 18 : 20} strokeWidth={1.75} />
        </div>
        <FavoriteButton
          toolId={tool.id}
          favorite={favorite}
          onChange={setFavorite}
          className={`transition-opacity duration-200 ${
            favorite
              ? 'opacity-100'
              : 'opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100'
          }`}
        />
      </div>

      <h3 className="mb-1 text-sm font-semibold tracking-tight text-[var(--text)] transition-colors duration-200 ease-out group-hover:text-[var(--accent)]">
        {tool.name}
      </h3>
      <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-[var(--text-muted)]">
        {tool.description}
      </p>
    </Link>
  )
})
