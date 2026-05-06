const SITE_NAME = '寧中亙的个人主页'
const SITE_URL = 'https://ningaloha.com'
const DEFAULT_DESCRIPTION = 'NingAloha 的个人站点，包含项目、文学随笔与技术博客。'

function upsertMeta(selector, attributes) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    document.head.appendChild(el)
  }
  Object.entries(attributes).forEach(([k, v]) => {
    el.setAttribute(k, v)
  })
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

function setJsonLd(data) {
  const id = 'app-jsonld'
  let script = document.getElementById(id)
  if (!data) {
    if (script) script.remove()
    return
  }

  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = id
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(data)
}

function truncate(text, max = 160) {
  if (!text) return DEFAULT_DESCRIPTION
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export function buildAbsoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString()
}

export function applySeo({ title, description, path = '/', type = 'website', image, jsonLd }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonical = buildAbsoluteUrl(path)
  const desc = truncate(description)
  const ogImage = image || buildAbsoluteUrl('/avatar.jpg')

  document.title = fullTitle
  setCanonical(canonical)

  upsertMeta('meta[name="description"]', { name: 'description', content: desc })
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: SITE_NAME })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: desc })
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: type })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage })

  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: desc })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage })

  setJsonLd(jsonLd || null)
}

export function buildArticleJsonLd({ title, summary, path, datePublished, tags, articleType = 'Article' }) {
  const url = buildAbsoluteUrl(path)
  return {
    '@context': 'https://schema.org',
    '@type': articleType,
    headline: title,
    description: truncate(summary),
    datePublished,
    dateModified: datePublished,
    mainEntityOfPage: url,
    url,
    author: {
      '@type': 'Person',
      name: 'NingAloha',
    },
    publisher: {
      '@type': 'Person',
      name: 'NingAloha',
    },
    image: buildAbsoluteUrl('/avatar.jpg'),
    keywords: Array.isArray(tags) ? tags.join(', ') : undefined,
  }
}

export const seoDefaults = {
  siteName: SITE_NAME,
  defaultDescription: DEFAULT_DESCRIPTION,
}
