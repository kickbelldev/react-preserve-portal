---
title: Video player
description: Share one video element between a full player and a mini player, with explicit pause on close.
---

# Video player

Use one `<video>` in Host and two empty Slots for its full and mini views. The portal chooses where the player appears; your application controls playback, source changes, and closing.

## A complete example

Install the package as shown in the [quick start](./quick-start). Put a playable video at your app's `/video.mp4` URL, or replace `src` with your own media URL. In a Vite app, a file named `public/video.mp4` supplies that URL. Adapt it if your app uses a different base path.

This example uses the browser's native `controls`, so it needs no separate playback-state store. It does not autoplay. Play the video, then select **Show in mini**.

```tsx [App.tsx]
import { useEffect, useRef } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Player = createPortal({ id: 'video-player', slots: ['main', 'mini'] })

function Video({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const { slotKey } = Player.usePortal()

  useEffect(() => {
    if (slotKey === null) video.current?.pause()
  }, [slotKey])

  return (
    <video
      ref={video}
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label="Example video"
      style={{ display: 'block', width: '100%' }}
    />
  )
}

export default function App() {
  const { slotKey, setSlotKey, reset } = Player.usePortal()
  useEffect(() => setSlotKey('main'), [setSlotKey])

  return (
    <main>
      <Player.Host mountWhen="connected">
        <Video src="/video.mp4" />
      </Player.Host>

      <h1>Watch</h1>
      <Player.Slot slotKey="main" style={{ maxWidth: 720, minHeight: 180 }} />
      <button onClick={() => setSlotKey('main')}>Show in main</button>
      <button onClick={() => setSlotKey('mini')}>Show in mini</button>

      <aside
        hidden={slotKey !== 'mini'}
        aria-label="Mini player"
        style={{ position: 'fixed', right: 16, bottom: 16, width: 'min(320px, 90vw)' }}
      >
        <Player.Slot slotKey="mini" />
        <button onClick={() => setSlotKey('main')}>Return to main</button>
        <button onClick={reset}>Close player</button>
      </aside>
    </main>
  )
}
```

## Why both Slots stay mounted

The mini player's `hidden` attribute changes its visibility without unmounting its Slot. The main Slot also stays in the document. This allows a connected move when the browser supports `moveBefore`.

`mountWhen="connected"` waits for the first destination before mounting the video. It does not change what later moves or hiding mean.

## Closing and reopening

The close button calls `reset()`. The video component observes `slotKey === null` and pauses. Selecting **Show in main** shows the same element again; use its Play control to resume.

Pausing is a policy implemented by this example. The library's `reset()` does not call `pause()`, clear playback time, or reset component state. If you build custom controls, derive their state from `play`, `pause`, and `ended` events and handle rejected `play()` promises. See [troubleshooting](./troubleshooting#playback-controls-disagree-with-the-video).

## What a move can preserve

The video element and React component state remain the same while Host and its children stay mounted. Connected `moveBefore` moves can also preserve browser-managed state. An `appendChild` move or hide/show can interrupt playback; offer an explicit way to resume. Replacing `src` loads another media resource even though the element is the same.

Start with [the live example](../playground), then use [the routing guide](./routing) to select a destination from your application's URL.
