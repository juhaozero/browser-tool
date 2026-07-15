/**
 * 从工具注册表与 .env 生成 SEO sitemap。
 * 输出到 public/，由 Vite 构建拷贝到 dist/。
 *
 * 生成文件：
 * - sitemap.xml        标准 URL 列表（Google / Bing 等）
 * - sitemap-index.xml  索引，指向 sitemap.xml
 * - baidusitemap.xml   百度专用（标准 urlset 协议）
 * - robots.txt         声明上述 sitemap 地址
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const TOOLS_FILE = path.join(ROOT, 'src', 'data', 'tools.ts')
const ENV_FILE = path.join(ROOT, '.env')
const OUT_DIR = path.join(ROOT, 'public')

const DEFAULT_SITE_ORIGIN = 'https://app.juhaozero.com'
const DEFAULT_BASE_PATH = '/'

/** 简易解析 .env（KEY=VALUE），忽略注释与空行 */
async function loadEnvFile(filePath) {
  const env = {}
  try {
    const raw = await readFile(filePath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      env[key] = value
    }
  } catch {
    // .env 不存在时使用默认值
  }
  return env
}

function normalizeBasePath(base) {
  if (!base || base === '/') return '/'
  const withLeading = base.startsWith('/') ? base : `/${base}`
  return withLeading.endsWith('/') ? withLeading : `${withLeading}/`
}

function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, '')
}

/** 从 tools.ts 的 tools 数组中提取 id（不 import React 依赖） */
function extractToolIds(source) {
  const marker = 'export const tools'
  const start = source.indexOf(marker)
  if (start === -1) {
    throw new Error(`未在 ${TOOLS_FILE} 中找到 "export const tools"`)
  }

  const slice = source.slice(start)
  const ids = []
  const re = /^\s+id:\s*'([^']+)'/gm
  let match
  while ((match = re.exec(slice)) !== null) {
    ids.push(match[1])
  }

  if (ids.length === 0) {
    throw new Error('未能从 tools 数组解析出任何工具 id')
  }

  return ids
}

function joinUrl(origin, basePath, pathname = '') {
  const base = basePath === '/' ? '/' : basePath
  const cleanPath = pathname.replace(/^\/+/, '')
  if (!cleanPath) {
    return `${origin}${base === '/' ? '/' : base}`
  }
  return `${origin}${base}${cleanPath}`
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

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
  const fileEnv = await loadEnvFile(ENV_FILE)
  const origin = normalizeOrigin(
    process.env.VITE_SITE_ORIGIN || fileEnv.VITE_SITE_ORIGIN || DEFAULT_SITE_ORIGIN,
  )
  const basePath = normalizeBasePath(
    process.env.VITE_BASE_PATH || fileEnv.VITE_BASE_PATH || DEFAULT_BASE_PATH,
  )

  const toolsSource = await readFile(TOOLS_FILE, 'utf8')
  const toolIds = extractToolIds(toolsSource)

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

  await mkdir(OUT_DIR, { recursive: true })

  await writeFile(path.join(OUT_DIR, 'sitemap.xml'), buildSitemapXml(urls, today), 'utf8')
  await writeFile(
    path.join(OUT_DIR, 'sitemap-index.xml'),
    buildSitemapIndexXml(sitemapUrl, today),
    'utf8',
  )
  await writeFile(
    path.join(OUT_DIR, 'baidusitemap.xml'),
    buildBaiduSitemapXml(urls, today),
    'utf8',
  )
  await writeFile(
    path.join(OUT_DIR, 'robots.txt'),
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
