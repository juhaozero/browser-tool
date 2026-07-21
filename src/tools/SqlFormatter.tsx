import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { formatSql, minifySql } from '@/lib/sql-format'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLE = `select u.id, u.name, count(o.id) as order_count from users u left join orders o on o.user_id = u.id where u.active = true and u.created_at > '2024-01-01' group by u.id, u.name having count(o.id) > 0 order by order_count desc limit 20;`

export default function SqlFormatter() {
  const [input, setInput] = useToolDraft('sql-formatter', 'input', '', { queryParam: 'input' })
  const [indent, setIndent] = useState(2)
  const [mode, setMode] = useState<'format' | 'minify'>('format')

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      const output = mode === 'minify' ? minifySql(input) : formatSql(input, indent)
      return { output, error: '' }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : '格式化失败' }
    }
  }, [input, indent, mode])

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLE)} />
        <Button variant={mode === 'format' ? 'primary' : 'secondary'} onClick={() => setMode('format')}>
          格式化
        </Button>
        <Button variant={mode === 'minify' ? 'primary' : 'secondary'} onClick={() => setMode('minify')}>
          压缩
        </Button>
        {mode === 'format' &&
          [2, 4].map((n) => (
            <Button key={n} variant={indent === n ? 'primary' : 'secondary'} onClick={() => setIndent(n)}>
              缩进 {n}
            </Button>
          ))}
      </div>

      <ToolSection label="输入 SQL" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} placeholder="SELECT * FROM users WHERE id = 1" rows={10} />
      </ToolSection>

      {result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        <ToolSection label="输出" action={result.output ? <CopyButton text={result.output} /> : undefined}>
          <TextArea value={result.output} readOnly rows={12} />
        </ToolSection>
      )}

      <Alert type="info">轻量启发式格式化，复杂方言 / CTE 可能需手动微调。</Alert>
    </ToolPanel>
  )
}
