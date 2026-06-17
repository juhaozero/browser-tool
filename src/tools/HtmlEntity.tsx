import { useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Button, ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { escapeHtml, unescapeHtml } from '@/lib/utils'

const EXAMPLE_HTML = '<div class="title">Tom & Jerry</div>'

export default function HtmlEntity() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setInput(EXAMPLE_HTML)} />
        <Button variant="primary" onClick={() => setOutput(escapeHtml(input))}>
          编码 HTML 实体
        </Button>
        <Button onClick={() => setOutput(unescapeHtml(input))}>解码 HTML 实体</Button>
      </div>

      <ToolSection label="输入" action={<CopyButton text={input} label="复制输入" />}>
        <TextArea value={input} onChange={setInput} placeholder='<div class="test">&amp; hello</div>' rows={6} />
      </ToolSection>

      <ToolSection label="输出" action={output ? <CopyButton text={output} /> : undefined}>
        <TextArea value={output} readOnly rows={6} />
      </ToolSection>
    </ToolPanel>
  )
}
