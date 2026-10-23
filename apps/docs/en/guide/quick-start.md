---
description: Install the library and build a complete example with a Host and two Slots.
---

# Quick start

## Install

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

Requires React and React DOM 18 or later. These docs describe the **0.3.0 API**.

## Define and render a portal

Call the factory **once, outside component render**. TypeScript infers literal slot names without `as const`.

```tsx
import { useEffect, useState } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Panel = createPortal({ id: 'editor', slots: ['main', 'mini'] })

function Editor() {
  const [count, setCount] = useState(0)
  return (
    <section>
      <input defaultValue="A note that survives moves" aria-label="Note" />
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </section>
  )
}

export default function App() {
  const { slotKey, setSlotKey } = Panel.usePortal()
  useEffect(() => setSlotKey('main'), [setSlotKey])

  return (
    <>
      <Panel.Host>
        <Editor />
      </Panel.Host>
      <main>
        <Panel.Slot slotKey="main" />
      </main>
      <aside>
        <Panel.Slot slotKey="mini" />
      </aside>
      <button onClick={() => setSlotKey(slotKey === 'main' ? 'mini' : 'main')}>
        Move
      </button>
      <button onClick={() => setSlotKey(null)}>Hide</button>
    </>
  )
}
```

The initial `slotKey` is `null`. `Host` mounts its content into a detached container. Selecting a registered slot attaches that container to the page. You can select a slot before it exists; content attaches when that destination registers.

## Two rules to keep in mind

1. Keep `Host` mounted for as long as the state should survive. A shared layout is usually the right place when using a router.
2. Use distinct IDs for independent portals. Identical IDs share state within the same loaded copy of the library.

Try the [interactive playground](../playground), or continue to the [API reference](../api).
