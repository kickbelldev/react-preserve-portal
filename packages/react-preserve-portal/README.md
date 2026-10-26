# @charley-kim/react-preserve-portal

[![npm version](https://badgen.net/npm/v/@charley-kim/react-preserve-portal)](https://www.npmjs.com/package/@charley-kim/react-preserve-portal)
[![license](https://badgen.net/npm/license/@charley-kim/react-preserve-portal)](https://github.com/kickbelldev/react-preserve-portal/blob/main/LICENSE)

Move one React subtree between layout destinations while keeping the same DOM
nodes and component state. Use it for a player, editor, canvas, or map that needs
to move between a main view and a smaller view without remounting.

React renders into one stable portal container; the library moves that container
between Slots. Browser-managed state such as playback, iframe documents and focus
also depends on the browser's DOM move support. See [preservation limits](#preservation-limits).

[English documentation](https://kickbelldev.github.io/react-preserve-portal/en/)
· [한국어 문서](https://kickbelldev.github.io/react-preserve-portal/)
· [Live playground](https://kickbelldev.github.io/react-preserve-portal/en/playground.html)
· [한국어 예제](https://kickbelldev.github.io/react-preserve-portal/playground.html)

## Install

```sh
npm install @charley-kim/react-preserve-portal
```

Use an existing app with React and React DOM **18+**. TypeScript users need **5+**.
ESM and CommonJS include matching declarations. React and React DOM are the only
runtime peer dependencies.

## Quick start

Paste this into `App.tsx`. No video file, router, or additional package is needed.
In a React Server Component framework such as Next.js, put the example behind a
`'use client'` boundary. Define the portal once outside component render.

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
      <Panel.Host>
        <Editor />
      </Panel.Host>

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

1. Edit the note and increment the counter.
2. Select **Show in mini**. The same input and its value move with the counter.
3. Select **Hide**, then **Show in main**. Both values remain.

| Part                | Responsibility                                                                |
| ------------------- | ----------------------------------------------------------------------------- |
| `Panel.Host`        | Owns the content. Keep one Host mounted while that content needs to survive.  |
| `Panel.Slot`        | An empty destination. Put headings and placeholders beside it, not inside it. |
| `Panel.usePortal()` | Select a destination with `setSlotKey(key)` or hide it with `null`.           |

The initial key is `null`; the Effect selects `main` after mounting. The default
Host can mount content before its container connects to the document. Use
`mountWhen="connected"` when initial measurements or autofocus need a connected
element. Give independent portals distinct, stable IDs. Style the content or
Slot; Host does not forward general HTML attributes or refs.

## Preservation limits

| Situation                                                                          | Behavior                                                                                             |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Moving between Slots with the same mounted Host                                    | DOM nodes and React component state are preserved.                                                   |
| Connected moves where `Element.moveBefore` is available and succeeds               | The browser can preserve state such as playback, iframe documents and focus.                         |
| `appendChild` fallback, hiding with `null`, or removing a destination              | DOM identity remains, but browser-managed state may reset. Uninterrupted playback is not guaranteed. |
| Unmounting Host, changing its React key, or replacing the content's component type | Normal React unmount/remount rules apply; preservation ends.                                         |

Hiding with `setSlotKey(null)` or `reset()` keeps the React subtree mounted;
Effects and timers continue. Pause media explicitly when closing it. Outer
Suspense/Activity boundaries follow React's own visibility and Effect rules.
Keep Host's `as` tag stable and destinations in the same document.

React context and synthetic events follow the Host tree; CSS inheritance follows
the physical destination. Cross-root destinations do not provide event isolation.
Shadow DOM selection/IME behavior is not guaranteed.

Host content is **client-only**: Host emits no server HTML and mounts after
hydration. Keep essential server-visible content outside Host. See the
[SSR guide](https://kickbelldev.github.io/react-preserve-portal/en/guide/ssr.html).

## Version 0.5.0

This README describes the released **0.5.0** API.

- Optional `Host animate` / `PortalAnimation` adds move animation; it is off by default.
- `Slot ref` exposes the destination element on React 18 and 19.
- `usePortal()` keeps the same result object until the portal snapshot changes.
- **Upgrading from 0.4.x:** removing the newest same-key destination now restores
  the most recent remaining registration. Call `setSlotKey(null)` or `reset()` to
  hide instead. `unregisterTarget(key)` still clears all registrations for that key.

**Known issues in 0.5.0:** returned callback-ref cleanup functions are not honored;
browser-rejected animation options can unmount content; running animations are
not cancelled when disabled or when Host unmounts. Fixes tracked in
[PR #24](https://github.com/kickbelldev/react-preserve-portal/pull/24) are **not
included in 0.5.0** and require a later release. The quick start above does not
use these affected options.

Existing `Host node`, `mountWhen`, hook actions and `dispose()` remain supported.
Read the migration guide before upgrading from older versions.

## Detailed guides

| Topic                                | English                                                                                                                                                                        | 한국어                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| API and defaults                     | [API](https://kickbelldev.github.io/react-preserve-portal/en/api.html)                                                                                                         | [API](https://kickbelldev.github.io/react-preserve-portal/api.html)                                                                                                      |
| Video and routing                    | [Video](https://kickbelldev.github.io/react-preserve-portal/en/guide/video-player.html) · [Routing](https://kickbelldev.github.io/react-preserve-portal/en/guide/routing.html) | [비디오](https://kickbelldev.github.io/react-preserve-portal/guide/video-player.html) · [라우팅](https://kickbelldev.github.io/react-preserve-portal/guide/routing.html) |
| Lifecycle, ownership and disposal    | [Lifecycle](https://kickbelldev.github.io/react-preserve-portal/en/guide/lifecycle-safety.html)                                                                                | [수명과 소유권](https://kickbelldev.github.io/react-preserve-portal/guide/lifecycle-safety.html)                                                                         |
| Browser APIs and alternatives        | [Browser APIs](https://kickbelldev.github.io/react-preserve-portal/en/guide/web-platform.html)                                                                                 | [브라우저 API](https://kickbelldev.github.io/react-preserve-portal/guide/web-platform.html)                                                                              |
| Migration from 0.4.x / 0.3.x / 0.2.x | [Migration](https://kickbelldev.github.io/react-preserve-portal/en/migration.html)                                                                                             | [마이그레이션](https://kickbelldev.github.io/react-preserve-portal/migration.html)                                                                                       |

[CHANGELOG](https://github.com/kickbelldev/react-preserve-portal/blob/main/packages/react-preserve-portal/CHANGELOG.md)
records released changes. [CONTRIBUTING](https://github.com/kickbelldev/react-preserve-portal/blob/main/CONTRIBUTING.md)
covers local development and verification.

## License

MIT
