import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import {
  generateFakeJson,
  generateFakePerson,
  generateLoremParagraphs,
  generateLoremSentences,
  generateLoremWords,
} from '@/lib/lorem'
import { parseIntInRange } from '@/lib/input-validation'

type Kind = 'words' | 'sentences' | 'paragraphs' | 'person' | 'json'

export default function LoremGenerator() {
  const [kind, setKind] = useState<Kind>('paragraphs')
  const [count, setCount] = useState('3')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const generate = () => {
    setError('')
    const parsed = parseIntInRange(count, 1, 100, '数量')
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }
    const n = parsed.value
    try {
      switch (kind) {
        case 'words':
          setOutput(generateLoremWords(n))
          break
        case 'sentences':
          setOutput(generateLoremSentences(n))
          break
        case 'paragraphs':
          setOutput(generateLoremParagraphs(n))
          break
        case 'person':
          setOutput(
            Array.from({ length: n }, () => {
              const p = generateFakePerson()
              return `${p.name} <${p.email}>\n${p.phone}\n${p.address}, ${p.city}\n${p.company}`
            }).join('\n\n---\n\n'),
          )
          break
        case 'json':
          setOutput(generateFakeJson(n))
          break
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败')
      setOutput('')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <ExampleButton
          onClick={() => {
            setKind('paragraphs')
            setCount('2')
            setOutput(generateLoremParagraphs(2))
            setError('')
          }}
        />
        <Select
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          options={[
            { value: 'words', label: '单词' },
            { value: 'sentences', label: '句子' },
            { value: 'paragraphs', label: '段落' },
            { value: 'person', label: '假人资料' },
            { value: 'json', label: '假数据 JSON' },
          ]}
        />
        <div className="space-y-1">
          <label className="text-sm text-[var(--text-muted)]">数量 (1-100)</label>
          <Input value={count} onChange={setCount} type="number" />
        </div>
        <Button variant="primary" onClick={generate}>
          生成
        </Button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {output && (
        <ToolSection label="输出" action={<CopyButton text={output} />}>
          <TextArea value={output} readOnly rows={14} mono={kind === 'json'} />
        </ToolSection>
      )}
    </ToolPanel>
  )
}
