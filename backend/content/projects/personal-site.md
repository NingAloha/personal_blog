---
title: 个人主页
summary: 你现在看到的这个网站。Wikipedia 风格的个人主页，包含项目展示与文学随笔。
tech: ["Vue 3", "Vite", "Vue Router", "Node.js", "Nginx", "PM2"]
startDate: "2026-04"
status: 进行中
link: https://github.com/NingAloha/personal_blog
featured: true
---

## 项目简介

就是你现在正在浏览的这个网站。受 Wikipedia 的排版美学启发，希望用克制、清晰的视觉语言来呈现自己。

## 技术栈

- **Vue 3** — 渐进式前端框架
- **Vite** — 极速开发构建工具
- **Vue Router** — 客户端路由
- **Node.js + Express** — 后端 API，提供 Markdown 内容
- **markdown-it** — Markdown 渲染
- **Nginx** — 高性能反向代理，处理 HTTPS 卸载与 HSTS 安全策略
- **PM2** — Node.js 生产环境进程守护，确保后端服务高可用
- **Certbot (SSL)** — 驱动 A+ 级自动化证书管理与安全加固
- **gray-matter** — 解析 Markdown 头部 YAML 元数据（Front-matter

## 设计理念

Wikipedia 的排版是互联网上最克制、最耐看的设计之一。没有多余的装饰，只有内容本身。我想用同样的方式呈现自己的东西——不炫技，让内容说话。

## 开发过程

先搭了一个 Wiki 风格的内容管理系统，后来意识到根本不需要那么复杂。删掉了登录、搜索、数据库，只留下三个页面和一堆 Markdown 文件。

**简单就是最好的设计。**
