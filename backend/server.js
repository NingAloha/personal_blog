import express from 'express'
import cors from 'cors'
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, basename } from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, 'content')
const DATA_DIR = process.env.DATA_DIR || join(__dirname, 'data')
const STATS_FILE = join(DATA_DIR, 'stats.json')
const VISIT_DEDUPE_WINDOW_MS = 10 * 60 * 1000

const app = express()
app.use(cors())
app.use(express.json())

function ensureStatsStore() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!existsSync(STATS_FILE)) {
    writeFileSync(
      STATS_FILE,
      JSON.stringify({ siteVisits: 0, articleViews: {} }, null, 2),
      'utf-8'
    )
  }
}

function readStats() {
  ensureStatsStore()
  return JSON.parse(readFileSync(STATS_FILE, 'utf-8'))
}

function writeStats(stats) {
  ensureStatsStore()
  writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf-8')
}

function visitorKey(req, scope) {
  const cfIp = req.headers['cf-connecting-ip']
  const forwardedIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
  const ip = cfIp || forwardedIp || req.socket.remoteAddress || 'unknown'
  const ua = req.headers['user-agent'] || 'unknown'
  return `${scope}:${ip}:${ua}`
}

const visitDedupeCache = new Map()

function shouldCountVisit(req, scope) {
  const key = visitorKey(req, scope)
  const now = Date.now()
  const lastSeen = visitDedupeCache.get(key)
  visitDedupeCache.set(key, now)
  return !lastSeen || now - lastSeen > VISIT_DEDUPE_WINDOW_MS
}

// ── 通用：读取某类内容的所有文件 ──
function readAllItems(type) {
  const dir = join(CONTENT_DIR, type)
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const slug = basename(file, '.md')
      const raw = readFileSync(join(dir, file), 'utf-8')
      const { data } = matter(raw)
      return { slug, ...data }
    })
    .sort((a, b) => {
      // 优先置顶 featured，其次按日期/startDate 倒序
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      const da = a.date || a.startDate || ''
      const db = b.date || b.startDate || ''
      return db.localeCompare(da)
    })
}

// ── 通用：读取单个文件（包含 content） ──
function readItem(type, slug) {
  const file = join(CONTENT_DIR, type, `${slug}.md`)
  const raw = readFileSync(file, 'utf-8')
  const { data, content } = matter(raw)
  return { slug, ...data, content }
}

// ── 项目 ──
app.get('/api/projects', (_req, res) => {
  try {
    res.json(readAllItems('projects'))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/projects/:slug', (req, res) => {
  try {
    res.json(readItem('projects', req.params.slug))
  } catch {
    res.status(404).json({ error: 'Not found' })
  }
})

// ── 随笔 ──
app.get('/api/essays', (_req, res) => {
  try {
    res.json(readAllItems('essays'))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/essays/:slug', (req, res) => {
  try {
    res.json(readItem('essays', req.params.slug))
  } catch {
    res.status(404).json({ error: 'Not found' })
  }
})

// ── 技术博客 ──
app.get('/api/tech-blogs', (_req, res) => {
  try {
    res.json(readAllItems('tech-blogs'))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/tech-blogs/:slug', (req, res) => {
  try {
    res.json(readItem('tech-blogs', req.params.slug))
  } catch {
    res.status(404).json({ error: 'Not found' })
  }
})

app.get('/api/stats/site', (_req, res) => {
  try {
    const stats = readStats()
    res.set('Cache-Control', 'no-store')
    res.json({ siteVisits: stats.siteVisits || 0 })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/stats/site/visit', (req, res) => {
  try {
    const stats = readStats()
    let counted = false
    if (shouldCountVisit(req, 'site')) {
      stats.siteVisits = (stats.siteVisits || 0) + 1
      writeStats(stats)
      counted = true
    }
    res.json({ ok: true, counted, siteVisits: stats.siteVisits || 0 })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/stats/article/:slug', (req, res) => {
  try {
    const stats = readStats()
    const slug = req.params.slug
    res.set('Cache-Control', 'no-store')
    res.json({ slug, views: stats.articleViews?.[slug] || 0 })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/stats/article/:slug/visit', (req, res) => {
  try {
    const stats = readStats()
    const slug = req.params.slug
    let counted = false
    if (shouldCountVisit(req, `article:${slug}`)) {
      stats.articleViews = stats.articleViews || {}
      stats.articleViews[slug] = (stats.articleViews[slug] || 0) + 1
      writeStats(stats)
      counted = true
    }
    res.json({ ok: true, counted, slug, views: stats.articleViews?.[slug] || 0 })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
  console.log(`Stats data dir: ${DATA_DIR}`)
  console.log(`Stats file: ${STATS_FILE}`)
})
