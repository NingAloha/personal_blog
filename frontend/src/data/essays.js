export const essays = [
  {
    id: 1,
    slug: 'on-beginning',
    title: '开始',
    summary: '万事开头难，但不开始就永远只是想象。关于动笔这件事。',
    date: '2026-04-02',
    tags: ['随想'],
    featured: true,
    content: `## 一

有很多东西一直想写，却总是等着"更合适的时机"。时机从来不会自己来，它只在你已经在做的时候悄悄出现。

## 二

写作这件事，最难的不是写什么，而是把第一个字打出来之后不要删掉它。

## 三

所以这是第一篇。不求完整，只求存在。
`,
  },
  {
    id: 2,
    slug: 'on-simplicity',
    title: '简单的事',
    summary: '做一件事的最好方式，往往是把它做得比你想象的更简单。',
    date: '2026-04-01',
    tags: ['随想', '设计'],
    featured: false,
    content: `## 复杂是怎么来的

复杂不是突然就有的，它是一点一点加进来的。每次加的时候都感觉很合理，但加完之后整体就失控了。

## 简单需要刻意为之

简单不是懒惰，是纪律。需要不断问自己：这个真的必要吗？

## 关于这个网站

这个网站的设计原则就是这个：只放必要的东西。
`,
  },
]

export function getFeaturedEssay() {
  return essays.find((e) => e.featured) || essays[0]
}

export function getEssayBySlug(slug) {
  return essays.find((e) => e.slug === slug)
}
