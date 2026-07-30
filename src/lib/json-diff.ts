/**
 * 结构化 JSON Diff（按路径对比）
 */

export type JsonDiffKind = 'added' | 'removed' | 'changed'

export interface JsonDiffEntry {
  kind: JsonDiffKind
  path: string
  left?: unknown
  right?: unknown
}

export function parseJsonStrict(input: string): unknown {
  const text = input.trim()
  if (!text) throw new Error('JSON 不能为空')
  return JSON.parse(text)
}

export function diffJson(left: unknown, right: unknown): JsonDiffEntry[] {
  const entries: JsonDiffEntry[] = []
  walk(left, right, '$', entries)
  return entries
}

export function formatJsonDiff(entries: JsonDiffEntry[], indent = 2): string {
  if (entries.length === 0) return '无差异'
  return entries
    .map((e) => {
      const left = e.left === undefined ? undefined : JSON.stringify(e.left, null, indent)
      const right = e.right === undefined ? undefined : JSON.stringify(e.right, null, indent)
      switch (e.kind) {
        case 'added':
          return `+ ${e.path}\n  ${right}`
        case 'removed':
          return `- ${e.path}\n  ${left}`
        case 'changed':
          return `~ ${e.path}\n  - ${left}\n  + ${right}`
      }
    })
    .join('\n\n')
}

export function summarizeJsonDiff(entries: JsonDiffEntry[]) {
  return {
    added: entries.filter((e) => e.kind === 'added').length,
    removed: entries.filter((e) => e.kind === 'removed').length,
    changed: entries.filter((e) => e.kind === 'changed').length,
    total: entries.length,
  }
}

function walk(left: unknown, right: unknown, path: string, out: JsonDiffEntry[]) {
  if (Object.is(left, right)) return

  if (isPlainObject(left) && isPlainObject(right)) {
    const keys = new Set([...Object.keys(left), ...Object.keys(right)])
    for (const key of [...keys].sort()) {
      const next = `${path}.${escapeKey(key)}`
      if (!(key in left)) {
        out.push({ kind: 'added', path: next, right: right[key] })
      } else if (!(key in right)) {
        out.push({ kind: 'removed', path: next, left: left[key] })
      } else {
        walk(left[key], right[key], next, out)
      }
    }
    return
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    const max = Math.max(left.length, right.length)
    for (let i = 0; i < max; i++) {
      const next = `${path}[${i}]`
      if (i >= left.length) {
        out.push({ kind: 'added', path: next, right: right[i] })
      } else if (i >= right.length) {
        out.push({ kind: 'removed', path: next, left: left[i] })
      } else {
        walk(left[i], right[i], next, out)
      }
    }
    return
  }

  // 类型不同或叶子值不同
  if (left === undefined) {
    out.push({ kind: 'added', path, right })
  } else if (right === undefined) {
    out.push({ kind: 'removed', path, left })
  } else {
    out.push({ kind: 'changed', path, left, right })
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function escapeKey(key: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key)
}
