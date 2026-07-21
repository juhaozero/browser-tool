import { Link } from 'react-router-dom'
import { getToolById, getCategoryLabel } from '@/data/tools'
import { getRelatedToolIds } from '@/data/related-tools'

/** 工具页底部相关推荐 */
export function RelatedTools({ toolId }: { toolId: string }) {
  const ids = getRelatedToolIds(toolId)
  const related = ids.map((id) => getToolById(id)).filter(Boolean)

  if (related.length === 0) return null

  return (
    <section className="space-y-2.5 border-t border-[var(--border)] pt-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
        Related
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {related.map((tool) => {
          if (!tool) return null
          const Icon = tool.icon
          return (
            <Link
              key={tool.id}
              to={`/tool/${tool.id}`}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 transition hover:border-[var(--accent)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--bg-muted)] text-[var(--accent)]">
                <Icon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-[var(--text)]">{tool.name}</span>
                <span className="inline-flex items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">
                  <span className={`cat-dot cat-${tool.category}`} />
                  {getCategoryLabel(tool.category)}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
