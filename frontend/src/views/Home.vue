<template>
  <article class="home-article">

    <!-- ── 页面标题 ── -->
    <h1 class="wiki-title">关于我</h1>

    <!-- ── 名片 Infobox（右浮动） ── -->
    <aside class="infobox">
      <div class="infobox-image">
        <!-- 替换为你的头像 URL -->
        <img
          src="/avatar.jpg"
          alt="avatar"
          width="900"
          height="900"
          loading="eager"
          decoding="async"
        />
      </div>
      <table class="infobox-table">
        <tbody>
          <tr><th>可以叫我</th><td>NingAloha(寧中亙)</td></tr>
          <tr><th>我也许是</th><td>开发者/随笔作者/吉他手/摄影师</td></tr>
          <tr><th>我来自于</th><td>中国·汕头</td></tr>
          <tr><th>项目做了</th><td>{{ projectCount }}个</td></tr>
          <tr><th>随笔写了</th><td>{{ essayCount }}篇</td></tr>
          <tr><th>技术博客</th><td>{{ techBlogCount }}篇</td></tr>
          <tr><th>网站访问</th><td>{{ siteVisits }}次</td></tr>
        </tbody>
      </table>
      <div class="infobox-links">
        <a href="https://github.com/NingAloha" target="_blank" rel="noopener">GitHub</a>
        <!-- 可以加更多链接 -->
      </div>
    </aside>

    <!-- ── 自我介绍 ── -->
    <p>
      你好，这里是我的个人主页。我喜欢写点代码，也喜欢写文章，时不时也会听听歌，练练琴。
      这个网站受 Wikipedia 排版风格的启发——不炫技，只是把东西放在该放的地方。
    </p>
    <p>
      上边（或者说，这段文字）是关于我的介绍。
      不过我暂时还没想好写些什么，就先这么多吧。
    </p>

    <!-- ── 在做的项目 ── -->
    <h2 class="wiki-section">正在做的项目</h2>
    <template v-if="featuredProject">
      <div class="featured-card" @click="$router.push(`/projects/${featuredProject.slug}`)">
        <div class="featured-card-header">
          <span class="featured-card-title">{{ featuredProject.title }}</span>
          <span class="featured-card-status">{{ featuredProject.status }}</span>
        </div>
        <p class="featured-card-summary">{{ featuredProject.summary }}</p>
        <div class="featured-card-tech">
          <span v-for="t in featuredProject.tech" :key="t" class="tech-tag">{{ t }}</span>
        </div>
        <router-link :to="`/projects/${featuredProject.slug}`" class="featured-more">
          阅读更多 →
        </router-link>
      </div>
    </template>
    <div v-else class="featured-card featured-skeleton">项目加载中...</div>
    <p class="section-seeall">
      <router-link to="/projects">查看所有项目</router-link>
    </p>

    <!-- ── 文学随笔 ── -->
    <h2 class="wiki-section">文学随笔</h2>
    <template v-if="featuredEssay">
      <div class="featured-card" @click="$router.push(`/essays/${featuredEssay.slug}`)">
        <div class="featured-card-header">
          <span class="featured-card-title">{{ featuredEssay.title }}</span>
          <span class="featured-card-date">{{ featuredEssay.date }}</span>
        </div>
        <p class="featured-card-summary">{{ featuredEssay.summary }}</p>
        <router-link :to="`/essays/${featuredEssay.slug}`" class="featured-more">
          阅读更多 →
        </router-link>
      </div>
    </template>
    <div v-else class="featured-card featured-skeleton">随笔加载中...</div>
    <p class="section-seeall">
      <router-link to="/essays">查看所有随笔</router-link>
    </p>

    <!-- ── 技术博客 ── -->
    <h2 class="wiki-section">技术博客</h2>
    <template v-if="featuredTechBlog">
      <div class="featured-card" @click="$router.push(`/tech-blogs/${featuredTechBlog.slug}`)">
        <div class="featured-card-header">
          <span class="featured-card-title">{{ featuredTechBlog.title }}</span>
          <span class="featured-card-date">{{ featuredTechBlog.date }}</span>
        </div>
        <p class="featured-card-summary">{{ featuredTechBlog.summary }}</p>
        <router-link :to="`/tech-blogs/${featuredTechBlog.slug}`" class="featured-more">
          阅读更多 →
        </router-link>
      </div>
    </template>
    <div v-else class="featured-card featured-skeleton">技术博客加载中...</div>
    <p class="section-seeall">
      <router-link to="/tech-blogs">查看所有技术博客</router-link>
    </p>

  </article>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../utils/api'

const featuredProject = ref(null)
const featuredEssay = ref(null)
const featuredTechBlog = ref(null)
const projectCount = ref(0)
const essayCount = ref(0)
const techBlogCount = ref(0)
const siteVisits = ref(0)

onMounted(async () => {
  api.getProjects().then((projects) => {
    projectCount.value = projects.length
    featuredProject.value = projects.find((p) => p.featured) || projects[0] || null
  }).catch(() => {})

  api.getEssays().then((essays) => {
    essayCount.value = essays.length
    featuredEssay.value = essays.find((e) => e.featured) || essays[0] || null
  }).catch(() => {})

  api.getTechBlogs().then((techBlogs) => {
    techBlogCount.value = techBlogs.length
    featuredTechBlog.value = techBlogs.find((p) => p.featured) || techBlogs[0] || null
  }).catch(() => {})

  api.getSiteStats().then((stats) => {
    siteVisits.value = stats.siteVisits || 0
  }).catch(() => {})
})
</script>

<style scoped>
/* ── Infobox ── */
.infobox {
  float: right;
  clear: right;
  margin: 0 0 1.25em 2em;
  border: 1px solid var(--border);
  background: var(--bg-muted);
  font-size: 0.875rem;
  width: 240px;
  border-collapse: collapse;
}
.infobox-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-bottom: 1px solid var(--border);
}
.infobox-image {
  aspect-ratio: 1 / 1;
  overflow: hidden;
}
.infobox-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}
.infobox-table th,
.infobox-table td {
  padding: 0.3rem 0.6rem;
  border-top: 1px solid var(--border-soft);
  vertical-align: top;
}
.infobox-table th {
  color: var(--text-muted);
  font-weight: normal;
  white-space: nowrap;
  width: 60px;
}
.infobox-links {
  border-top: 1px solid var(--border);
  padding: 0.4rem 0.6rem;
  display: flex;
  gap: 0.75rem;
}

/* ── Featured card ── */
.featured-card {
  border: 1px solid var(--border);
  border-radius: 2px;
  padding: 0.9rem 1.1rem;
  cursor: pointer;
  transition: background 0.15s;
  background: var(--bg);
  /* 让卡片不被右侧浮动的 infobox 遮住 */
  margin-right: calc(240px + 2em + 2px);
}
.featured-skeleton {
  min-height: 130px;
  color: var(--text-faint);
}
.featured-card:hover {
  background: var(--bg-muted);
}
.featured-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.4rem;
}
.featured-card-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
}
.featured-card-status,
.featured-card-date {
  font-size: 0.8rem;
  color: var(--text-faint);
}
.featured-card-summary {
  margin: 0 0 0.75rem;
  color: var(--text-soft);
  line-height: 1.6;
}
.featured-card-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}
.tech-tag {
  background: var(--border-soft);
  border-radius: 2px;
  padding: 0.15rem 0.5rem;
  font-size: 0.78rem;
  color: var(--text-soft);
}
.featured-more {
  font-size: 0.875rem;
  color: var(--link);
  text-decoration: none;
}
.featured-more:hover {
  text-decoration: underline;
}
.section-seeall {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

/* ── 移动端响应式 ── */
@media (max-width: 768px) {
  .infobox {
    float: none;
    width: 100%;
    margin: 0 0 1.5em 0;
  }
  .featured-card {
    margin-right: 0;
  }
}
</style>
