import { httpFetch } from '@/lib/http-client'

export type GitignoreCategory = 'language' | 'framework' | 'editor' | 'os' | 'env'

export interface GitignoreTemplateMeta {
  name: string // 与 GitHub 官方模板名一致
  label: string
  category: GitignoreCategory
  tags: string[] // 搜索关键词
}

export const GITIGNORE_CATEGORIES: { id: GitignoreCategory; label: string }[] = [
  { id: 'language', label: '编程语言' },
  { id: 'framework', label: '框架' },
  { id: 'editor', label: '编辑器 / IDE' },
  { id: 'os', label: '操作系统' },
  { id: 'env', label: '环境 / 工具' },
]

/** GitHub gitignore 模板元数据（名称与官方模板一致） */
export const GITIGNORE_META: GitignoreTemplateMeta[] = [
  { name: 'Node', label: 'Node.js', category: 'language', tags: ['node', 'javascript', 'npm', 'js'] },
  { name: 'Python', label: 'Python', category: 'language', tags: ['python', 'pip', 'py'] },
  { name: 'Go', label: 'Go', category: 'language', tags: ['go', 'golang'] },
  { name: 'Java', label: 'Java', category: 'language', tags: ['java', 'maven', 'gradle'] },
  { name: 'Rust', label: 'Rust', category: 'language', tags: ['rust', 'cargo'] },
  { name: 'C++', label: 'C++', category: 'language', tags: ['cpp', 'c++'] },
  { name: 'C', label: 'C', category: 'language', tags: ['c'] },
  { name: 'Csharp', label: 'C#', category: 'language', tags: ['csharp', 'c#', 'dotnet'] },
  { name: 'Ruby', label: 'Ruby', category: 'language', tags: ['ruby', 'rails'] },
  { name: 'PHP', label: 'PHP', category: 'language', tags: ['php', 'composer'] },
  { name: 'Swift', label: 'Swift', category: 'language', tags: ['swift', 'ios'] },
  { name: 'Kotlin', label: 'Kotlin', category: 'language', tags: ['kotlin', 'android'] },
  { name: 'Dart', label: 'Dart', category: 'language', tags: ['dart', 'flutter'] },
  { name: 'Elixir', label: 'Elixir', category: 'language', tags: ['elixir'] },
  { name: 'Lua', label: 'Lua', category: 'language', tags: ['lua'] },
  { name: 'R', label: 'R', category: 'language', tags: ['r'] },
  { name: 'Scala', label: 'Scala', category: 'language', tags: ['scala'] },
  { name: 'Haskell', label: 'Haskell', category: 'language', tags: ['haskell'] },
  { name: 'React', label: 'React', category: 'framework', tags: ['react', 'jsx'] },
  { name: 'Nextjs', label: 'Next.js', category: 'framework', tags: ['next', 'nextjs'] },
  { name: 'Vue', label: 'Vue', category: 'framework', tags: ['vue'] },
  { name: 'Nuxt', label: 'Nuxt', category: 'framework', tags: ['nuxt', 'vue'] },
  { name: 'Angular', label: 'Angular', category: 'framework', tags: ['angular'] },
  { name: 'Svelte', label: 'Svelte', category: 'framework', tags: ['svelte'] },
  { name: 'Django', label: 'Django', category: 'framework', tags: ['django', 'python'] },
  { name: 'Flask', label: 'Flask', category: 'framework', tags: ['flask', 'python'] },
  { name: 'Rails', label: 'Ruby on Rails', category: 'framework', tags: ['rails', 'ruby'] },
  { name: 'Laravel', label: 'Laravel', category: 'framework', tags: ['laravel', 'php'] },
  { name: 'Symfony', label: 'Symfony', category: 'framework', tags: ['symfony', 'php'] },
  { name: 'SpringBoot', label: 'Spring Boot', category: 'framework', tags: ['spring', 'java'] },
  { name: 'Dotnet', label: '.NET', category: 'framework', tags: ['dotnet', 'asp'] },
  { name: 'Unity', label: 'Unity', category: 'framework', tags: ['unity', 'game'] },
  { name: 'VisualStudioCode', label: 'VS Code', category: 'editor', tags: ['vscode', 'code'] },
  { name: 'VisualStudio', label: 'Visual Studio', category: 'editor', tags: ['visualstudio', 'vs'] },
  { name: 'JetBrains', label: 'JetBrains IDEs', category: 'editor', tags: ['jetbrains', 'idea', 'webstorm'] },
  { name: 'Vim', label: 'Vim', category: 'editor', tags: ['vim'] },
  { name: 'Emacs', label: 'Emacs', category: 'editor', tags: ['emacs'] },
  { name: 'SublimeText', label: 'Sublime Text', category: 'editor', tags: ['sublime'] },
  { name: 'macOS', label: 'macOS', category: 'os', tags: ['mac', 'macos', 'apple'] },
  { name: 'Windows', label: 'Windows', category: 'os', tags: ['windows', 'win'] },
  { name: 'Linux', label: 'Linux', category: 'os', tags: ['linux'] },
  { name: 'Docker', label: 'Docker', category: 'env', tags: ['docker', 'container'] },
  { name: 'Terraform', label: 'Terraform', category: 'env', tags: ['terraform', 'iac'] },
  { name: 'Kubernetes', label: 'Kubernetes', category: 'env', tags: ['k8s', 'kubernetes'] },
  { name: 'Vagrant', label: 'Vagrant', category: 'env', tags: ['vagrant'] },
  { name: 'Ansible', label: 'Ansible', category: 'env', tags: ['ansible'] },
  { name: 'GitBook', label: 'GitBook', category: 'env', tags: ['gitbook', 'docs'] },
]

export function getMetaMap(): Map<string, GitignoreTemplateMeta> {
  return new Map(GITIGNORE_META.map((m) => [m.name, m]))
}

/** 从 GitHub 官方 API 拉取全部模板名称 */
export async function fetchTemplateNames(): Promise<string[]> {
  const res = await httpFetch('https://api.github.com/gitignore/templates')
  if (!res.ok) throw new Error('获取模板列表失败')
  return res.json()
}

export async function fetchTemplateContent(name: string): Promise<string> {
  const res = await httpFetch(`https://api.github.com/gitignore/templates/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`获取模板 ${name} 失败`)
  const data = (await res.json()) as { source: string }
  return data.source
}

/** 合并多个模板，每段以注释头分隔 */
export async function mergeTemplates(names: string[]): Promise<string> {
  const parts: string[] = []
  for (const name of names) {
    const content = await fetchTemplateContent(name)
    parts.push(`# --- ${name} ---\n${content.trim()}`)
  }
  return parts.join('\n\n') + '\n'
}
