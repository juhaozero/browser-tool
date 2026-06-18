import { useState } from 'react'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection } from '@/components/ui'

const EXAMPLE_IP = '8.8.8.8'

interface IpInfo {
  ip?: string
  type?: string
  country?: string
  region?: string
  city?: string
  isp?: string
  org?: string
  latitude?: number
  longitude?: number
  timezone?: string
}

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/

function isValidIpv4(value: string): boolean {
  if (!IPV4_RE.test(value)) return false
  return value.split('.').every((part) => {
    const n = Number(part)
    return Number.isInteger(n) && n >= 0 && n <= 255
  })
}

function isValidIpv6(value: string): boolean {
  if (!/^[\da-f:.]+$/i.test(value)) return false
  try {
    new URL(`http://[${value}]`)
    return true
  } catch {
    return false
  }
}

function isIpAddress(value: string): boolean {
  return isValidIpv4(value) || isValidIpv6(value)
}

function isValidHostname(host: string): boolean {
  if (!host || host.length > 253) return false
  if (host.startsWith('.') || host.endsWith('.') || host.includes('..')) return false
  const labels = host.split('.')
  return labels.every((label) => {
    if (label.length === 0 || label.length > 63) return false
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label)
  })
}

/** 校验查询目标，空字符串表示查询本机公网 IP */
function validateQuery(query: string): string | null {
  if (!query) return null
  if (isValidIpv4(query) || isValidIpv6(query) || isValidHostname(query)) return null
  return '请输入有效的 IP 地址或域名（仅支持字母、数字、连字符和点）'
}

function detectIpType(value: string): string | undefined {
  if (isValidIpv4(value)) return 'IPv4'
  if (value.includes(':')) return 'IPv6'
  return undefined
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

async function resolveViaDns(
  provider: 'alidns' | 'cloudflare',
  host: string,
  recordType: 'A' | 'AAAA',
  init?: RequestInit,
): Promise<string> {
  const encoded = encodeURIComponent(host)
  const typeParam = recordType === 'A' ? 'A' : 'AAAA'
  const dnsType = recordType === 'A' ? 1 : 28
  const url =
    provider === 'alidns'
      ? `https://dns.alidns.com/resolve?name=${encoded}&type=${typeParam}`
      : `https://cloudflare-dns.com/dns-query?name=${encoded}&type=${typeParam}`

  const data = await fetchJson<{
    Answer?: Array<{ type: number; data: string }>
    Status?: number
  }>(url, init)
  if (data.Status !== 0 || !data.Answer?.length) {
    throw new Error('无法解析该域名')
  }
  const ip = data.Answer.find((item) => item.type === dnsType)?.data
  if (!ip) throw new Error('无法解析该域名')
  return ip
}

async function resolveHost(host: string): Promise<string> {
  const trimmed = host.trim()
  if (isIpAddress(trimmed)) return trimmed

  const attempts: Array<() => Promise<string>> = [
    () => resolveViaDns('alidns', trimmed, 'A'),
    () =>
      resolveViaDns('cloudflare', trimmed, 'A', {
        headers: { Accept: 'application/dns-json' },
      }),
    () => resolveViaDns('alidns', trimmed, 'AAAA'),
    () =>
      resolveViaDns('cloudflare', trimmed, 'AAAA', {
        headers: { Accept: 'application/dns-json' },
      }),
  ]

  let lastError: Error | null = null
  for (const resolve of attempts) {
    try {
      return await resolve()
    } catch (e) {
      lastError = e instanceof Error ? e : new Error('域名解析失败')
    }
  }
  throw lastError ?? new Error('域名解析失败')
}

function formatCountry(name?: string, code?: string): string | undefined {
  if (!name && !code) return undefined
  if (name && code) return `${name} (${code})`
  return name ?? code
}

async function lookupViaIpSb(ip?: string): Promise<IpInfo> {
  const url = ip
    ? `https://api.ip.sb/geoip/${encodeURIComponent(ip)}`
    : 'https://api.ip.sb/geoip'
  const data = await fetchJson<{
    ip?: string
    country?: string
    country_code?: string
    region?: string
    city?: string
    isp?: string
    organization?: string
    latitude?: number
    longitude?: number
    timezone?: string
  }>(url)
  if (!data.ip) throw new Error('未获取到 IP 信息')
  return {
    ip: data.ip,
    type: detectIpType(data.ip),
    country: formatCountry(data.country, data.country_code),
    region: data.region,
    city: data.city,
    isp: data.isp,
    org: data.organization,
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
  }
}

async function lookupViaIpApiCo(ip?: string): Promise<IpInfo> {
  const url = ip
    ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
    : 'https://ipapi.co/json/'
  const data = await fetchJson<{
    ip?: string
    error?: boolean
    reason?: string
    country_name?: string
    country_code?: string
    region?: string
    city?: string
    org?: string
    latitude?: number
    longitude?: number
    timezone?: string
  }>(url)
  if (data.error) throw new Error(data.reason || '查询失败')
  if (!data.ip) throw new Error('未获取到 IP 信息')
  return {
    ip: data.ip,
    type: detectIpType(data.ip),
    country: formatCountry(data.country_name, data.country_code),
    region: data.region,
    city: data.city,
    isp: data.org,
    org: data.org,
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
  }
}

async function lookupViaGeoJs(ip?: string): Promise<IpInfo> {
  const url = ip
    ? `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(ip)}.json`
    : 'https://get.geojs.io/v1/ip/geo.json'
  const data = await fetchJson<{
    ip?: string
    error?: string
    country?: string
    country_code?: string
    region?: string
    city?: string
    organization_name?: string
    latitude?: string
    longitude?: string
    timezone?: string
  }>(url)
  if (data.error) throw new Error(data.error)
  if (!data.ip) throw new Error('未获取到 IP 信息')
  return {
    ip: data.ip,
    type: detectIpType(data.ip),
    country: formatCountry(data.country, data.country_code),
    region: data.region,
    city: data.city,
    isp: data.organization_name,
    org: data.organization_name,
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
    timezone: data.timezone,
  }
}

async function lookupGeo(ip?: string): Promise<IpInfo> {
  const providers = [lookupViaIpSb, lookupViaIpApiCo, lookupViaGeoJs]
  let lastError: Error | null = null

  for (const provider of providers) {
    try {
      return await provider(ip)
    } catch (e) {
      lastError =
        e instanceof TypeError && e.message === 'Failed to fetch'
          ? new Error('网络请求失败，接口可能无法访问')
          : e instanceof Error
            ? e
            : new Error('查询失败')
    }
  }

  throw (
    lastError ??
    new Error('所有查询接口均不可用，请检查网络或稍后重试')
  )
}

export default function IpLookup() {
  const [ip, setIp] = useState(EXAMPLE_IP)
  const [info, setInfo] = useState<IpInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async (target?: string) => {
    const query = target !== undefined ? target : ip.trim()

    if (target === undefined && !ip.trim()) {
      setError('请输入 IP 或域名')
      setInfo(null)
      return
    }

    if (target !== '' && query) {
      const validationError = validateQuery(query)
      if (validationError) {
        setError(validationError)
        setInfo(null)
        return
      }
    }

    setLoading(true)
    setError('')
    setInfo(null)
    try {
      const resolved = query ? await resolveHost(query) : undefined
      const mapped = await lookupGeo(resolved)
      setInfo(mapped)
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询失败')
    } finally {
      setLoading(false)
    }
  }

  const fields: [string, keyof IpInfo][] = [
    ['IP 地址', 'ip'],
    ['类型', 'type'],
    ['国家', 'country'],
    ['地区', 'region'],
    ['城市', 'city'],
    ['运营商', 'isp'],
    ['组织', 'org'],
    ['时区', 'timezone'],
  ]

  return (
    <ToolPanel className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={() => setIp(EXAMPLE_IP)} />
        <Button variant="primary" onClick={() => lookup()} disabled={loading}>
          {loading ? '查询中...' : '查询 IP'}
        </Button>
        <Button onClick={() => lookup('')} disabled={loading}>
          查询本机公网 IP
        </Button>
      </div>

      <ToolSection label="IP 地址或域名">
        <Input value={ip} onChange={setIp} placeholder="8.8.8.8 或 example.com" />
      </ToolSection>

      {error && <Alert type="error">{error}</Alert>}

      {info && (
        <div className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm sm:grid-cols-2">
          {fields.map(([label, key]) =>
            info[key] ? (
              <div key={key}>
                <span className="text-[var(--text-muted)]">{label}：</span>
                {String(info[key])}
              </div>
            ) : null,
          )}
          {info.latitude != null && info.longitude != null && (
            <div>
              <span className="text-[var(--text-muted)]">坐标：</span>
              {info.latitude}, {info.longitude}
            </div>
          )}
        </div>
      )}

      <Alert type="info">
        IP 查询在浏览器中直连第三方接口（ip.sb / ipapi.co / GeoJS
        自动回退），域名解析依次尝试 A / AAAA 记录（阿里 DNS、Cloudflare DNS）。
      </Alert>
    </ToolPanel>
  )
}
