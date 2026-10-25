import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type HeadConfig } from 'vitepress'
import { version } from '../../../packages/react-preserve-portal/package.json'

const base = '/react-preserve-portal/'
const origin = 'https://kickbelldev.github.io'

function sidebar(en: boolean) {
  const prefix = en ? '/en' : ''
  return [
    {
      text: en ? 'Start here' : '시작하기',
      items: [
        {
          text: en ? 'Introduction' : '소개',
          link: `${prefix}/guide/introduction`,
        },
        {
          text: en ? 'Quick start' : '빠르게 시작하기',
          link: `${prefix}/guide/quick-start`,
        },
        {
          text: en ? 'How preservation works' : '보존 원리와 수명',
          link: `${prefix}/guide/preservation`,
        },
        {
          text: en ? 'Interactive playground' : '인터랙티브 예제',
          link: `${prefix}/playground`,
        },
      ],
    },
    {
      text: en ? 'Build with it' : '실전 가이드',
      items: [
        {
          text: en ? 'Video player' : '비디오 플레이어',
          link: `${prefix}/guide/video-player`,
        },
        { text: en ? 'Routing' : '라우팅', link: `${prefix}/guide/routing` },
        {
          text: en ? 'SSR & hydration' : 'SSR과 하이드레이션',
          link: `${prefix}/guide/ssr`,
        },
        {
          text: en ? 'Browser APIs & alternatives' : '브라우저 API와 대안',
          link: `${prefix}/guide/web-platform`,
        },
        {
          text: en ? 'Troubleshooting' : '문제 해결',
          link: `${prefix}/guide/troubleshooting`,
        },
      ],
    },
    {
      text: en ? 'Reference' : '레퍼런스',
      items: [
        { text: 'API', link: `${prefix}/api` },
        {
          text: en ? 'Lifecycle and ownership' : '수명과 소유권',
          link: `${prefix}/guide/lifecycle-safety`,
        },
        {
          text: en ? 'Migration to 0.4' : '0.4 마이그레이션',
          link: `${prefix}/migration`,
        },
      ],
    },
  ]
}

export default defineConfig({
  title: 'React Preserve Portal',
  description:
    'React 콘텐츠를 다시 마운트하지 않고 이동하세요. DOM과 상태를 보존하는 타입 안전한 포털.',
  base,
  outDir: '../../dist/apps/docs',
  cleanUrls: false,
  lastUpdated: true,
  sitemap: {
    hostname: origin + base,
    transformItems: (items) => items.filter((item) => item.url !== '404.html'),
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    ['meta', { name: 'theme-color', content: '#087f72' }],
  ],
  // Page data is shared by prerendered HTML and the client router. transformHead
  // alone would leave the first page's canonical/share tags behind on navigation.
  transformPageData(pageData, { siteConfig }) {
    if (pageData.relativePath === '404.md') {
      pageData.isNotFound = true
      return
    }

    const en = pageData.relativePath.startsWith('en/')
    const title = pageData.title || siteConfig.site.title
    const description =
      pageData.description ||
      siteConfig.site.locales[en ? 'en' : 'root']?.description ||
      siteConfig.site.description
    const route = pageData.relativePath
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '.html')
    const url = `${origin}${base}${route}`
    const image = `${origin}${base}social-card.png`
    const imageAlt =
      'React Preserve Portal — one component, main and mini destinations'
    const unlocalizedPage = pageData.relativePath.replace(/^en\//, '')
    const translations = [
      { lang: 'ko-KR', locale: 'ko_KR', page: unlocalizedPage },
      { lang: 'en', locale: 'en_US', page: `en/${unlocalizedPage}` },
    ].filter(({ page }) => existsSync(join(siteConfig.srcDir, page)))
    const locale = en ? 'en_US' : 'ko_KR'
    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'React Preserve Portal' }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:locale', content: locale }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { property: 'og:image:type', content: 'image/png' }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { property: 'og:image:alt', content: imageAlt }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: image }],
      ['meta', { name: 'twitter:image:alt', content: imageAlt }],
    ]
    for (const translation of translations) {
      const route = translation.page
        .replace(/index\.md$/, '')
        .replace(/\.md$/, '.html')
      head.push([
        'link',
        {
          rel: 'alternate',
          hreflang: translation.lang,
          href: `${origin}${base}${route}`,
        },
      ])
      if (translation.locale !== locale) {
        head.push([
          'meta',
          { property: 'og:locale:alternate', content: translation.locale },
        ])
      }
    }
    pageData.frontmatter.head = [...(pageData.frontmatter.head ?? []), ...head]
  },
  vite: { esbuild: { jsx: 'automatic' } },
  locales: {
    root: {
      label: '한국어',
      lang: 'ko-KR',
      themeConfig: {
        nav: [
          { text: '가이드', link: '/guide/introduction' },
          { text: 'API', link: '/api' },
          { text: '플레이그라운드', link: '/playground' },
          {
            text: `v${version}`,
            link: 'https://www.npmjs.com/package/@charley-kim/react-preserve-portal',
          },
        ],
        sidebar: sidebar(false),
        outline: { label: '이 페이지에서', level: [2, 3] },
        docFooter: { prev: '이전', next: '다음' },
        sidebarMenuLabel: '메뉴',
        returnToTopLabel: '맨 위로',
        darkModeSwitchLabel: '테마',
        editLink: {
          pattern:
            'https://github.com/kickbelldev/react-preserve-portal/edit/main/apps/docs/:path',
          text: '이 페이지 수정하기',
        },
        lastUpdated: { text: '마지막 수정' },
        footer: {
          message: 'DOM은 그대로, 위치만 새롭게.',
          copyright: 'MIT License · React Preserve Portal',
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en',
      description:
        'Move React content without remounting. Preserve DOM identity and component state with a small, typed portal API.',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/introduction' },
          { text: 'API', link: '/en/api' },
          { text: 'Playground', link: '/en/playground' },
          {
            text: `v${version}`,
            link: 'https://www.npmjs.com/package/@charley-kim/react-preserve-portal',
          },
        ],
        sidebar: sidebar(true),
        outline: { level: [2, 3] },
        editLink: {
          pattern:
            'https://github.com/kickbelldev/react-preserve-portal/edit/main/apps/docs/:path',
        },
        footer: {
          message: 'Same DOM. New destination.',
          copyright: 'MIT License · React Preserve Portal',
        },
      },
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Preserve Portal',
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/kickbelldev/react-preserve-portal',
      },
    ],
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '문서 검색', buttonAriaLabel: '문서 검색' },
              modal: {
                displayDetails: '자세히 보기',
                resetButtonTitle: '검색 초기화',
                backButtonTitle: '검색 닫기',
                noResultsText: '검색 결과가 없습니다',
                footer: {
                  selectText: '선택',
                  navigateText: '이동',
                  closeText: '닫기',
                },
              },
            },
          },
        },
      },
    },
  },
})
