import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, Search, Star } from 'lucide-react'
import { categories, getToolById, tools, ALL_CATEGORY_NAV_ID } from '@/data/tools'
import { CategoryNav } from '@/components/CategoryNav'
import { ToolCard } from '@/components/ToolCard'
import { toolCardId } from '@/lib/last-tool'
import { getFavoriteToolIds } from '@/lib/favorites'
import { getRecentToolIds } from '@/lib/recent-tools'
import { buildToolSearchIndex, matchToolQuery } from '@/lib/tool-search'
import { modKShortcutLabel } from '@/lib/platform'
import { useModKHotkey } from '@/hooks/useCommandPaletteHotkey'
import type { ToolCategory, ToolDefinition } from '@/types/tool'

const searchIndex = buildToolSearchIndex(tools)

function SectionTitle({
  title,
  description,
  icon,
}: {
  title: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <div className="mb-4 min-w-0">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold tracking-tight text-[var(--text)]">{title}</h2>
      </div>
      {description && <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>}
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
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
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

/** 首页：Spotlight 搜索 + 分类 Tab + 工具网格 */
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
  const [hint] = useState(modKShortcutLabel)
  const searchRef = useRef<HTMLInputElement>(null)

  useModKHotkey(() => searchRef.current?.focus())

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

  const flatFiltered = useMemo(() => {
    if (!matchedIds && !categoryFilter) return null
    return tools.filter((t) => {
      if (categoryFilter && t.category !== categoryFilter) return false
      if (matchedIds && !matchedIds.has(t.id)) return false
      return true
    })
  }, [matchedIds, categoryFilter])

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

  const listPending = query.trim() !== deferredQuery.trim()

  return (
    <div className="section-enter space-y-8">
      {/* Hero：Spotlight 搜索 */}
      <section className="mx-auto max-w-2xl pt-4 text-center sm:pt-8">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
          浏览器工具箱
        </h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">
          本地优先 · 隐私安全 · 按{' '}
          <kbd className="rounded border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--accent)]">
            {hint}
          </kbd>{' '}
          快速搜索
        </p>

        <div className="relative group/search">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors duration-200 ease-out group-focus-within/search:text-[var(--accent)]"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`搜索工具…（按 ${hint}）`}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-3.5 pl-11 pr-4 text-sm text-[var(--text)] shadow-sm outline-none transition-all duration-200 ease-out placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_50%,transparent)]"
          />
        </div>
      </section>

      {/* 分类 Filter Chips */}
      <CategoryNav
        value={categoryFilter ?? ALL_CATEGORY_NAV_ID}
        getHref={(id) => (id === ALL_CATEGORY_NAV_ID ? '/' : `/?category=${id}`)}
      />

      {showShelves && favoriteTools.length > 0 && (
        <section>
          <SectionTitle
            title="收藏"
            icon={<Star size={14} className="text-[var(--accent)]" />}
          />
          <ToolGrid items={favoriteTools} highlightId={highlightId} keyPrefix="fav" compact />
        </section>
      )}

      {showShelves && recentTools.length > 0 && (
        <section>
          <SectionTitle
            title="最近使用"
            icon={<Clock size={14} className="text-[var(--accent)]" />}
          />
          <ToolGrid items={recentTools} highlightId={highlightId} keyPrefix="recent" compact />
        </section>
      )}

      <div
        className={`transition-opacity duration-200 ease-out ${listPending ? 'opacity-70' : 'opacity-100'}`}
      >
        {filteredCount === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] py-16 text-center">
            <Search size={22} className="mb-3 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text)]">没有找到匹配的工具</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">试试其他关键词或切换分类</p>
          </div>
        ) : isSearching || categoryFilter ? (
          <ToolGrid
            items={flatFiltered ?? []}
            highlightId={highlightId}
            keyPrefix={categoryFilter ?? 'search'}
          />
        ) : (
          <div className="space-y-10">
            {grouped.map(({ cat, items }) => (
              <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-28">
                <SectionTitle title={cat.label} description={cat.description} />
                <ToolGrid items={items} highlightId={highlightId} keyPrefix={cat.id} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
