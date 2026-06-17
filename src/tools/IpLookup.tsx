import { useState } from 'react'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Button, Input, ToolPanel, ToolSection } from '@/components/ui'

const EXAMPLE_IP = '8.8.8.8'

interface IpInfo {
  ip?: string
  success?: boolean
  type?: string
  continent?: string
  country?: string
  region?: string
  city?: string
  isp?: string
  org?: string
  asn?: string
  latitude?: number
  longitude?: number
  timezone?: string
  message?: string
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
      const query = target || ip.trim() || ''
      const url = query
        ? `https://ipwho.is/${encodeURIComponent(query)}`
        : 'https://ipwho.is/'
      const res = await fetch(url)
      const data = (await res.json()) as IpInfo
      if (!data.success) throw new Error(data.message || '查询失败')
      setInfo(data)
      if (data.ip) setIp(data.ip)
    } catch (e) {
      setError(e instanceof Error ? e.message : '查询失败')
    } finally {
      setLoading(false)
    }
  }

  const fields: [string, keyof IpInfo][] = [
    ['IP 地址', 'ip'],
    ['类型', 'type'],
    ['大洲', 'continent'],
    ['国家', 'country'],
    ['地区', 'region'],
    ['城市', 'city'],
    ['运营商', 'isp'],
    ['组织', 'org'],
    ['ASN', 'asn'],
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

      <Alert type="info">IP 查询通过 ipwho.is 接口完成，仅发送查询目标地址，不上传本地其他数据。</Alert>
    </ToolPanel>
  )
}
