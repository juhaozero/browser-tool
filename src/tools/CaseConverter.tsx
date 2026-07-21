import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import {
  toCamelCase,
  toConstantCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from '@/lib/utils'
import { useToolDraft } from '@/hooks/useToolDraft'

const styles = [
  { value: 'camel', label: '小驼峰命名', fn: toCamelCase },
  { value: 'pascal', label: '大驼峰命名法', fn: toPascalCase },
  { value: 'snake', label: '下划线命名', fn: toSnakeCase },
  { value: 'kebab', label: '短横线命名', fn: toKebabCase },
  { value: 'constant', label: '常量命名', fn: toConstantCase },
]

export default function CaseConverter() {
  const [input, setInput] = useToolDraft('case-converter', 'input', '', { queryParam: 'input' })
  const [style, setStyle] = useState('camel')

  const output = useMemo(() => {
    if (!input.trim()) return ''
    const fn = styles.find((s) => s.value === style)?.fn ?? toCamelCase
    return fn(input)
  }, [input, style])

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton onClick={() => setInput('hello world example')} />
      <Select
        value={style}
        onChange={setStyle}
        options={styles.map((s) => ({ value: s.value, label: s.label }))}
      />

      <ToolSection label="输入文本" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} placeholder="hello world example" rows={4} mono={false} />
      </ToolSection>

      <ToolSection label="转换结果" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={output} readOnly rows={4} mono={false} />
      </ToolSection>

      {input.trim() && (
        <div className="grid gap-2 sm:grid-cols-2">
          {styles.map((s) => (
            <div
              key={s.value}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm"
            >
              <span className="text-[var(--text-muted)]">{s.label}：</span>
              <span className="font-mono">{s.fn(input)}</span>
            </div>
          ))}
        </div>
      )}
    </ToolPanel>
  )
}
