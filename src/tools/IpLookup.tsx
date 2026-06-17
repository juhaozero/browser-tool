import { useState } from 'react'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection } from '@/components/ui'

const EXAMPLE_IP = '8.8.8.8'

interface GeoJsResponse {
  ip?: string
  country?: string
  country_code?: string
  region?: string
  city?: string
  organization_name?: string
  latitude?: string
  longitude?: string
  timezone?: string
  error?: string
}

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

function isIpAddress(value: string): boolean {
  if (IPV4_RE.test(value)) return true
  return value.includes(':') && /^[\da-f:.]+$/i.test(value)
}

function detectIpType(value: string): string | undefined {
  if (IPV4_RE.test(value)) return 'IPv4'
  if (value.includes(':')) return 'IPv6'
  return undefined
}

async function resolveHost(host: string): Promise<string> {
  const trimmed = host.trim()
  if (isIpAddress(trimmed)) return trimmed

  const res = await fetch(
    `https://dns.google/resolve?name=${encodeURIComponent(trimmed)}&type=A`,
  )
  if (!res.ok) throw new Error('域名解析失败')
  const data = (await res.json()) as {
    Answer?: Array<{ type: number; data: string }>
  }
  const ip = data.Answer?.find((item) => item.type === 1)?.data
  if (!ip) throw new Error('无法解析该域名')
  return ip
}

function mapGeoJs(data: GeoJsResponse): IpInfo {
  return {
    ip: data.ip,
    type: data.ip ? detectIpType(data.ip) : undefined,
    country: data.country_code
      ? `${data.country ?? ''} (${data.country_code})`.trim()
      : data.country,
    region: data.region,
    city: data.city,
    isp: data.organization_name,
    org: data.organization_name,
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
    timezone: data.timezone,
  }
}

export default function IpLookup() {
  const [ip, setIp] = useState(EXAMPLE_IP)
  const [info, setInfo] = useState<IpInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const lookup = async (target?: string) => {
    setLoading(true)
    setError('')
    setInfo(null)
    try {
      const query = target ?? ip.trim()
      const resolved = query ? await resolveHost(query) : ''
      const url = resolved
        ? `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(resolved)}.json`
        : 'https://get.geojs.io/v1/ip/geo.json'
      const res = await fetch(url)
      if (!res.ok) throw new Error('查询失败')
      const data = (await res.json()) as GeoJsResponse
      if (data.error) throw new Error(data.error)
      if (!data.ip) throw new Error('未获取到 IP 信息')
      const mapped = mapGeoJs(data)
      setInfo(mapped)
      setIp(mapped.ip ?? query)
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
        IP 查询通过 GeoJS 接口完成（支持浏览器直连）。域名会先经 Google DNS 解析为 IP
        后再查询，仅发送查询目标地址，不上传本地其他数据。
      </Alert>
    </ToolPanel>
  )
}
