import { useMemo } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import {
  diffJson,
  formatJsonDiff,
  parseJsonStrict,
  summarizeJsonDiff,
} from '@/lib/json-diff'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLE_A = `{
  "name": "Browser Tool",
  "version": 1,
  "tags": ["json", "diff"],
  "active": true
}`

const EXAMPLE_B = `{
  "name": "Browser Tool",
  "version": 2,
  "tags": ["json", "diff", "compare"],
  "meta": { "author": "local" }
}`

export default function JsonDiff() {
  const [textA, setTextA] = useToolDraft('json-diff', 'left', '')
  const [textB, setTextB] = useToolDraft('json-diff', 'right', '')

  const result = useMemo(() => {
    if (!textA.trim() && !textB.trim()) {
      return { output: '', error: '', stats: null as ReturnType<typeof summarizeJsonDiff> | null }
    }
    try {
      if (!textA.trim() || !textB.trim()) {
        return { output: '', error: '请同时提供左右两侧 JSON', stats: null }
      }
      const left = parseJsonStrict(textA)
      const right = parseJsonStrict(textB)
      const entries = diffJson(left, right)
      return {
        output: formatJsonDiff(entries),
        error: '',
        stats: summarizeJsonDiff(entries),
      }
    } catch (e) {
      return {
        output: '',
        error: e instanceof Error ? e.message : 'JSON 解析失败',
        stats: null,
      }
    }
  }, [textA, textB])

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton
        onClick={() => {
          setTextA(EXAMPLE_A)
          setTextB(EXAMPLE_B)
        }}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolSection label="JSON A（原）" action={<CopyButton text={textA} label="复制 A" />}>
          <TextArea value={textA} onChange={setTextA} placeholder='{"a": 1}' rows={14} />
        </ToolSection>
        <ToolSection label="JSON B（新）" action={<CopyButton text={textB} label="复制 B" />}>
          <TextArea value={textB} onChange={setTextB} placeholder='{"a": 2}' rows={14} />
        </ToolSection>
      </div>

      {result.error && <Alert type="error">{result.error}</Alert>}

      {result.stats && (
        <>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-[var(--success)]">+ {result.stats.added} 新增</span>
            <span className="text-[var(--error)]">− {result.stats.removed} 删除</span>
            <span className="text-[var(--accent)]">~ {result.stats.changed} 修改</span>
            {result.stats.total === 0 && (
              <span className="text-[var(--success)]">两侧完全一致</span>
            )}
          </div>
          <ToolSection label="结构化 Diff" action={<CopyButton text={result.output} />}>
            <TextArea value={result.output} readOnly rows={14} />
          </ToolSection>
        </>
      )}
    </ToolPanel>
  )
}
