export const SITE_URL = 'https://ningaloha.com'

export function normalizeSitePath(path = '/') {
  if (!path || path === '/') return '/'
  const rawPath = String(path)
  const [pathAndQuery, hash = ''] = rawPath.split('#')
  const [basePath, search = ''] = pathAndQuery.split('?')
  const normalizedPath = basePath.endsWith('/') ? basePath : `${basePath}/`
  const query = search ? `?${search}` : ''
  const fragment = hash ? `#${hash}` : ''
  return `${normalizedPath}${query}${fragment}`
}

export function buildAbsoluteUrl(path = '/') {
  return new URL(normalizeSitePath(path), SITE_URL).toString()
}
