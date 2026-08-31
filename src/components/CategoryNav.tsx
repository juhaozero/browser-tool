import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import {
  ALL_CATEGORY_NAV_ID,
  CORE_CATEGORY_NAV_IDS,
  categoryNavItems,
} from '@/data/tools'

export interface CategoryNavItem {
  id: string
  label: string
}

export interface CategoryNavProps {
  /** 分类列表，默认来自 tools.ts 的 categoryNavItems */
  items?: CategoryNavItem[]
  /** 受控：当前选中 id（`all` 表示全部） */
  value?: string
  /** 非受控初始选中 id */
  defaultValue?: string
  /** 点击回调（按钮模式） */
  onChange?: (id: string) => void
  /** 提供则渲染为 React Router Link（URL 驱动选中态） */
  getHref?: (id: string) => string
  className?: string
  'aria-label'?: string
}

function chipClass(active: boolean) {
  const base =
    'inline-flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]'

  if (active) {
    return `${base} bg-[var(--text)] text-[var(--bg)]`
  }

  return `${base} bg-[color-mix(in_srgb,var(--bg-muted)_55%,transparent)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]`
}

function splitNavItems(items: CategoryNavItem[]) {
  const coreSet = new Set<string>([ALL_CATEGORY_NAV_ID, ...CORE_CATEGORY_NAV_IDS])
  const visible: CategoryNavItem[] = []
  const overflow: CategoryNavItem[] = []

  for (const item of items) {
    if (coreSet.has(item.id)) visible.push(item)
    else overflow.push(item)
  }

  return { visible, overflow }
}

interface NavChipProps {
  item: CategoryNavItem
  active: boolean
  getHref?: (id: string) => string
  onSelect: (id: string) => void
}

function NavChip({ item, active, getHref, onSelect }: NavChipProps) {
  const className = chipClass(active)

  if (getHref) {
    return (
      <Link to={getHref(item.id)} className={className} aria-current={active ? 'page' : undefined}>
        {item.label}
      </Link>
    )
  }

  return (
    <button type="button" aria-pressed={active} className={className} onClick={() => onSelect(item.id)}>
      {item.label}
    </button>
  )
}

/**
 * 分类导航 / Filter Chips — 核心分类 +「更多」下拉
 */
export function CategoryNav({
  items = categoryNavItems,
  value,
  defaultValue = ALL_CATEGORY_NAV_ID,
  onChange,
  getHref,
  className = '',
  'aria-label': ariaLabel = '工具分类',
}: CategoryNavProps) {
  const [internal, setInternal] = useState(defaultValue)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const activeId = value ?? internal

  const { visible, overflow } = useMemo(() => splitNavItems(items), [items])
  const overflowActive = overflow.some((item) => item.id === activeId)
  const activeOverflowLabel = overflow.find((item) => item.id === activeId)?.label

  const select = (id: string) => {
    if (value === undefined) setInternal(id)
    onChange?.(id)
    setMenuOpen(false)
  }

  // 延迟注册 outside 监听，避免打开同一次点击立刻关闭
  useEffect(() => {
    if (!menuOpen) return

    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown)
      document.addEventListener('keydown', onKeyDown)
    }, 0)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <div className={`flex w-full justify-center ${className}`}>
      <nav
        className="inline-flex max-w-full items-center justify-center gap-2"
        aria-label={ariaLabel}
      >
        {/* 核心分类可横向滚动；「更多」留在外层，避免下拉被 overflow 裁切 */}
        <div className="scrollbar-hide flex min-w-0 items-center gap-2 overflow-x-auto">
          {visible.map((item) => (
            <NavChip
              key={item.id}
              item={item}
              active={activeId === item.id}
              getHref={getHref}
              onSelect={select}
            />
          ))}
        </div>

        {overflow.length > 0 && (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-controls={menuId}
              className={`${chipClass(overflowActive)} gap-1 pr-3`}
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((open) => !open)
              }}
            >
              {overflowActive && activeOverflowLabel ? activeOverflowLabel : '更多'}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>

            {menuOpen && (
              <div
                id={menuId}
                role="menu"
                className="absolute right-0 top-[calc(100%+0.375rem)] z-[100] min-w-[9.5rem] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1 shadow-lg"
              >
                {overflow.map((item) => {
                  const active = activeId === item.id
                  const itemClass = `flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-200 ease-out ${
                    active
                      ? 'bg-[var(--bg-muted)] text-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]'
                  }`

                  if (getHref) {
                    return (
                      <Link
                        key={item.id}
                        to={getHref(item.id)}
                        role="menuitem"
                        className={itemClass}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      className={itemClass}
                      aria-pressed={active}
                      onClick={() => select(item.id)}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  )
}
