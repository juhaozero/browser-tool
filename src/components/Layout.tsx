import { Outlet, Link, useLocation, useSearchParams } from 'react-router-dom'
import { Moon, Sun, Menu, X, LayoutGrid } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTheme } from '@/lib/utils'
import { categories, tools } from '@/data/tools'

function NavLink({
  to,
  active,
  children,
  count,
  onClick,
}: {
  to: string
  active: boolean
  children: ReactNode
  count?: number
  onClick?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
        active
          ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] font-medium text-[var(--accent)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_25%,transparent)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
      }`}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
            active ? 'bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]' : 'bg-[var(--bg-muted)]'
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  )
}

/** 全局布局：顶栏 + 首页侧栏分类导航 + 主内容区（Outlet） */
export function Layout() {
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const isHome = location.pathname === '/'
  const categoryFilter = searchParams.get('category')

  const categoryNav = (
    <nav className="space-y-1">
      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        工具分类
      </p>
      <NavLink to="/" active={!categoryFilter} count={tools.length} onClick={() => setMenuOpen(false)}>
        全部工具
      </NavLink>
      {categories.map((cat) => (
        <NavLink
          key={cat.id}
          to={`/?category=${cat.id}`}
          active={categoryFilter === cat.id}
          count={tools.filter((t) => t.category === cat.id).length}
          onClick={() => setMenuOpen(false)}
        >
          {cat.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[color-mix(in_srgb,var(--border)_80%,transparent)] bg-[color-mix(in_srgb,var(--bg)_75%,transparent)] backdrop-blur-xl">
        <div className="mx- auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_60%,#6366f1)] text-white shadow-[0_4px_14px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition group-hover:scale-105">
              <LayoutGrid size={18} strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <span className="block font-semibold tracking-tight text-[var(--text)]">Browser Tool</span>
              <span className="hidden text-xs text-[var(--text-muted)] sm:block">本地运行的开发者工具箱</span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5">
            <span className="mr-2 hidden rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-muted)] md:inline">
              {tools.length} 个工具
            </span>
            <button
              onClick={toggle}
              className="rounded-xl p-2.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
              aria-label="切换主题"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {isHome && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-xl p-2.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] md:hidden"
                aria-label="菜单"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>
        </div>

        {isHome && menuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4 md:hidden">
            {categoryNav}
          </div>
        )}

        {!isHome && (
          <div className="border-t border-[var(--border)] md:hidden">
            <nav className="flex gap-2 overflow-x-auto px-4 py-2.5">
              <Link
                to="/"
                className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-muted)]"
              >
                首页
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/?category=${cat.id}`}
                  className="shrink-0 rounded-full bg-[var(--bg-muted)] px-3 py-1 text-xs text-[var(--text-muted)]"
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-10 px-4 py-8 sm:px-6">
        {isHome && (
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow-card)]">
              {categoryNav}
            </div>
          </aside>
        )}

        <main className="min-w-0 flex-1 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
