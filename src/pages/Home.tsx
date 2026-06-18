import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { categories, tools } from '@/data/tools'
import { ToolCard } from '@/components/ToolCard'
import { toolCardId } from '@/lib/last-tool'

/** 首页：工具搜索、分类筛选、返回时定位上次使用的工具 */
export default function Home() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const categoryFilter = searchParams.get('category')
  const [query, setQuery] = useState('')
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tools.filter((tool) => {
      if (categoryFilter && tool.category !== categoryFilter) return false
      if (!q) return true
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.tags.some((t) => t.includes(q))
      )
    })
  }, [query, categoryFilter])

  useEffect(() => {
    setHighlightId(null)
  }, [categoryFilter])

  // 从工具页返回时滚动并高亮对应工具（仅 location.state 触发，分类筛选不触发）
  useEffect(() => {
    const scrollToTool = (location.state as { scrollToTool?: string } | null)?.scrollToTool
    if (!scrollToTool) return
    if (!filtered.some((t) => t.id === scrollToTool)) return

    setHighlightId(scrollToTool)

    const timer = window.setTimeout(() => {
      document.getElementById(toolCardId(scrollToTool))?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      // 滚动后再清除 state，避免 effect 重跑取消 scrollIntoView 定时器
      navigate(location.pathname + location.search, { replace: true, state: {} })
    }, 150)

    const clearHighlight = window.setTimeout(() => setHighlightId(null), 3000)

    return () => {
      clearTimeout(timer)
      clearTimeout(clearHighlight)
    }
  }, [location.state, filtered, location.pathname, location.search, navigate])

  const activeCategory = categories.find((c) => c.id === categoryFilter)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-10 sm:px-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] blur-2xl" />
        <div className="relative">
          <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            浏览器工具箱
          </h1>
          <p className="mb-6 max-w-2xl text-[var(--text-muted)]">
            所有工具在浏览器本地运行，无需安装、无需注册、数据不上传。
          </p>
          <div className="relative max-w-lg">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索工具名称、描述或标签..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--accent)_20%,transparent)]"
            />
          </div>
        </div>
      </section>

      {activeCategory && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{activeCategory.label}</h2>
            <p className="text-sm text-[var(--text-muted)]">{activeCategory.description}</p>
          </div>
        </div>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {activeCategory ? activeCategory.label : '全部工具'}
          </h2>
          <span className="text-sm text-[var(--text-muted)]">{filtered.length} 个</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] py-16 text-center text-[var(--text-muted)]">
            没有找到匹配的工具，试试其他关键词
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                highlighted={highlightId === tool.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
