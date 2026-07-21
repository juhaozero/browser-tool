import { useMemo, useState } from 'react'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Input, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { REGEX_FLAGS_RE } from '@/lib/input-validation'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLE_PATTERN = '\\d{3,4}-\\d{7,8}'
const EXAMPLE_TEXT = '联系电话：010-12345678，手机：13812345678'

export default function RegexTester() {
  const [pattern, setPattern] = useToolDraft('regex-tester', 'pattern', '', { queryParam: 'pattern' })
  const [flags, setFlags] = useToolDraft('regex-tester', 'flags', 'g', { queryParam: 'flags' })
  const [text, setText] = useToolDraft('regex-tester', 'text', '', { queryParam: 'text' })
  const [replacement, setReplacement] = useState('')

  const result = useMemo(() => {
    if (!pattern) return { matches: [] as RegExpMatchArray[], error: '', replaced: '' }
    if (flags && !REGEX_FLAGS_RE.test(flags)) {
      return {
        matches: [] as RegExpMatchArray[],
        error: 'Flags 仅支持 g、i、m、s、u、y',
        replaced: '',
      }
    }
    try {
      const regex = new RegExp(pattern, flags)
      const matches = [...text.matchAll(regex)]
      const replaced = pattern ? text.replace(regex, replacement) : ''
      return { matches, error: '', replaced }
    } catch (e) {
      return {
        matches: [] as RegExpMatchArray[],
        error: e instanceof Error ? e.message : '正则表达式无效',
        replaced: '',
      }
    }
  }, [pattern, flags, text, replacement])

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton onClick={() => { setPattern(EXAMPLE_PATTERN); setText(EXAMPLE_TEXT); setFlags('g') }} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <ToolSection label="正则表达式">
          <Input value={pattern} onChange={setPattern} placeholder="例如: \\d+" />
        </ToolSection>
        <ToolSection label="Flags">
          <Input value={flags} onChange={setFlags} placeholder="gim" />
        </ToolSection>
      </div>

      <ToolSection label="测试文本">
        <TextArea value={text} onChange={setText} placeholder="在此输入要匹配的文本" rows={6} mono={false} />
      </ToolSection>

      {result.error && <Alert type="error">{result.error}</Alert>}

      {!result.error && pattern && (
        <div className="rounded-lg bg-[var(--bg-muted)] p-4 text-sm">
          找到 <strong>{result.matches.length}</strong> 个匹配
          {result.matches.length > 0 && (
            <ul className="mt-2 space-y-1 font-mono">
              {result.matches.slice(0, 20).map((m, i) => (
                <li key={i} className="text-[var(--accent)]">
                  [{i}] &quot;{m[0]}&quot;
                  {m.length > 1 && (
                    <span className="text-[var(--text-muted)]">
                      {' '}
                      捕获组: {m.slice(1).map((g) => `"${g}"`).join(', ')}
                    </span>
                  )}
                </li>
              ))}
              {result.matches.length > 20 && (
                <li className="text-[var(--text-muted)]">... 还有 {result.matches.length - 20} 个</li>
              )}
            </ul>
          )}
        </div>
      )}

      <ToolSection label="替换文本 (可选)">
        <Input value={replacement} onChange={setReplacement} placeholder="替换为..." />
      </ToolSection>

      {pattern && !result.error && (
        <ToolSection label="替换预览">
          <TextArea value={result.replaced} readOnly rows={6} mono={false} />
        </ToolSection>
      )}
    </ToolPanel>
  )
}
