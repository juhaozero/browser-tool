import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import {
  GITIGNORE_CATEGORIES,
  getMetaMap,
  getTemplateNames,
  mergeTemplates,
  type GitignoreCategory,
} from '@/data/gitignore-meta'
import { downloadText } from '@/lib/download'

/** 模板项：合并 GitHub 全量列表与本地分类元数据 */
interface TemplateItem {
  name: string
  label: string
  category: GitignoreCategory
  tags: string[]
}

const EXAMPLE_SELECTED = ['Node', 'VisualStudioCode', 'macOS']

export default function GitignoreGenerator() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<GitignoreCategory | 'all'>('all')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const metaMap = useMemo(() => getMetaMap(), [])

  const templates = useMemo((): TemplateItem[] => {
    return getTemplateNames().map((name) => {
      const meta = metaMap.get(name)
      return {
        name,
        label: meta?.label ?? name,
        category: meta?.category ?? 'env',
        tags: meta?.tags ?? [name.toLowerCase()],
      }
    })
  }, [metaMap])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      if (category !== 'all' && t.category !== category) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.label.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q))
      )
    })
  }, [templates, query, category])

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const generate = () => {
    if (selected.size === 0) {
      setError('请至少选择一个模板')
      return
    }
    setError('')
    try {
      setOutput(mergeTemplates([...selected]))
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    }
  }

  const loadExample = () => {
    setSelected(new Set(EXAMPLE_SELECTED))
    setQuery('')
    setCategory('all')
    setError('')
    try {
      setOutput(mergeTemplates(EXAMPLE_SELECTED))
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        基于 GitHub 官方 gitignore 模板，按语言、框架、编辑器或环境搜索选择，合并生成 .gitignore 文件。
      </p>

      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={loadExample} label="示例：Node + VS Code + macOS" />
        <Button variant="primary" onClick={generate} disabled={selected.size === 0}>
          {`生成 .gitignore (${selected.size})`}
        </Button>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索语言、框架、编辑器，如 node、vue、vscode..."
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`rounded-full px-3 py-1 text-xs transition ${category === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}
        >
          全部
        </button>
        {GITIGNORE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3 py-1 text-xs transition ${category === c.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-muted)] text-[var(--text-muted)]'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-2">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-[var(--text-muted)]">无匹配模板</p>
        ) : (
          <div className="grid gap-1 sm:grid-cols-2">
            {filtered.map((t) => (
              <label
                key={t.name}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-[var(--bg-elevated)] ${selected.has(t.name) ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(t.name)}
                  onChange={() => toggle(t.name)}
                />
                <span className="font-medium">{t.label}</span>
                <span className="text-xs text-[var(--text-muted)]">{t.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {output && (
        <ToolSection
          label="生成的 .gitignore"
          action={
            <div className="flex gap-2">
              <CopyButton text={output} />
              <Button variant="ghost" onClick={() => downloadText(output, '.gitignore')}>
                下载
              </Button>
            </div>
          }
        >
          <TextArea value={output} readOnly rows={16} />
        </ToolSection>
      )}

      <Alert type="info">
        模板内容来自 GitHub 官方 gitignore 仓库，本地离线可用，共{' '}
        {templates.length} 个模板。
      </Alert>
    </ToolPanel>
  )
}
