---
title: Routing
description: Keep the player in a shared layout and select its destination from the current route.
---

# Routing

Keep Host in a layout that survives route changes. Changing the route should select a Slot, not recreate the player. For a basic player without routing, start with [the video guide](./video-player).

## Connect your router to a shared layout

The following component accepts `pathname`, `navigate`, and the active route's content as props. Obtain those values from your router and render `PlayerLayout` above the route content. For React Router, they can come from `useLocation().pathname`, `useNavigate()`, and an `<Outlet />`. **The library does not install or control a router.**

The example treats `/watch/*` as the full-player route. Supply a video at `/video.mp4` or replace that URL; this example keeps one source across routes.

```tsx [PlayerLayout.tsx]
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Player = createPortal({ id: 'routed-player', slots: ['main', 'mini'] })

type Props = {
  pathname: string
  navigate: (path: string) => void
  children: ReactNode
}

export function PlayerLayout({ pathname, navigate, children }: Props) {
  const { slotKey, setSlotKey, returnPath, setReturnPath, reset } = Player.usePortal()
  const watching = pathname.startsWith('/watch/')
  const wasWatching = useRef(false)
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (watching) {
      setReturnPath(pathname)
      setSlotKey('main')
    } else if (wasWatching.current) {
      setSlotKey('mini')
    }
    wasWatching.current = watching
  }, [pathname, watching, setSlotKey, setReturnPath])

  useEffect(() => {
    if (slotKey === null) video.current?.pause()
  }, [slotKey])

  return (
    <>
      <Player.Host mountWhen="connected">
        <video ref={video} src="/video.mp4" controls playsInline style={{ width: '100%' }} />
      </Player.Host>
      {children}
      <section hidden={!watching} aria-label="Full player">
        <Player.Slot slotKey="main" />
      </section>
      <aside
        hidden={slotKey !== 'mini'}
        aria-label="Mini player"
        style={{ position: 'fixed', right: 16, bottom: 16, width: 'min(320px, 90vw)' }}
      >
        <Player.Slot slotKey="mini" />
        {returnPath && <button onClick={() => navigate(returnPath)}>Return to video</button>}
        <button onClick={reset}>Close player</button>
      </aside>
    </>
  )
}
```

## Check each transition

| Action | Result |
| --- | --- |
| Open the home route first | No Slot is selected; the player is hidden. |
| Visit `/watch/1` | Select `main` and remember `/watch/1` as `returnPath`. |
| Navigate from `/watch/1` to another route | Select `mini`; the same video moves into the mini player. |
| Close the mini player, then visit another non-watch route | Keep it hidden. Merely changing a route does not reopen it. |
| Visit a watch route again | Show the main player; playback is controlled by the user. |

`returnPath` is metadata only. The return button calls your router's `navigate`; neither setting `returnPath` nor calling `reset()` changes the URL.

## Keep destinations mounted when connection matters

Both Slots stay mounted in this layout. `hidden` changes visibility, not DOM membership. Removing a route-local Slot can temporarily detach the content before the next route registers its destination. React state can survive that gap while Host remains mounted, but iframe documents and focus may not.

Persistent Slots allow connected `moveBefore` moves in supporting browsers. They do not override browser media policies; playback can still pause, especially during hiding or fallback moves. The player keeps native controls available for resuming.

If the shared layout itself unmounts, or Host gets `key={pathname}`, its content starts over. Full page navigation also creates a new document. See [preservation and lifetime](./preservation) for these boundaries.
