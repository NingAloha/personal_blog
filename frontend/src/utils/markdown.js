import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: false, linkify: true, typographer: true })
const renderCache = new Map()
const MAX_CACHE_SIZE = 50

function getCached(key) {
  if (!renderCache.has(key)) return null
  const value = renderCache.get(key)
  // LRU touch
  renderCache.delete(key)
  renderCache.set(key, value)
  return value
}

function setCached(key, value) {
  if (renderCache.has(key)) {
    renderCache.delete(key)
  }
  renderCache.set(key, value)
  if (renderCache.size > MAX_CACHE_SIZE) {
    const oldestKey = renderCache.keys().next().value
    renderCache.delete(oldestKey)
  }
}

export function renderMarkdown(content) {
  const text = content || ''
  const cached = getCached(text)
  if (cached !== null) return cached
  const html = md.render(text)
  setCached(text, html)
  return html
}
