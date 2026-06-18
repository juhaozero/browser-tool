import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, Shield, Sparkles, Zap } from 'lucide-react'
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
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--border)_70%,transparent)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--hero-glow)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] blur-3xl" />

        <div className="relative px-6 py-10 sm:px-10 sm:py-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            <Sparkles size={14} />
            纯浏览器本地运行 
          </div>

          <h1 className="mb-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            <span className="text-gradient">浏览器工具箱</span>
          </h1>
          {/* <p className="mb-8 max-w-xl text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            编码、加密、格式化、图片处理等 {tools.length} 款工具。
          </p> */}

          <div className="mb-8 flex flex-wrap gap-3">
            {[
              { icon: Zap, label: `${tools.length} 个工具` },
              { icon: Shield, label: '本地隐私安全' },
              { icon: Sparkles, label: `${categories.length} 大分类` },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
              >
                <Icon size={15} className="text-[var(--accent)]" />
                {label}
              </span>
            ))}
          </div>

          <div className="relative max-w-xl">
            <Search
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索工具名称、描述或标签..."
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] py-3.5 pl-12 pr-4 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:bg-[var(--bg-elevated)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--accent)_15%,transparent)]"
            />
          </div>

          {/* 移动端分类快捷筛选 */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <Link
              to="/"
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
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
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  categoryFilter === cat.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)]'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 工具列表 */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">
              {activeCategory ? activeCategory.label : '全部工具'}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {activeCategory ? activeCategory.description : '浏览所有可用工具，点击即可开始使用'}
            </p>
          </div>
          <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-sm tabular-nums text-[var(--text-muted)]">
            {filtered.length} 个结果
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-muted)] text-[var(--text-muted)]">
              <Search size={24} />
            </div>
            <p className="font-medium text-[var(--text)]">没有找到匹配的工具</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">试试其他关键词或切换分类</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tool) => (
              <ToolCard key={tool.id} tool={tool} highlighted={highlightId === tool.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
