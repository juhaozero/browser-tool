import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { ToolPanel, ToolSection, TextArea } from '@/components/ui'
import { simpleDiff } from '@/lib/utils'

const EXAMPLE_A = '第一行\n第二行\n第三行'
const EXAMPLE_B = '第一行\n第二行（已修改）\n第三行\n第四行'

export default function TextDiff() {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')

  const diff = useMemo(() => {
    if (!textA && !textB) return ''
    return simpleDiff(textA, textB)
  }, [textA, textB])

  const stats = useMemo(() => {
    const lines = diff.split('\n').filter(Boolean)
    return {
      added: lines.filter((l) => l.startsWith('+')).length,
      removed: lines.filter((l) => l.startsWith('-')).length,
    }
  }, [diff])

  return (
    <ToolPanel className="space-y-4">
      <ExampleButton onClick={() => { setTextA(EXAMPLE_A); setTextB(EXAMPLE_B) }} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolSection label="文本 A" action={<CopyButton text={textA} label="复制 A" />}>
          <TextArea value={textA} onChange={setTextA} placeholder="原始文本" rows={12} mono={false} />
        </ToolSection>
        <ToolSection label="文本 B" action={<CopyButton text={textB} label="复制 B" />}>
          <TextArea value={textB} onChange={setTextB} placeholder="修改后文本" rows={12} mono={false} />
        </ToolSection>
      </div>

      {diff && (
        <>
          <div className="flex gap-4 text-sm">
            <span className="text-[var(--error)]">− {stats.removed} 行删除</span>
            <span className="text-[var(--success)]">+ {stats.added} 行新增</span>
          </div>
          <ToolSection label="Diff 输出" action={<CopyButton text={diff} />}>
            <TextArea value={diff} readOnly rows={12} />
          </ToolSection>
        </>
      )}
    </ToolPanel>
  )
}
