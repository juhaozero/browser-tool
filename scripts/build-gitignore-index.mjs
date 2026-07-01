/**
 * 从 vendor/gitignore submodule 扫描模板，生成前端可用的 JSON 索引。
 * 与 GitHub API 一致：根目录 + Global/ 下的 *.gitignore，不含 community/。
 */
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SUBMODULE = path.join(ROOT, 'vendor', 'gitignore')
const OUT_DIR = path.join(ROOT, 'src', 'data', 'gitignore')

function templateName(filename) {
  return filename.replace(/\.gitignore$/i, '')
}

async function collectFromDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const result = new Map()

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.gitignore')) continue
    const name = templateName(entry.name)
    const content = await readFile(path.join(dir, entry.name), 'utf8')
    result.set(name, content)
  }

  return result
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function main() {
  const namesOut = path.join(OUT_DIR, 'names.json')

  if (!(await exists(SUBMODULE))) {
    if (await exists(namesOut)) {
      console.log('vendor/gitignore 不存在，跳过同步，使用已提交的索引')
      return
    }
    console.error(
      'vendor/gitignore 不存在且无本地索引。请先执行：git submodule update --init --recursive',
    )
    process.exit(1)
  }

  const templates = new Map()

  for (const [name, content] of await collectFromDir(SUBMODULE)) {
    templates.set(name, content)
  }

  const globalDir = path.join(SUBMODULE, 'Global')
  for (const [name, content] of await collectFromDir(globalDir)) {
    if (templates.has(name)) {
      console.warn(`跳过重复模板名: ${name} (Global/ 与根目录冲突)`)
      continue
    }
    templates.set(name, content)
  }

  const names = [...templates.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
  const record = Object.fromEntries(names.map((name) => [name, templates.get(name)]))

  await mkdir(OUT_DIR, { recursive: true })

  await writeFile(
    path.join(OUT_DIR, 'names.json'),
    JSON.stringify(names, null, 2) + '\n',
    'utf8',
  )
  await writeFile(
    path.join(OUT_DIR, 'templates.json'),
    JSON.stringify(record) + '\n',
    'utf8',
  )

  console.log(`已生成 ${names.length} 个 gitignore 模板索引 → src/data/gitignore/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
