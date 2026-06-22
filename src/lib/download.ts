/** 浏览器 / Tauri 统一文件下载 */

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function extensionFromFilename(filename: string): string | undefined {
  const match = filename.match(/\.([^.]+)$/)
  return match?.[1]?.toLowerCase()
}

function saveDialogFilters(filename: string) {
  const ext = extensionFromFilename(filename)
  if (!ext) return undefined
  return [{ name: ext.toUpperCase(), extensions: [ext] }]
}

/** Tauri WebView 不支持 <a download> + blob:，需弹出保存对话框并写文件 */
async function saveViaTauri(data: Uint8Array, filename: string): Promise<void> {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const { writeFile } = await import('@tauri-apps/plugin-fs')

  const path = await save({
    defaultPath: filename,
    filters: saveDialogFilters(filename),
  })
  if (!path) return

  await writeFile(path, data)
}

function downloadViaBrowser(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  if (isTauriRuntime()) {
    await saveViaTauri(new Uint8Array(await blob.arrayBuffer()), filename)
    return
  }
  downloadViaBrowser(blob, filename)
}

export async function downloadDataUrl(dataUrl: string, filename: string): Promise<void> {
  if (isTauriRuntime()) {
    const res = await fetch(dataUrl)
    await downloadBlob(await res.blob(), filename)
    return
  }
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export async function downloadText(
  text: string,
  filename: string,
  mime = 'text/plain',
): Promise<void> {
  await downloadBlob(new Blob([text], { type: mime }), filename)
}
