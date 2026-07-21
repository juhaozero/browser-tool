import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import {
  escapeText,
  inspectCodePoints,
  unescapeText,
  type EscapeMode,
} from '@/lib/unicode-escape'
import { useToolDraft } from '@/hooks/useToolDraft'

const EXAMPLE = '你好 Browser Tool 🚀\nLine 2'

const MODE_OPTIONS: { value: EscapeMode; label: string }[] = [
  { value: 'unicode', label: '\\uXXXX' },
  { value: 'unicode-braced', label: '\\u{...}' },
  { value: 'hex', label: '\\xHH (UTF-8)' },
  { value: 'js-string', label: 'JSON / JS 字符串' },
  { value: 'html-decimal', label: 'HTML &#数字;' },
  { value: 'html-hex', label: 'HTML &#x十六进制;' },
]

export default function UnicodeEscape() {
  const [input, setInput] = useToolDraft('unicode-escape', 'input', '', { queryParam: 'input' })
  const [mode, setMode] = useState<EscapeMode>('unicode')
  const [direction, setDirection] = useState<'escape' | 'unescape'>('escape')

  const result = useMemo(() => {
    if (!input) return { output: '', error: '', points: [] as ReturnType<typeof inspectCodePoints> }
    try {
      const output =
        direction === 'escape' ? escapeText(input, mode) : unescapeText(input, mode)
      const points = inspectCodePoints(direction === 'escape' ? input : output)
      return { output, error: '', points }
    } catch (e) {
      return {
        output: '',
        error: e instanceof Error ? e.message : '转换失败',
        points: [] as ReturnType<typeof inspectCodePoints>,
      }
    }
  }, [input, mode, direction])

  const pointsText = result.points
    .map((p) => `${p.char}\t${p.codePoint}\tUTF-8 ${p.utf8}`)
    .join('\n')

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLE)} />
        <Select value={mode} onChange={(v) => setMode(v as EscapeMode)} options={MODE_OPTIONS} />
        <Button
          variant={direction === 'escape' ? 'primary' : 'secondary'}
          onClick={() => setDirection('escape')}
        >
          转义
        </Button>
        <Button
          variant={direction === 'unescape' ? 'primary' : 'secondary'}
          onClick={() => setDirection('unescape')}
        >
          还原
        </Button>
      </div>

      <ToolSection label="输入" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea
          value={input}
          onChange={setInput}
          placeholder={direction === 'escape' ? '输入普通文本' : '输入 \\u4f60\\u597d'}
          rows={6}
          mono={direction === 'unescape'}
        />
      </ToolSection>

      {result.error ? (
        <Alert type="error">{result.error}</Alert>
      ) : (
        <ToolSection label="输出" action={result.output ? <CopyButton text={result.output} /> : undefined}>
          <TextArea value={result.output} readOnly rows={6} />
        </ToolSection>
      )}

      {pointsText && (
        <ToolSection label="码点详情" action={<CopyButton text={pointsText} />}>
          <TextArea value={pointsText} readOnly rows={Math.min(10, result.points.length + 1)} />
        </ToolSection>
      )}
    </ToolPanel>
  )
}
