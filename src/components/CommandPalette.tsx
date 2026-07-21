import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star, Clock, CornerDownLeft } from 'lucide-react'
import { getCategoryLabel, tools } from '@/data/tools'
import { getFavoriteToolIds } from '@/lib/favorites'
import { getRecentToolIds } from '@/lib/recent-tools'
import { setLastToolId } from '@/lib/last-tool'
import { buildToolSearchIndex, matchToolQuery } from '@/lib/tool-search'
import { preloadToolComponent } from '@/lib/lazy-tool'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const searchIndex = buildToolSearchIndex(tools)

/** 全局 ⌘K / Ctrl+K 命令面板（由父级 key 控制每次打开重置） */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const favoriteIds = useMemo(() => (open ? getFavoriteToolIds() : []), [open])
  const recentIds = useMemo(() => (open ? getRecentToolIds() : []), [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return searchIndex
      .map((entry) => {
        const { tool } = entry
        if (!q) {
          const favRank = favoriteIds.indexOf(tool.id)
          const recentRank = recentIds.indexOf(tool.id)
          let score = 1000
          if (favRank >= 0) score = favRank
          else if (recentRank >= 0) score = 100 + recentRank
          return { tool, score }
        }
        if (!matchToolQuery(entry, q)) return null
        const name = tool.name.toLowerCase()
        const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : 2
        return { tool, score }
      })
      .filter((x): x is { tool: (typeof tools)[number]; score: number } => x !== null)
      .sort((a, b) => a.score - b.score || a.tool.name.localeCompare(b.tool.name, 'zh'))
      .slice(0, 12)
      .map((x) => x.tool)
  }, [deferredQuery, favoriteIds, recentIds])

  const safeIndex = results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1)

  const go = useCallback(
    (toolId: string) => {
      onOpenChange(false)
      navigate(`/tool/${toolId}`)
      setLastToolId(toolId)
    },
    [navigate, onOpenChange],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' && results[safeIndex]) {
        e.preventDefault()
        go(results[safeIndex]!.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, safeIndex, go, onOpenChange])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 px-4 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="搜索工具"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card-hover)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4">
          <Search size={18} className="shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            placeholder="搜索工具名称、标签…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="hidden rounded-md border border-[var(--border)] bg-[var(--bg-muted)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] sm:inline">
            ESC
          </kbd>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">没有匹配的工具</li>
          ) : (
            results.map((tool, index) => {
              const Icon = tool.icon
              const fav = favoriteIds.includes(tool.id)
              const recent = recentIds.includes(tool.id)
              return (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => go(tool.id)}
                    onMouseEnter={() => {
                      setActiveIndex(index)
                      preloadToolComponent(tool.component)
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      index === safeIndex
                        ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]'
                        : 'text-[var(--text)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-muted)] text-[var(--accent)]">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{tool.name}</span>
                        {fav && <Star size={12} className="fill-current text-amber-500" />}
                        {!fav && recent && <Clock size={12} className="text-[var(--text-muted)]" />}
                      </span>
                      <span className="block truncate text-xs text-[var(--text-muted)]">
                        {getCategoryLabel(tool.category)} · {tool.description}
                      </span>
                    </span>
                    {index === safeIndex && (
                      <CornerDownLeft size={14} className="shrink-0 text-[var(--text-muted)]" />
                    )}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
