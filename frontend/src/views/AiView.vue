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