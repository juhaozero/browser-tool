import { useState } from 'react'
import SparkMD5 from 'spark-md5'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'

const EXAMPLE = 'Hello, Browser Tool!'

export default function Md5Hash() {
  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)

  const compute = () => {
    setOutput(SparkMD5.hash(input))
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setInput(`[文件] ${file.name}`)
    const reader = new FileReader()
    reader.onload = () => {
      setOutput(SparkMD5.ArrayBuffer.hash(reader.result as ArrayBuffer))
      setLoading(false)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => { setInput(EXAMPLE); setOutput('') }} />
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
        <TextArea value={input} onChange={setInput} rows={6} />
      </ToolSection>

      <ToolSection label="MD5 (Hex)" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={loading ? '计算中...' : output} readOnly rows={2} />
      </ToolSection>
    </ToolPanel>
  )
}
