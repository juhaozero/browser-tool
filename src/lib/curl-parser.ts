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
      while (i < input.length && input[i] !== quote) val += input[i++]
      if (i < input.length) i++
      tokens.push(val)
      continue
    }
    let val = ''
    while (i < input.length && !/\s/.test(input[i])) val += input[i++]
    tokens.push(val)
  }
  return tokens
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
  return !token.startsWith('-') && /^https?:\/\//i.test(token)
}

function readFlagValue(tokens: string[], index: number): string {
  return tokens[index] ?? ''
}

export function parseCurl(input: string): ParsedCurl | string {
  const trimmed = input.trim().replace(/\\\r?\n/g, ' ')
  if (!trimmed.toLowerCase().startsWith('curl')) return '请输入以 curl 开头的命令'

  const tokens = tokenizeCurlInput(trimmed)
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
  lines.push('});', 'const data = await response.json();')
  return lines.join('\n')
}

export function curlToPython(parsed: ParsedCurl): string {
  const lines = ['import requests', '', `url = ${JSON.stringify(parsed.url)}`]
  if (Object.keys(parsed.headers).length) {
    lines.push(`headers = ${JSON.stringify(parsed.headers, null, 2)}`)
  }
  if (Object.keys(parsed.formData).length) {
    lines.push(`files = ${JSON.stringify(parsed.formData, null, 2)}`)
  } else if (parsed.body) {
    lines.push(`data = ${JSON.stringify(parsed.body)}`)
  }
  const args = ['url']
  if (Object.keys(parsed.headers).length) args.push('headers=headers')
  if (Object.keys(parsed.formData).length) args.push('data=files')
  else if (parsed.body) args.push('data=data')
  lines.push(`response = requests.${parsed.method.toLowerCase()}(${args.join(', ')})`)
  lines.push('print(response.text)')
  return lines.join('\n')
}

export function curlToGo(parsed: ParsedCurl): string {
  const headerLines = Object.entries(parsed.headers)
    .map(([k, v]) => `\treq.Header.Set(${JSON.stringify(k)}, ${JSON.stringify(v)})`)
    .join('\n')
  const bodyInit = parsed.body ? `strings.NewReader(${JSON.stringify(parsed.body)})` : 'nil'
  return `package main

import (
\t"fmt"
\t"net/http"
\t"strings"
)

func main() {
\tbody := ${bodyInit}
\treq, _ := http.NewRequest(${JSON.stringify(parsed.method)}, ${JSON.stringify(parsed.url)}, body)
${headerLines}
\tresp, err := http.DefaultClient.Do(req)
\tif err != nil { panic(err) }
\tdefer resp.Body.Close()
\tfmt.Println(resp.Status)
}`
}
