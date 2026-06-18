import { useMemo, useState } from 'react'
import { ExampleButton } from '@/components/ExampleButton'
import { ToolPanel, ToolSection, TextArea } from '@/components/ui'

const EXAMPLE =
  'Browser Tool 是一款纯浏览器本地运行的工具箱。\n\n它支持 JSON 格式化、Base64 编解码、JWT 解析等功能。所有数据不上传服务器，保护你的隐私。'

function countWords(text: string): number {
  const en = text.match(/[a-zA-Z]+/g)?.length ?? 0
  const zh = (text.match(/[\u4e00-\u9fff]/g) || []).length
  return en + zh
}

export default function TextStatistics() {
  const [text, setText] = useState(EXAMPLE)

  const stats = useMemo(() => {
    const chars = text.length
    const charsNoSpace = text.replace(/\s/g, '').length
    const lines = text ? text.split('\n').length : 0
    const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).length : 0
    const sentences = text.match(/[.!?。！？]+/g)?.length ?? 0
    const words = countWords(text)
    const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length
    const english = (text.match(/[a-zA-Z]+/g) || []).length
    const digits = (text.match(/\d/g) || []).length
    const readingMin = Math.ceil(words / 300) || 0
    const readingCn = Math.ceil(chinese / 500) || 0

    return {
      chars,
      charsNoSpace,
      lines,
      paragraphs,
      sentences: sentences || (text.trim() ? 1 : 0),
      words,
      chinese,
      english,
      digits,
      readingMin: Math.max(readingMin, readingCn, text.trim() ? 1 : 0),
    }
  }, [text])

  const items = [
    ['总字符数', stats.chars],
    ['不含空格字符', stats.charsNoSpace],
    ['行数', stats.lines],
    ['段落数', stats.paragraphs],
    ['句子数', stats.sentences],
    ['词数（中英合计）', stats.words],
    ['中文字符', stats.chinese],
    ['英文单词', stats.english],
    ['数字字符', stats.digits],
    ['预计阅读时间', `约 ${stats.readingMin} 分钟`],
  ]

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton onClick={() => setText(EXAMPLE)} />

      <ToolSection label="文本内容">
        <TextArea value={text} onChange={setText} rows={10} mono={false} />
      </ToolSection>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3"
          >
            <div className="text-sm text-[var(--text-muted)]">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
    </ToolPanel>
  )
}
