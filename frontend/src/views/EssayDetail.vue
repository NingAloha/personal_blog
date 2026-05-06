<template>
  <div v-if="loading" class="loading">加载中...</div>
  <div v-else-if="essay">
    <p class="breadcrumb">
      <router-link to="/essays">文学随笔</router-link>
      <span> › </span>
      <span>{{ essay.title }}</span>
    </p>

    <article>
      <h1 class="wiki-title">{{ essay.title }}</h1>
      <p class="meta">阅读 {{ views }} 次</p>

      <!-- ── 正文 ── -->
      <div class="wiki-body" v-html="rendered" />
    </article>
  </div>
  <div v-else class="not-found">
    <p>随笔不存在。<router-link to="/essays">← 返回随笔列表</router-link></p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'
import { renderMarkdown } from '../utils/markdown'

const route = useRoute()
const essay = ref(null)
const loading = ref(true)
const notFound = ref(false)
const views = ref(0)

async function load(slug) {
  loading.value = true
  notFound.value = false
  try {
    essay.value = await api.getEssay(slug)
    try {
      await api.trackArticleVisit(slug)
      const stats = await api.getArticleStats(slug)
      views.value = stats.views || 0
    } catch {
      views.value = 0
    }
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const rendered = computed(() => renderMarkdown(essay.value?.content))

onMounted(() => load(route.params.slug))
watch(() => route.params.slug, (slug) => slug && load(slug))
</script>

<style scoped>
.breadcrumb {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.breadcrumb a { color: var(--link); text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.meta {
  font-size: 0.85rem;
  color: var(--text-faint);
  margin: -0.25rem 0 1rem;
}

.tag {
  display: inline-block;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 2px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  color: var(--link);
  margin: 0.1rem 0.2rem 0.1rem 0;
}
.loading { color: var(--text-muted); padding: 2rem 0; }
.not-found { color: var(--text-muted); padding: 2rem 0; }
</style>
