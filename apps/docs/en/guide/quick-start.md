---
title: Quick start
description: Install the package, then move one editor between two destinations in a complete React example.
---

# Quick start

This example moves one input and counter between two locations. You can try preservation without a video file, router, or extra state library.

## 1. Install

::: code-group

```sh [npm]
npm install @charley-kim/react-preserve-portal
```

```sh [pnpm]
pnpm add @charley-kim/react-preserve-portal
```

```sh [yarn]
yarn add @charley-kim/react-preserve-portal
```

:::

Use an existing React app with React and React DOM 18+. TypeScript users need TypeScript 5+.

## 2. Add the example

Paste this into your app's `App.tsx`. Define `Panel` outside the component so its Host and Slot component types remain stable.

```tsx [App.tsx]
import { useEffect, useState } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Panel = createPortal({ id: 'editor', slots: ['main', 'mini'] })

function Editor() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <input aria-label="Note" defaultValue="Edit this before moving" />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  )
}

export default function App() {
  const { setSlotKey } = Panel.usePortal()
  useEffect(() => setSlotKey('main'), [setSlotKey])

  return (
    <main>
      <Panel.Host><Editor /></Panel.Host>

      <section>
        <h2>Main view</h2>
        <Panel.Slot slotKey="main" style={{ minHeight: 80 }} />
      </section>
      <section>
        <h2>Mini view</h2>
        <Panel.Slot slotKey="mini" style={{ minHeight: 80 }} />
      </section>

      <button onClick={() => setSlotKey('main')}>Show in main</button>
      <button onClick={() => setSlotKey('mini')}>Show in mini</button>
      <button onClick={() => setSlotKey(null)}>Hide</button>
    </main>
  )
}
```

## 3. Check the result

1. Edit the note and increment the counter in the main area.
2. Select **Show in mini**. Both values should follow the content.
3. Select **Hide**, then **Show in main**. The values should still be there.

There is one `Editor` inside Host. Slots only define its destinations; they do not render copies. Headings and placeholders go beside Slots, not inside them.

## How the first selection works

`slotKey` starts as `null`, so nothing is visible. The Effect selects `main` after mounting. With the default `mountWhen="immediate"`, the content can mount before its container connects to the document. Use `mountWhen="connected"` if the first layout measurement or autofocus needs a connected element.

Selecting a Slot before it mounts is supported: content attaches when that destination registers. Keep Host mounted for as long as its content needs to survive. Give independent portals different IDs.

Continue with [a video player](./video-player), [routing](./routing), or the [API reference](../api).
