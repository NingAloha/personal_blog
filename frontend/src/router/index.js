import { createRouter, createWebHistory } from 'vue-router'

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
      { path: 'ai', name: 'AiView', component: () => import('../views/AiView.vue') }
    ],
  },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFound.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
