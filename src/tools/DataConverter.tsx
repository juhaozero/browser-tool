import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { convertData, type ConvertPair } from '@/lib/data-convert'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLES: Record<ConvertPair, string> = {
  'json-yaml': `{"name":"Browser Tool","tags":["json","yaml"],"active":true}`,
  'yaml-json': `name: Browser Tool
tags:
  - json
  - yaml
active: true`,
  'json-xml': `{"name":"Browser Tool","version":1,"tags":["json","xml"]}`,
  'xml-json': `<?xml version="1.0"?><root><name>Browser Tool</name><version>1</version></root>`,
  'json-csv': `[{"id":1,"name":"Alice","role":"admin"},{"id":2,"name":"Bob","role":"user"}]`,
  'csv-json': `id,name,role
1,Alice,admin
2,Bob,user`,
}

const PAIR_OPTIONS: { value: ConvertPair; label: string }[] = [
  { value: 'json-yaml', label: 'JSON → YAML' },
  { value: 'yaml-json', label: 'YAML → JSON' },
  { value: 'json-xml', label: 'JSON → XML' },
  { value: 'xml-json', label: 'XML → JSON' },
  { value: 'json-csv', label: 'JSON → CSV' },
  { value: 'csv-json', label: 'CSV → JSON' },
]

export default function DataConverter() {
  const [pair, setPair] = useState<ConvertPair>('json-yaml')
  const [indent, setIndent] = useState(2)
  const [input, setInput] = useToolDraft('data-converter', 'input', '', { queryParam: 'input' })

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      return { output: convertData(pair, input, indent), error: '' }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : '转换失败' }
    }
  }, [input, pair, indent])

  const showIndent = pair !== 'json-csv'

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLES[pair])} />
        <Select
          value={pair}
          onChange={(v) => setPair(v as ConvertPair)}
          options={PAIR_OPTIONS}
        />
        {showIndent &&
          [2, 4].map((n) => (
            <Button key={n} variant={indent === n ? 'primary' : 'secondary'} onClick={() => setIndent(n)}>
              缩进 {n}
            </Button>
          ))}
      </div>

      <ToolSection label="输入" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} rows={12} placeholder="粘贴待转换内容" />
      </ToolSection>

      {result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        <ToolSection
          label="输出"
          action={result.output ? <CopyButton text={result.output} /> : undefined}
        >
          <TextArea value={result.output} readOnly rows={12} />
        </ToolSection>
      )}

      <Alert type="info">
        JSON → CSV 需要对象数组或二维数组；XML 转换使用字段名作为标签，数组元素标签为 item。
      </Alert>
    </ToolPanel>
  )
}
