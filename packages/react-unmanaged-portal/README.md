# @charley-kim/react-preserve-portal

[![npm version](https://img.shields.io/npm/v/@charley-kim/react-preserve-portal.svg)](https://www.npmjs.com/package/@charley-kim/react-preserve-portal)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@charley-kim/react-preserve-portal)](https://bundlephobia.com/package/@charley-kim/react-preserve-portal)
[![license](https://img.shields.io/npm/l/@charley-kim/react-preserve-portal.svg)](https://github.com/kickbelldev/react-preserve-portal/blob/main/LICENSE)

A React portal library that leverages Unmanaged DOM to dynamically move portal content while **preserving the actual DOM instances**.

## Core Concept: Unmanaged DOM Node

React's `createPortal` alone cannot preserve DOM instances because it is bound to the React lifecycle. When the portal target changes, React unmounts the existing DOM and creates a new one.

```tsx
// This causes the video to be recreated every time the target changes
createPortal(<video />, slotKey === 'main' ? mainRef : miniRef)
```

This library solves this problem by placing an **Unmanaged DOM node** (not managed by React) in between:

```
React -> createPortal -> Unmanaged Node (div) -> Slot targets
                              |
                    Outside React control
                              |
              Only uses appendChild/removeChild
```

This approach bypasses React's render-commit lifecycle, physically moving the DOM node.

## Use Cases

Useful for any DOM element where recreation is expensive or causes state loss:

### Video / Audio Players

- Playback position and buffer preserved
- Network connections maintained
- No re-loading or buffering when moving between slots

### Canvas / WebGL

- 3D scenes (Three.js, Babylon.js) don't need re-initialization
- Game state preserved
- WebGL context maintained (context loss is expensive)

### Maps

- Google Maps, Mapbox, Kakao Map instances preserved
- Map position, zoom level, markers maintained
- Avoids re-fetching map tiles

### iframe

- Embedded content state preserved
- No page reload when moving
- Login sessions in embedded widgets maintained

### Rich Text Editors

- Editor state (undo history, cursor position) preserved
- Plugin initialization maintained
- CKEditor, Quill, TipTap, etc.

### Charts / Data Visualizations

- D3, Chart.js, ECharts instances preserved
- Animation states maintained
- Avoids expensive re-rendering of large datasets

### Third-party Widgets

- Chat widgets, payment forms
- SDK initialization preserved
- User input state maintained

## Installation

```bash
npm install @charley-kim/react-preserve-portal
# or
pnpm add @charley-kim/react-preserve-portal
# or
yarn add @charley-kim/react-preserve-portal
```

## Quick Start

```tsx
import { createPortal } from '@charley-kim/react-preserve-portal'

// 1. Create a typed portal
const VideoPortal = createPortal({
  id: 'video',
  slots: ['main', 'mini', 'pip'],
} as const)

// 2. Use components and hooks
function App() {
  return (
    <>
      {/* Portal content */}
      <VideoPortal.Host node={<video src="..." />} />

      {/* Portal slots */}
      <div className="main-area">
        <VideoPortal.Slot slotKey="main" />
      </div>
      <div className="mini-area">
        <VideoPortal.Slot slotKey="mini" />
      </div>
    </>
  )
}

function Controls() {
  const { slotKey, setSlotKey } = VideoPortal.usePortal()

  return (
    <button onClick={() => setSlotKey(slotKey === 'main' ? 'mini' : 'main')}>
      Toggle
    </button>
  )
}
```

## Type Safety

The library provides full type safety for slot keys:

```tsx
const VideoPortal = createPortal({
  id: 'video',
  slots: ['main', 'mini', 'pip'],
} as const)

// Type-safe slot keys
<VideoPortal.Slot slotKey="main" />     // OK
<VideoPortal.Slot slotKey="mini" />     // OK
<VideoPortal.Slot slotKey="wrong" />    // TypeScript Error!

// Type-safe setSlotKey
const { setSlotKey } = VideoPortal.usePortal()
setSlotKey('main')   // OK
setSlotKey('wrong')  // TypeScript Error!
```

## API

### `createPortal(options)`

Creates a typed portal instance.

**Options:**

| Option  | Type                | Description              |
| ------- | ------------------- | ------------------------ |
| `id`    | `string`            | Unique portal identifier |
| `slots` | `readonly string[]` | Array of valid slot keys |

**Returns:**

| Property    | Type                              | Description     |
| ----------- | --------------------------------- | --------------- |
| `id`        | `string`                          | Portal ID       |
| `slots`     | `readonly string[]`               | Valid slot keys |
| `Host`      | `(props: HostProps) => ReactNode` | Host component  |
| `Slot`      | `(props: SlotProps) => ReactNode` | Slot component  |
| `usePortal` | `() => UsePortalReturn`           | Portal hook     |

### Host Component

Renders portal content using an Unmanaged DOM node.

**Props:**

| Prop   | Type                          | Default | Description            |
| ------ | ----------------------------- | ------- | ---------------------- |
| `node` | `ReactNode`                   | -       | **Required** Content   |
| `as`   | `keyof HTMLElementTagNameMap` | `'div'` | Container element type |

**Example:**

```tsx
<VideoPortal.Host node={<video src="video.mp4" />} />
<VideoPortal.Host as="section" node={<CustomComponent />} />
```

### Slot Component

Specifies where portal content should be rendered.

**Props:**

| Prop       | Type                          | Default | Description                      |
| ---------- | ----------------------------- | ------- | -------------------------------- |
| `slotKey`  | `TSlot`                       | -       | **Required** Target slot (typed) |
| `as`       | `keyof HTMLElementTagNameMap` | `'div'` | Container element type           |
| `...props` | `HTMLAttributes`              | -       | HTML element attributes          |

**Example:**

```tsx
<VideoPortal.Slot slotKey="main" />
<VideoPortal.Slot slotKey="mini" className="mini-player" />
<VideoPortal.Slot slotKey="pip" as="section" id="pip-container" />
```

### usePortal Hook

Returns portal state and actions with typed slot keys.

**Returns:**

| Property           | Type                                            | Description                   |
| ------------------ | ----------------------------------------------- | ----------------------------- |
| `slotKey`          | `TSlot \| null`                                 | Currently active slot (typed) |
| `returnPath`       | `string \| null`                                | Portal return path            |
| `targets`          | `Map<TSlot, HTMLElement>`                       | Registered targets            |
| `setSlotKey`       | `(key: TSlot \| null) => void`                  | Set active slot (typed)       |
| `setReturnPath`    | `(path: string \| null) => void`                | Set return path               |
| `reset`            | `() => void`                                    | Reset portal state            |
| `registerTarget`   | `(slotKey: TSlot, target: HTMLElement) => void` | Manually register target      |
| `unregisterTarget` | `(slotKey: TSlot) => void`                      | Manually unregister target    |

**Example:**

```tsx
function VideoControls() {
  const { slotKey, setSlotKey, targets } = VideoPortal.usePortal()

  return (
    <div>
      <p>Current slot: {slotKey || 'none'}</p>
      <p>Available: {Array.from(targets.keys()).join(', ')}</p>
      <button onClick={() => setSlotKey('main')}>Main</button>
      <button onClick={() => setSlotKey('mini')}>Mini</button>
      <button onClick={() => setSlotKey(null)}>Hide</button>
    </div>
  )
}
```

## Usage Examples

### Video Player (Main <-> Mini Player)

```tsx
import { createPortal } from '@charley-kim/react-preserve-portal'

const VideoPortal = createPortal({
  id: 'video',
  slots: ['main', 'mini'],
} as const)

function VideoApp() {
  const { slotKey, setSlotKey } = VideoPortal.usePortal()

  return (
    <>
      <VideoPortal.Host node={<video src="video.mp4" controls />} />

      <main>
        <VideoPortal.Slot slotKey="main" />
        <button onClick={() => setSlotKey('mini')}>Minimize</button>
      </main>

      <aside>
        <VideoPortal.Slot slotKey="mini" />
        <button onClick={() => setSlotKey('main')}>Maximize</button>
      </aside>
    </>
  )
}
```

### Multiple Portal Instances

Create independent portals for different use cases:

```tsx
const VideoPortal = createPortal({
  id: 'video',
  slots: ['main', 'mini'],
} as const)

const ModalPortal = createPortal({
  id: 'modal',
  slots: ['center', 'fullscreen'],
} as const)

function App() {
  return (
    <>
      {/* Video portal */}
      <VideoPortal.Host node={<VideoElement />} />
      <VideoPortal.Slot slotKey="main" />
      <VideoPortal.Slot slotKey="mini" />

      {/* Modal portal (completely independent) */}
      <ModalPortal.Host node={<ModalContent />} />
      <ModalPortal.Slot slotKey="center" />
    </>
  )
}
```

### Usage with Routing

Maintain video state across page transitions:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { createPortal } from '@charley-kim/react-preserve-portal'

const VideoPortal = createPortal({
  id: 'video',
  slots: ['main', 'mini'],
} as const)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/video/:id" element={<VideoPage />} />
      </Routes>

      {/* Video state maintained across all pages */}
      <VideoPortal.Host node={<VideoElement />} />
      <MiniPlayer />
    </BrowserRouter>
  )
}
```

## Migration from v0.1.x

v0.2.0 introduces a new type-safe API:

```tsx
// Before (v0.1.x)
import { Portal, usePortal } from '@charley-kim/react-preserve-portal'

<Portal.Host>
  <video />
</Portal.Host>
<Portal.Slot slotKey="main" />

const { setSlotKey } = usePortal()

// After (v0.2.0)
import { createPortal } from '@charley-kim/react-preserve-portal'

const VideoPortal = createPortal({
  id: 'video',
  slots: ['main', 'mini'],
} as const)

<VideoPortal.Host node={<video />} />
<VideoPortal.Slot slotKey="main" />

const { setSlotKey } = VideoPortal.usePortal()
```

## Requirements

- React >= 18.0.0
- React DOM >= 18.0.0

## License

MIT

## Contributing

Issues and PRs are welcome!

---

**Need more help?** If you'd like me to draft a more technical "Deep Dive" section or a specific guide for Next.js SSR, just let me know!
