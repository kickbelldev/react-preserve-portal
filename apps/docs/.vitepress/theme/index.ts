import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PortalPlayground from './PortalPlayground.vue'
import { useNotFoundRobots } from './not-found'
import './style.css'

export default {
  extends: DefaultTheme,
  setup: useNotFoundRobots,
  enhanceApp({ app }) {
    app.component('PortalPlayground', PortalPlayground)
  },
} satisfies Theme
