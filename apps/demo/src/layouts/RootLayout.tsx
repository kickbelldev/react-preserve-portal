import { useEffect, useRef } from 'react'
import { matchPath, NavLink, Outlet, useLocation } from 'react-router-dom'

import { MainPlayer, usePlayerStore } from '@/features/player'

import { VideoPortal } from '@/portals/VideoPortal'
import { VIDEO_SOURCES } from '@/shared/constants/VIDEO_SOURCES'
import { ExternalIcon } from '@/shared/ui/icons'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/video/1', label: 'Video 1' },
  { to: '/video/2', label: 'Video 2' },
]

export function RootLayout() {
  const { pathname } = useLocation()
  const match = matchPath('/video/:id', pathname)
  const src = match
    ? (VIDEO_SOURCES[match.params.id ?? '1'] ?? VIDEO_SOURCES['1'])
    : null
  const { setSlotKey, setReturnPath } = VideoPortal.usePortal()
  const initVideo = usePlayerStore((state) => state.initVideo)
  const wasWatching = useRef(false)

  useEffect(() => {
    if (src) {
      initVideo(src)
      setReturnPath(pathname)
      setSlotKey('main')
    } else if (wasWatching.current) {
      setSlotKey('mini')
    }
    wasWatching.current = !!src
  }, [pathname, src, initVideo, setReturnPath, setSlotKey])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt=""
              className="h-6 w-6"
            />
            <span className="hidden sm:inline">Preserve Portal</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
              demo
            </span>
          </NavLink>
          <nav className="flex gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 transition-colors ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <a
            href="https://kickbelldev.github.io/react-preserve-portal/"
            target="_blank"
            rel="noreferrer"
            className="ml-auto hidden items-center gap-1.5 text-sm text-zinc-400 hover:text-white md:flex"
          >
            문서
            <ExternalIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <MainPlayer hidden={!src} />
        <Outlet />
      </main>
    </div>
  )
}
