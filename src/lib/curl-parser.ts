/**
 * cURL 命令解析与多语言代码生成
 * 支持常见 -X / -H / -d / -F 参数，多行续行符会被展平
 */
import { validateHttpUrl } from '@/lib/input-validation'

export interface ParsedCurl {
  method: string
  url: string
  headers: Record<string, string>
  body: string
  formData: Record<string, string>
}

function tokenizeCurlInput(input: string): string[] {
  const tokens: string[] = []
  let i = 0
  while (i < input.length) {
    const ch = input[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (ch === "'" || ch === '"') {
      const quote = ch
      i++
      let val = ''
      while (i < input.length) {
        if (input[i] === '\\' && i + 1 < input.length) {
          val += input[i + 1]
          i += 2
          continue
        }
        if (input[i] === quote) {
          i++
          break
        }
        val += input[i++]
      }
      tokens.push(val)
      continue
    }
    let val = ''
    while (i < input.length && !/\s/.test(input[i])) val += input[i++]
    tokens.push(val)
  }
  return tokens
}

/** 拆分粘连 flag，如 -XPOST、-H'Header: value' */
function expandToken(tok: string): string[] {
  if (tok === '-X' || tok === '--request' || tok.startsWith('--')) return [tok]
  const shortFlag = tok.match(/^-([A-Za-z]{2,})(.+)$/)
  if (shortFlag && shortFlag[1] !== 'X') return [tok]
  const xMatch = tok.match(/^-X([A-Za-z]+)$/i)
  if (xMatch) return ['-X', xMatch[1]]
  const hMatch = tok.match(/^-H(.+)$/s)
  if (hMatch) return ['-H', hMatch[1]]
  return [tok]
}

const FLAGS_WITH_VALUE = new Set([
  '-X', '--request',
  '-H', '--header',
  '-d', '--data', '--data-raw', '--data-binary', '--data-urlencode',
  '-F', '--form',
  '-u', '--user',
  '--url',
  '-A', '--user-agent',
  '-e', '--referer',
  '-b', '--cookie',
  '-o', '--output',
])

const BOOLEAN_FLAGS = new Set([
  '-s', '-S', '-L', '-k', '-v', '-i', '-I', '-f', '--compressed', '--insecure', '-g', '--globoff',
])

function isUrlCandidate(token: string): boolean {
  if (token.startsWith('-')) return false
  return /^https?:\/\//i.test(token) || /^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(token)
}

function normalizeCurlUrl(url: string): string {
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function readFlagValue(tokens: string[], index: number): string {
  return tokens[index] ?? ''
}

export function parseCurl(input: string): ParsedCurl | string {
  const trimmed = input.trim().replace(/\\\r?\n/g, ' ')
  if (!trimmed.toLowerCase().startsWith('curl')) return '请输入以 curl 开头的命令'

  const rawTokens = tokenizeCurlInput(trimmed)
  const tokens = rawTokens.flatMap(expandToken)
  if (tokens[0]?.toLowerCase() !== 'curl') return '请输入以 curl 开头的命令'

  let method = 'GET'
  let url = ''
  const headers: Record<string, string> = {}
  const bodyParts: string[] = []
  const formData: Record<string, string> = {}

  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i]

    if (tok === '-X' || tok === '--request') {
      method = readFlagValue(tokens, ++i).toUpperCase() || method
      continue
    }
    if (tok.startsWith('-X') && tok.length > 2) {
      method = tok.slice(2).toUpperCase()
      continue
    }
    if (tok === '-H' || tok === '--header') {
      const h = readFlagValue(tokens, ++i)
      const idx = h.indexOf(':')
      if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim()
      continue
    }
    if (/^(-d|--data(?:-(?:raw|binary|urlencode))?)$/.test(tok)) {
      bodyParts.push(readFlagValue(tokens, ++i))
      if (method === 'GET') method = 'POST'
      continue
    }
    if (tok === '-F' || tok === '--form') {
      const part = readFlagValue(tokens, ++i)
      const idx = part.indexOf('=')
      if (idx > 0) {
        formData[part.slice(0, idx)] = part.slice(idx + 1)
        if (method === 'GET') method = 'POST'
      }
      continue
    }
    if (tok === '--url') {
      url = readFlagValue(tokens, ++i)
      continue
    }
    if (BOOLEAN_FLAGS.has(tok)) continue
    if (FLAGS_WITH_VALUE.has(tok)) {
      i++
      continue
    }
    if (isUrlCandidate(tok)) {
      url = tok
      continue
    }
  }

  const body = bodyParts.join('&')

  if (!url) return '未能解析 URL'
  url = normalizeCurlUrl(url)
  const urlError = validateHttpUrl(url)
  if (urlError) return urlError
  return { method, url, headers, body, formData }
}

function buildFetchBody(parsed: ParsedCurl): string | null {
  if (Object.keys(parsed.formData).length) {
    const entries = Object.entries(parsed.formData)
      .map(([k, v]) => `    fd.append(${JSON.stringify(k)}, ${JSON.stringify(v)});`)
      .join('\n')
    return `(() => {\n    const fd = new FormData();\n${entries}\n    return fd;\n  })()`
  }
  if (parsed.body) return JSON.stringify(parsed.body)
  return null
}

function inferResponseHandler(parsed: ParsedCurl): string {
  const contentType = Object.entries(parsed.headers).find(
    ([k]) => k.toLowerCase() === 'content-type',
  )?.[1]?.toLowerCase() ?? ''
  if (contentType.includes('json')) return 'const data = await response.json();'
  return 'const data = await response.text();'
}

export function curlToFetch(parsed: ParsedCurl): string {
  const lines = [`const response = await fetch(${JSON.stringify(parsed.url)}, {`, `  method: ${JSON.stringify(parsed.method)},`]
  const headerKeys = Object.keys(parsed.headers)
  if (headerKeys.length) {
    lines.push('  headers: {')
    for (const k of headerKeys) lines.push(`    ${JSON.stringify(k)}: ${JSON.stringify(parsed.headers[k])},`)
    lines.push('  },')
  }
  const bodyExpr = buildFetchBody(parsed)
  if (bodyExpr) lines.push(`  body: ${bodyExpr},`)
  lines.push('});', inferResponseHandler(parsed))
  return lines.join('\n')
}

function buildPythonMultipartFields(formData: Record<string, string>): string {
  const entries = Object.entries(formData)
    .map(([k, v]) => `    ${JSON.stringify(k)}: (None, ${JSON.stringify(v)}),`)
    .join('\n')
  return `{\n${entries}\n  }`
}

export function curlToPython(parsed: ParsedCurl): string {
  const lines = ['import requests', '', `url = ${JSON.stringify(parsed.url)}`]
  if (Object.keys(parsed.headers).length) {
    lines.push(`headers = ${JSON.stringify(parsed.headers, null, 2)}`)
  }
  const hasForm = Object.keys(parsed.formData).length > 0
  if (hasForm) {
    lines.push(`files = ${buildPythonMultipartFields(parsed.formData)}`)
  } else if (parsed.body) {
    lines.push(`data = ${JSON.stringify(parsed.body)}`)
  }
  const args = ['url']
  if (Object.keys(parsed.headers).length) args.push('headers=headers')
  if (hasForm) args.push('files=files')
  else if (parsed.body) args.push('data=data')
  lines.push(`response = requests.${parsed.method.toLowerCase()}(${args.join(', ')})`)
  lines.push('print(response.text)')
  return lines.join('\n')
}

function buildGoMultipartBody(formData: Record<string, string>): { setup: string; bodyVar: string } {
  const fields = Object.entries(formData)
    .map(([k, v]) => `\t_ = bodyWriter.WriteField(${JSON.stringify(k)}, ${JSON.stringify(v)})`)
    .join('\n')
  return {
    setup: `\tbodyBuf := &bytes.Buffer{}
\tbodyWriter := multipart.NewWriter(bodyBuf)
${fields}
\tbodyWriter.Close()
\tbody := bodyBuf`,
    bodyVar: 'body',
  }
}

export function curlToGo(parsed: ParsedCurl): string {
  const headerLines = Object.entries(parsed.headers)
    .map(([k, v]) => `\treq.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`)
    .join('\n')

  const hasForm = Object.keys(parsed.formData).length > 0
  let imports = '"fmt"\n\t"net/http"\n\t"strings"'
  let bodyBlock: string

  if (hasForm) {
    imports = '"bytes"\n\t"fmt"\n\t"mime/multipart"\n\t"net/http"'
    const multipart = buildGoMultipartBody(parsed.formData)
    bodyBlock = `${multipart.setup}
\treq, _ := http.NewRequest(${JSON.stringify(parsed.method)}, ${JSON.stringify(parsed.url)}, ${multipart.bodyVar})
\treq.Header.Set("Content-Type", bodyWriter.FormDataContentType())`
  } else {
    const bodyInit = parsed.body ? `strings.NewReader(${JSON.stringify(parsed.body)})` : 'nil'
    bodyBlock = `\tbody := ${bodyInit}
\treq, _ := http.NewRequest(${JSON.stringify(parsed.method)}, ${JSON.stringify(parsed.url)}, body)`
  }

  return `package main

import (
\t${imports}
)

func main() {
${bodyBlock}
${headerLines}
\tresp, err := http.DefaultClient.Do(req)
\tif err != nil { panic(err) }
\tdefer resp.Body.Close()
\tfmt.Println(resp.Status)
}`
}
