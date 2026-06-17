import { Outlet, Link, useLocation } from 'react-router-dom'
import { Moon, Sun, Wrench, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/lib/utils'
import { categories, tools } from '@/data/tools'

export function Layout() {
  const { dark, toggle } = useTheme()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isHome = location.pathname === '/'

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-[var(--text)]">
            <span>
              Browser Tool
              <span className="ml-1.5 hidden text-sm font-normal text-[var(--text-muted)] sm:inline">
                浏览器工具箱
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
              {tools.length} 个工具 · 本地运行
            </span>
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
              aria-label="切换主题"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] md:hidden"
              aria-label="菜单"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {!isHome && (
          <div className="border-t border-[var(--border)] md:hidden">
            <nav className="flex gap-1 overflow-x-auto px-4 py-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/?category=${cat.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="shrink-0 rounded-full bg-[var(--bg-muted)] px-3 py-1 text-xs text-[var(--text-muted)]"
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6">
        {isHome && (
          <aside className="hidden w-52 shrink-0 md:block">
            <nav className="sticky top-20 space-y-1">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                分类
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/?category=${cat.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text)]"
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}

        <main className="min-w-0 flex-1 pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
