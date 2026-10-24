---
description: Keep a Host alive across routes and choose destinations from a shared layout.
---

# Routing

Place `Host` and **both Slots** in a shared layout that survives navigation. Hide the inactive destination with CSS instead of unmounting it. Route pages render headings and details, while the library remains independent of the router.

## Select a destination from the layout

Pass `pathname` and `navigate` from your router. Define `Player` once in a separate module.

```tsx
import { useEffect, useRef, type ReactNode } from 'react'
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
  const { slotKey, setSlotKey, returnPath, setReturnPath } = Player.usePortal()
  const watching = pathname.startsWith('/watch/')
  const wasWatching = useRef(false)

  useEffect(() => {
    if (watching) {
      setReturnPath(pathname)
      setSlotKey('main')
    } else if (wasWatching.current) {
      setSlotKey('mini')
    }
    wasWatching.current = watching
  }, [pathname, watching, setSlotKey, setReturnPath])

  return (
    <>
      <Player.Host>
        <VideoPlayer />
      </Player.Host>
      {children}
      <section hidden={!watching}>
        <Player.Slot slotKey="main" />
      </section>
      <aside hidden={slotKey !== 'mini'}>
        <Player.Slot slotKey="mini" />
        {returnPath && (
          <button onClick={() => navigate(returnPath)}>Return</button>
        )}
      </aside>
    </>
  )
}
```

`returnPath` is just string metadata. Your application owns navigation history, URL updates, and playback conditions. The example selects mini only after leaving a watch route, so it stays hidden on an initial home visit or after being closed. Call the media player's `pause()` before hiding it with `reset()`; the portal does not manage playback.

## Route transitions and browser state

If the source Slot disappears first, the container may be temporarily detached. React state survives, but the move no longer satisfies the conditions for browser-state preservation through `moveBefore`. Keeping both Slots mounted, as above, allows connected moves without coordinating source removal with the router. The repository demo uses this structure. Older browsers still use `appendChild`; DOM identity survives, but browser-managed state is not universally preserved.

Replacing the shared layout or keying Host by pathname remounts the content. Preservation does not survive full-page reloads or document navigation.
