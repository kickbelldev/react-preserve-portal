---
title: API reference
description: Types, defaults, and behavior for createPortal, Host, Slot, usePortal, and dispose.
---

# API reference

Define a portal with the factory, render its content in Host, then select a Slot to move it. If you are new to the library, try the complete [quick-start example](./guide/quick-start) first. Use this page to look up exact types and behavior.

## `createPortal({ id, slots })`

```tsx
import { createPortal } from '@charley-kim/react-preserve-portal'

export const Player = createPortal({ id: 'player', slots: ['main', 'mini'] })
// Returns { id, slots, Host, Slot, usePortal, dispose }
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

| Prop        | Type / default                               | Meaning                                                              |
| ----------- | -------------------------------------------- | -------------------------------------------------------------------- |
| `children`  | `ReactNode`                                  | Content to preserve. Supply either `children` or `node`.             |
| `node`      | `ReactNode`                                  | Content prop retained for compatibility.                             |
| `as`        | HTML tag / `'div'`                           | Container tag, chosen at creation. Keep it stable while mounted.     |
| `mountWhen` | `'immediate' \| 'connected'` / `'immediate'` | Mount content immediately or wait for the first document connection. |

With `mountWhen="connected"`, initial layout effects and `autoFocus` run after connection. Later moves or hiding do not remount content. Connection does not guarantee visibility or a nonzero size.

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

Slots register on mount and unregister on unmount; hidden boundaries can also detach their refs. Host renders the content. `children` and `dangerouslySetInnerHTML` are rejected by types and at runtime. Render empty-state descriptions as siblings and never overwrite Slot content through external DOM code.

Slot does not expose a user `ref` prop. If you need to own the destination element, use [external DOM registration](#register-an-external-dom-destination) below.

If destinations with the same key overlap, **the last registration wins**. Cleaning up an older Slot does not unregister its replacement. If the latest destination is removed first, the content returns to the most recent destination that is still registered, so overlapping Slots during an exit animation do not drop the content.

Development builds warn once when more than one Host is mounted for a portal ID, when a slot key is not declared (`setSlotKey`, `Slot`, `registerTarget`), when one ID is created with different `slots`, and when a Host's `as` changes after mount. Production builds strip these checks.

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

| Member                         | Type                                | Behavior                                                                             |
| ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------ |
| `slotKey`                      | Slot key or `null`                  | Current selection; initially `null`.                                                 |
| `setSlotKey(key)`              | `(key: SlotKey \| null) => void`                     | Select a destination, or hide with `null`.                                           |
| `returnPath`                   | `string \| null`                    | Optional router metadata; initially `null`.                                          |
| `setReturnPath(path)`          | `(string \| null) => void`          | Set metadata without changing the URL.                                               |
| `targets`                      | `ReadonlyMap<SlotKey, HTMLElement>` | Snapshot of registered destinations. Do not mutate it.                               |
| `registerTarget(key, element)` | Returns `() => void`                | Register a manual destination and return an ownership-safe cleanup.                  |
| `unregisterTarget(key)`        | `(key: SlotKey) => void`                     | Remove every registration for a key.                                                  |
| `reset()`                      | `() => void`                        | Hide content and clear `returnPath`. Keep destinations and content's internal state. |

`slotKey` is a selection, not a connection or visibility signal: its target can be missing or hidden. `setSlotKey(null)` clears the selection; `reset()` also clears `returnPath`. Neither resets the content's React state.

Action references are stable per ID. Changes to another ID do not notify this portal's subscribers. The hook subscribes to the entire snapshot for its chosen ID.

### Register an external DOM destination

Use this when the destination is an existing DOM element. For normal React layouts, `Slot` handles registration and cleanup for you. The `Player` below is the factory defined above.

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

Every registration has a distinct identity, even when reusing the same element. The returned cleanup only unregisters that registration if it is still current. Prefer it over a manual `unregisterTarget` call to avoid removing a newer destination. Destinations must be in Host's document and cannot be its container or descendants. The library rejects cross-document adoption and cyclic moves before changing the DOM.

## `dispose(): boolean`

Use this for an unused portal ID when a feature is permanently removed or a long-lived app creates and retires dynamic portals. Hiding, moving, and normal route changes do not require it. The following sequence assumes you own the React root and any manual target registrations.

```tsx
// After all React owners of this ID have unmounted:
root.unmount()
cleanupManualTarget()
const released = Player.dispose()
```

Returns `false` while a Host, Slot, hook owner, subscriber or manual destination remains. Hidden committed owners also block disposal. Returns `true` after removing the ID's store or if no store exists. `reset()` only hides content; it does not dispose the store.

Call this after ownership ends, never during render or while mounting/transferring owners. Retained actions from the disposed store throw. Old registration cleanup is a safe no-op, and a later mount of the same factory uses a fresh empty store.

## Public types

Import `CreatePortalOptions`, `HostProps`, `SlotProps`, `UsePortalReturn`, and `TypedPortal` with `import type` from the package root. Internal store and component paths are not public API.
