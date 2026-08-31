/**
 * 从工具注册表与 .env 生成 SEO sitemap。
 * 输出到 public/，由 Vite 构建拷贝到 browser/。
 *
 * 生成文件：
 * - sitemap.xml        标准 URL 列表（Google / Bing 等）
 * - sitemap-index.xml  索引，指向 sitemap.xml
 * - baidusitemap.xml   百度专用（标准 urlset 协议）
 * - robots.txt         声明上述 sitemap 地址
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  PUBLIC_DIR,
  escapeXml,
  joinUrl,
  resolveSiteConfig,
} from './lib/site-env.mjs'
import { extractToolIds } from './lib/tools-registry.mjs'

function buildUrlEntries(urls, today) {
  return urls
    .map(
      ({ loc, priority, changefreq }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join('\n')
}

function buildSitemapXml(urls, today) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${buildUrlEntries(urls, today)}
</urlset>
`
}

function buildSitemapIndexXml(sitemapUrl, today) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(sitemapUrl)}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`
}

/** 百度接受标准 urlset；单独文件便于站长平台提交 */
function buildBaiduSitemapXml(urls, today) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${buildUrlEntries(urls, today)}
</urlset>
`
}

function buildRobotsTxt(sitemapIndexUrl, baiduSitemapUrl) {
  return `User-agent: *
Allow: /

Sitemap: ${sitemapIndexUrl}
Sitemap: ${baiduSitemapUrl}
`
}

async function main() {
  const { origin, basePath } = await resolveSiteConfig()
  const toolIds = await extractToolIds()

  const today = new Date().toISOString().slice(0, 10)
  const homeUrl = joinUrl(origin, basePath)
  const urls = [
    { loc: homeUrl, priority: '1.0', changefreq: 'daily' },
    ...toolIds.map((id) => ({
      loc: joinUrl(origin, basePath, `tool/${id}`),
      priority: '0.8',
      changefreq: 'weekly',
    })),
  ]

  const sitemapUrl = joinUrl(origin, basePath, 'sitemap.xml')
  const sitemapIndexUrl = joinUrl(origin, basePath, 'sitemap-index.xml')
  const baiduSitemapUrl = joinUrl(origin, basePath, 'baidusitemap.xml')

  await mkdir(PUBLIC_DIR, { recursive: true })

  await writeFile(path.join(PUBLIC_DIR, 'sitemap.xml'), buildSitemapXml(urls, today), 'utf8')
  await writeFile(
    path.join(PUBLIC_DIR, 'sitemap-index.xml'),
    buildSitemapIndexXml(sitemapUrl, today),
    'utf8',
  )
  await writeFile(
    path.join(PUBLIC_DIR, 'baidusitemap.xml'),
    buildBaiduSitemapXml(urls, today),
    'utf8',
  )
  await writeFile(
    path.join(PUBLIC_DIR, 'robots.txt'),
    buildRobotsTxt(sitemapIndexUrl, baiduSitemapUrl),
    'utf8',
  )

  console.log(
    `已生成 sitemap（${urls.length} 条 URL，${toolIds.length} 个工具）→ public/` +
      `\n  origin=${origin} base=${basePath}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
