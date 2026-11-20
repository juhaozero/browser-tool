import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { TextArea } from '@/components/ui'
import { computeTextDiff, type DiffRow, type InlinePart } from '@/lib/text-diff'

const EXAMPLE_A = `{
  "Name": "\\\\\\\\.\\\\PHYSICALDRIVE0",
  "Size": 120031511040,
  "Model": "Samsung SSD 850 EVO 120GB",
  "SerialNumber": "S1YANXAH202470L"
}`

const EXAMPLE_B = `{
  "Name": "\\\\\\\\.\\\\PHYSICALDRIVE1",
  "Size": 500105249280,
  "Model": "ST3500418AS",
  "SerialNumber": "5VMPCLCT"
}`

function InlineText({ parts, empty }: { parts: InlinePart[]; empty?: boolean }) {
  if (empty) {
    return <span className="select-none opacity-30">&nbsp;</span>
  }
  return (
    <>
      {parts.map((part, i) => {
        if (part.kind === 'equal') {
          return (
            <span key={i} className="text-[var(--text)]">
              {part.text}
            </span>
          )
        }
        if (part.kind === 'delete') {
          return (
            <mark
              key={i}
              className="rounded-[2px] bg-[#f48771] px-0.5 text-[#1e1e1e] dark:bg-[#c94c3c] dark:text-[#fff5f3]"
            >
              {part.text}
            </mark>
          )
        }
        return (
          <mark
            key={i}
            className="rounded-[2px] bg-[#4ec9b0] px-0.5 text-[#1e1e1e] dark:bg-[#2d8f7b] dark:text-[#e8fff9]"
          >
            {part.text}
          </mark>
        )
      })}
    </>
  )
}

function cellBg(kind: DiffRow['kind'], side: 'left' | 'right'): string {
  if (kind === 'equal') return ''
  if (kind === 'change') {
    return side === 'left' ? 'bg-[#f48771]/18' : 'bg-[#4ec9b0]/18'
  }
  if (kind === 'delete' && side === 'left') return 'bg-[#f48771]/22'
  if (kind === 'insert' && side === 'right') return 'bg-[#4ec9b0]/22'
  return 'bg-[var(--bg-muted)]/40'
}

function sideContent(row: DiffRow, side: 'left' | 'right'): {
  lineNo: number | null
  parts: InlinePart[]
  empty: boolean
} {
  if (side === 'left') {
    switch (row.kind) {
      case 'equal':
        return { lineNo: row.leftNo, parts: [{ text: row.left, kind: 'equal' }], empty: false }
      case 'delete':
      case 'change':
        return { lineNo: row.leftNo, parts: row.leftParts, empty: false }
      case 'insert':
        return { lineNo: null, parts: [], empty: true }
      default: {
        const _exhaustive: never = row
        return _exhaustive
      }
    }
  }

  switch (row.kind) {
    case 'equal':
      return { lineNo: row.rightNo, parts: [{ text: row.right, kind: 'equal' }], empty: false }
    case 'insert':
    case 'change':
      return { lineNo: row.rightNo, parts: row.rightParts, empty: false }
    case 'delete':
      return { lineNo: null, parts: [], empty: true }
    default: {
      const _exhaustive: never = row
      return _exhaustive
    }
  }
}

function SideBySideDiff({ rows }: { rows: DiffRow[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="grid shrink-0 grid-cols-2 border-b border-[var(--border)] bg-[var(--bg-muted)] text-xs font-medium text-[var(--text-muted)] sm:text-sm">
        <div className="border-r border-[var(--border)] px-3 py-2">原始文本</div>
        <div className="px-3 py-2">对比文本</div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[var(--bg-muted)] font-mono text-[13px] leading-6">
        {rows.map((row, index) => {
          const left = sideContent(row, 'left')
          const right = sideContent(row, 'right')
          return (
            <div
              key={index}
              className="grid grid-cols-2 border-b border-[var(--border)]/50 last:border-b-0"
            >
              <div className={`flex min-w-0 border-r border-[var(--border)]/60 ${cellBg(row.kind, 'left')}`}>
                <span className="w-9 shrink-0 select-none border-r border-[var(--border)]/40 px-1 text-right text-[11px] text-[var(--text-muted)] tabular-nums">
                  {left.lineNo ?? ''}
                </span>
                <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all px-2 py-0.5">
                  <InlineText parts={left.parts} empty={left.empty} />
                </pre>
              </div>
              <div className={`flex min-w-0 ${cellBg(row.kind, 'right')}`}>
                <span className="w-9 shrink-0 select-none border-r border-[var(--border)]/40 px-1 text-right text-[11px] text-[var(--text-muted)] tabular-nums">
                  {right.lineNo ?? ''}
                </span>
                <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all px-2 py-0.5">
                  <InlineText parts={right.parts} empty={right.empty} />
                </pre>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TextDiff() {
  const [textA, setTextA] = useState('')
  const [textB, setTextB] = useState('')

  const result = useMemo(() => {
    if (!textA && !textB) return null
    return computeTextDiff(textA, textB)
  }, [textA, textB])

  return (
    <div className="mx-auto flex h-[calc(100dvh-7.5rem)] min-h-[24rem] w-full max-w-[90rem] flex-col gap-3">
      <div className="shrink-0">
        <ExampleButton
          onClick={() => {
            setTextA(EXAMPLE_A)
            setTextB(EXAMPLE_B)
          }}
        />
      </div>

      <div className="grid h-[min(24vh,12rem)] shrink-0 gap-3 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">原始文本</span>
            <CopyButton text={textA} label="复制" />
          </div>
          <div className="relative min-h-0 flex-1 bg-[var(--bg-muted)]">
            <TextArea
              value={textA}
              onChange={setTextA}
              placeholder="粘贴原始文本"
              className="absolute inset-0 h-full resize-none rounded-none border-0 bg-transparent focus:ring-0"
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">对比文本</span>
            <CopyButton text={textB} label="复制" />
          </div>
          <div className="relative min-h-0 flex-1 bg-[var(--bg-muted)]">
            <TextArea
              value={textB}
              onChange={setTextB}
              placeholder="粘贴对比文本"
              className="absolute inset-0 h-full resize-none rounded-none border-0 bg-transparent focus:ring-0"
            />
          </div>
        </div>
      </div>

      {result ? (
        <SideBySideDiff rows={result.rows} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
          粘贴两侧文本后，这里会显示左右对照差异
        </div>
      )}
    </div>
  )
}
