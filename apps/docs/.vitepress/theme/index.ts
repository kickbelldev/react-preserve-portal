import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PortalPlayground from './PortalPlayground.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PortalPlayground', PortalPlayground)
  },
} satisfies Theme
