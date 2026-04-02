export const projects = [
  {
    id: 1,
    slug: 'personal-site',
    title: '个人主页',
    summary: '你现在看到的这个网站。Wikipedia 风格的个人主页，包含项目展示与文学随笔。',
    tech: ['Vue 3', 'Vite', 'Vue Router'],
    startDate: '2026-04',
    status: '进行中',
    link: 'https://github.com/NingAloha/personal_blog',
    featured: true,
    content: `## 项目简介

就是你现在正在浏览的这个网站。受 Wikipedia 的排版美学启发，希望用克制、清晰的视觉语言来呈现自己。

## 技术栈

- **Vue 3** — 渐进式前端框架
- **Vite** — 极速开发构建工具
- **Vue Router** — 客户端路由
- **markdown-it** — Markdown 渲染

## 设计理念

Wikipedia 的排版是互联网上最克制、最耐看的设计之一。没有多余的装饰，只有内容本身。我想用同样的方式呈现自己的东西——不炫技，让内容说话。
`,
  },
  {
    id: 2,
    slug: 'project-two',
    title: '另一个项目',
    summary: '这里放第二个项目的简介，随时替换为你的真实项目。',
    tech: ['Python', 'FastAPI'],
    startDate: '2025-12',
    status: '已完成',
    link: '',
    featured: false,
    content: `## 项目简介

这是第二个项目的详细说明。你可以在 \`src/data/projects.js\` 中编辑这些内容。

## 主要功能

- 功能一
- 功能二
- 功能三
`,
  },
]

export function getFeaturedProject() {
  return projects.find((p) => p.featured) || projects[0]
}

export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug)
}
