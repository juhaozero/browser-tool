const STORAGE_KEY = 'browser-tool-last-tool'

export function setLastToolId(id: string) {
  sessionStorage.setItem(STORAGE_KEY, id)
}

export function getLastToolId(): string | null {
  return sessionStorage.getItem(STORAGE_KEY)
}

export function toolCardId(toolId: string) {
  return `tool-${toolId}`
}
