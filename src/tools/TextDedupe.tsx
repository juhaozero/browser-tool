import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { dedupeLines } from '@/lib/text-dedupe'

const EXAMPLE = `apple
banana
apple
cherry
Banana
orange
banana
`

export default function TextDedupe() {
  const [input, setInput] = useState('')
  const [trimLines, setTrimLines] = useState(true)
  const [ignoreEmpty, setIgnoreEmpty] = useState(true)
  const [caseSensitive, setCaseSensitive] = useState(true)
  const [keep, setKeep] = useState<'first' | 'last'>('first')

  const result = useMemo(
    () =>
      dedupeLines(input, {
        trimLines,
        ignoreEmpty,
        caseSensitive,
        keep,
      }),
    [input, trimLines, ignoreEmpty, caseSensitive, keep],
  )

  const loadExample = () => {
    setInput(EXAMPLE)
    setTrimLines(true)
    setIgnoreEmpty(true)
    setCaseSensitive(true)
    setKeep('first')
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={loadExample} />
        <Button
          variant={keep === 'first' ? 'primary' : 'secondary'}
          onClick={() => setKeep('first')}
        >
          保留首次
        </Button>
        <Button
          variant={keep === 'last' ? 'primary' : 'secondary'}
          onClick={() => setKeep('last')}
        >
          保留末次
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={trimLines} onChange={(e) => setTrimLines(e.target.checked)} />
          去除行首尾空白
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={ignoreEmpty} onChange={(e) => setIgnoreEmpty(e.target.checked)} />
          忽略空行
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          区分大小写
        </label>
      </div>

      <ToolSection label="输入文本" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea
          value={input}
          onChange={setInput}
          placeholder="每行一条记录，重复行将被去除"
          rows={10}
          mono={false}
        />
      </ToolSection>

      {input && (
        <div className="grid gap-2 rounded-lg bg-[var(--bg-muted)] p-4 text-sm sm:grid-cols-3">
          <div>
            <span className="text-[var(--text-muted)]">原始行数：</span>
            {result.total}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">去重后：</span>
            {result.unique}
          </div>
          <div>
            <span className="text-[var(--text-muted)]">移除重复：</span>
            {result.removed}
          </div>
        </div>
      )}

      <ToolSection label="去重结果" action={<CopyButton text={result.output} />}>
        <TextArea value={result.output} readOnly rows={10} mono={false} />
      </ToolSection>
    </ToolPanel>
  )
}
