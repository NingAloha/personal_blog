import { createRouter, createWebHistory } from 'vue-router'
import { api } from '../utils/api'
import { applySeo } from '../utils/seo'

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
            title: '首页',
            description: 'NingAloha 的个人站点，记录项目、文学随笔与技术博客。',
            path: '/',
          },
        },
      },
      {
        path: 'projects',
        name: 'ProjectList',
        component: () => import('../views/ProjectList.vue'),
        meta: {
          seo: {
            title: '项目',
            description: '项目列表：正在做和做过的工程项目。',
            path: '/projects',
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
            title: '文学随笔',
            description: '文学随笔与生活思考。',
            path: '/essays',
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
            title: '技术博客',
            description: '开发实践、技术思考与踩坑复盘。',
            path: '/tech-blogs',
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
        title: '页面未找到',
        description: '你访问的页面不存在。',
      },
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  if (to.meta?.seo) {
    applySeo({ ...to.meta.seo, path: to.fullPath })
  }

  const key = 'site_visit_tracked'
  if (sessionStorage.getItem(key)) return
  sessionStorage.setItem(key, '1')
  api.trackSiteVisit().catch(() => {
    sessionStorage.removeItem(key)
  })
})

export default router
