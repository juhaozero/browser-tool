/**
 * 构建后预渲染：为每个工具生成独立 HTML
 *（title / description / canonical / 社交 meta / OG 图 / 结构化正文 / JSON-LD），
 * 供搜索引擎与社交平台抓取；React hydrate 后替换 #root 内容。
 *
 * 输出：
 * - dist/tool/{id}/index.html
 * - dist/og/home.{svg,png?}
 * - dist/og/tool-{id}.{svg,png?}
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
import {
  OG_DIR_NAME,
  OG_HEIGHT,
  OG_WIDTH,
  ogPublicUrl,
  resolveOgFontPath,
  writeOgAssets,
} from './lib/og-image.mjs'
import {
  categoryLabelOf,
  extractCategories,
  extractTools,
  loadRelatedToolMap,
  loadToolSeoMap,
  relatedIdsFor,
  resolveToolSeo,
} from './lib/tools-registry.mjs'

function buildArticleHtml({ name, seo, related }) {
  const bullets =
    seo.bullets.length > 0
      ? `<h2>功能要点</h2><ul>${seo.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
      : ''

  const faqs =
    seo.faqs.length > 0
      ? `<h2>常见问题</h2>${seo.faqs
          .map(
            (item) =>
              `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`,
          )
          .join('')}`
      : ''

  const relatedHtml =
    related.length > 0
      ? `<h2>相关工具</h2><ul>${related
          .map(
            (item) =>
              `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.name)}</a> — ${escapeHtml(item.description)}</li>`,
          )
          .join('')}</ul>`
      : ''

  return `<div id="root"><article>
  <h1>${escapeHtml(name)}</h1>
  <p>${escapeHtml(seo.intro)}</p>
  ${bullets}
  ${faqs}
  ${relatedHtml}
</article></div>`
}

function buildBreadcrumbList(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

function buildJsonLd({ name, seo, canonical, related, breadcrumbs, image }) {
  const app = {
    '@type': 'WebApplication',
    name,
    description: seo.description,
    url: canonical,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    inLanguage: 'zh-CN',
  }
  if (image) app.image = image

  const graph = [app]

  if (breadcrumbs?.length) {
    graph.push(buildBreadcrumbList(breadcrumbs))
  }

  if (seo.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: seo.faqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    })
  }

  if (related.length > 0) {
    graph.push({
      '@type': 'ItemList',
      name: `${name}相关工具`,
      itemListElement: related.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.href,
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

function buildSocialMetaTags({
  title,
  description,
  canonical,
  imageUrl,
  imageType,
  imageAlt,
}) {
  const tags = [
    `    <meta property="og:type" content="website" />`,
    `    <meta property="og:site_name" content="Browser Tool" />`,
    `    <meta property="og:locale" content="zh_CN" />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
  ]

  if (canonical) {
    tags.push(`    <meta property="og:url" content="${escapeHtml(canonical)}" />`)
    tags.push(`    <link rel="canonical" href="${escapeHtml(canonical)}" />`)
  }

  if (imageUrl) {
    tags.push(`    <meta property="og:image" content="${escapeHtml(imageUrl)}" />`)
    tags.push(`    <meta property="og:image:width" content="${OG_WIDTH}" />`)
    tags.push(`    <meta property="og:image:height" content="${OG_HEIGHT}" />`)
    tags.push(`    <meta property="og:image:alt" content="${escapeHtml(imageAlt || title)}" />`)
    if (imageType) {
      tags.push(`    <meta property="og:image:type" content="${escapeHtml(imageType)}" />`)
    }
  }

  tags.push(`    <meta name="twitter:card" content="summary_large_image" />`)
  tags.push(`    <meta name="twitter:title" content="${escapeHtml(title)}" />`)
  tags.push(`    <meta name="twitter:description" content="${escapeHtml(description)}" />`)
  if (imageUrl) {
    tags.push(`    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`)
    tags.push(`    <meta name="twitter:image:alt" content="${escapeHtml(imageAlt || title)}" />`)
  }

  return tags
}

function injectPageMeta(html, { title, description, canonical, articleHtml, jsonLd, social }) {
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

  // 去掉旧的社交 / canonical / json-ld，避免重复
  out = out.replace(
    /\s*<meta\s+(?:property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*>/gi,
    '',
  )
  out = out.replace(/\s*<link\s+rel=["']canonical["'][^>]*>/gi, '')
  out = out.replace(/\s*<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')

  const headExtra = [
    ...buildSocialMetaTags({ title, description, canonical, ...social }),
    jsonLd
      ? `    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  out = out.replace(/<\/head>/i, `${headExtra}\n  </head>`)

  if (!/<div\s+id=["']root["'][\s\S]*?<\/div>/i.test(out)) {
    throw new Error('模板 HTML 缺少 <div id="root">')
  }
  out = out.replace(/<div\s+id=["']root["'][\s\S]*?<\/div>/i, articleHtml)

  return out
}

function pickImageMeta(origin, basePath, assets) {
  if (assets.relativePng) {
    return {
      imageUrl: ogPublicUrl(origin, basePath, assets.relativePng),
      imageType: 'image/png',
    }
  }
  return {
    imageUrl: ogPublicUrl(origin, basePath, assets.relativeSvg),
    imageType: 'image/svg+xml',
  }
}

function categoryPageUrl(origin, basePath, categoryId) {
  const home = joinUrl(origin, basePath)
  const normalized = home.endsWith('/') ? home : `${home}/`
  // SPA 分类筛选：/browser/?category=encode
  return `${normalized}?category=${encodeURIComponent(categoryId)}`
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
  const categories = await extractCategories()
  const seoMap = await loadToolSeoMap()
  const relatedMap = await loadRelatedToolMap()
  const toolById = new Map(tools.map((t) => [t.id, t]))
  const fontPath = await resolveOgFontPath()
  const ogDir = path.join(DIST_DIR, OG_DIR_NAME)

  if (!fontPath) {
    console.warn(
      '未找到 CJK 字体，OG 将仅输出 SVG。可将字体放到 scripts/assets/fonts/ 或设置 OG_FONT_PATH。',
    )
  } else {
    console.log(`OG 字体: ${fontPath}`)
  }

  const homeCanonical = joinUrl(origin, basePath)
  const homeOg = await writeOgAssets(
    ogDir,
    'home',
    {
      eyebrow: 'BROWSER TOOL',
      title: '浏览器工具箱',
      description: SITE_DESCRIPTION,
      footer: '本地运行 · 隐私优先',
    },
    fontPath,
  )
  const homeImage = pickImageMeta(origin, basePath, homeOg)

  const homeHtml = injectPageMeta(template, {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    canonical: homeCanonical,
    articleHtml: `<div id="root"><article><h1>浏览器工具箱</h1><p>${escapeHtml(SITE_DESCRIPTION)}</p></article></div>`,
    social: {
      ...homeImage,
      imageAlt: 'Browser Tool 浏览器工具箱',
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'Browser Tool',
          description: SITE_DESCRIPTION,
          url: homeCanonical,
          image: homeImage.imageUrl,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Web Browser',
          inLanguage: 'zh-CN',
        },
        buildBreadcrumbList([{ name: '首页', url: homeCanonical }]),
      ],
    },
  })
  await writeFile(indexPath, homeHtml, 'utf8')

  let enriched = 0
  let pngCount = homeOg.pngPath ? 1 : 0

  for (const tool of tools) {
    const seo = resolveToolSeo(tool, seoMap)
    if (seoMap[tool.id]) enriched += 1

    const canonical = joinUrl(origin, basePath, `tool/${tool.id}`)
    const categoryLabel = categoryLabelOf(categories, tool.category)
    const related = relatedIdsFor(tool.id, relatedMap, tools)
      .map((id) => toolById.get(id))
      .filter(Boolean)
      .map((item) => ({
        name: item.name,
        description: item.description,
        href: joinUrl(origin, basePath, `tool/${item.id}`),
      }))

    const ogAssets = await writeOgAssets(
      ogDir,
      `tool-${tool.id}`,
      {
        eyebrow: `${categoryLabel} · BROWSER TOOL`.toUpperCase(),
        title: tool.name,
        description: seo.description,
        footer: '本地运行 · 隐私优先',
      },
      fontPath,
    )
    if (ogAssets.pngPath) pngCount += 1
    const image = pickImageMeta(origin, basePath, ogAssets)

    const breadcrumbs = [
      { name: '首页', url: homeCanonical },
      { name: categoryLabel, url: categoryPageUrl(origin, basePath, tool.category) },
      { name: tool.name, url: canonical },
    ]

    const html = injectPageMeta(template, {
      title: seo.title,
      description: seo.description,
      canonical,
      articleHtml: buildArticleHtml({ name: tool.name, seo, related }),
      social: {
        ...image,
        imageAlt: `${tool.name} — Browser Tool`,
      },
      jsonLd: buildJsonLd({
        name: tool.name,
        seo,
        canonical,
        related,
        breadcrumbs,
        image: image.imageUrl,
      }),
    })
    const outDir = path.join(DIST_DIR, 'tool', tool.id)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'index.html'), html, 'utf8')
  }

  console.log(
    `已预渲染 SEO HTML：首页 + ${tools.length} 个工具页（增强文案 ${enriched}）` +
      `\n  OG 图：${tools.length + 1} 个 SVG` +
      (pngCount ? `，${pngCount} 个 PNG` : '（无 PNG，缺 CJK 字体）') +
      `\n  origin=${origin} base=${basePath}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
