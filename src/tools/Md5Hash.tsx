import { useState } from 'react'
import SparkMD5 from 'spark-md5'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'

const EXAMPLE = 'Hello, Browser Tool!'

export default function Md5Hash() {
  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)

  const compute = () => {
    setError('')
    if (!fileBuffer && !input.trim()) {
      setError('请输入文本或上传文件')
      return
    }
    if (fileBuffer) {
      setOutput(SparkMD5.ArrayBuffer.hash(fileBuffer))
      return
    }
    setOutput(SparkMD5.hash(input))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    setInput(`[文件] ${file.name}`)
    const reader = new FileReader()
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer
      setFileBuffer(buffer)
      setOutput(SparkMD5.ArrayBuffer.hash(buffer))
      setLoading(false)
    }
    reader.onerror = () => {
      setError('文件读取失败')
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton
          onClick={() => {
            setInput(EXAMPLE)
            setOutput('')
            setFileBuffer(null)
            setError('')
          }}
        />
        <Button variant="primary" onClick={compute} disabled={loading}>
          计算 MD5
        </Button>
        <label className="cursor-pointer">
          <span className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm hover:border-[var(--accent)]">
            上传文件
          </span>
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <ToolSection label="输入">
        <TextArea
          value={input}
          onChange={(v) => {
            setInput(v)
            setFileBuffer(null)
          }}
          rows={6}
        />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      <ToolSection label="MD5 (Hex)" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={loading ? '计算中...' : output} readOnly rows={2} />
      </ToolSection>
    </ToolPanel>
  )
}
