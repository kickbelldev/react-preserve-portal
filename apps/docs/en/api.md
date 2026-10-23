---
title: API reference
description: Types, defaults, and behavior for createPortal, Host, Slot, and usePortal.
---

# API reference

## `createPortal({ id, slots })`

```tsx
import { createPortal } from '@charley-kim/react-preserve-portal'

export const Player = createPortal({ id: 'player', slots: ['main', 'mini'] })
// Returns { id, slots, Host, Slot, usePortal }
// Player.Slot's slotKey: 'main' | 'mini'
```

| Option  | Type                | Meaning                                                                                              |
| ------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`    | `string`            | State-sharing key within one loaded library instance. Use a distinct ID for each independent portal. |
| `slots` | `readonly string[]` | Allowed slot keys. TypeScript 5+ automatically infers literals.                                      |

Calling the factory during render creates new Host and Slot component types, causing remounts. Define it at module scope. The slot list provides type checking, not runtime validation. Validate values coming from untyped JavaScript yourself.

## `Host`

```tsx
<Player.Host><VideoPlayer /></Player.Host>
// The previous API remains supported:
<Player.Host node={<VideoPlayer />} />
```

| Prop       | Type / default     | Meaning                                                          |
| ---------- | ------------------ | ---------------------------------------------------------------- |
| `children` | `ReactNode`        | Content to preserve. Supply either `children` or `node`.         |
| `node`     | `ReactNode`        | Content prop retained for compatibility.                         |
| `as`       | HTML tag / `'div'` | Container tag, chosen at creation. Keep it stable while mounted. |

Host does not forward general HTML attributes or refs. Put styling, events, and ARIA attributes on your content or Slot. Host renders `null` on the server.

## `Slot`

```tsx
<Player.Slot
  slotKey="main"
  as="section"
  className="player-area"
  aria-label="Player"
/>
```

| Prop            | Type / default                | Meaning                                                     |
| --------------- | ----------------------------- | ----------------------------------------------------------- |
| `slotKey`       | A declared slot key           | Identifies this destination.                                |
| `as`            | HTML tag / `'div'`            | Destination tag. Use an element that can contain children.  |
| HTML attributes | Tag-specific `HTMLAttributes` | `className`, `id`, events, ARIA, data attributes, and more. |

Slots register on mount and unregister on unmount. Host renders the content. Prefer rendering empty-state descriptions as siblings instead of adding React children inside a Slot.

If destinations with the same key overlap, **the last registration wins**. Cleaning up an older Slot does not unregister its replacement. Removing the latest destination does not automatically restore an older registration.

## `usePortal()`

```tsx
const {
  slotKey,
  setSlotKey,
  returnPath,
  setReturnPath,
  targets,
  registerTarget,
  unregisterTarget,
  reset,
} = Player.usePortal()
```

| Member                         | Type                        | Behavior                                                                             |
| ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------ |
| `slotKey`                      | Slot key or `null`          | Current selection; initially `null`.                                                 |
| `setSlotKey(key)`              | `(key) => void`             | Select a destination, or hide with `null`.                                           |
| `returnPath`                   | `string \| null`            | Optional router metadata; initially `null`.                                          |
| `setReturnPath(path)`          | `(string \| null) => void`  | Set metadata without changing the URL.                                               |
| `targets`                      | `Map<SlotKey, HTMLElement>` | Snapshot of registered destinations. Do not mutate it.                               |
| `registerTarget(key, element)` | Returns `() => void`        | Register a manual destination and return an ownership-safe cleanup.                  |
| `unregisterTarget(key)`        | `(key) => void`             | Remove the current registration for a key.                                           |
| `reset()`                      | `() => void`                | Hide content and clear `returnPath`. Keep destinations and content's internal state. |

Action references are stable per ID. Changes to another ID do not notify this portal's subscribers. The hook subscribes to the entire snapshot for its chosen ID.

### Register an external DOM destination

```tsx
import { useEffect } from 'react'

function ExternalTarget({ element }: { element: HTMLElement | null }) {
  const { registerTarget } = Player.usePortal()
  useEffect(() => {
    if (!element) return
    return registerTarget('mini', element)
  }, [element, registerTarget])
  return null
}
```

The returned cleanup only unregisters the element if it still owns the registration. Prefer it over a manual `unregisterTarget` call to avoid removing a newer destination. Never register a descendant of the portal's own container as its destination: that would form a DOM cycle, and the browser rejects the move.

## Public types

Import `CreatePortalOptions`, `HostProps`, `SlotProps`, `UsePortalReturn`, and `TypedPortal` with `import type` from the package root. Internal store and component paths are not public API.
