import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { formatCss, formatJs, minifyCss, minifyJs } from '@/lib/code-format'
import { useToolDraft } from '@/hooks/useToolDraft'

type Lang = 'css' | 'js'
type Mode = 'format' | 'minify'

const EXAMPLE_CSS = `.card{padding:12px;color:#333} .card:hover{color:#000}`
const EXAMPLE_JS = `function hello(name){const msg="hi "+name;console.log(msg);return msg}`

export default function CodeFormatter() {
  const [lang, setLang] = useState<Lang>('css')
  const [mode, setMode] = useState<Mode>('format')
  const [indent, setIndent] = useState(2)
  const [input, setInput] = useToolDraft('code-formatter', 'input', '', { queryParam: 'input' })

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      if (lang === 'css') {
        return {
          output: mode === 'minify' ? minifyCss(input) : formatCss(input, indent),
          error: '',
        }
      }
      return {
        output: mode === 'minify' ? minifyJs(input) : formatJs(input, indent),
        error: '',
      }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : '处理失败' }
    }
  }, [input, lang, mode, indent])

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton
          onClick={() => setInput(lang === 'css' ? EXAMPLE_CSS : EXAMPLE_JS)}
        />
        <Select
          value={lang}
          onChange={(v) => setLang(v as Lang)}
          options={[
            { value: 'css', label: 'CSS' },
            { value: 'js', label: 'JavaScript' },
          ]}
        />
        <Button variant={mode === 'format' ? 'primary' : 'secondary'} onClick={() => setMode('format')}>
          美化
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
        <TextArea value={input} onChange={setInput} rows={12} placeholder={lang === 'css' ? '.box { color: red }' : 'const x = 1'} />
      </ToolSection>

      {result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        <ToolSection label="输出" action={result.output ? <CopyButton text={result.output} /> : undefined}>
          <TextArea value={result.output} readOnly rows={12} />
        </ToolSection>
      )}

      <Alert type="info">启发式本地处理，复杂语法（正则字面量、嵌套模板等）可能需手动调整。</Alert>
    </ToolPanel>
  )
}
