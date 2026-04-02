<template>
  <article>
    <h1 class="wiki-title">项目</h1>
    <p class="page-lead">这里是我做过和正在做的项目，点击标题查看详情。</p>

    <div v-if="loading" class="loading">加载中...</div>
    <table v-else class="wiki-list-table">
      <thead>
        <tr>
          <th>项目名</th>
          <th>简介</th>
          <th>技术栈</th>
          <th>状态</th>
          <th>时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in projects" :key="p.slug">
          <td class="list-title-cell">
            <router-link :to="`/projects/${p.slug}`">{{ p.title }}</router-link>
          </td>
          <td class="list-summary-cell">{{ p.summary }}</td>
          <td>
            <span v-for="t in p.tech" :key="t" class="tech-tag">{{ t }}</span>
          </td>
          <td>{{ p.status }}</td>
          <td class="list-date-cell">{{ p.startDate }}</td>
        </tr>
      </tbody>
    </table>
  </article>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const projects = ref([])
const loading = ref(true)
onMounted(async () => {
  projects.value = await api.getProjects()
  loading.value = false
})
</script>

<style scoped>
.page-lead {
  color: #555;
  margin-bottom: 1.5rem;
}
.wiki-list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.wiki-list-table th {
  background: #eaecf0;
  border: 1px solid #a2a9b1;
  padding: 0.45rem 0.75rem;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
}
.wiki-list-table td {
  border: 1px solid #a2a9b1;
  padding: 0.45rem 0.75rem;
  vertical-align: top;
}
.wiki-list-table tbody tr:hover td {
  background: #f8f9fa;
}
.list-title-cell a {
  font-weight: 600;
  color: #3366cc;
  text-decoration: none;
}
.list-title-cell a:hover {
  text-decoration: underline;
}
.list-summary-cell {
  max-width: 320px;
  color: #444;
}
.list-date-cell {
  white-space: nowrap;
  color: #777;
}
.tech-tag {
  display: inline-block;
  background: #eaecf0;
  border-radius: 2px;
  padding: 0.1rem 0.45rem;
  font-size: 0.75rem;
  color: #444;
  margin: 0.1rem 0.2rem 0.1rem 0;
}
</style>
