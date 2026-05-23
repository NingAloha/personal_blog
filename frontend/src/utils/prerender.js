let fired = false

function inBrowser() {
  return typeof window !== 'undefined'
}

export function markPrerenderReady() {
  if (!inBrowser() || fired) return
  fired = true
  window.dispatchEvent(new Event('app:rendered'))
}

export function resetPrerenderReady() {
  fired = false
}
