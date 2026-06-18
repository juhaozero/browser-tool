import { useMemo, useState } from 'react'
import { ExampleButton } from '@/components/ExampleButton'
import { ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { marked } from 'marked'

const EXAMPLE_MD = `# Markdown 预览示例

这是一段 **粗体** 和 *斜体* 文本。

## 代码块

\`\`\`javascript
const hello = 'Browser Tool'
console.log(hello)
\`\`\`

## 列表

- 本地运行
- 绝大多数工具数据不上传
- 支持深色模式

> 引用：绝大多数处理均在浏览器完成。

| 功能 | 状态 |
|------|------|
| JSON | ✅ |
| Base64 | ✅ |
`

export default function MarkdownPreview() {
  const [markdown, setMarkdown] = useState(EXAMPLE_MD)

  const html = useMemo(() => {
    try {
      const raw = marked.parse(markdown, { async: false }) as string
      return sanitizeHtml(raw)
    } catch {
      return '<p>解析失败</p>'
    }
  }, [markdown])

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton onClick={() => setMarkdown(EXAMPLE_MD)} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolSection label="Markdown 源码">
          <TextArea value={markdown} onChange={setMarkdown} rows={18} mono={false} />
        </ToolSection>
        <ToolSection label="预览">
          <div
            className="prose prose-sm max-w-none min-h-[320px] rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-[var(--text)] [&_a]:text-[var(--accent)] [&_code]:rounded [&_code]:bg-[var(--bg-elevated)] [&_code]:px-1 [&_h1]:text-xl [&_h2]:text-lg [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[var(--bg-elevated)] [&_pre]:p-3 [&_table]:w-full [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </ToolSection>
      </div>
    </ToolPanel>
  )
}
