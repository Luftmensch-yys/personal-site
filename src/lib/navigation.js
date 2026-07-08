const TRANSITION_KEY = 'pageTransition'
export const TRANSITION_MS = 480

export function goToPage(event, href) {
  if (!href || !href.endsWith('.html')) return false
  if (event) event.preventDefault()

  document.body.classList.add('is-leaving')
  sessionStorage.setItem(TRANSITION_KEY, 'forward')

  window.setTimeout(() => {
    window.location.href = href
  }, TRANSITION_MS)

  return true
}
