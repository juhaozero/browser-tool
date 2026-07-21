import { describe, expect, it, beforeEach } from 'vitest'
import { pushRecentTool, getRecentToolIds, clearRecentTools } from '@/lib/recent-tools'
import { toggleFavoriteTool, isFavoriteTool, getFavoriteToolIds } from '@/lib/favorites'
import { saveToolDraft, loadToolDraft, clearToolDraft } from '@/lib/tool-draft'
import { getRelatedToolIds } from '@/data/related-tools'

describe('recent-tools', () => {
  beforeEach(() => {
    clearRecentTools()
  })

  it('pushes and dedupes recent tools', () => {
    pushRecentTool('json-formatter')
    pushRecentTool('base64')
    pushRecentTool('json-formatter')
    expect(getRecentToolIds()[0]).toBe('json-formatter')
    expect(getRecentToolIds()).toEqual(['json-formatter', 'base64'])
  })
})

describe('favorites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('toggles favorite', () => {
    expect(isFavoriteTool('hash')).toBe(false)
    expect(toggleFavoriteTool('hash')).toBe(true)
    expect(isFavoriteTool('hash')).toBe(true)
    expect(getFavoriteToolIds()).toContain('hash')
    expect(toggleFavoriteTool('hash')).toBe(false)
    expect(isFavoriteTool('hash')).toBe(false)
  })
})

describe('tool-draft', () => {
  beforeEach(() => {
    clearToolDraft('json-formatter')
  })

  it('saves and loads draft', () => {
    saveToolDraft('json-formatter', 'input', '{"a":1}')
    expect(loadToolDraft('json-formatter', 'input')).toBe('{"a":1}')
    clearToolDraft('json-formatter', 'input')
    expect(loadToolDraft('json-formatter', 'input')).toBeNull()
  })
})

describe('related-tools', () => {
  it('returns related jwt tools', () => {
    const ids = getRelatedToolIds('jwt-decoder')
    expect(ids).toContain('jwt-verifier')
    expect(ids).toContain('jwt-generator')
  })
})
