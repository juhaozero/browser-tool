import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Select, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { bufferToBase64, bufferToHex, hashFile, hashText } from '@/lib/utils'

const EXAMPLE = 'Hello, Browser Tool!'

export default function Sha256Hash() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [format, setFormat] = useState<'hex' | 'base64'>('hex')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const compute = async (text: string) => {
    setLoading(true)
    setError('')
    try {
      const buffer = await hashText('SHA-256', text)
      setOutput(format === 'hex' ? bufferToHex(buffer) : bufferToBase64(buffer))
    } catch (e) {
      setError(e instanceof Error ? e.message : '哈希计算失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const buffer = await hashFile('SHA-256', file)
      setOutput(format === 'hex' ? bufferToHex(buffer) : bufferToBase64(buffer))
      setInput(`[文件] ${file.name} (${file.size} bytes)`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '文件哈希失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLE)} />
        <Select
          value={format}
          onChange={(v) => setFormat(v as 'hex' | 'base64')}
          options={[
            { value: 'hex', label: 'Hex 输出' },
            { value: 'base64', label: 'Base64 输出' },
          ]}
        />
        <Button variant="primary" onClick={() => compute(input)} disabled={loading || !input}>
          计算哈希
        </Button>
        <label className="cursor-pointer">
          <span className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm transition hover:border-[var(--accent)]">
            上传文件
          </span>
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <ToolSection label="输入文本" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} placeholder="输入要哈希的文本" rows={6} />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      <ToolSection label="SHA-256 结果" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={loading ? '计算中...' : output} readOnly rows={3} />
      </ToolSection>
    </ToolPanel>
  )
}
