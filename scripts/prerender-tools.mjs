/**
 * 构建后预渲染：为每个工具生成独立 HTML（title / description / canonical），
 * 供搜索引擎直接抓取；React hydrate 后替换 #root 内容。
 *
 * 输出：dist/tool/{id}/index.html
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  DIST_DIR,
  SITE_DESCRIPTION,
  SITE_TITLE,
  escapeHtml,
  joinUrl,
  resolveSiteConfig,
} from './lib/site-env.mjs'
import { extractTools } from './lib/tools-registry.mjs'

function toolPageTitle(name) {
  return `${name} — Browser Tool`
}

function injectPageMeta(html, { title, description, canonical, h1, summary }) {
  let out = html

  if (!/<title>[\s\S]*?<\/title>/i.test(out)) {
    throw new Error('模板 HTML 缺少 <title>')
  }
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)

  if (/<meta\s+name=["']description["']/i.test(out)) {
    out = out.replace(
      /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    )
  } else {
    out = out.replace(
      /<head[^>]*>/i,
      (m) => `${m}\n    <meta name="description" content="${escapeHtml(description)}" />`,
    )
  }

  // 去掉旧的 og / canonical，避免重复
  out = out.replace(/\s*<meta\s+property=["']og:(?:title|description)["'][^>]*>/gi, '')
  out = out.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '')

  const headExtra = [
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    canonical ? `    <link rel="canonical" href="${escapeHtml(canonical)}" />` : '',
  ]
    .filter(Boolean)
    .join('\n')

  out = out.replace(/<\/head>/i, `${headExtra}\n  </head>`)

  const shell = `<div id="root"><article><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(summary)}</p></article></div>`
  if (!/<div\s+id=["']root["'][\s\S]*?<\/div>/i.test(out)) {
    throw new Error('模板 HTML 缺少 <div id="root">')
  }
  out = out.replace(/<div\s+id=["']root["'][\s\S]*?<\/div>/i, shell)

  return out
}

async function main() {
  const indexPath = path.join(DIST_DIR, 'index.html')
  let template
  try {
    template = await readFile(indexPath, 'utf8')
  } catch {
    throw new Error(`未找到 ${indexPath}，请先执行 vite build`)
  }

  const { origin, basePath } = await resolveSiteConfig()
  const tools = await extractTools()

  // 首页也补上 canonical / og，便于检索
  const homeCanonical = joinUrl(origin, basePath)
  const homeHtml = injectPageMeta(template, {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    canonical: homeCanonical,
    h1: '浏览器工具箱',
    summary: SITE_DESCRIPTION,
  })
  await writeFile(indexPath, homeHtml, 'utf8')

  for (const tool of tools) {
    const canonical = joinUrl(origin, basePath, `tool/${tool.id}`)
    const html = injectPageMeta(template, {
      title: toolPageTitle(tool.name),
      description: tool.description,
      canonical,
      h1: tool.name,
      summary: tool.description,
    })
    const outDir = path.join(DIST_DIR, 'tool', tool.id)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'index.html'), html, 'utf8')
  }

  console.log(
    `已预渲染 SEO HTML：首页 + ${tools.length} 个工具页 → dist/tool/{id}/index.html` +
      `\n  origin=${origin} base=${basePath}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
