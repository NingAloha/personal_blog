<template>
  <article>
    <h1 class="wiki-title">文学随笔</h1>
    <p class="page-lead">一些零散的文字，不成体系，但都是真实的。</p>

    <div v-if="loading" class="loading">加载中...</div>
    <table v-else class="wiki-list-table">
      <thead>
        <tr>
          <th>标题</th>
          <th>摘要</th>
          <th>标签</th>
          <th>日期</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in essays" :key="e.slug">
          <td class="list-title-cell">
            <router-link :to="`/essays/${e.slug}`">{{ e.title }}</router-link>
          </td>
          <td class="list-summary-cell">{{ e.summary }}</td>
          <td>
            <span v-for="tag in e.tags" :key="tag" class="tag">{{ tag }}</span>
          </td>
          <td class="list-date-cell">{{ e.date }}</td>
        </tr>
      </tbody>
    </table>
  </article>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const essays = ref([])
const loading = ref(true)
onMounted(async () => {
  essays.value = await api.getEssays()
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
  max-width: 380px;
  color: #444;
}
.list-date-cell {
  white-space: nowrap;
  color: #777;
}
.tag {
  display: inline-block;
  background: #eaf3fb;
  border: 1px solid #cee0f2;
  border-radius: 2px;
  padding: 0.1rem 0.45rem;
  font-size: 0.75rem;
  color: #3366cc;
  margin: 0.1rem 0.2rem 0.1rem 0;
}
</style>
