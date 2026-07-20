/**
 * CSS / JS 轻量格式化与压缩（本地启发式，非完整 AST）
 */

function stripCssComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, '')
}

function stripJsComments(input: string): string {
  let out = ''
  let i = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  let inLineComment = false
  let inBlockComment = false

  while (i < input.length) {
    const ch = input[i]!
    const next = input[i + 1]

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false
        out += ch
      }
      i++
      continue
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false
        i += 2
        continue
      }
      i++
      continue
    }

    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === '/' && next === '/') {
        inLineComment = true
        i += 2
        continue
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true
        i += 2
        continue
      }
    }

    if (ch === "'" && !inDouble && !inTemplate) {
      inSingle = !inSingle
      out += ch
      i++
      continue
    }
    if (ch === '"' && !inSingle && !inTemplate) {
      inDouble = !inDouble
      out += ch
      i++
      continue
    }
    if (ch === '`' && !inSingle && !inDouble) {
      inTemplate = !inTemplate
      out += ch
      i++
      continue
    }

    if ((inSingle || inDouble || inTemplate) && ch === '\\') {
      out += ch + (next ?? '')
      i += 2
      continue
    }

    out += ch
    i++
  }
  return out
}

/** 格式化 CSS：大括号与分号换行缩进 */
export function formatCss(input: string, indentSize = 2): string {
  const indent = ' '.repeat(indentSize)
  const src = stripCssComments(input).replace(/\s+/g, ' ').trim()
  if (!src) return ''

  let out = ''
  let depth = 0
  let i = 0
  while (i < src.length) {
    const ch = src[i]!
    if (ch === '{') {
      out = out.trimEnd() + ' {\n'
      depth++
      out += indent.repeat(depth)
      i++
      continue
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1)
      out = out.trimEnd() + '\n' + indent.repeat(depth) + '}\n' + indent.repeat(depth)
      i++
      continue
    }
    if (ch === ';') {
      out += ';\n' + indent.repeat(depth)
      i++
      continue
    }
    out += ch
    i++
  }
  return out
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l, idx, arr) => l !== '' || (idx > 0 && arr[idx - 1] !== ''))
    .join('\n')
    .trim()
}

/** 压缩 CSS */
export function minifyCss(input: string): string {
  return stripCssComments(input)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()
}

/** 格式化 JS：按括号/花括号启发式缩进 */
export function formatJs(input: string, indentSize = 2): string {
  const indent = ' '.repeat(indentSize)
  const src = stripJsComments(input)
  if (!src.trim()) return ''

  let out = ''
  let depth = 0
  let i = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false

  const newline = () => {
    out = out.trimEnd() + '\n' + indent.repeat(Math.max(0, depth))
  }

  while (i < src.length) {
    const ch = src[i]!
    const next = src[i + 1]

    if ((inSingle || inDouble || inTemplate) && ch === '\\') {
      out += ch + (next ?? '')
      i += 2
      continue
    }
    if (ch === "'" && !inDouble && !inTemplate) {
      inSingle = !inSingle
      out += ch
      i++
      continue
    }
    if (ch === '"' && !inSingle && !inTemplate) {
      inDouble = !inDouble
      out += ch
      i++
      continue
    }
    if (ch === '`' && !inSingle && !inDouble) {
      inTemplate = !inTemplate
      out += ch
      i++
      continue
    }
    if (inSingle || inDouble || inTemplate) {
      out += ch
      i++
      continue
    }

    if (ch === '{') {
      out += ' {'
      depth++
      newline()
      i++
      continue
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1)
      newline()
      out = out.trimEnd()
      // 回退到正确缩进行
      const lines = out.split('\n')
      lines[lines.length - 1] = indent.repeat(depth) + '}'
      out = lines.join('\n')
      if (next === ';' || next === ',') {
        out += next
        i += 2
        newline()
        continue
      }
      newline()
      i++
      continue
    }
    if (ch === ';') {
      out += ';'
      newline()
      i++
      continue
    }
    if (ch === '\n' || ch === '\r') {
      i++
      continue
    }
    if (/\s/.test(ch)) {
      if (!out.endsWith(' ') && !out.endsWith('\n') && out !== '') out += ' '
      i++
      continue
    }
    out += ch
    i++
  }

  return out
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l, idx, arr) => !(l === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim()
}

/** 压缩 JS（去注释与多余空白，保留字符串） */
export function minifyJs(input: string): string {
  const src = stripJsComments(input)
  let out = ''
  let i = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false

  while (i < src.length) {
    const ch = src[i]!
    const next = src[i + 1]

    if ((inSingle || inDouble || inTemplate) && ch === '\\') {
      out += ch + (next ?? '')
      i += 2
      continue
    }
    if (ch === "'" && !inDouble && !inTemplate) {
      inSingle = !inSingle
      out += ch
      i++
      continue
    }
    if (ch === '"' && !inSingle && !inTemplate) {
      inDouble = !inDouble
      out += ch
      i++
      continue
    }
    if (ch === '`' && !inSingle && !inDouble) {
      inTemplate = !inTemplate
      out += ch
      i++
      continue
    }
    if (inSingle || inDouble || inTemplate) {
      out += ch
      i++
      continue
    }

    if (/\s/.test(ch)) {
      const prev = out.at(-1) ?? ''
      const needSpace =
        /[A-Za-z0-9_$]/.test(prev) && next !== undefined && /[A-Za-z0-9_$]/.test(next)
      if (needSpace) out += ' '
      i++
      continue
    }
    out += ch
    i++
  }
  return out.trim()
}
