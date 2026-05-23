# personal_blog

Wikipedia 排版风格的个人站（前后端分离）：内容以 Markdown 维护，前端负责展示与 SEO/预渲染，后端按请求读取 `backend/content/` 提供 API，并记录基础访问/阅读统计（可选、可持久化）。

## 快速开始（本地开发）

```bash
# 1) 启动后端（默认端口 3000）
cd backend
npm install
npm run dev

# 2) 新开终端，启动前端（默认端口 5173；/api 代理到后端）
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。

常见报错：
- Vite `proxy ECONNREFUSED /api/...`：后端没启动或端口不对（默认 `3000`）。
- `npm install ENOTEMPTY ... node_modules/...`：通常是依赖目录残留/占用导致，停掉相关进程后重试；必要时在对应目录执行 `rm -rf node_modules package-lock.json && npm install`。

## 统计数据（访问量 / 阅读量）

访问量/阅读量属于**运行时状态**，不要依赖 Git 仓库文件持久化。

默认行为（本地开发）：
- 未设置 `DATA_DIR` 时，统计写入 `backend/data/stats.json`（不存在会自动创建；该文件已在 `.gitignore` 中忽略）。

推荐行为（服务器部署）：
- 通过环境变量把统计写到独立持久化目录（例如 `/var/lib/personal_blog`），避免被部署脚本的 `git reset/clean` 影响。

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
├── scripts/
│   ├── generate-sitemap.mjs  # 根据 Markdown 内容自动生成 sitemap.xml
│   └── prerender-static.mjs  # 构建后预渲染静态路由
└── README.md
```

---

## 当前能力（简述）

- 内容：`backend/content/**.md`（front matter + 正文）
- 主题：浅色/黑夜切换（本地持久化）
- 语言：UI 结构支持中/英切换（浏览器默认 + 本地持久化）；`backend/content/` 不做翻译
- SEO：title/description/canonical/OG/Twitter Card + JSON-LD（Article/BlogPosting）
- 构建：自动生成 `frontend/public/sitemap.xml` + 预渲染静态路由到 `frontend/dist/`
- 统计：站点访问量 + 文章阅读量（可选；通过 `DATA_DIR` 做持久化）

## 内容维护（写作/更新）

新增/修改内容只需要编辑 `backend/content/` 下的 Markdown；后端按请求实时读取，一般不需要重启。

---

## 服务器部署

### 前提条件

- Node.js 18+
- 服务器上已安装 Nginx（或其他反向代理）
- 建议用 systemd 管理后端进程

### 第一步：克隆并安装依赖

```bash
git clone https://github.com/NingAloha/personal_blog.git
cd personal_blog

# 安装后端依赖
cd backend && npm install --omit=dev && cd ..

# 安装前端依赖并构建
cd frontend && npm ci && npm run build && cd ..
```

构建完成后，静态文件在 `frontend/dist/` 目录。  
另外，`frontend npm run build` 会自动生成 sitemap 并进行预渲染：
- 输入来源：`backend/content/**/*.md`
- 输出文件：`frontend/public/sitemap.xml`
- 预渲染输出：`frontend/dist/`

### 第二步：用 systemd 启动后端

示例 unit（路径与用户名按你的服务器调整）：

```ini
[Unit]
Description=Personal Blog Backend
After=network.target

[Service]
Type=simple
User=blog
Group=blog
WorkingDirectory=/var/www/personal_blog/backend
Environment=PORT=3000
Environment=DATA_DIR=/var/lib/personal_blog
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

配套准备：

```bash
sudo mkdir -p /var/lib/personal_blog
sudo chown -R blog:blog /var/lib/personal_blog
sudo systemctl daemon-reload
sudo systemctl enable --now personal-blog-backend
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

## 内容格式参考

### 新增项目（projects）

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

### 新增随笔（essays）

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

### 新增技术博客（tech-blogs）

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

## SEO 与收录

- 前端路由切换时会动态更新页面 `title`、`description`、`canonical`、Open Graph、Twitter Card。
- 详情页会注入结构化数据（JSON-LD，`Article/BlogPosting`）。
- `frontend/public/robots.txt` 已声明站点可抓取并指向站点地图。
- 站点地图由 `scripts/generate-sitemap.mjs` 自动生成，不建议手改 `frontend/public/sitemap.xml`。

## 更新上线流程

### 情况一：只新增/修改了 Markdown 文章

后端是实时读取文件的，内容页本身可直接生效；  
但为了让搜索引擎尽快发现新 URL，建议同步重新构建一次前端以更新 sitemap：

```bash
# 在服务器上直接拉取最新内容
cd ~/personal_blog
git pull

# 建议：更新 sitemap 并发布新的静态资源
cd frontend && npm run build && cd ..
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
cd ~/personal_blog && git pull
sudo systemctl restart personal-blog-backend
```

---

### 一键全量更新（前端 + 后端都有改动）

```bash
cd ~/personal_blog && git pull
cd frontend && npm run build && cd ..
sudo systemctl restart personal-blog-backend
```

---

## 头像

将头像图片命名为 `avatar.jpg` 放入 `frontend/public/` 目录，重新构建前端即可：

```bash
cp your-avatar.jpg frontend/public/avatar.jpg
cd frontend && npm run build
```

建议头像使用正方形并压缩到较小体积（建议 `100~200KB`）。  
头像更新后，如果站点接入了 Cloudflare，请执行 `Custom Purge` 清理：
- `https://ningaloha.com/avatar.jpg`

---

## 性能维护基线

### Lighthouse 目标

- 手机端（Mobile）性能分：`>= 85`
- 桌面端（Desktop）性能分：`>= 85`

### 已落地优化

- 首页头像补齐了明确尺寸属性（避免布局抖动）
- 首页 infobox 图片容器固定为 `1:1`，并使用 `object-fit: cover`
- 头像资源已压缩，降低首屏图片传输体积
- 首页首屏卡片加入占位渲染，减少异步数据回填造成的首屏波动
- `robots.txt` 与 `sitemap.xml` 已标准化，SEO 审核稳定通过
- 文章详情页已优化 Markdown 渲染流程（渲染缓存 + 低优先级统计请求）

### 最新验证快照

- Lighthouse 移动端（Mobile）：`99`
- Lighthouse 桌面端（Desktop）：`77`（文章详情页场景，仍在持续优化）
- 说明：首页与文章详情页的性能分可能差异较大，建议按关键页面分别评估

### 发布后检查清单（推荐）

```bash
# 1) 头像是否为新资源（示例目标值会随文件更新而变化）
curl -I https://ningaloha.com/avatar.jpg

# 2) robots 与 sitemap 是否可访问
curl https://ningaloha.com/robots.txt
curl -I https://ningaloha.com/sitemap.xml
```

若上线后分数异常回退，优先检查：
- Cloudflare 是否仍命中旧缓存（`cf-cache-status: HIT` + 旧 `content-length`）
- 是否忘记执行 `cd frontend && npm run build` 导致 sitemap/静态资源未更新
- 是否引入了未压缩的大图资源进入首页首屏

---

## 内容版权声明

本仓库代码用于开源协作，但 `backend/content/` 下的文章与文字内容不因仓库公开而自动授权他人使用。  
未经作者书面授权，禁止对文章内容进行转载、复制、二次分发、商用或用于模型训练。

详细条款见 [CONTENT_COPYRIGHT.md](./CONTENT_COPYRIGHT.md)。
