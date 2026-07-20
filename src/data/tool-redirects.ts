/**
 * 旧工具 ID → 新路径（含可选 query），用于书签与外链兼容
 * Navigate 目标形如 `hash?algo=md5` → `/tool/hash?algo=md5`
 */
export const toolRedirects: Record<string, string> = {
  sha256: 'hash?algo=sha-256',
  md5: 'hash?algo=md5',
  'image-to-png': 'image-convert?format=png',
  'image-to-jpg': 'image-convert?format=jpg',
  'image-to-webp': 'image-convert?format=webp',
  'image-to-avif': 'image-convert?format=avif',
  'image-to-ico': 'image-convert?format=ico',
}

/** 解析重定向目标中的工具 id（去掉 query） */
export function canonicalToolId(id: string): string {
  const target = toolRedirects[id]
  if (!target) return id
  return target.split('?')[0] ?? id
}
