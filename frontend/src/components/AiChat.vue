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