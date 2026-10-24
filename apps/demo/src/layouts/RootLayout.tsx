import { useEffect, useRef } from 'react'
import { matchPath, NavLink, Outlet, useLocation } from 'react-router-dom'

import { MainPlayer, usePlayerStore } from '@/features/player'

import { VideoPortal } from '@/portals/VideoPortal'
import { VIDEO_SOURCES } from '@/shared/constants/VIDEO_SOURCES'

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
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="flex gap-4 border-b border-gray-700 p-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hover:text-blue-400 ${isActive ? 'text-blue-400' : ''}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `hover:text-blue-400 ${isActive ? 'text-blue-400' : ''}`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/video/1"
            className={({ isActive }) =>
              `hover:text-blue-400 ${isActive ? 'text-blue-400' : ''}`
            }
          >
            Video 1
          </NavLink>
          <NavLink
            to="/video/2"
            className={({ isActive }) =>
              `hover:text-blue-400 ${isActive ? 'text-blue-400' : ''}`
            }
          >
            Video 2
          </NavLink>
        </nav>
        <main className="p-4">
          <Outlet />
          <MainPlayer hidden={!src} />
        </main>
      </div>
    </>
  )
}
