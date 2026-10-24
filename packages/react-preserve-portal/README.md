# @charley-kim/react-preserve-portal

[![npm version](https://badgen.net/npm/v/@charley-kim/react-preserve-portal)](https://www.npmjs.com/package/@charley-kim/react-preserve-portal)
[![license](https://badgen.net/npm/license/@charley-kim/react-preserve-portal)](https://github.com/kickbelldev/react-preserve-portal/blob/main/LICENSE)

Move React content between DOM destinations without recreating its DOM nodes or
remounting its React subtree. Useful for persistent video players, editors,
canvases, and other stateful UI.

```bash
npm install @charley-kim/react-preserve-portal
```

Requires React and React DOM 18 or later. TypeScript users need TypeScript 5 or
later for automatic literal inference. The library has no runtime dependencies
other than its React peer dependencies.

Read the [technical documentation](https://kickbelldev.github.io/react-preserve-portal/en/)
([한국어](https://kickbelldev.github.io/react-preserve-portal/)) for detailed guides,
API reference, browser compatibility, and an interactive playground.

## Quick start

Create the portal **once, outside component render**. Keep its `Host` mounted for
as long as you want its content and state to survive.

```tsx
import { useEffect } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Player = createPortal({ id: 'player', slots: ['main', 'mini'] })

export function App() {
  const { slotKey, setSlotKey } = Player.usePortal()

  useEffect(() => setSlotKey('main'), [setSlotKey])

  return (
    <>
      <Player.Host>
        <video src="/video.mp4" controls />
      </Player.Host>

      <main>
        <Player.Slot slotKey="main" />
      </main>
      <aside>
        <Player.Slot slotKey="mini" />
      </aside>

      <button onClick={() => setSlotKey(slotKey === 'main' ? 'mini' : 'main')}>
        Move player
      </button>
      <button onClick={() => setSlotKey(null)}>Hide</button>
    </>
  )
}
```

The initial active slot is `null`: content is mounted in a detached container,
so it is not visible until you select a registered slot. Selecting a slot before
it mounts is supported; content attaches when the destination appears.

## How preservation works

React always renders into the **same unmanaged container**. The library moves
that container between `Slot` elements. React's portal destination never changes,
so moving it does not remount the React subtree.

```text
Host → React portal → stable container → currently selected Slot
```

- DOM identity, React state, and effects survive slot changes while `Host` stays mounted.
- Hiding content or temporarily removing a destination detaches the container;
  the React subtree remains mounted. Effects and timers continue running.
- Unmounting `Host`, changing its React key, or replacing its content with a
  different component type ends preservation, following normal React rules.
- Connected moves use the browser's `Element.moveBefore` when available. Other
  moves use `appendChild`. Detaching/reinserting DOM can reset browser-managed
  state such as focus, iframe documents, media playback, or animations. DOM
  identity alone does **not** guarantee uninterrupted playback or iframe state
  in every browser. Test the browsers and media you support.
- React context and synthetic events follow the `Host`'s React tree, not the
  destination's React ancestors. CSS inheritance follows the physical DOM.
- Keep `Host`'s `as` tag stable; it is chosen when the container is created.

## API

The reference below describes npm 0.3.0. The source branch also contains
[unreleased lifecycle fixes](https://kickbelldev.github.io/react-preserve-portal/en/guide/lifecycle-safety.html),
including `Host mountWhen="connected"`, `Portal.dispose()`, empty-Slot validation,
and protection for hidden Host containers. Those additions require a source build
until the next npm release.

### `createPortal({ id, slots })`

Returns `{ id, slots, Host, Slot, usePortal }` bound to that portal. Literal slot
keys are inferred without `as const`:

```tsx
const Panel = createPortal({ id: 'panel', slots: ['left', 'right'] })
// <Panel.Slot slotKey="other" /> // TypeScript error
```

Use distinct IDs for independent portals. Factories with the same ID share
state within the same loaded copy of this library. IDs should be stable,
application-level identifiers, not values generated on every render. One mounted
`Host` per portal is the usual arrangement; multiple hosts share the active slot.

### `Host`

| Prop       | Meaning                                                          |
| ---------- | ---------------------------------------------------------------- |
| `children` | React content to preserve                                        |
| `node`     | Compatible alternative to `children`; pass only one content prop |
| `as`       | Container HTML tag, default `'div'`; fixed for the mounted Host  |

Existing `<Panel.Host node={<Editor />} />` calls remain supported.

### `Slot`

| Prop            | Meaning                                                     |
| --------------- | ----------------------------------------------------------- |
| `slotKey`       | A key declared in `slots`                                   |
| `as`            | Destination HTML tag, default `'div'`                       |
| HTML attributes | `className`, `id`, event handlers, ARIA and data attributes |

```tsx
<Panel.Slot slotKey="left" as="section" className="editor-pane" />
```

Prefer one mounted destination per key. If destinations overlap during a
transition, the last registration wins. Cleaning up an older destination does
not remove the newer one. Removing the newest destination does not restore an
older registration automatically.

### `usePortal()`

| Member                               | Meaning                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `slotKey`                            | Active typed key or `null`                                                   |
| `setSlotKey(key)`                    | Move to a key, or hide with `null`                                           |
| `returnPath` / `setReturnPath(path)` | Optional routing metadata; the library does not navigate                     |
| `targets`                            | Snapshot of registered DOM destinations; do not mutate this map              |
| `reset()`                            | Hide content and clear `returnPath`, keeping mounted destinations registered |
| `registerTarget(key, element)`       | Register a manual DOM destination; returns a cleanup function                |
| `unregisterTarget(key)`              | Remove a manual registration                                                 |

Action references remain stable for a given ID. Updating one portal does not
notify subscribers of unrelated portals. Manual registrations should use the
returned cleanup function so a stale cleanup cannot unregister a replacement:

```tsx
useEffect(() => {
  if (!externalElement) return
  return registerTarget('left', externalElement)
}, [externalElement, registerTarget])
```

## Routing

Place `Host` above routes that unmount. Route components can render a `Slot` and
select it in an effect. Move to a persistent mini-player slot when leaving the
route. `returnPath` is optional metadata for your router; it never changes the URL.

The repository's [demo](https://github.com/kickbelldev/react-preserve-portal/tree/main/apps/demo)
shows route changes, a main player, and a mini player with a return link.

## Server rendering

`Host` emits no server HTML and mounts its content after hydration. `Slot` emits
its ordinary HTML element. Hooks use an empty server snapshot, avoiding access
to mutable client state during server rendering. Portal content is therefore
client-only; render essential server-visible content outside `Host`.

In React Server Component frameworks, define and use the portal behind a
`'use client'` boundary. Do not create portals inside component render or store
per-request data in module-level portal state.

## Upgrading from 0.2.x

- Existing factory calls, `node`, slot keys, and hook methods continue to work.
- `Host` additionally accepts JSX children. Do not supply both `children` and `node`.
- `reset()` now preserves registered destinations. If you used it to remove
  manually registered targets, call their cleanup functions instead.
- `registerTarget` now returns cleanup; existing code may continue to ignore it.
- TypeScript 5+ is required by the published type declarations.

See [CHANGELOG.md](https://github.com/kickbelldev/react-preserve-portal/blob/main/packages/react-preserve-portal/CHANGELOG.md)
for the release history.

## Development

Use Node 22.12+ or Node 24 and the pnpm version pinned in `package.json`.
From the repository root:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm test
corepack pnpm exec nx run-many --target=typecheck --all
corepack pnpm lint
corepack pnpm dev
```

The dev command builds the library, keeps its watcher running, and starts the
demo. Lint is read-only. The test command reports actual test counts and fails
if no tests are found. In restricted containers that cannot create Nx plugin
sockets, set `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` for the command.

[CONTRIBUTING.md](https://github.com/kickbelldev/react-preserve-portal/blob/main/CONTRIBUTING.md)
covers architecture, regression checks, and publishing.

## License

MIT
