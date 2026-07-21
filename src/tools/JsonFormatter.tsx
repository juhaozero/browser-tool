import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { formatJson } from '@/lib/utils'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLE_JSON = '{"name":"Browser Tool","version":1,"tags":["json","format"],"active":true}'

export default function JsonFormatter() {
  const [input, setInput] = useToolDraft('json-formatter', 'input', '', { queryParam: 'input' })
  const [indent, setIndent] = useState(2)
  const [mode, setMode] = useState<'format' | 'minify'>('format')

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      const parsed = JSON.parse(input)
      const output =
        mode === 'minify' ? JSON.stringify(parsed) : formatJson(parsed, indent)
      return { output, error: '' }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : 'JSON 解析失败' }
    }
  }, [input, indent, mode])

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLE_JSON)} />
        <Button variant={mode === 'format' ? 'primary' : 'secondary'} onClick={() => setMode('format')}>
          格式化
        </Button>
        <Button variant={mode === 'minify' ? 'primary' : 'secondary'} onClick={() => setMode('minify')}>
          压缩
        </Button>
        {mode === 'format' && (
          <>
            {[2, 4].map((n) => (
              <Button
                key={n}
                variant={indent === n ? 'primary' : 'secondary'}
                onClick={() => setIndent(n)}
              >
                缩进 {n}
              </Button>
            ))}
          </>
        )}
      </div>

      <ToolSection label="输入 JSON" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} placeholder='{"hello": "world"}' rows={10} />
      </ToolSection>

      {result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        <ToolSection
          label="输出"
          action={result.output ? <CopyButton text={result.output} /> : undefined}
        >
          <TextArea value={result.output} readOnly rows={10} />
        </ToolSection>
      )}
    </ToolPanel>
  )
}
