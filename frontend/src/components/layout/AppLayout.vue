<template>
  <div class="wiki-page">
    <header class="wiki-header">
      <div class="wiki-header-inner">
        <router-link class="wiki-logo" to="/">{{ t('site.name') }}</router-link>
        <nav class="wiki-nav">
          <router-link to="/">{{ t('nav.home') }}</router-link>
          <router-link to="/projects/">{{ t('nav.projects') }}</router-link>
          <router-link to="/essays/">{{ t('nav.essays') }}</router-link>
          <router-link to="/tech-blogs/">{{ t('nav.techBlogs') }}</router-link>
        </nav>
        <div class="header-actions">
          <button class="theme-toggle" type="button" @click="toggleTheme">
            {{ isDark ? t('toggles.themeLight') : t('toggles.themeDark') }}
          </button>
          <button class="lang-toggle" type="button" @click="toggleLocale">
            {{ locale === 'zh' ? t('toggles.langEn') : t('toggles.langZh') }}
          </button>
        </div>
      </div>
    </header>
    <main class="wiki-main">
      <router-view />
    </main>
    <footer class="wiki-footer">
      <div class="wiki-footer-inner">
        {{ t('footer.lastModified', { date: today }) }}
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { locale, setLocale, t } from '../../i18n'

const today = ref('')
const isDark = ref(false)

function updateToday() {
  const lang = locale.value === 'en' ? 'en-US' : 'zh-CN'
  today.value = new Date().toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  isDark.value = theme === 'dark'
}

function toggleTheme() {
  const nextTheme = isDark.value ? 'light' : 'dark'
  applyTheme(nextTheme)
  localStorage.setItem('theme', nextTheme)
}

function toggleLocale() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
}

onMounted(() => {
  updateToday()
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || savedTheme === 'light') {
    applyTheme(savedTheme)
    return
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(prefersDark ? 'dark' : 'light')
})

watch(locale, updateToday)
</script>

<style scoped>
.wiki-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* ── Header ── */
.wiki-header {
  border-bottom: 1px solid var(--border);
  background: var(--bg);
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
  color: var(--text);
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
  margin-right: auto;
}
.wiki-nav a {
  color: var(--link);
  text-decoration: none;
  padding: 0.2rem 0;
  border-bottom: 2px solid transparent;
}
.wiki-nav a:hover {
  text-decoration: underline;
}
.wiki-nav a.router-link-exact-active {
  color: var(--text);
  border-bottom-color: var(--text);
  font-weight: 600;
}
.theme-toggle {
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-soft);
  border-radius: 3px;
  padding: 0.25rem 0.55rem;
  font-size: 0.8rem;
  cursor: pointer;
}
.theme-toggle:hover {
  background: var(--border-soft);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.lang-toggle {
  border: 1px solid var(--border);
  background: var(--bg-muted);
  color: var(--text-soft);
  border-radius: 3px;
  padding: 0.25rem 0.55rem;
  font-size: 0.8rem;
  cursor: pointer;
}
.lang-toggle:hover {
  background: var(--border-soft);
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
  border-top: 1px solid var(--border);
  background: var(--bg-muted);
  font-size: 0.8rem;
  color: var(--text-muted);
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
  .theme-toggle {
    margin-left: auto;
  }
  .header-actions {
    margin-left: auto;
  }
  .wiki-main {
    padding: 1.25rem 1rem;
  }
}
</style>
