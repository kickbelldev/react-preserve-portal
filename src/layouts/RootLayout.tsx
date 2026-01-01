import { NavLink, Outlet } from 'react-router-dom'

export function RootLayout() {
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
        </main>
      </div>
    </>
  )
}
