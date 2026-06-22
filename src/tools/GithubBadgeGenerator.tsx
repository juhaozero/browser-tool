import { useMemo, useState } from 'react'
import { CopyButton } from '@/components/CopyButton'
import { ExampleButton } from '@/components/ExampleButton'
import { Alert, Input, Select, TextArea, ToolPanel, ToolSection } from '@/components/ui'
import {
  BADGE_COLOR_PRESETS,
  BADGE_STYLES,
  buildBadgeHtml,
  buildBadgeMarkdown,
  buildShieldsBadgeUrl,
  validateBadgeOptions,
} from '@/lib/github-badge'

const PRESETS = [
  { label: '构建通过', labelText: 'build', message: 'passing', color: 'brightgreen' },
  { label: '构建失败', labelText: 'build', message: 'failing', color: 'red' },
  { label: '版本', labelText: 'version', message: '1.0.0', color: 'blue' },
  { label: 'License MIT', labelText: 'license', message: 'MIT', color: 'blue' },
  { label: 'GitHub Stars', labelText: 'stars', message: '1k', color: 'blue', logo: 'github' },
] as const

export default function GithubBadgeGenerator() {
  const [badgeLabel, setBadgeLabel] = useState('build')
  const [message, setMessage] = useState('passing')
  const [color, setColor] = useState('brightgreen')
  const [style, setStyle] = useState('')
  const [logo, setLogo] = useState('')
  const [logoColor, setLogoColor] = useState('')
  const [link, setLink] = useState('')

  const options = useMemo(
    () => ({
      label: badgeLabel,
      message,
      color,
      style: style || undefined,
      logo: logo || undefined,
      logoColor: logoColor || undefined,
      link: link || undefined,
    }),
    [badgeLabel, message, color, style, logo, logoColor, link],
  )

  const { imageUrl, validationError, markdown, html } = useMemo(() => {
    if (!badgeLabel.trim() && !message.trim()) {
      return { imageUrl: '', validationError: '', markdown: '', html: '' }
    }
    const err = validateBadgeOptions(options)
    if (err) {
      return { imageUrl: '', validationError: err, markdown: '', html: '' }
    }
    const url = buildShieldsBadgeUrl(options)!
    return {
      imageUrl: url,
      validationError: '',
      markdown: buildBadgeMarkdown(url, options),
      html: buildBadgeHtml(url, options),
    }
  }, [options, badgeLabel, message])

  const colorPresetValue = BADGE_COLOR_PRESETS.some((c) => c.value === color) ? color : ''

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setBadgeLabel(preset.labelText)
    setMessage(preset.message)
    setColor(preset.color)
    setLogo('logo' in preset ? preset.logo : '')
  }

  const loadExample = () => {
    setBadgeLabel('build')
    setMessage('passing')
    setColor('brightgreen')
    setStyle('')
    setLogo('')
    setLogoColor('')
    setLink('https://github.com')
  }

  return (
    <ToolPanel className="space-y-4">
      <p className="text-sm text-[var(--text-muted)]">
        生成 shields.io 风格的 GitHub README 徽章 Markdown / HTML，预览图从 img.shields.io 加载。
      </p>

      <div className="flex flex-wrap gap-2">
        <ExampleButton onClick={loadExample} />
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-1.5 text-xs transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToolSection label="标签 (label)">
          <Input value={badgeLabel} onChange={setBadgeLabel} placeholder="build" />
        </ToolSection>
        <ToolSection label="内容 (message)">
          <Input value={message} onChange={setMessage} placeholder="passing" />
        </ToolSection>
        <ToolSection label="颜色">
          <div className="flex gap-2">
            <Input value={color} onChange={setColor} placeholder="brightgreen 或 4c1" />
            <Select
              value={colorPresetValue}
              onChange={(v) => v && setColor(v)}
              options={[{ value: '', label: '选择预设...' }, ...BADGE_COLOR_PRESETS.map((c) => c)]}
            />
          </div>
        </ToolSection>
        <ToolSection label="样式">
          <Select value={style} onChange={setStyle} options={[...BADGE_STYLES]} />
        </ToolSection>
        <ToolSection label="Logo (可选)">
          <Input value={logo} onChange={setLogo} placeholder="github / npm / react" />
        </ToolSection>
        <ToolSection label="Logo 颜色 (可选)">
          <Input value={logoColor} onChange={setLogoColor} placeholder="white" />
        </ToolSection>
        <ToolSection label="点击跳转链接 (可选)">
          <Input value={link} onChange={setLink} placeholder="https://github.com/user/repo" />
        </ToolSection>
      </div>

      {validationError && <Alert type="error">{validationError}</Alert>}

      {imageUrl && (
        <>
          <ToolSection label="预览">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-6">
              <img src={imageUrl} alt={`${badgeLabel} ${message}`} className="max-h-8" />
            </div>
          </ToolSection>

          <ToolSection label="徽章 URL" action={<CopyButton text={imageUrl} />}>
            <TextArea value={imageUrl} readOnly rows={2} />
          </ToolSection>

          <ToolSection label="Markdown" action={<CopyButton text={markdown} />}>
            <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-3 text-sm">
              {markdown}
            </pre>
          </ToolSection>

          <ToolSection label="HTML" action={<CopyButton text={html} />}>
            <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-3 text-sm">
              {html}
            </pre>
          </ToolSection>
        </>
      )}

      <Alert type="info">
        徽章图片由 shields.io 提供，预览与 README 渲染时需联网访问。链接仅允许 http/https。
      </Alert>
    </ToolPanel>
  )
}
