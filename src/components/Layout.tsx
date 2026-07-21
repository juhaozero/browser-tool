import { Outlet, Link, useLocation, useSearchParams } from 'react-router-dom'
import { Moon, Sun, Menu, X, Search } from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useTheme } from '@/lib/utils'
import { categories, tools } from '@/data/tools'
import { CommandPalette } from '@/components/CommandPalette'
import { useCommandPaletteHotkey } from '@/hooks/useCommandPaletteHotkey'

const categoryCounts = Object.fromEntries(
  categories.map((cat) => [cat.id, tools.filter((t) => t.category === cat.id).length]),
) as Record<string, number>

function NavLink({
  to,
  active,
  children,
  count,
  onClick,
  categoryClass,
}: {
  to: string
  active: boolean
  children: ReactNode
  count?: number
  onClick?: () => void
  categoryClass?: string
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm transition ${
        active
          ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] font-medium text-[var(--accent)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
      }`}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        {categoryClass && <span className={`cat-dot ${categoryClass}`} />}
        <span className="truncate">{children}</span>
      </span>
      {count !== undefined && (
        <span className="font-mono text-[11px] tabular-nums opacity-70">{count}</span>
      )}
    </Link>
  )
}

/** 全局布局：顶栏 + 首页侧栏分类导航 + 主内容区 */
export function Layout() {
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteSession, setPaletteSession] = useState(0)
  const isHome = location.pathname === '/'
  const categoryFilter = searchParams.get('category')
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform),
    [],
  )

  const openPalette = useCallback(() => {
    setPaletteSession((n) => n + 1)
    setPaletteOpen(true)
  }, [])
  useCommandPaletteHotkey(openPalette)

  const categoryNav = (
    <nav className="space-y-0.5">
      <p className="mb-2 px-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
        Categories
      </p>
      <NavLink to="/" active={!categoryFilter} count={tools.length} onClick={() => setMenuOpen(false)}>
        全部工具
      </NavLink>
      {categories.map((cat) => (
        <NavLink
          key={cat.id}
          to={`/?category=${cat.id}`}
          active={categoryFilter === cat.id}
          count={categoryCounts[cat.id] ?? 0}
          onClick={() => setMenuOpen(false)}
          categoryClass={`cat-${cat.id}`}
        >
          {cat.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_94%,transparent)]">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-[var(--border)] transition group-hover:ring-[var(--accent)]">
              <img
                src={`${import.meta.env.BASE_URL}logo.svg`}
                alt=""
                width={32}
                height={32}
                className="h-full w-full"
              />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold tracking-tight text-[var(--text)]">
                Browser Tool
              </span>
              <span className="hidden font-mono text-[10px] text-[var(--text-muted)] sm:block">
                local · private · offline-first
              </span>
            </div>
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={openPalette}
              className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:inline-flex"
            >
              <Search size={14} />
              搜索
              <kbd className="rounded border border-[var(--border)] bg-[var(--bg-muted)] px-1.5 py-0.5 font-mono text-[10px]">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>
            <button
              type="button"
              onClick={openPalette}
              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)] sm:hidden"
              aria-label="搜索工具"
            >
              <Search size={18} />
            </button>
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
              aria-label="切换主题"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {isHome && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] md:hidden"
                aria-label="菜单"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>
        </div>

        {isHome && menuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 md:hidden">
            {categoryNav}
          </div>
        )}

        {!isHome && (
          <div className="border-t border-[var(--border)] md:hidden">
            <nav className="flex gap-1.5 overflow-x-auto px-4 py-2">
              <Link
                to="/"
                className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
              >
                首页
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/?category=${cat.id}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--bg-muted)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
                >
                  <span className={`cat-dot cat-${cat.id}`} />
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-7 sm:px-6">
        {isHome && (
          <aside className="hidden w-52 shrink-0 lg:block">
            <div className="sticky top-20 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5">
              {categoryNav}
            </div>
          </aside>
        )}

        <main className="min-w-0 flex-1 pb-14">
          <Outlet />
        </main>
      </div>

      <CommandPalette key={paletteSession} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
