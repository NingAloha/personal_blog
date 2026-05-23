import { createRouter, createWebHistory } from 'vue-router'
import { api } from '../utils/api'
import { applySeo } from '../utils/seo'
import { t } from '../i18n'

const routes = [
  {
    path: '/',
    component: () => import('../components/layout/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: {
          seo: {
            key: 'home',
          },
        },
      },
      {
        path: 'projects',
        name: 'ProjectList',
        component: () => import('../views/ProjectList.vue'),
        meta: {
          seo: {
            key: 'projects',
          },
        },
      },
      { path: 'projects/:slug', name: 'ProjectDetail', component: () => import('../views/ProjectDetail.vue') },
      {
        path: 'essays',
        name: 'EssayList',
        component: () => import('../views/EssayList.vue'),
        meta: {
          seo: {
            key: 'essays',
          },
        },
      },
      { path: 'essays/:slug', name: 'EssayDetail', component: () => import('../views/EssayDetail.vue') },
      {
        path: 'tech-blogs',
        name: 'TechBlogList',
        component: () => import('../views/TechBlogList.vue'),
        meta: {
          seo: {
            key: 'techBlogs',
          },
        },
      },
      { path: 'tech-blogs/:slug', name: 'TechBlogDetail', component: () => import('../views/TechBlogDetail.vue') },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../views/NotFound.vue'),
    meta: {
      seo: {
        key: 'notFound',
      },
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

function applyRouteSeo(to) {
  const key = to?.meta?.seo?.key
  if (!key) return
  applySeo({
    title: t(`seo.${key}.title`),
    description: t(`seo.${key}.description`),
    path: to.fullPath,
  })
}

router.afterEach((to) => {
  applyRouteSeo(to)

  const key = 'site_visit_tracked'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  api.trackSiteVisit().then((stats) => {
    const siteVisits = stats?.siteVisits
    if (typeof siteVisits === 'number') {
      sessionStorage.setItem('site_visits_latest', String(siteVisits))
      window.dispatchEvent(new CustomEvent('site-visits-updated', { detail: { siteVisits } }))
    }
  }).catch(() => {
    sessionStorage.removeItem(key)
  })
})

if (typeof window !== 'undefined') {
  window.addEventListener('locale-changed', () => {
    applyRouteSeo(router.currentRoute.value)
  })
}

export default router
