<template>
  <div v-if="loading" class="loading">加载中...</div>
  <div v-else-if="post">
    <p class="breadcrumb">
      <router-link to="/tech-blogs">技术博客</router-link>
      <span> › </span>
      <span>{{ post.title }}</span>
    </p>

    <article>
      <h1 class="wiki-title">{{ post.title }}</h1>
      <div class="wiki-body" v-html="rendered" />
    </article>
  </div>
  <div v-else class="not-found">
    <p>文章不存在。<router-link to="/tech-blogs">← 返回技术博客列表</router-link></p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../utils/api'
import { renderMarkdown } from '../utils/markdown'

const route = useRoute()
const post = ref(null)
const loading = ref(true)
const notFound = ref(false)

async function load(slug) {
  loading.value = true
  notFound.value = false
  try {
    post.value = await api.getTechBlog(slug)
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const rendered = computed(() => renderMarkdown(post.value?.content))

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
.loading { color: var(--text-muted); padding: 2rem 0; }
.not-found { color: var(--text-muted); padding: 2rem 0; }
</style>
