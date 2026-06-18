/**
 * cURL 命令解析与多语言代码生成
 * 支持常见 -X / -H / -d / -F 参数，多行续行符会被展平
 */
export interface ParsedCurl {
  method: string
  url: string
  headers: Record<string, string>
  body: string
  formData: Record<string, string>
}

function readQuotedArg(regex: RegExp, input: string): string[] {
  const values: string[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g')
  while ((match = re.exec(input))) {
    values.push(match[1] ?? match[2] ?? match[3] ?? '')
  }
  return values
}

export function parseCurl(input: string): ParsedCurl | string {
  const trimmed = input.trim().replace(/\\\r?\n/g, ' ')
  if (!trimmed.toLowerCase().startsWith('curl')) return '请输入以 curl 开头的命令'

  let method = 'GET'
  let url = ''
  const headers: Record<string, string> = {}
  let body = ''
  const formData: Record<string, string> = {}

  const urlMatch = trimmed.match(/curl\s+(?:'([^']+)'|"([^"]+)"|(\S+))/i)
  if (urlMatch) url = urlMatch[1] || urlMatch[2] || urlMatch[3] || ''

  const methodMatch = trimmed.match(/-X\s+(\w+)/i)
  if (methodMatch) method = methodMatch[1].toUpperCase()

  const headerRegex = /-H\s+(?:'([^']+)'|"([^"]+)")/gi
  let hm: RegExpExecArray | null
  while ((hm = headerRegex.exec(trimmed))) {
    const h = hm[1] || hm[2]
    const idx = h.indexOf(':')
    if (idx > 0) headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim()
  }

  const dataParts = readQuotedArg(/(?:-d|--data(?:-raw)?)\s+(?:'([^']*)'|"([^"]*)"|(\S+))/gi, trimmed)
  if (dataParts.length) {
    body = dataParts.join('&')
    if (method === 'GET') method = 'POST'
  }

  const formParts = readQuotedArg(/-F\s+(?:'([^']+)'|"([^"]+)"|(\S+))/gi, trimmed)
  for (const part of formParts) {
    const idx = part.indexOf('=')
    if (idx > 0) {
      formData[part.slice(0, idx)] = part.slice(idx + 1)
      if (method === 'GET') method = 'POST'
    }
  }

  if (!url) return '未能解析 URL'
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
