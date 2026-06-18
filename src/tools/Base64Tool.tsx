import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { base64Decode, base64Encode } from '@/lib/utils'

const EXAMPLE_PLAIN = 'Hello, Browser Tool! 你好世界 🌍'
const EXAMPLE_BASE64 = 'SGVsbG8sIEJyb3dzZXIgVG9vbCEg5L2g5aW95LiW55WMIPCfjIw='

export default function Base64Tool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const encode = () => {
    try {
      setOutput(base64Encode(input))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '编码失败')
      setOutput('')
    }
  }

  const decode = () => {
    if (!input.trim()) {
      setError('请输入 Base64 字符串')
      setOutput('')
      return
    }
    try {
      setOutput(base64Decode(input))
      setError('')
    } catch {
      setError('Base64 格式无效，请检查输入')
      setOutput('')
    }
  }

  const loadPlainExample = () => {
    setInput(EXAMPLE_PLAIN)
    setError('')
    try {
      setOutput(base64Encode(EXAMPLE_PLAIN))
    } catch (e) {
      setError(e instanceof Error ? e.message : '编码失败')
      setOutput('')
    }
  }

  const loadBase64Example = () => {
    setInput(EXAMPLE_BASE64)
    setError('')
    try {
      setOutput(base64Decode(EXAMPLE_BASE64))
    } catch {
      setError('Base64 格式无效，请检查输入')
      setOutput('')
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={loadPlainExample} label="示例明文" />
        <ExampleButton onClick={loadBase64Example} label="示例 Base64" />
        <Button variant="primary" onClick={encode}>
          编码 → Base64
        </Button>
        <Button onClick={decode}>解码 ← Base64</Button>
      </div>

      <ToolSection label="输入" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} placeholder="输入文本或 Base64 字符串" rows={8} />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      <ToolSection label="输出" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={output} readOnly rows={8} />
      </ToolSection>
    </ToolPanel>
  )
}
