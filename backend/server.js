import express from 'express'
import cors from 'cors'
import { readFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import matter from 'gray-matter'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, 'content')

const app = express()
app.use(cors())
app.use(express.json())

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

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
