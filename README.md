# personal_blog

Wikipedia 排版风格的个人主页，前后端分离架构。

- **前端**: Vue 3 + Vite，构建后托管静态文件
- **后端**: Node.js + Express，读取 `backend/content/` 目录下的 Markdown 文件提供 API

---

## 目录结构

```
personal_blog/
├── frontend/          # Vue 3 前端项目
│   ├── src/
│   └── public/        # 静态资源（如 avatar.jpg 放这里）
├── backend/           # Express API 服务
│   ├── server.js
│   └── content/
│       ├── projects/  # 项目 Markdown 文件
│       ├── essays/    # 随笔 Markdown 文件
│       └── tech-blogs/# 技术博客 Markdown 文件
└── README.md
```

---

## 本地开发

```bash
# 1. 启动后端（端口 3000）
cd backend
npm install
npm run dev

# 2. 新开一个终端，启动前端（端口 5173，/api 自动代理到后端）
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`

---

## 服务器部署

### 前提条件

- Node.js 18+
- 服务器上已安装 Nginx（或其他反向代理）
- 推荐使用 PM2 管理后端进程

### 第一步：克隆并安装依赖

```bash
git clone https://github.com/NingAloha/personal_blog.git
cd personal_blog

# 安装后端依赖
cd backend && npm install --omit=dev && cd ..

# 安装前端依赖并构建
cd frontend && npm install && npm run build && cd ..
```

构建完成后，静态文件在 `frontend/dist/` 目录。

### 第二步：用 PM2 启动后端

```bash
# 全局安装 PM2（如果没有）
npm install -g pm2

# 启动后端服务（端口 3000）
cd backend
pm2 start server.js --name personal_blog_api

# 设置开机自启
pm2 save
pm2 startup
```

### 第三步：配置 Nginx

将 `frontend/dist/` 作为静态根目录，同时将 `/api` 反代到后端：

```nginx
server {
    listen 80;
    server_name your-domain.com;   # 替换为你的域名或 IP

    root /path/to/personal_blog/frontend/dist;
    index index.html;

    # Vue Router 的 history 模式需要 fallback 到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 反向代理 API 请求到 Node.js 后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

修改配置后重载 Nginx：

```bash
nginx -t && systemctl reload nginx
```

### 第四步：（可选）配置 HTTPS

推荐使用 [Certbot](https://certbot.eff.org/) 申请免费 Let's Encrypt 证书：

```bash
certbot --nginx -d your-domain.com
```

---

## 内容维护

### 新增项目

在 `backend/content/projects/` 下新建一个 `.md` 文件，例如 `my-project.md`：

```markdown
---
title: 项目名称
summary: 一句话描述
tech: [Vue, Node.js]
startDate: "2025-01"
status: 进行中
link: https://github.com/NingAloha/...
featured: false
---

## 项目背景

正文 Markdown 内容...
```

### 新增随笔

在 `backend/content/essays/` 下新建一个 `.md` 文件，例如 `my-essay.md`：

```markdown
---
title: 随笔标题
summary: 一句话摘要
tags: [随想, 生活]
date: "2025-04-01"
featured: false
---

正文 Markdown 内容...
```

> 文件名即 URL slug，例如 `my-essay.md` 对应 `/essays/my-essay`。  
> `featured: true` 的条目会显示在主页精选区域（每类取第一个）。

### 新增技术博客

在 `backend/content/tech-blogs/` 下新建一个 `.md` 文件，例如 `my-tech-post.md`：

```markdown
---
title: 文章标题
summary: 一句话摘要
tags: [Vue, Node.js]
date: "2026-05-03"
featured: false
---

正文 Markdown 内容...
```

> 文件名即 URL slug，例如 `my-tech-post.md` 对应 `/tech-blogs/my-tech-post`。

### 更新后重启

修改 Markdown 文件后无需重启，Express 每次请求时实时读取文件。  
如果修改了 `server.js`，需要重启后端：

```bash
pm2 restart personal_blog_api
```

---

## 更新上线流程

### 情况一：只新增/修改了 Markdown 文章

后端是实时读取文件的，直接在服务器上操作即可，**无需重启、无需重新构建**：

```bash
# 在服务器上直接拉取最新内容
cd ~/personal_blog
git pull
```

或者直接在服务器上新建/编辑 `.md` 文件，刷新页面即可看到变化。

---

### 情况二：修改了前端代码（Vue 组件、样式等）

前端代码变更需要重新构建，然后 Nginx 会自动托管新的 `dist/`：

```bash
# 1. 本地提交并推送
git add -A && git commit -m "描述你的改动" && git push

# 2. 在服务器上拉取并重新构建
cd ~/personal_blog
git pull
cd frontend && npm run build && cd ..
```

构建完成后，刷新浏览器即可看到更新（可能需要强刷 Ctrl+Shift+R 清除缓存）。

---

### 情况三：修改了后端代码（server.js）

```bash
# 1. 本地提交并推送
git add -A && git commit -m "描述你的改动" && git push

# 2. 在服务器上拉取并重启后端
cd ~/personal_blog
git pull
pm2 restart personal_blog_api
```

---

### 一键全量更新（前端 + 后端都有改动）

```bash
cd ~/personal_blog
git pull
cd frontend && npm run build && cd ..
pm2 restart personal_blog_api
```

---

## 头像

将头像图片命名为 `avatar.jpg` 放入 `frontend/public/` 目录，重新构建前端即可：

```bash
cp your-avatar.jpg frontend/public/avatar.jpg
cd frontend && npm run build
```
