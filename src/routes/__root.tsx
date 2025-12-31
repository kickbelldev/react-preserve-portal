import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

import { MiniPlayer, VideoElement } from '../features/player'
import { PortalHost } from '../features/portal/components/PortalHost'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="flex gap-4 border-b border-gray-700 p-4">
          <Link to="/" className="hover:text-blue-400 [&.active]:text-blue-400">
            Home
          </Link>
          <Link
            to="/about"
            className="hover:text-blue-400 [&.active]:text-blue-400"
          >
            About
          </Link>
          <Link
            to="/video/$id"
            params={{ id: '1' }}
            className="hover:text-blue-400 [&.active]:text-blue-400"
          >
            Video 1
          </Link>
          <Link
            to="/video/$id"
            params={{ id: '2' }}
            className="hover:text-blue-400 [&.active]:text-blue-400"
          >
            Video 2
          </Link>
        </nav>
        <main className="p-4">
          <Outlet />
        </main>
        <MiniPlayer />
      </div>
      <PortalHost>
        <VideoElement />
      </PortalHost>
    </>
  )
}
