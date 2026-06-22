/**
 * 统一 HTTP 请求：Web 用 fetch，Tauri 桌面端走 plugin-http（绕过 WebView 限制）
 */

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export async function httpFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isTauriRuntime()) {
    const { fetch } = await import('@tauri-apps/plugin-http')
    return fetch(input, init)
  }
  return fetch(input, init)
}
