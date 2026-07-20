/** URL 解析：协议、主机、路径、Query、Hash 等 */

export type ParsedUrl = {
  href: string
  protocol: string
  username: string
  password: string
  host: string
  hostname: string
  port: string
  pathname: string
  search: string
  hash: string
  origin: string
  query: { key: string; value: string }[]
}

/** 解析完整 URL；缺协议时自动补 https:// */
export function parseUrl(input: string): ParsedUrl {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('请输入 URL')

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    try {
      url = new URL(`https://${trimmed}`)
    } catch {
      throw new Error('URL 格式无效')
    }
  }

  const query: { key: string; value: string }[] = []
  url.searchParams.forEach((value, key) => {
    query.push({ key, value })
  })

  return {
    href: url.href,
    protocol: url.protocol,
    username: url.username,
    password: url.password,
    host: url.host,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    origin: url.origin,
    query,
  }
}

/** 由字段重建 URL（含 query 列表） */
export function buildUrl(parts: {
  protocol: string
  username?: string
  password?: string
  hostname: string
  port?: string
  pathname?: string
  hash?: string
  query?: { key: string; value: string }[]
}): string {
  const protocol = parts.protocol.endsWith(':') ? parts.protocol : `${parts.protocol}:`
  const url = new URL(`${protocol}//placeholder`)
  url.hostname = parts.hostname
  url.port = parts.port ?? ''
  url.pathname = parts.pathname || '/'
  url.hash = parts.hash?.startsWith('#') ? parts.hash : parts.hash ? `#${parts.hash}` : ''
  url.username = parts.username ?? ''
  url.password = parts.password ?? ''
  url.search = ''
  for (const { key, value } of parts.query ?? []) {
    if (key === '' && value === '') continue
    url.searchParams.append(key, value)
  }
  return url.href
}
