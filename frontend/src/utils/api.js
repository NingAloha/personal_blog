const BASE = '/api'

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  getProjects: () => get('/projects'),
  getProject: (slug) => get(`/projects/${slug}`),
  getEssays: () => get('/essays'),
  getEssay: (slug) => get(`/essays/${slug}`),
  getTechBlogs: () => get('/tech-blogs'),
  getTechBlog: (slug) => get(`/tech-blogs/${slug}`),
}
