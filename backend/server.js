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

// ── AI 知识库接口 ──
const RAG_URL = process.env.RAG_URL || 'http://127.0.0.1:18765'

// 检查 AI 服务是否在线
app.get('/api/ai/status', async (_req, res) => {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    await fetch(`${RAG_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'ping' }),
      signal: controller.signal
    })
    clearTimeout(timer)
    res.json({ online: true })
  } catch {
    res.json({ online: false })
  }
})

// 流式问答接口（SSE）
app.post('/api/ai/chat', async (req, res) => {
  const { question } = req.body
  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: '问题不能为空' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  try {
    const ragRes = await fetch(`${RAG_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    })

    const reader = ragRes.body
    const decoder = new TextDecoder()
    const isSSE = (ragRes.headers.get('content-type') || '').includes('text/event-stream')

    for await (const chunk of reader) {
      const text = decoder.decode(chunk)
      if (isSSE) {
        // RAG 返回的已经是 SSE 格式，直接透传
        res.write(text)
      } else {
        // RAG 返回纯文本，包装成前端期望的 SSE 格式
        const data = JSON.stringify({ token: text }, null, 0)
        res.write(`data: ${data}\n\n`)
      }
    }

    if (!isSSE) {
      res.write('data: [DONE]\n\n')
    }
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用' })}\n\n`)
  } finally {
    res.end()
  }
})

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
