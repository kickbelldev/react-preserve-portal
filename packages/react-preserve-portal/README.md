# @charley-kim/react-preserve-portal

[![npm version](https://badgen.net/npm/v/@charley-kim/react-preserve-portal)](https://www.npmjs.com/package/@charley-kim/react-preserve-portal)
[![license](https://badgen.net/npm/license/@charley-kim/react-preserve-portal)](https://github.com/kickbelldev/react-preserve-portal/blob/main/LICENSE)

Move an existing DOM instance, such as a playing `<video>`, a loaded `<iframe>`,
a WebGL canvas, or an editor, to another place in your layout without
recreating it. The same DOM nodes are reused, so the React subtree inside is not
remounted either: component state and effects carry on.

**Why not lift state into a store?** React state can be restored after a remount.
State held by DOM instances cannot: a video's loaded data and decoder, an
iframe's document, a WebGL context, DOM built by map or editor libraries, and
the caret, selection, and scroll position of text being edited. Recreating the
node reloads or interrupts them. Moving the same node is the only way to keep
them.

**Why not React's `createPortal`?** Changing a portal's target to another node
makes React unmount and remount its content. This library always renders into
one container and moves that container node between destinations instead.

```bash
npm install @charley-kim/react-preserve-portal
```

Requires React and React DOM 18 or later. TypeScript users need TypeScript 5 or
later for automatic literal inference. The library has no runtime dependencies
other than its React peer dependencies. Both ESM and CommonJS consumers have
matching runtime and TypeScript declaration entries. Version 0.4.1 also fixes
final cleanup of hidden Suspense Hosts in React 19.0/19.1.

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
that container node between `Slot` elements. The DOM nodes are never recreated,
and because React's portal destination never changes, the React subtree is never
remounted either.

```text
Host → React portal → stable container → currently selected Slot
```

- The same DOM nodes (and therefore React state and effects) survive slot changes
  while `Host` stays mounted.
- Hiding content or temporarily removing a destination detaches the container;
  the React subtree remains mounted. Effects and timers continue running.
- Unmounting `Host`, changing its React key, or replacing its content with a
  different component type ends preservation, following normal React rules.
- Connected moves use the browser's `Element.moveBefore` when available. Other
  moves use `appendChild`. Detaching/reinserting DOM can reset browser-managed
  state such as focus, iframe documents, media playback, or animations. DOM
  identity alone does **not** guarantee uninterrupted playback or iframe state
  in every browser. Test the browsers and media you support.
- Within one root, React context and synthetic events follow the `Host` tree.
  A destination in another root can also invoke that root's event handlers;
  this is not event isolation. CSS inheritance follows the physical DOM.
  Cross-document moves are rejected; Shadow DOM selection/IME is not guaranteed.
- Keep `Host`'s `as` tag stable; it is chosen when the container is created.

## API

The reference below describes 0.4.1. See the
[lifecycle guide](https://kickbelldev.github.io/react-preserve-portal/en/guide/lifecycle-safety.html)
for connected mounting, hidden boundaries, destination ownership, and disposal.

### `createPortal({ id, slots })`

Returns `{ id, slots, Host, Slot, usePortal, dispose }` bound to that portal. Literal slot
keys are inferred without `as const`:

```tsx
const Panel = createPortal({ id: 'panel', slots: ['left', 'right'] })
// <Panel.Slot slotKey="other" /> // TypeScript error
```

Use distinct IDs for independent portals. Factories with the same ID share
state within the same loaded copy of this library. IDs should be stable,
application-level identifiers, not values generated on every render. One mounted
`Host` per portal is the usual arrangement; multiple hosts share the active slot,
and development builds warn when more than one is mounted.

### `Host`

| Prop        | Meaning                                                                                 |
| ----------- | --------------------------------------------------------------------------------------- |
| `children`  | React content to preserve                                                               |
| `node`      | Compatible alternative to `children`; pass only one content prop                        |
| `as`        | Container HTML tag, default `'div'`; fixed for the mounted Host                         |
| `mountWhen` | `'immediate'` (default) or `'connected'`; delay the first content mount until connected |
| `animate`   | `true` or `{ duration, easing }`; animate moves between slots (default off)             |

Existing `<Panel.Host node={<Editor />} />` calls remain supported. Use
`mountWhen="connected"` for initial layout measurements or `autoFocus`. After the
first mount, moving or hiding preserves the same content; connection alone does
not guarantee visibility or a nonzero size. Outer Suspense/Activity boundaries
keep the Host container connected, while React controls visibility and Effects.

With `animate`, a `setSlotKey` move animates the container from its old box to
the new one (FLIP). It changes only `transform` and `opacity` through the Web
Animations API, measures once per move, continues smoothly when interrupted,
and respects `prefers-reduced-motion`. Without `animate`, nothing is measured.

### `Slot`

| Prop            | Meaning                                                     |
| --------------- | ----------------------------------------------------------- |
| `slotKey`       | A key declared in `slots`                                   |
| `as`            | Destination HTML tag, default `'div'`                       |
| `ref`           | Receives the destination element (React 18 and 19)          |
| HTML attributes | `className`, `id`, event handlers, ARIA and data attributes |

```tsx
<Panel.Slot slotKey="left" as="section" className="editor-pane" />
```

Slots must be empty: `children` and `dangerouslySetInnerHTML` are rejected by types
and at runtime. Render placeholders as siblings. Destinations must belong to the
same document as Host and cannot be the portal container or its descendants.

Prefer one mounted destination per key. If destinations overlap during a
transition, the last registration wins. Cleaning up an older destination does
not remove the newer one, and removing the newest destination returns the
content to the most recent destination that is still registered.

### Development warnings

Outside production builds (`process.env.NODE_ENV !== 'production'`), the library
warns once for: more than one mounted `Host` per portal ID, slot keys that the
portal does not declare (from `setSlotKey`, `Slot`, or `registerTarget`), the same
ID created with different `slots`, and a `Host` whose `as` tag changes after
mount. Production bundles strip these checks.

### `usePortal()`

| Member                               | Meaning                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `slotKey`                            | Active typed key or `null`                                                   |
| `setSlotKey(key)`                    | Move to a key, or hide with `null`                                           |
| `returnPath` / `setReturnPath(path)` | Optional routing metadata; the library does not navigate                     |
| `targets`                            | `ReadonlyMap` snapshot of registered destinations; do not mutate             |
| `reset()`                            | Hide content and clear `returnPath`, keeping mounted destinations registered |
| `registerTarget(key, element)`       | Register a manual DOM destination; returns a cleanup function                |
| `unregisterTarget(key)`              | Remove every registration for that key                                       |

Action references remain stable for a given ID, and the returned object is the
same until the state changes. Updating one portal does not
notify subscribers of unrelated portals. Manual registrations should use the
returned cleanup function so a stale cleanup cannot unregister a replacement:

```tsx
useEffect(() => {
  if (!externalElement) return
  return registerTarget('left', externalElement)
}, [externalElement, registerTarget])
```

### `dispose(): boolean`

After all components using an ID have unmounted and all manual targets have been
unregistered, call `Panel.dispose()` to release its store. It returns `false`
while any Host, Slot, hook owner (including hidden ones), subscription or target
remains, and `true` on success or if the ID is already absent. Do not call it
during render or ownership transitions. Stale actions throw after disposal; a
fresh mount of the same factory uses a new empty store. Use `reset()` to hide an
active portal instead.

## Routing

Keep `Host` and both main/mini Slots in a shared layout that survives navigation.
Hide the inactive destination with CSS instead of unmounting it so both endpoints
stay connected for `moveBefore`. `returnPath` is optional metadata for your router;
it never changes the URL. Pause media explicitly before closing it.

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

## Upgrading from 0.3.x

- Keep Slots empty and move any placeholder content beside them.
- Treat `targets` as a read-only snapshot and use registration actions to change it.
- Keep destinations in Host's document and outside its own container.
- Connected mounting and explicit disposal are optional; existing immediate mounting
  and the `node` prop remain supported. Read the [migration guide](https://kickbelldev.github.io/react-preserve-portal/en/migration.html).

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
