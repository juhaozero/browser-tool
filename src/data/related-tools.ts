/**
 * 相关工具推荐 — 按工具 id 映射
 * 未列出的工具会回退到同分类其它工具
 */
export const relatedToolMap: Record<string, string[]> = {
  'json-formatter': ['data-converter', 'json-diff', 'markup-formatter'],
  'markup-formatter': ['data-converter', 'json-formatter', 'sql-formatter'],
  'data-converter': ['json-formatter', 'markup-formatter', 'json-diff'],
  'json-diff': ['json-formatter', 'text-diff', 'data-converter'],
  'sql-formatter': ['json-formatter', 'code-formatter', 'markup-formatter'],
  'code-formatter': ['json-formatter', 'sql-formatter', 'regex-tester'],
  'markdown-preview': ['json-formatter', 'html-entity', 'github-badge'],
  'radix-converter': ['hash', 'color-converter', 'timestamp'],
  base64: ['data-uri', 'url-encoder', 'hash'],
  'url-encoder': ['url-parser', 'base64', 'html-entity'],
  'url-parser': ['url-encoder', 'curl-converter'],
  'html-entity': ['unicode-escape', 'url-encoder', 'base64'],
  'unicode-escape': ['html-entity', 'base64'],
  'data-uri': ['base64', 'image-convert'],
  hash: ['aes-crypto', 'password-generator', 'jwt-decoder'],
  'aes-crypto': ['hash', 'password-generator', 'jwt-generator'],
  'jwt-decoder': ['jwt-verifier', 'jwt-generator'],
  'jwt-generator': ['jwt-verifier', 'jwt-decoder'],
  'jwt-verifier': ['jwt-decoder', 'jwt-generator'],
  'password-generator': ['hash', 'id-generator', 'uuid-generator'],
  'uuid-generator': ['id-generator', 'password-generator'],
  'id-generator': ['uuid-generator', 'password-generator'],
  'qr-code': ['qr-scanner', 'url-encoder'],
  'qr-scanner': ['qr-code', 'image-convert'],
  'image-convert': ['image-compressor', 'image-resizer', 'data-uri'],
  'image-compressor': ['image-resizer', 'image-convert'],
  'image-resizer': ['image-compressor', 'image-convert'],
  'text-diff': ['json-diff', 'text-statistics', 'text-dedupe'],
  'text-statistics': ['text-diff', 'text-dedupe', 'lorem-generator'],
  'text-dedupe': ['text-diff', 'case-converter'],
  'case-converter': ['text-dedupe', 'regex-tester'],
  'regex-tester': ['code-formatter', 'case-converter', 'text-diff'],
  'color-converter': ['github-badge', 'image-convert'],
  cron: ['timestamp'],
  timestamp: ['cron'],
  'curl-converter': ['url-parser', 'json-formatter'],
  'gitignore-generator': ['github-badge'],
  'github-badge': ['gitignore-generator', 'markdown-preview'],
  'pem-viewer': ['jwt-decoder', 'aes-crypto', 'hash'],
  'lorem-generator': ['text-statistics', 'password-generator'],
  'ip-lookup': ['url-parser', 'curl-converter'],
}

export function getRelatedToolIds(toolId: string, limit = 4): string[] {
  const mapped = relatedToolMap[toolId] ?? []
  return mapped.slice(0, limit)
}
