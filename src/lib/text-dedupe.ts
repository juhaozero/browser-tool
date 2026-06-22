/** 文本行去重逻辑 */

export interface DedupeLineOptions {
  trimLines?: boolean
  ignoreEmpty?: boolean
  caseSensitive?: boolean
  keep?: 'first' | 'last'
}

export interface DedupeLineResult {
  output: string
  total: number
  unique: number
  removed: number
}

export function dedupeLines(text: string, options: DedupeLineOptions = {}): DedupeLineResult {
  const {
    trimLines = true,
    ignoreEmpty = true,
    caseSensitive = true,
    keep = 'first',
  } = options

  const rawLines = text.split('\n')
  const keyOf = (line: string) => (caseSensitive ? line : line.toLowerCase())

  const normalize = (line: string) => (trimLines ? line.trim() : line)

  if (keep === 'first') {
    const seen = new Set<string>()
    const outputLines: string[] = []
    let removed = 0

    for (const raw of rawLines) {
      const line = normalize(raw)
      if (ignoreEmpty && line === '') continue
      const key = keyOf(line)
      if (seen.has(key)) {
        removed++
        continue
      }
      seen.add(key)
      outputLines.push(trimLines ? line : raw)
    }

    return {
      output: outputLines.join('\n'),
      total: rawLines.length,
      unique: outputLines.length,
      removed,
    }
  }

  const seen = new Set<string>()
  const outputLines: string[] = []
  let removed = 0

  for (let i = rawLines.length - 1; i >= 0; i--) {
    const raw = rawLines[i]
    const line = normalize(raw)
    if (ignoreEmpty && line === '') continue
    const key = keyOf(line)
    if (seen.has(key)) {
      removed++
      continue
    }
    seen.add(key)
    outputLines.unshift(trimLines ? line : raw)
  }

  return {
    output: outputLines.join('\n'),
    total: rawLines.length,
    unique: outputLines.length,
    removed,
  }
}
