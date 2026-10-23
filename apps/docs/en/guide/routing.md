---
description: Keep a Host alive across routes and choose destinations from a shared layout.
---

# Routing

Place `Host` and the persistent mini slot in a **shared layout** that survives navigation. Route pages render their own destination slots. The library does not depend on a particular router.

## Select a destination from the layout

Pass `pathname` and `navigate` from your router. Define `Player` once in a separate module.

```tsx
import { useEffect, type ReactNode } from 'react'
import { Player } from './player-portal'
import { VideoPlayer } from './VideoPlayer'

export function Layout({
  pathname,
  navigate,
  children,
}: {
  pathname: string
  navigate: (path: string) => void
  children: ReactNode
}) {
  const { setSlotKey, returnPath, setReturnPath } = Player.usePortal()

  useEffect(() => {
    if (pathname.startsWith('/watch/')) {
      setReturnPath(pathname)
      setSlotKey('main')
    } else {
      setSlotKey('mini')
    }
  }, [pathname, setSlotKey, setReturnPath])

  return (
    <>
      <Player.Host>
        <VideoPlayer />
      </Player.Host>
      {children}
      <aside>
        <Player.Slot slotKey="mini" />
        {returnPath && (
          <button onClick={() => navigate(returnPath)}>Return</button>
        )}
      </aside>
    </>
  )
}

export function WatchPage() {
  return <Player.Slot slotKey="main" />
}
```

`returnPath` is just string metadata. Your application owns navigation history, URL updates, and playback conditions. In a real app, add a condition to show the mini player only after content has been selected.

## Route transitions and browser state

If the source Slot disappears first, the container may be temporarily detached. React state survives, but the move no longer satisfies the conditions for browser-state preservation through `moveBefore`. If iframe or focus continuity matters, move to a persistent mini slot before removing the source slot. Coordinate this with your router's transition timing.

Replacing the shared layout or keying Host by pathname remounts the content. Preservation does not survive full-page reloads or document navigation.
