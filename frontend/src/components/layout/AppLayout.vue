<template>
  <div class="wiki-page">
    <header class="wiki-header">
      <div class="wiki-header-inner">
        <router-link class="wiki-logo" to="/">寧中亙的个人主页</router-link>
        <nav class="wiki-nav">
          <router-link to="/">主页</router-link>
          <router-link to="/projects">项目</router-link>
          <router-link to="/essays">文学随笔</router-link>
          <router-link to="/tech-blogs">技术博客</router-link>
        </nav>
      </div>
    </header>
    <main class="wiki-main">
      <router-view />
    </main>
    <footer class="wiki-footer">
      <div class="wiki-footer-inner">
        本页面最后修改于 {{ today }} &nbsp;·&nbsp; 内容由本人维护
      </div>
    </footer>
  </div>
</template>

<script setup>
const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
</script>

<style scoped>
.wiki-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* ── Header ── */
.wiki-header {
  border-bottom: 1px solid #a2a9b1;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
}
.wiki-header-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 2rem;
}
.wiki-logo {
  font-family: 'Linux Libertine', Georgia, Times, serif;
  font-size: 1.25rem;
  color: #202122;
  text-decoration: none;
  font-weight: bold;
  white-space: nowrap;
}
.wiki-logo:hover {
  text-decoration: none;
}
.wiki-nav {
  display: flex;
  gap: 1.25rem;
  font-size: 0.875rem;
}
.wiki-nav a {
  color: #3366cc;
  text-decoration: none;
  padding: 0.2rem 0;
  border-bottom: 2px solid transparent;
}
.wiki-nav a:hover {
  text-decoration: underline;
}
.wiki-nav a.router-link-exact-active {
  color: #202122;
  border-bottom-color: #202122;
  font-weight: 600;
}

/* ── Main ── */
.wiki-main {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* ── Footer ── */
.wiki-footer {
  border-top: 1px solid #a2a9b1;
  background: #f8f9fa;
  font-size: 0.8rem;
  color: #555;
  margin-top: auto;
}
.wiki-footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
}

/* ── 移动端响应式 ── */
@media (max-width: 768px) {
  .wiki-header-inner {
    padding: 0 1rem;
    gap: 0.75rem;
    flex-wrap: wrap;
    height: auto;
    min-height: 48px;
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
  }
  .wiki-logo {
    font-size: 1rem;
  }
  .wiki-nav {
    gap: 0.75rem;
    font-size: 0.82rem;
  }
  .wiki-main {
    padding: 1.25rem 1rem;
  }
}
</style>
