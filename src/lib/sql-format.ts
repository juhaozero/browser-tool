/**
 * 轻量 SQL 格式化 / 压缩（本地、无第三方依赖）
 * 覆盖常见 SELECT/INSERT/UPDATE/DELETE 与简单 DDL，非完整 SQL 解析器
 */

const KEYWORDS = new Set(
  [
    'select', 'from', 'where', 'and', 'or', 'not', 'in', 'is', 'null', 'like', 'between',
    'join', 'inner', 'left', 'right', 'full', 'outer', 'cross', 'on', 'as', 'using',
    'group', 'by', 'order', 'having', 'limit', 'offset', 'union', 'all', 'distinct',
    'insert', 'into', 'values', 'update', 'set', 'delete', 'create', 'table', 'index',
    'drop', 'alter', 'add', 'column', 'primary', 'key', 'foreign', 'references',
    'constraint', 'default', 'check', 'unique', 'exists', 'case', 'when', 'then',
    'else', 'end', 'with', 'recursive', 'over', 'partition', 'rows', 'range',
    'asc', 'desc', 'nulls', 'first', 'last', 'true', 'false', 'cast', 'coalesce',
    'count', 'sum', 'avg', 'min', 'max', 'if', 'elseif', 'elsif', 'begin', 'commit',
    'rollback', 'transaction', 'explain', 'analyze', 'returning', 'conflict', 'do',
    'nothing', 'lateral', 'natural', 'except', 'intersect', 'fetch', 'next', 'only',
  ].map((k) => k.toUpperCase()),
)

const BREAK_BEFORE = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL',
  'CROSS', 'OUTER', 'GROUP', 'ORDER', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'EXCEPT',
  'INTERSECT', 'RETURNING', 'VALUES', 'SET', 'ON', 'WHEN', 'ELSE', 'END',
])

function tokenize(sql: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < sql.length) {
    const ch = sql[i]!

    if (/\s/.test(ch)) {
      i++
      continue
    }

    if (ch === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i)
      i = end === -1 ? sql.length : end + 1
      continue
    }

    if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2)
      i = end === -1 ? sql.length : end + 2
      continue
    }

    if (ch === "'" || ch === '"') {
      const quote = ch
      let j = i + 1
      let out = quote
      while (j < sql.length) {
        if (sql[j] === quote) {
          out += quote
          j++
          if (sql[j] === quote) {
            out += quote
            j++
            continue
          }
          break
        }
        out += sql[j]!
        j++
      }
      tokens.push(out)
      i = j
      continue
    }

    if (/[(),.;]/.test(ch)) {
      tokens.push(ch)
      i++
      continue
    }

    if (ch === '*' || ch === '=' || ch === '<' || ch === '>' || ch === '!' || ch === '+' || ch === '-' || ch === '/' || ch === '%') {
      let op = ch
      if ((ch === '<' || ch === '>' || ch === '!' || ch === '=') && sql[i + 1] === '=') {
        op += '='
        i++
      } else if (ch === '<' && sql[i + 1] === '>') {
        op += '>'
        i++
      }
      tokens.push(op)
      i++
      continue
    }

    let j = i
    while (j < sql.length && !/[\s(),.;'"`=<>!+\-/*%]/.test(sql[j]!)) j++
    tokens.push(sql.slice(i, j))
    i = j
  }
  return tokens
}

function normalizeToken(token: string): string {
  if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
    return token
  }
  const upper = token.toUpperCase()
  return KEYWORDS.has(upper) ? upper : token
}

/** 格式化 SQL：关键字大写并按子句换行缩进 */
export function formatSql(sql: string, indentSize = 2): string {
  const indentUnit = ' '.repeat(Math.max(1, indentSize))
  const tokens = tokenize(sql).map(normalizeToken)
  if (tokens.length === 0) return ''

  const lines: string[] = []
  let depth = 0
  let current = ''
  let i = 0

  const flush = () => {
    const trimmed = current.trimEnd()
    if (trimmed) lines.push(trimmed)
    current = ''
  }

  const pad = () => indentUnit.repeat(Math.max(0, depth))

  while (i < tokens.length) {
    const tok = tokens[i]!
    const next = tokens[i + 1]

    if (tok === '(') {
      current += (current.endsWith(' ') || current === '' ? '' : ' ') + '('
      depth++
      flush()
      current = pad()
      i++
      continue
    }

    if (tok === ')') {
      flush()
      depth = Math.max(0, depth - 1)
      current = pad() + ')'
      i++
      continue
    }

    if (tok === ',') {
      current += ','
      flush()
      current = pad()
      i++
      continue
    }

    if (tok === ';') {
      current += ';'
      flush()
      depth = 0
      i++
      continue
    }

    const isBreak =
      BREAK_BEFORE.has(tok) &&
      !(tok === 'OUTER' || tok === 'INNER') &&
      !(tok === 'BY' && (tokens[i - 1] === 'GROUP' || tokens[i - 1] === 'ORDER' || tokens[i - 1] === 'PARTITION'))

    // JOIN 组合：LEFT JOIN / INNER JOIN
    if (
      (tok === 'LEFT' || tok === 'RIGHT' || tok === 'FULL' || tok === 'INNER' || tok === 'CROSS') &&
      next === 'JOIN'
    ) {
      flush()
      current = pad() + `${tok} JOIN`
      i += 2
      if (tokens[i] === 'OUTER') {
        // LEFT OUTER JOIN — already have LEFT JOIN, skip OUTER if present after JOIN incorrectly
      }
      continue
    }

    if (tok === 'GROUP' && next === 'BY') {
      flush()
      current = pad() + 'GROUP BY'
      i += 2
      continue
    }

    if (tok === 'ORDER' && next === 'BY') {
      flush()
      current = pad() + 'ORDER BY'
      i += 2
      continue
    }

    if (tok === 'PARTITION' && next === 'BY') {
      flush()
      current = pad() + 'PARTITION BY'
      i += 2
      continue
    }

    if (tok === 'INSERT' && next === 'INTO') {
      flush()
      current = pad() + 'INSERT INTO'
      i += 2
      continue
    }

    if (isBreak && current.trim()) {
      flush()
      current = pad() + tok
      i++
      continue
    }

    if (isBreak && !current.trim()) {
      current = pad() + tok
      i++
      continue
    }

    if (!current) current = pad()
    else if (!current.endsWith('(') && !current.endsWith(' ')) current += ' '
    current += tok
    i++
  }

  flush()
  return lines.join('\n').trim() + (sql.trimEnd().endsWith(';') && !lines.at(-1)?.endsWith(';') ? ';' : '')
}

/** 压缩 SQL：去除注释与多余空白 */
export function minifySql(sql: string): string {
  return tokenize(sql)
    .map(normalizeToken)
    .join(' ')
    .replace(/\s*([(),.;])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
