import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'

const EXAMPLE_URL = 'https://example.com/search?q=你好世界&lang=zh'

export default function UrlEncoder() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const encode = (component: boolean) => {
    try {
      setOutput(component ? encodeURIComponent(input) : encodeURI(input))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '编码失败')
    }
  }

  const decode = (component: boolean) => {
    try {
      setOutput(component ? decodeURIComponent(input) : decodeURI(input))
      setError('')
    } catch {
      setError('URL 解码失败，请检查输入格式')
      setOutput('')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLE_URL)} />
        <Button variant="primary" onClick={() => encode(true)}>
           编码Url查询参数
        </Button>
        <Button onClick={() => encode(false)}>编码URL</Button>
        <Button onClick={() => decode(true)}>解码Url查询参数</Button>
        <Button onClick={() => decode(false)}>解码URL</Button>
      </div>

      <ToolSection label="输入" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} placeholder="https://example.com?q=你好" rows={6} />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      <ToolSection label="输出" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={output} readOnly rows={6} />
      </ToolSection>
    </ToolPanel>
  )
}
