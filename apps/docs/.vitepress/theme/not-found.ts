import { watch } from 'vue'
import { useData } from 'vitepress'

export function useNotFoundRobots() {
  if (import.meta.env.SSR) return
  const { page } = useData()

  // Unknown URLs use VitePress's virtual page data, so its head manager cannot
  // adopt the robots tag from the host's 404.html response. Own only that tag.
  watch(
    () => page.value.isNotFound,
    (isNotFound) => {
      const tags = document.head.querySelectorAll('meta[data-docs-not-found]')
      if (!isNotFound) {
        tags.forEach((tag) => tag.remove())
      } else if (tags.length === 0) {
        const tag = document.createElement('meta')
        tag.name = 'robots'
        tag.content = 'noindex, follow'
        tag.setAttribute('data-docs-not-found', '')
        document.head.append(tag)
      }
    },
    { immediate: true, flush: 'post' },
  )
}
