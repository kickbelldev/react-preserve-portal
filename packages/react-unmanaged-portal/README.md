# @charley-kim/react-unmanaged-portal

[![npm version](https://img.shields.io/npm/v/@charley-kim/react-unmanaged-portal.svg)](https://www.npmjs.com/package/@charley-kim/react-unmanaged-portal)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@charley-kim/react-unmanaged-portal)](https://bundlephobia.com/package/@charley-kim/react-unmanaged-portal)
[![license](https://img.shields.io/npm/l/@charley-kim/react-unmanaged-portal.svg)](https://github.com/kickbelldev/react-unmanaged-portal/blob/main/LICENSE)

A React portal library that leverages Unmanaged DOM to dynamically move portal content while preserving DOM instances.

## Installation

```bash
npm install @charley-kim/react-unmanaged-portal
# or
pnpm add @charley-kim/react-unmanaged-portal
# or
yarn add @charley-kim/react-unmanaged-portal
```

## Quick Start

```tsx
import { createPortal } from '@charley-kim/react-unmanaged-portal'

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

## Core Concept: Unmanaged DOM Node

React's `createPortal` alone cannot preserve DOM instances. When the portal target changes, React unmounts the existing DOM and creates a new one.

This library solves this problem by placing an **Unmanaged DOM node** (not managed by React) in between:

```
React -> createPortal -> Unmanaged Node (div) -> Slot targets
                              |
                    Outside React control
                              |
              Only uses appendChild/removeChild
```

### Why This Approach?

#### Limitations of Standard createPortal

```tsx
// This causes the video to be recreated every time the target changes
createPortal(<video />, slotKey === 'main' ? mainRef : miniRef)
```

#### Benefits of Unmanaged DOM

1. **Complete DOM Instance Preservation**: The video element never gets unmounted
2. **State Preservation**: Playback position, buffer, network connections maintained
3. **Independent of React**: Only uses appendChild/removeChild to change location

## API

### `createPortal(options)`

Creates a typed portal instance.

**Options:**

| Option  | Type                     | Description                     |
| ------- | ------------------------ | ------------------------------- |
| `id`    | `string`                 | Unique portal identifier        |
| `slots` | `readonly string[]`      | Array of valid slot keys        |

**Returns:**

| Property    | Type                                        | Description              |
| ----------- | ------------------------------------------- | ------------------------ |
| `id`        | `string`                                    | Portal ID                |
| `slots`     | `readonly string[]`                         | Valid slot keys          |
| `Host`      | `(props: HostProps) => ReactNode`           | Host component           |
| `Slot`      | `(props: SlotProps) => ReactNode`           | Slot component           |
| `usePortal` | `() => UsePortalReturn`                     | Portal hook              |

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

| Prop       | Type                          | Default | Description                        |
| ---------- | ----------------------------- | ------- | ---------------------------------- |
| `slotKey`  | `TSlot`                       | -       | **Required** Target slot (typed)   |
| `as`       | `keyof HTMLElementTagNameMap` | `'div'` | Container element type             |
| `...props` | `HTMLAttributes`              | -       | HTML element attributes            |

**Example:**

```tsx
<VideoPortal.Slot slotKey="main" />
<VideoPortal.Slot slotKey="mini" className="mini-player" />
<VideoPortal.Slot slotKey="pip" as="section" id="pip-container" />
```

### usePortal Hook

Returns portal state and actions with typed slot keys.

**Returns:**

| Property           | Type                                         | Description                     |
| ------------------ | -------------------------------------------- | ------------------------------- |
| `slotKey`          | `TSlot \| null`                              | Currently active slot (typed)   |
| `returnPath`       | `string \| null`                             | Portal return path              |
| `targets`          | `Map<TSlot, HTMLElement>`                    | Registered targets              |
| `setSlotKey`       | `(key: TSlot \| null) => void`               | Set active slot (typed)         |
| `setReturnPath`    | `(path: string \| null) => void`             | Set return path                 |
| `reset`            | `() => void`                                 | Reset portal state              |
| `registerTarget`   | `(slotKey: TSlot, target: HTMLElement) => void` | Manually register target     |
| `unregisterTarget` | `(slotKey: TSlot) => void`                   | Manually unregister target      |

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
import { createPortal } from '@charley-kim/react-unmanaged-portal'

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
import { createPortal } from '@charley-kim/react-unmanaged-portal'

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
import { Portal, usePortal } from '@charley-kim/react-unmanaged-portal'

<Portal.Host>
  <video />
</Portal.Host>
<Portal.Slot slotKey="main" />

const { setSlotKey } = usePortal()

// After (v0.2.0)
import { createPortal } from '@charley-kim/react-unmanaged-portal'

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
