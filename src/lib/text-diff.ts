/**
 * 文本 Diff：行级对齐 + 行内字符高亮（Beyond Compare / diff.xuecan.net 风格）
 */

export type InlineKind = 'equal' | 'insert' | 'delete'

export interface InlinePart {
  text: string
  kind: InlineKind
}

export type DiffRow =
  | {
      kind: 'equal'
      left: string
      right: string
      leftNo: number
      rightNo: number
    }
  | {
      kind: 'delete'
      left: string
      leftNo: number
      leftParts: InlinePart[]
    }
  | {
      kind: 'insert'
      right: string
      rightNo: number
      rightParts: InlinePart[]
    }
  | {
      kind: 'change'
      left: string
      right: string
      leftNo: number
      rightNo: number
      leftParts: InlinePart[]
      rightParts: InlinePart[]
    }

export interface TextDiffResult {
  rows: DiffRow[]
  stats: {
    added: number
    removed: number
    changed: number
    equal: number
  }
}

type RawOp =
  | { type: 'equal'; line: string }
  | { type: 'remove'; line: string }
  | { type: 'add'; line: string }

/** 按字符对比（适合标出 PHYSICALDRIVE0 ↔ 1 这种单字差异） */
export function diffChars(a: string, b: string): InlinePart[] {
  if (a === b) return a ? [{ text: a, kind: 'equal' }] : []
  if (!a) return b ? [{ text: b, kind: 'insert' }] : []
  if (!b) return a ? [{ text: a, kind: 'delete' }] : []

  // 先剥公共前后缀，缩小 LCS 范围
  let start = 0
  const minLen = Math.min(a.length, b.length)
  while (start < minLen && a[start] === b[start]) start++

  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }

  const parts: InlinePart[] = []
  const push = (text: string, kind: InlineKind) => {
    if (!text) return
    const last = parts[parts.length - 1]
    if (last && last.kind === kind) last.text += text
    else parts.push({ text, kind })
  }

  if (start > 0) push(a.slice(0, start), 'equal')

  const midA = a.slice(start, endA)
  const midB = b.slice(start, endB)

  if (!midA && midB) {
    push(midB, 'insert')
  } else if (midA && !midB) {
    push(midA, 'delete')
  } else if (midA && midB) {
    const n = midA.length
    const m = midB.length
    if (n * m > 200_000) {
      // 超长中间段：整段标为替换，避免卡死
      push(midA, 'delete')
      push(midB, 'insert')
    } else {
      const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1))
      for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
          if (midA[i] === midB[j]) dp[i][j] = dp[i + 1][j + 1] + 1
          else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]) as number
        }
      }
      let i = 0
      let j = 0
      while (i < n && j < m) {
        if (midA[i] === midB[j]) {
          push(midA[i], 'equal')
          i++
          j++
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
          push(midA[i], 'delete')
          i++
        } else {
          push(midB[j], 'insert')
          j++
        }
      }
      while (i < n) push(midA[i++], 'delete')
      while (j < m) push(midB[j++], 'insert')
    }
  }

  if (endA < a.length) push(a.slice(endA), 'equal')
  return parts
}

function splitPartsForSide(parts: InlinePart[], side: 'left' | 'right'): InlinePart[] {
  return parts
    .filter((p) => {
      if (p.kind === 'equal') return true
      if (side === 'left') return p.kind === 'delete'
      return p.kind === 'insert'
    })
    .map((p) => ({ ...p }))
}

function lineOps(a: string, b: string): RawOp[] {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const n = aLines.length
  const m = bLines.length

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const ops: RawOp[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      ops.push({ type: 'equal', line: aLines[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: 'remove', line: aLines[i] })
      i++
    } else {
      ops.push({ type: 'add', line: bLines[j] })
      j++
    }
  }
  while (i < n) ops.push({ type: 'remove', line: aLines[i++] })
  while (j < m) ops.push({ type: 'add', line: bLines[j++] })
  return ops
}

/** 将连续删除/新增块配对为「修改」，并做行内高亮 */
function toRows(ops: RawOp[]): DiffRow[] {
  const rows: DiffRow[] = []
  let leftNo = 1
  let rightNo = 1
  let idx = 0

  while (idx < ops.length) {
    const op = ops[idx]
    if (op.type === 'equal') {
      rows.push({
        kind: 'equal',
        left: op.line,
        right: op.line,
        leftNo: leftNo++,
        rightNo: rightNo++,
      })
      idx++
      continue
    }

    const removes: string[] = []
    const adds: string[] = []
    while (idx < ops.length && ops[idx].type === 'remove') {
      removes.push((ops[idx] as { type: 'remove'; line: string }).line)
      idx++
    }
    while (idx < ops.length && ops[idx].type === 'add') {
      adds.push((ops[idx] as { type: 'add'; line: string }).line)
      idx++
    }

    const paired = Math.min(removes.length, adds.length)
    for (let k = 0; k < paired; k++) {
      const left = removes[k]
      const right = adds[k]
      const parts = diffChars(left, right)
      rows.push({
        kind: 'change',
        left,
        right,
        leftNo: leftNo++,
        rightNo: rightNo++,
        leftParts: splitPartsForSide(parts, 'left'),
        rightParts: splitPartsForSide(parts, 'right'),
      })
    }
    for (let k = paired; k < removes.length; k++) {
      rows.push({
        kind: 'delete',
        left: removes[k],
        leftNo: leftNo++,
        leftParts: [{ text: removes[k], kind: 'delete' }],
      })
    }
    for (let k = paired; k < adds.length; k++) {
      rows.push({
        kind: 'insert',
        right: adds[k],
        rightNo: rightNo++,
        rightParts: [{ text: adds[k], kind: 'insert' }],
      })
    }
  }

  return rows
}

export function computeTextDiff(a: string, b: string): TextDiffResult {
  if (!a && !b) {
    return { rows: [], stats: { added: 0, removed: 0, changed: 0, equal: 0 } }
  }

  const rows = toRows(lineOps(a, b))
  const stats = { added: 0, removed: 0, changed: 0, equal: 0 }
  for (const row of rows) {
    switch (row.kind) {
      case 'equal':
        stats.equal++
        break
      case 'delete':
        stats.removed++
        break
      case 'insert':
        stats.added++
        break
      case 'change':
        stats.changed++
        break
      default: {
        const _exhaustive: never = row
        void _exhaustive
      }
    }
  }

  return { rows, stats }
}
