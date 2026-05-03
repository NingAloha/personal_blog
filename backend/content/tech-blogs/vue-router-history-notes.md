---
title: Vue Router History 模式部署笔记
summary: 记录个人站点在 Nginx 下使用 history 模式的关键配置与常见问题。
tags: [Vue, Vite, Nginx]
date: "2026-05-03"
featured: true
---

## 背景

前端使用 Vue Router 的 `createWebHistory()`。本地开发时看不出问题，但服务器刷新深层路由会 404。

## 核心配置

Nginx 里需要让前端路由回退到 `index.html`：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## API 反代

同时要把 `/api` 转发给后端，避免前端直接跨域请求：

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:3000;
}
```

## 排查建议

1. 刷新 `/projects/xxx` 或 `/tech-blogs/xxx` 验证是否回退成功。
2. 在浏览器网络面板确认 `/api/*` 是否命中后端而不是静态资源。
3. 修改 Nginx 后先执行 `nginx -t` 再重载。
