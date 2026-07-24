import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, Search, Star } from 'lucide-react'
import { categories, getToolById, tools } from '@/data/tools'
import { ToolCard } from '@/components/ToolCard'
import { toolCardId } from '@/lib/last-tool'
import { getFavoriteToolIds } from '@/lib/favorites'
import { getRecentToolIds } from '@/lib/recent-tools'
import { buildToolSearchIndex, matchToolQuery } from '@/lib/tool-search'
import type { ToolCategory, ToolDefinition } from '@/types/tool'

const searchIndex = buildToolSearchIndex(tools)

function shortcutHint() {
  if (typeof navigator === 'undefined') return 'Ctrl+K'
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘K' : 'Ctrl+K'
}

function SectionTitle({
  title,
  description,
  count,
  icon,
  category,
}: {
  title: string
  description?: string
  count?: number
  icon?: ReactNode
  category?: ToolCategory
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          {category && <span className={`cat-dot cat-${category}`} />}
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text)]">{title}</h2>
        </div>
        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
      {count !== undefined && (
        <span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">{count}</span>
      )}
    </div>
  )
}

function ToolGrid({
  items,
  highlightId,
  keyPrefix,
  compact,
}: {
  items: (ToolDefinition | undefined | null)[]
  highlightId: string | null
  keyPrefix: string
  compact?: boolean
}) {
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${compact ? 'xl:grid-cols-3' : 'xl:grid-cols-3'}`}>
      {items.map(
        (tool) =>
          tool && (
            <ToolCard
              key={`${keyPrefix}-${tool.id}`}
              tool={tool}
              highlighted={highlightId === tool.id}
              compact={compact}
            />
          ),
      )}
    </div>
  )
}

/** 首页：精简 Hero、收藏/最近、按分类分节 */
export default function Home() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const categoryFilter = searchParams.get('category') as ToolCategory | null
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState(() => getFavoriteToolIds())
  const [recentIds, setRecentIds] = useState(() => getRecentToolIds())
  const [hint] = useState(shortcutHint)

  useEffect(() => {
    const sync = () => {
      setFavoriteIds(getFavoriteToolIds())
      setRecentIds(getRecentToolIds())
    }
    window.addEventListener('browser-tool-favorites-changed', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('browser-tool-favorites-changed', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const normalizedQuery = deferredQuery.trim().toLowerCase()
  const isSearching = normalizedQuery.length > 0

  const matchedIds = useMemo(() => {
    if (!normalizedQuery && !categoryFilter) return null
    const ids = new Set<string>()
    for (const entry of searchIndex) {
      if (categoryFilter && entry.tool.category !== categoryFilter) continue
      if (!matchToolQuery(entry, normalizedQuery)) continue
      ids.add(entry.tool.id)
    }
    return ids
  }, [normalizedQuery, categoryFilter])

  const showShelves = !categoryFilter && !isSearching

  const favoriteTools = useMemo(
    () => favoriteIds.map((id) => getToolById(id)).filter(Boolean),
    [favoriteIds],
  )

  const recentTools = useMemo(() => {
    const favSet = new Set(favoriteIds)
    return recentIds
      .filter((id) => !favSet.has(id))
      .map((id) => getToolById(id))
      .filter(Boolean)
      .slice(0, 6)
  }, [recentIds, favoriteIds])

  const grouped = useMemo(() => {
    return categories
      .map((cat) => {
        if (categoryFilter && cat.id !== categoryFilter) return null
        const items = tools.filter((t) => {
          if (t.category !== cat.id) return false
          if (matchedIds && !matchedIds.has(t.id)) return false
          return true
        })
        if (items.length === 0) return null
        return { cat, items }
      })
      .filter((g): g is { cat: (typeof categories)[number]; items: ToolDefinition[] } => g !== null)
  }, [categoryFilter, matchedIds])

  const filteredCount = useMemo(
    () => grouped.reduce((sum, g) => sum + g.items.length, 0),
    [grouped],
  )

  const scrollToTool = (location.state as { scrollToTool?: string } | null)?.scrollToTool

  useLayoutEffect(() => {
    if (!scrollToTool) return
    const known =
      grouped.some((g) => g.items.some((t) => t.id === scrollToTool)) ||
      favoriteTools.some((t) => t?.id === scrollToTool) ||
      recentTools.some((t) => t?.id === scrollToTool)
    if (!known) return

    const scrollTimer = window.setTimeout(() => {
      document.getElementById(toolCardId(scrollToTool))?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }, 150)

    const highlightTimer = window.setTimeout(() => setHighlightId(scrollToTool), 0)
    const clearHighlight = window.setTimeout(() => setHighlightId(null), 2800)

    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(highlightTimer)
      clearTimeout(clearHighlight)
    }
  }, [scrollToTool, grouped, favoriteTools, recentTools, location.pathname, location.search, navigate])

  const activeCategory = categories.find((c) => c.id === categoryFilter)
  const listPending = query.trim() !== deferredQuery.trim()

  return (
    <div className="space-y-9">
      {/* Hero：品牌 + 一句主张 + 搜索 */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-7 sm:px-8 sm:py-8">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
          Browser Tool · Local first
        </p>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
          浏览器工具箱
        </h1>
        <p className="mb-6 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
          绝大多数在本地完成。按{' '}
          <kbd className="rounded border border-[var(--border)] bg-[var(--bg-muted)] px-1.5 py-0.5 font-mono text-[11px]">
            {hint}
          </kbd>{' '}
          快速跳转。
        </p>

        <div className="relative max-w-lg">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工具名称、描述或标签…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--bg-elevated)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_18%,transparent)]"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-0.5 lg:hidden">
          <Link
            to="/"
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              !categoryFilter
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)]'
            }`}
          >
            全部
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/?category=${cat.id}`}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                categoryFilter === cat.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)]'
              }`}
            >
              <span className={`cat-dot cat-${cat.id} ${categoryFilter === cat.id ? 'bg-white' : ''}`} />
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {showShelves && favoriteTools.length > 0 && (
        <section>
          <SectionTitle
            title="收藏"
            count={favoriteTools.length}
            icon={<Star size={15} className="text-amber-500" />}
          />
          <ToolGrid items={favoriteTools} highlightId={highlightId} keyPrefix="fav" compact />
        </section>
      )}

      {showShelves && recentTools.length > 0 && (
        <section>
          <SectionTitle
            title="最近使用"
            count={recentTools.length}
            icon={<Clock size={15} className="text-[var(--accent)]" />}
          />
          <ToolGrid items={recentTools} highlightId={highlightId} keyPrefix="recent" compact />
        </section>
      )}

      <div
        className={`space-y-10 transition-opacity duration-150 ${listPending ? 'opacity-70' : 'opacity-100'}`}
      >
        {categoryFilter && (
          <SectionTitle
            title={activeCategory?.label ?? '分类'}
            description={activeCategory?.description}
            count={filteredCount}
            category={activeCategory?.id}
          />
        )}

        {isSearching && !categoryFilter && filteredCount > 0 && (
          <p className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
            匹配 “{query.trim()}” · {filteredCount} 个工具
          </p>
        )}

        {filteredCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] py-16 text-center">
            <Search size={22} className="mb-3 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text)]">没有找到匹配的工具</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">试试其他关键词或切换分类</p>
          </div>
        ) : (
          grouped.map(({ cat, items }) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-28">
              {!categoryFilter && (
                <SectionTitle
                  title={cat.label}
                  description={isSearching ? undefined : cat.description}
                  count={items.length}
                  category={cat.id}
                />
              )}
              <ToolGrid items={items} highlightId={highlightId} keyPrefix={cat.id} />
            </section>
          ))
        )}
      </div>
    </div>
  )
}
