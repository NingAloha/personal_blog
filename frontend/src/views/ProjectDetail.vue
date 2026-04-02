<template>
  <div v-if="loading" class="loading">加载中...</div>
  <div v-else-if="project">
    <p class="breadcrumb">
      <router-link to="/projects">项目</router-link>
      <span> › </span>
      <span>{{ project.title }}</span>
    </p>

    <article>
      <!-- ── 标题 ── -->
      <h1 class="wiki-title">{{ project.title }}</h1>

      <!-- ── 正文 ── -->
      <div class="wiki-body" v-html="rendered" />
    </article>
  </div>
  <div v-else class="not-found">
    <p>项目不存在。<router-link to="/projects">← 返回项目列表</router-link></p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'
import { renderMarkdown } from '../utils/markdown'

const route = useRoute()
const project = ref(null)
const loading = ref(true)
const notFound = ref(false)

async function load(slug) {
  loading.value = true
  notFound.value = false
  try {
    project.value = await api.getProject(slug)
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const rendered = computed(() => renderMarkdown(project.value?.content))

onMounted(() => load(route.params.slug))
watch(() => route.params.slug, (slug) => slug && load(slug))
</script>

<style scoped>
.breadcrumb {
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.5rem;
}
.breadcrumb a { color: #3366cc; text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }

.tech-tag {
  display: inline-block;
  background: #eaecf0;
  border-radius: 2px;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  color: #444;
  margin: 0.1rem 0.2rem 0.1rem 0;
}
.loading { color: #555; padding: 2rem 0; }
.not-found { color: #555; padding: 2rem 0; }
</style>
