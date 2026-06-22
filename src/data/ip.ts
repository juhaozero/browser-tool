export const DNS_PROVIDERS = [
  {
    name: '阿里 DNS',
    url: 'https://dns.alidns.com/resolve?name=${encoded}&type=${typeParam}',
  },
  {
    name: 'Cloudflare DNS',
    url: 'https://cloudflare-dns.com/dns-query?name=${encoded}&type=${typeParam}',
  },
] as const

/** 构建 IP 地理信息查询 URL；不传 ip 时查询本机公网 IP */
export function buildIpLookupUrl(provider: 'ipSb' | 'ipApiCo' | 'geoJs', ip?: string): string {
  const encoded = ip ? encodeURIComponent(ip) : undefined
  switch (provider) {
    case 'ipSb':
      return encoded ? `https://api.ip.sb/geoip/${encoded}` : 'https://api.ip.sb/geoip'
    case 'ipApiCo':
      return encoded ? `https://ipapi.co/${encoded}/json/` : 'https://ipapi.co/json/'
    case 'geoJs':
      return encoded
        ? `https://get.geojs.io/v1/ip/geo/${encoded}.json`
        : 'https://get.geojs.io/v1/ip/geo.json'
  }
}
