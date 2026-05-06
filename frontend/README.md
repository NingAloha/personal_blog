# Frontend (personal_blog)

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Build behavior

- `npm run build` 会先执行 `npm run generate:sitemap`，再进行 Vite 构建。
- `generate:sitemap` 会读取仓库根目录下 `backend/content/**/*.md` 并生成：
  - `public/sitemap.xml`

## SEO files

- `src/utils/seo.js`：统一管理页面 `title`、`description`、`canonical`、Open Graph、Twitter Card 和 JSON-LD。
- `public/robots.txt`：声明抓取规则并指向 `https://ningaloha.com/sitemap.xml`。
