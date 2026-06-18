import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { escapeHtml, unescapeHtml } from '@/lib/utils'

const EXAMPLE_HTML = '<div class="title">Tom & Jerry</div>'

export default function HtmlEntity() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const encode = () => {
    setError('')
    if (!input) {
      setError('请输入要编码的 HTML 文本')
      setOutput('')
      return
    }
    setOutput(escapeHtml(input))
  }

  const decode = () => {
    setError('')
    if (!input.trim()) {
      setError('请输入要解码的 HTML 实体')
      setOutput('')
      return
    }
    try {
      setOutput(unescapeHtml(input))
    } catch {
      setError('HTML 实体解码失败')
      setOutput('')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => { setInput(EXAMPLE_HTML); setError('') }} />
        <Button variant="primary" onClick={encode}>
          编码 HTML 实体
        </Button>
        <Button onClick={decode}>解码 HTML 实体</Button>
      </div>

      <ToolSection label="输入" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} placeholder='<div class="test">&amp; hello</div>' rows={6} />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      <ToolSection label="输出" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={output} readOnly rows={6} />
      </ToolSection>
    </ToolPanel>
  )
}
