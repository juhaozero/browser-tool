import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import type { ToolDefinition } from '@/types/tool'
import { getCategoryLabel } from '@/data/tools'
import { setLastToolId } from '@/lib/last-tool'
import { isFavoriteTool } from '@/lib/favorites'
import { FavoriteButton } from '@/components/FavoriteButton'
import { RelatedTools } from '@/components/RelatedTools'

interface ToolLayoutProps {
  tool: ToolDefinition
  children: ReactNode
  immersive?: boolean
}

function ToolChrome({
  tool,
  children,
  immersive,
}: {
  tool: ToolDefinition
  children: ReactNode
  immersive: boolean
}) {
  const Icon = tool.icon
  const [favorite, setFavorite] = useState(() => isFavoriteTool(tool.id))

  useEffect(() => {
    setLastToolId(tool.id)
  }, [tool.id])

  const crumb = (
    <div className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-muted)]">
      <Link
        to="/"
        state={{ scrollToTool: tool.id }}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft size={14} />
        工具
      </Link>
      <ChevronRight size={14} className="opacity-50" />
      <Link
        to={`/?category=${tool.category}`}
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
      >
        <span className={`cat-dot cat-${tool.category}`} />
        {getCategoryLabel(tool.category)}
      </Link>
      <ChevronRight size={14} className="opacity-50" />
      <span className="inline-flex min-w-0 items-center gap-1.5 px-1.5 py-1 font-medium text-[var(--text)]">
        <Icon size={15} className="shrink-0 text-[var(--accent)]" />
        <span className="truncate">{tool.name}</span>
      </span>
      <FavoriteButton toolId={tool.id} favorite={favorite} onChange={setFavorite} className="ml-auto" />
    </div>
  )

  if (immersive) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] w-full flex-col">
        <div className="mb-3 shrink-0">{crumb}</div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        <div className="mt-4 shrink-0">
          <RelatedTools toolId={tool.id} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="space-y-2 border-b border-[var(--border)] pb-4">
        {crumb}
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">{tool.description}</p>
      </header>

      {children}

      <RelatedTools toolId={tool.id} />
    </div>
  )
}

/** 工具页通用外壳：面包屑、收藏、相关推荐 */
export function ToolLayout({ tool, children, immersive = false }: ToolLayoutProps) {
  return (
    <ToolChrome key={tool.id} tool={tool} immersive={immersive}>
      {children}
    </ToolChrome>
  )
}
