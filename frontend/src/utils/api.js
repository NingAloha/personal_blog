const BASE = '/api'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function post(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function withLang(path, lang) {
  if (!lang) return path
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}lang=${encodeURIComponent(lang)}`
}

export const api = {
  getProjects: () => get('/projects'),
  getProject: (slug) => get(`/projects/${slug}`),
  getEssays: () => get('/essays'),
  getEssay: (slug) => get(`/essays/${slug}`),
  getTechBlogs: (lang) => get(withLang('/tech-blogs', lang)),
  getTechBlog: (slug, lang) => get(withLang(`/tech-blogs/${slug}`, lang)),
  getSiteStats: () => get('/stats/site'),
  trackSiteVisit: () => post('/stats/site/visit'),
  getArticleStats: (slug) => get(`/stats/article/${slug}`),
  trackArticleVisit: (slug) => post(`/stats/article/${slug}/visit`),
}
