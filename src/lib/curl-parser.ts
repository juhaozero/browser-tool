export interface ParsedCurl {
  method: string
  url: string
  headers: Record<string, string>
  body: string
}

export function parseCurl(input: string): ParsedCurl | string {
  const trimmed = input.trim().replace(/\\\r?\n/g, ' ')
  if (!trimmed.toLowerCase().startsWith('curl')) return '请输入以 curl 开头的命令'

  let method = 'GET'
  let url = ''
  const headers: Record<string, string> = {}
  let body = ''

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

  const dataMatch = trimmed.match(/(?:-d|--data(?:-raw)?)\s+(?:'([^']*)'|"([^"]*)"|(\S+))/i)
  if (dataMatch) {
    body = dataMatch[1] ?? dataMatch[2] ?? dataMatch[3] ?? ''
    if (method === 'GET') method = 'POST'
  }

  if (!url) return '未能解析 URL'
  return { method, url, headers, body }
}

export function curlToFetch(parsed: ParsedCurl): string {
  const lines = [`const response = await fetch('${parsed.url}', {`, `  method: '${parsed.method}',`]
  const headerKeys = Object.keys(parsed.headers)
  if (headerKeys.length) {
    lines.push('  headers: {')
    for (const k of headerKeys) lines.push(`    '${k}': '${parsed.headers[k]}',`)
    lines.push('  },')
  }
  if (parsed.body) lines.push(`  body: ${JSON.stringify(parsed.body)},`)
  lines.push('});', 'const data = await response.json();')
  return lines.join('\n')
}

export function curlToPython(parsed: ParsedCurl): string {
  const lines = ['import requests', '', `url = '${parsed.url}'`]
  if (Object.keys(parsed.headers).length) {
    lines.push(`headers = ${JSON.stringify(parsed.headers, null, 2)}`)
  }
  if (parsed.body) lines.push(`data = ${JSON.stringify(parsed.body)}`)
  const args = ['url']
  if (Object.keys(parsed.headers).length) args.push('headers=headers')
  if (parsed.body) args.push('data=data')
  lines.push(`response = requests.${parsed.method.toLowerCase()}(${args.join(', ')})`)
  lines.push('print(response.text)')
  return lines.join('\n')
}

export function curlToGo(parsed: ParsedCurl): string {
  return `package main

import (
\t"fmt"
\t"net/http"
\t"strings"
)

func main() {
\tbody := strings.NewReader(${JSON.stringify(parsed.body)})
\treq, _ := http.NewRequest("${parsed.method}", "${parsed.url}", body)
${Object.entries(parsed.headers).map(([k, v]) => `\treq.Header.Set("${k}", "${v}")`).join('\n')}
\tresp, err := http.DefaultClient.Do(req)
\tif err != nil { panic(err) }
\tdefer resp.Body.Close()
\tfmt.Println(resp.Status)
}`
}
