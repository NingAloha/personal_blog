import { createRouter, createWebHistory } from 'vue-router'
import { api } from '../utils/api'

const routes = [
  {
    path: '/',
    component: () => import('../components/layout/AppLayout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('../views/Home.vue') },
      { path: 'projects', name: 'ProjectList', component: () => import('../views/ProjectList.vue') },
      { path: 'projects/:slug', name: 'ProjectDetail', component: () => import('../views/ProjectDetail.vue') },
      { path: 'essays', name: 'EssayList', component: () => import('../views/EssayList.vue') },
      { path: 'essays/:slug', name: 'EssayDetail', component: () => import('../views/EssayDetail.vue') },
      { path: 'tech-blogs', name: 'TechBlogList', component: () => import('../views/TechBlogList.vue') },
      { path: 'tech-blogs/:slug', name: 'TechBlogDetail', component: () => import('../views/TechBlogDetail.vue') }
    ],
  },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach(() => {
  const key = 'site_visit_tracked'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  api.trackSiteVisit().catch(() => {
    sessionStorage.removeItem(key)
  })
})

export default router
