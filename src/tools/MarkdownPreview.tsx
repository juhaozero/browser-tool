import { useMemo } from 'react'
import { ExampleButton } from '@/components/ExampleButton'
import { TextArea } from '@/components/ui'
import { sanitizeHtml } from '@/lib/sanitize-html'
import { marked } from 'marked'
import { useToolDraft } from '@/hooks/useToolDraft'

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

const PROSE_PREVIEW =
  'prose prose-sm max-w-none text-[var(--text)] [&_a]:text-[var(--accent)] [&_code]:rounded [&_code]:bg-[var(--bg-elevated)] [&_code]:px-1 [&_h1]:text-xl [&_h2]:text-lg [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[var(--bg-elevated)] [&_pre]:p-3 [&_table]:w-full [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2'

export default function MarkdownPreview() {
  const [markdown, setMarkdown] = useToolDraft('markdown-preview', 'markdown', EXAMPLE_MD)

  const html = useMemo(() => {
    try {
      const raw = marked.parse(markdown, { async: false }) as string
      return sanitizeHtml(raw)
    } catch {
      return '<p>解析失败</p>'
    }
  }, [markdown])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 shrink-0">
        <ExampleButton onClick={() => setMarkdown(EXAMPLE_MD)} />
      </div>

      <div className="grid h-[calc(100dvh-7.5rem)] min-h-[20rem] grid-rows-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] lg:grid-cols-2 lg:grid-rows-1">
        <div className="flex min-h-0 flex-col border-b border-[var(--border)] lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-xs font-medium text-[var(--text-muted)]">
            Markdown 源码
          </div>
          <div className="relative min-h-0 flex-1 bg-[var(--bg-muted)]">
            <TextArea
              value={markdown}
              onChange={setMarkdown}
              mono={false}
              className="absolute inset-0 h-full resize-none rounded-none border-0 bg-transparent px-4 py-3 focus:ring-0"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-2 text-xs font-medium text-[var(--text-muted)]">
            预览
          </div>
          <div
            className={`min-h-0 flex-1 overflow-auto p-4 ${PROSE_PREVIEW}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  )
}
