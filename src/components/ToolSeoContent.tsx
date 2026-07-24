import { resolveToolSeo } from '@/lib/resolve-tool-seo'
import type { ToolDefinition } from '@/types/tool'

/** 工具页可见 SEO 正文：介绍 / 要点 / FAQ（hydrate 后仍保留，利于爬虫与用户） */
export function ToolSeoContent({ tool }: { tool: ToolDefinition }) {
  const seo = resolveToolSeo(tool)

  return (
    <section className="space-y-4 border-t border-[var(--border)] pt-5">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-[var(--text)]">关于此工具</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">{seo.intro}</p>
      </div>

      {seo.bullets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text)]">功能要点</h3>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {seo.bullets.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-muted)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {seo.faqs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[var(--text)]">常见问题</h3>
          <div className="space-y-2">
            {seo.faqs.map((faq) => (
              <details
                key={faq.q}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2"
              >
                <summary className="cursor-pointer text-sm font-medium text-[var(--text)]">
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
