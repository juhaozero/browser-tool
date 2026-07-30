import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { formatMarkup, minifyMarkup, type MarkupLang } from '@/lib/markup-format'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLES: Record<MarkupLang, string> = {
  yaml: `name: Browser Tool
version: 1
features:
  - format
  - validate
active: true`,
  xml: `<?xml version="1.0" encoding="UTF-8"?>
<root><name>Browser Tool</name><tags><item>xml</item><item>format</item></tags></root>`,
  toml: `name = "Browser Tool"
version = 1
active = true

[features]
list = ["format", "validate"]`,
}

export default function MarkupFormatter() {
  const [lang, setLang] = useState<MarkupLang>('yaml')
  const [mode, setMode] = useState<'format' | 'minify'>('format')
  const [indent, setIndent] = useState(2)
  const [input, setInput] = useToolDraft('markup-formatter', 'input', '', { queryParam: 'input' })

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '', valid: false as boolean | null }
    try {
      const output =
        mode === 'minify' ? minifyMarkup(lang, input) : formatMarkup(lang, input, indent)
      return { output, error: '', valid: true }
    } catch (e) {
      return {
        output: '',
        error: e instanceof Error ? e.message : '解析失败',
        valid: false,
      }
    }
  }, [input, lang, mode, indent])

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLES[lang])} />
        <Select
          value={lang}
          onChange={(v) => setLang(v as MarkupLang)}
          options={[
            { value: 'yaml', label: 'YAML' },
            { value: 'xml', label: 'XML' },
            { value: 'toml', label: 'TOML' },
          ]}
        />
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

      <ToolSection label="输入" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea
          value={input}
          onChange={setInput}
          rows={12}
          placeholder={
            lang === 'yaml'
              ? 'name: example'
              : lang === 'xml'
                ? '<root></root>'
                : 'name = "example"'
          }
        />
      </ToolSection>

      {result.valid === true && (
        <Alert type="success">语法有效</Alert>
      )}

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

      {lang === 'toml' && mode === 'minify' && (
        <Alert type="info">TOML 无标准压缩格式，压缩模式会校验语法并去除空行。</Alert>
      )}
    </ToolPanel>
  )
}
