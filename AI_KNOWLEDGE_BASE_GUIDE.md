# 🧠 个人博客 AI 知识库接入指南

> 目标：在宿舍游戏本部署本地大模型 + RAG 知识库，通过中继服务器转发，在博客中展示 AI 问答功能。
>
> 技术栈：**Ollama + Node.js (ESM) Express + Vue 3 + Vite**

---

## 📋 操作环境说明

| 标记 | 含义 |
|------|------|
| 🖥️ **[宿舍游戏本]** | 通过 VSCode Remote SSH 连接宿舍电脑 |
| 🌐 **[博客服务器]** | 部署博客前后端的公网服务器 |
| 💻 **[本地]** | 你手边的电脑，编辑代码后 push |

---

## 阶段一：宿舍游戏本部署 Ollama

> 🖥️ 以下操作在**宿舍游戏本**执行

### 1.1 安装 Ollama

**Linux：**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows（若游戏本是 Windows）：**
前往 https://ollama.com/download 下载安装包，安装后在 PowerShell 中使用。

验证安装：
```bash
ollama --version
```

---

### 1.2 拉取模型

根据显存选择模型（二选一即可）：

```bash
# 6-8GB 显存推荐（中文效果好）
ollama pull qwen2.5:7b

# 或者更小的版本（4GB 显存也够）
ollama pull qwen2.5:3b

# 向量嵌入模型（知识库必须）
ollama pull nomic-embed-text
```

拉取完成后验证：
```bash
ollama list
```

---

### 1.3 启动 Ollama 服务

```bash
# 默认只监听 localhost:11434
ollama serve

# 若需局域网访问（Windows 设置环境变量）
# OLLAMA_HOST=0.0.0.0:11434
```

测试模型是否正常：
```bash
curl http://localhost:11434/api/generate -d '{"model": "qwen2.5:7b", "prompt": "你好，请介绍一下自己", "stream": false}'
```

---

### 1.4 安装 Python 环境（用于向量数据库）

```bash
# 检查 Python 版本（需要 3.8+）
python3 --version

# 安装 ChromaDB（本地向量数据库）
pip3 install chromadb sentence-transformers
```

---

### 1.5 创建知识库初始化脚本

在宿舍游戏本上创建目录和脚本：

```bash
mkdir -p ~/ai_knowledge
cd ~/ai_knowledge
```

创建文件 `~/ai_knowledge/ingest.py`，内容如下：

```python
#!/usr/bin/env python3
"""
知识库文档导入脚本
将 Markdown 文件向量化存入 ChromaDB
"""
import os
import glob
import chromadb
import requests
import json

# ChromaDB 本地存储路径
CHROMA_PATH = "./chroma_db"
# 你的博客 Markdown 内容目录（需要 scp 或 git clone 过来）
CONTENT_PATH = "./content"
OLLAMA_URL = "http://localhost:11434"

def get_embedding(text: str) -> list:
    """调用 Ollama 获取文本向量"""
    resp = requests.post(f"{OLLAMA_URL}/api/embeddings", json={
        "model": "nomic-embed-text",
        "prompt": text
    })
    return resp.json()["embedding"]

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """将长文本切分为小块"""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)
        i += chunk_size - overlap
    return chunks

def ingest_documents():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    # 删除旧集合（重建时用）
    try:
        client.delete_collection("blog_knowledge")
    except:
        pass
    
    collection = client.create_collection("blog_knowledge")
    
    # 读取所有 Markdown 文件
    md_files = glob.glob(f"{CONTENT_PATH}/**/*.md", recursive=True)
    print(f"找到 {len(md_files)} 个 Markdown 文件")
    
    doc_id = 0
    for filepath in md_files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        filename = os.path.basename(filepath)
        print(f"处理: {filename}")
        
        # 切分文本
        chunks = chunk_text(content)
        
        for i, chunk in enumerate(chunks):
            if len(chunk.strip()) < 20:
                continue
            
            embedding = get_embedding(chunk)
            collection.add(
                ids=[f"doc_{doc_id}"],
                embeddings=[embedding],
                documents=[chunk],
                metadatas=[{"source": filename, "chunk": i}]
            )
            doc_id += 1
    
    print(f"✅ 知识库构建完成，共 {doc_id} 个文档块")

if __name__ == "__main__":
    ingest_documents()
```

---

### 1.6 创建 RAG 查询服务

创建文件 `~/ai_knowledge/rag_server.py`：

```python
#!/usr/bin/env python3
"""
RAG 查询 HTTP 服务
供博客 Node.js 后端调用
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import chromadb
import requests

CHROMA_PATH = "./chroma_db"
OLLAMA_URL = "http://localhost:11434"
MODEL_NAME = "qwen2.5:7b"
PORT = 8765

client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_collection("blog_knowledge")

def get_embedding(text: str) -> list:
    resp = requests.post(f"{OLLAMA_URL}/api/embeddings", json={
        "model": "nomic-embed-text",
        "prompt": text
    })
    return resp.json()["embedding"]

def retrieve_context(question: str, top_k: int = 3) -> str:
    embedding = get_embedding(question)
    results = collection.query(
        query_embeddings=[embedding],
        n_results=top_k
    )
    docs = results["documents"][0]
    sources = [m["source"] for m in results["metadatas"][0]]
    
    context_parts = []
    for doc, src in zip(docs, sources):
        context_parts.append(f"[来源: {src}]\n{doc}")
    
    return "\n\n---\n\n".join(context_parts)

def generate_answer(question: str, context: str):
    """流式生成回答（返回 generator）"""
    prompt = f"""你是博客主人的AI助手，性格亲切。请基于以下知识库内容回答用户的问题。
如果知识库中没有相关内容，请诚实说明，可以根据自己的知识补充回答。

【知识库内容】
{context}

【用户问题】
{question}

【回答】"""

    resp = requests.post(f"{OLLAMA_URL}/api/generate", 
        json={"model": MODEL_NAME, "prompt": prompt, "stream": True},
        stream=True
    )
    
    for line in resp.iter_lines():
        if line:
            data = json.loads(line)
            yield data.get("response", "")
            if data.get("done"):
                break

class RAGHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # 静默日志
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_POST(self):
        if self.path == "/query":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            question = body.get("question", "")
            
            context = retrieve_context(question)
            
            # SSE 流式响应
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            
            try:
                for token in generate_answer(question, context):
                    data = json.dumps({"token": token}, ensure_ascii=False)
                    self.wfile.write(f"data: {data}\n\n".encode("utf-8"))
                    self.wfile.flush()
                
                self.wfile.write(b"data: [DONE]\n\n")
                self.wfile.flush()
            except BrokenPipeError:
                pass
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    print(f"🚀 RAG 服务启动在 http://localhost:{PORT}")
    HTTPServer(("0.0.0.0", PORT), RAGHandler).serve_forever()
```

---

### 1.7 同步博客内容到游戏本

在游戏本上，将博客的 content 目录同步过来：

```bash
cd ~/ai_knowledge

# 方案A：如果博客仓库是公开的，直接 git clone
git clone https://github.com/NingAloha/personal_blog.git
cp -r personal_blog/backend/content ./content

# 方案B：通过 scp 从博客服务器拉取
# scp -r user@blog-server:/path/to/backend/content ./content
```

---

### 1.8 初始化知识库

```bash
cd ~/ai_knowledge

# 确保 ollama 已在运行（新开终端执行）
# ollama serve

# 执行知识库初始化（首次或内容更新后执行）
python3 ingest.py
```

成功后会看到：
```
找到 X 个 Markdown 文件
处理: xxx.md
✅ 知识库构建完成，共 N 个文档块
```

---

### 1.9 启动 RAG 服务

```bash
cd ~/ai_knowledge
python3 rag_server.py
# 🚀 RAG 服务启动在 http://localhost:8765
```

---

### 1.10 配置 systemd 开机自启（Linux）

创建服务文件（需要 root）：

```bash
sudo nano /etc/systemd/system/ollama-rag.service
```

内容：
```ini
[Unit]
Description=Ollama RAG Knowledge Base Service
After=network.target

[Service]
Type=simple
User=你的用户名
WorkingDirectory=/home/你的用户名/ai_knowledge
ExecStart=/usr/bin/python3 rag_server.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama-rag
sudo systemctl start ollama-rag
sudo systemctl status ollama-rag
```

---

## 阶段二：配置 SSH 端口转发

> 🌐 以下操作在**博客服务器（中继服务器）**执行

### 2.1 在中继服务器开放 RAG 服务端口

目前你已有 SSH 转发，现在需要额外转发 RAG 服务的 8765 端口。

**方案A：在游戏本上执行反向隧道（推荐）**

```bash
# 在宿舍游戏本上执行
# 将游戏本的 8765 端口反向转发到博客服务器的 18765 端口（内网访问）
ssh -N -R 127.0.0.1:18765:localhost:8765 user@your-blog-server

# 加 -f 后台运行
ssh -fN -R 127.0.0.1:18765:localhost:8765 user@your-blog-server
```

> 注意：`127.0.0.1:18765` 表示只在博客服务器的本地监听，不对外暴露，安全！

**方案B：autossh 保持隧道稳定（推荐用于长期运行）**

```bash
# 游戏本上安装 autossh
sudo apt install autossh

# 创建永久隧道（开机自启见下方）
autossh -M 0 -N -R 127.0.0.1:18765:localhost:8765 \
  -o "ServerAliveInterval 30" \
  -o "ServerAliveCountMax 3" \
  user@your-blog-server
```

创建 systemd 服务 `/etc/systemd/system/autossh-rag.service`：

```ini
[Unit]
Description=AutoSSH RAG Tunnel
After=network.target

[Service]
User=你的用户名
ExecStart=/usr/bin/autossh -M 0 -N \
  -R 127.0.0.1:18765:localhost:8765 \
  -o "ServerAliveInterval 30" \
  -o "ServerAliveCountMax 3" \
  -o "StrictHostKeyChecking=no" \
  -i /home/你的用户名/.ssh/id_rsa \
  user@your-blog-server
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable autossh-rag
sudo systemctl start autossh-rag
```

---

### 2.2 验证端口转发

在**博客服务器**上测试：

```bash
# 测试 RAG 服务是否可达（博客服务器本地访问）
curl -X POST http://127.0.0.1:18765/query \
  -H "Content-Type: application/json" \
  -d '{"question": "你好"}'
```

如果看到流式输出，说明隧道配置成功。

---

## 阶段三：博客后端接入 AI 接口

> 💻 在本地编辑代码，push 后在博客服务器 pull 部署

### 3.1 修改 `backend/server.js`

在现有 `server.js` 末尾（`app.listen` 之前）添加以下路由：

```javascript
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

    for await (const chunk of reader) {
      const text = decoder.decode(chunk)
      // 直接透传 SSE 数据
      res.write(text)
    }
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用' })}\n\n`)
  } finally {
    res.end()
  }
})
```

---

### 3.2 配置环境变量

在**博客服务器**的 `backend/` 目录下创建 `.env` 文件（不要提交到 git）：

```bash
# backend/.env
PORT=3000
RAG_URL=http://127.0.0.1:18765
```

修改 `backend/server.js` 顶部，加载 env（Node 20.6+ 原生支持）：

```bash
# 启动命令改为
node --env-file=.env server.js
```

或在 `package.json` 中修改 start 脚本：
```json
{
  "scripts": {
    "start": "node --env-file=.env server.js",
    "dev": "node --env-file=.env --watch server.js"
  }
}
```

---

## 阶段四：博客前端添加 AI 问答页面

> 💻 在本地编辑代码

### 4.1 创建 AI 对话组件 `frontend/src/components/AiChat.vue`

```vue
<template>
  <div class="ai-chat">
    <div class="ai-chat__header">
      <span class="ai-chat__dot" :class="{ online: isOnline }"></span>
      <span>{{ isOnline ? 'AI 助手在线' : 'AI 助手离线' }}</span>
    </div>

    <div class="ai-chat__messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="ai-chat__empty">
        <p>👋 你好！我是基于知识库的 AI 助手</p>
        <p>可以问我关于这个博客的任何内容～</p>
      </div>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="ai-chat__msg"
        :class="msg.role"
      >
        <div class="ai-chat__bubble">
          <span v-if="msg.role === 'assistant' && msg.loading" class="ai-chat__cursor">▍</span>
          <span v-else>{{ msg.content }}</span>
        </div>
      </div>
    </div>

    <div class="ai-chat__input-area">
      <input
        v-model="inputText"
        @keydown.enter="sendMessage"
        :disabled="isLoading || !isOnline"
        :placeholder="isOnline ? '输入问题，按 Enter 发送...' : 'AI 服务暂时离线'"
        class="ai-chat__input"
      />
      <button
        @click="sendMessage"
        :disabled="isLoading || !isOnline || !inputText.trim()"
        class="ai-chat__btn"
      >
        {{ isLoading ? '...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const messages = ref([])
const inputText = ref('')
const isLoading = ref(false)
const isOnline = ref(false)
const messagesRef = ref(null)

// 检查 AI 服务状态
async function checkStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/ai/status`)
    const data = await res.json()
    isOnline.value = data.online
  } catch {
    isOnline.value = false
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

async function sendMessage() {
  const question = inputText.value.trim()
  if (!question || isLoading.value) return

  messages.value.push({ role: 'user', content: question })
  inputText.value = ''
  isLoading.value = true

  // 添加 AI 消息占位
  const aiMsgIndex = messages.value.length
  messages.value.push({ role: 'assistant', content: '', loading: true })
  await scrollToBottom()

  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    })

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break

        try {
          const data = JSON.parse(raw)
          if (data.token) {
            messages.value[aiMsgIndex].content += data.token
            messages.value[aiMsgIndex].loading = false
            await scrollToBottom()
          }
          if (data.error) {
            messages.value[aiMsgIndex].content = data.error
            messages.value[aiMsgIndex].loading = false
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  } catch (e) {
    messages.value[aiMsgIndex].content = '请求失败，请检查网络连接'
    messages.value[aiMsgIndex].loading = false
  } finally {
    isLoading.value = false
    messages.value[aiMsgIndex].loading = false
    await scrollToBottom()
  }
}

onMounted(() => {
  checkStatus()
  setInterval(checkStatus, 30000) // 每 30 秒检查一次
})
</script>

<style scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  font-size: 14px;
}

.ai-chat__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
}

.ai-chat__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  transition: background 0.3s;
}
.ai-chat__dot.online { background: #22c55e; }

.ai-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-chat__empty {
  text-align: center;
  color: #9ca3af;
  margin: auto;
  line-height: 2;
}

.ai-chat__msg { display: flex; }
.ai-chat__msg.user { justify-content: flex-end; }
.ai-chat__msg.assistant { justify-content: flex-start; }

.ai-chat__bubble {
  max-width: 75%;
  padding: 8px 12px;
  border-radius: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.user .ai-chat__bubble {
  background: #3b82f6;
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant .ai-chat__bubble {
  background: #f3f4f6;
  color: #111827;
  border-bottom-left-radius: 4px;
}

.ai-chat__cursor {
  animation: blink 1s infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.ai-chat__input-area {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e5e7eb;
}

.ai-chat__input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.2s;
}
.ai-chat__input:focus { border-color: #3b82f6; }
.ai-chat__input:disabled { background: #f9fafb; cursor: not-allowed; }

.ai-chat__btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}
.ai-chat__btn:hover:not(:disabled) { background: #2563eb; }
.ai-chat__btn:disabled { background: #93c5fd; cursor: not-allowed; }
</style>
```

---

### 4.2 创建 AI 知识库页面 `frontend/src/views/AiView.vue`

```vue
<template>
  <div class="ai-view">
    <div class="ai-view__header">
      <h1>🧠 AI 知识库</h1>
      <p>基于我的博客文章、笔记和项目文档训练的本地 AI 助手，运行在我宿舍的游戏本上。</p>
    </div>

    <div class="ai-view__info">
      <div class="info-card">
        <span class="info-card__icon">🖥️</span>
        <div>
          <strong>本地部署</strong>
          <p>模型运行在我的游戏本，数据不上传第三方</p>
        </div>
      </div>
      <div class="info-card">
        <span class="info-card__icon">📚</span>
        <div>
          <strong>知识来源</strong>
          <p>博客文章、项目文档、个人随笔</p>
        </div>
      </div>
      <div class="info-card">
        <span class="info-card__icon">⚡</span>
        <div>
          <strong>技术栈</strong>
          <p>Ollama + Qwen2.5 + ChromaDB RAG</p>
        </div>
      </div>
    </div>

    <AiChat />
  </div>
</template>

<script setup>
import AiChat from '../components/AiChat.vue'
</script>

<style scoped>
.ai-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 16px;
}

.ai-view__header {
  text-align: center;
  margin-bottom: 32px;
}

.ai-view__header h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.ai-view__header p {
  color: #6b7280;
  line-height: 1.6;
}

.ai-view__info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.info-card__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.info-card strong {
  display: block;
  margin-bottom: 4px;
}

.info-card p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}
</style>
```

---

### 4.3 在路由中注册页面

找到 `frontend/src/router/index.js`，添加 AI 路由：

```javascript
// 在现有路由数组中添加：
{
  path: '/ai',
  name: 'ai',
  component: () => import('../views/AiView.vue')
}
```

---

### 4.4 在导航中添加入口

在导航组件（通常在 `components/` 中）添加跳转链接：

```html
<router-link to="/ai">🧠 AI 助手</router-link>
```

---

## 阶段五：部署上线

> 🌐 在**博客服务器**执行

### 5.1 拉取最新代码

```bash
cd /path/to/personal_blog
git pull origin main

# 重启后端服务（根据你的部署方式选择）
# 如果用 pm2：
pm2 restart backend

# 如果用 systemd：
sudo systemctl restart blog-backend
```

---

### 5.2 重新构建前端

```bash
cd frontend
npm run build
# 将 dist/ 目录内容部署到 Web 服务器（nginx/caddy 等）
```

---

## 日常维护操作

### 知识库内容更新（新写了博客后）

```bash
# 🖥️ 宿舍游戏本执行
cd ~/ai_knowledge

# 重新拉取最新内容
git -C personal_blog pull
cp -r personal_blog/backend/content ./content

# 重新建立知识库索引
python3 ingest.py

# 重启 RAG 服务
sudo systemctl restart ollama-rag
```

---

### 常用调试命令

```bash
# 检查 Ollama 状态
ollama list
curl http://localhost:11434/api/tags

# 检查 RAG 服务
curl -X POST http://localhost:8765/query \
  -H "Content-Type: application/json" \
  -d '{"question":"你好"}'

# 检查 SSH 隧道（博客服务器上）
ss -tlnp | grep 18765

# 检查博客后端 AI 接口
curl http://localhost:3000/api/ai/status
```

---

## 架构总览

```
[访客浏览器]
     │ HTTPS
     ▼
[博客前端 Vue3 + Vite]
     │ /api/ai/chat (SSE)
     ▼
[博客后端 Node.js Express :3000]
     │ http://127.0.0.1:18765
     ▼
[中继服务器 SSH 反向隧道]
     │ 转发到 localhost:8765
     ▼
[宿舍游戏本 RAG Server :8765]
     ├── ChromaDB 向量检索
     └── Ollama :11434 (qwen2.5:7b)
```

---

## 常见问题

**Q: 游戏本关机了怎么办？**
A: 前端 `AiChat.vue` 已处理离线状态，会显示"AI 助手离线"并禁用输入框，不影响博客其他功能。

**Q: 回答很慢怎么办？**
A: 流式输出（SSE）保证第一个 token 出现在 1-3 秒内，整体响应时间取决于显卡性能。可以在 UI 上添加"正在思考中..."的动画缓解等待感。

**Q: 如何换模型？**
A: 修改 `rag_server.py` 中的 `MODEL_NAME`，然后确保该模型已通过 `ollama pull` 下载。

**Q: SSH 隧道断了怎么办？**
A: 使用 autossh + systemd 服务可以自动重连。如果手动管理，在游戏本上重新执行 `ssh -fN -R ...` 即可。