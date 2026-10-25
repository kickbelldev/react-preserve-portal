---
title: Modern Web APIs and alternatives
description: Compare moveBefore, View Transition, Popover, and Activity to choose a simpler implementation.
---

# Modern Web APIs and alternatives

Choosing technology by responsibility keeps the API small. This review checked **official documentation and MDN compatibility data on 2026-10-23**. Browser support changes; detect features instead of browser versions.

## `Element.moveBefore`: already in the core

`appendChild` removes and reinserts a node even when moving the same object. `moveBefore` moves it without disconnecting it, preserving state such as focus, iframe documents, CSS animations, and open popovers or modal dialogs.

Since 0.3.0, the library automatically uses this path when supported, when **both the container and destination are connected and belong to the same document**. Otherwise it uses `appendChild`. The same guarantee cannot apply to containers already detached by hiding or route removal.

The MDN data reviewed records support in Chrome 133+ and Firefox 144+, with Safari support still absent. Check the actual environment:

```ts
const supportsStatePreservingMove =
  'moveBefore' in Element.prototype &&
  typeof Element.prototype.moveBefore === 'function'
```

Distinguish native `<video>` / `<audio>` playback state from players embedded in iframes. MDN describes native media playback state as surviving removal and reinsertion. That is not a blanket guarantee for iframe document recreation, player-library behavior, or detachment during routing.

For custom elements, also review `connectedMoveCallback()`. It lets the element implementation avoid unnecessary initialization and cleanup during a state-preserving move.

## View Transition: optional animation

View Transition animates the visual change between snapshots. It does not preserve components or DOM. It fits as an application-level enhancement on top of a move.

```tsx
import { flushSync } from 'react-dom'

function moveToMini() {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    setSlotKey('mini')
    return
  }

  const transition = document.startViewTransition(() => {
    flushSync(() => setSlotKey('mini'))
  })
  // The slot update still applies if the animation is skipped.
  void transition.ready.catch(() => {})
}
```

Here, `setSlotKey` comes from `Player.usePortal()`. `flushSync` commits the React update before the browser takes its next snapshot, inside an event handler. Ordinary slot changes do not need it. Keep `view-transition-name` values unique on the page. You can enable this enhancement in the [playground](../playground).

## Choose the simpler path

| Requirement                                  | Consider first                   | Relationship to this library                                    |
| -------------------------------------------- | -------------------------------- | --------------------------------------------------------------- |
| Menu or tooltip escaping overflow clipping   | Native Popover + CSS positioning | Can use the top layer without physically reparenting DOM        |
| Modal and focus management                   | `<dialog>` with `showModal()`    | An ordinary modal may need no portal library                    |
| Hide and restore tabs in the same place      | React 19.2 `Activity`            | Preserves state and DOM, but cleans up Effects while hidden     |
| Visual rearrangement for responsive layouts  | CSS Grid/Flex                    | May remove the need to move DOM; consider reading and tab order |
| Physically move DOM and preserve React state | Preserve Portal                  | Stable container + `moveBefore` / `appendChild`                 |
| Overlay with no preservation requirement     | React DOM `createPortal`         | A smaller solution may be enough                                |

Popover does not change the React parent or DOM location. `Activity` does not move content between different DOM parents and cannot replace React 18 support. Its Effect cleanup policy also differs from this library's “effects keep running while hidden” behavior. Compose them deliberately.

Guarded disposal and opt-in connected mounting are available in 0.4.0; see [lifecycle and ownership](./lifecycle-safety).

## Candidates for future work

These are **design candidates, not APIs provided by 0.4.0**.

| Priority  | Candidate                                | Question to resolve first                                                                     |
| --------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| High      | Hide content in a connected parking area | Must iframe documents survive? What are the focus, accessibility, media, and Effect policies? |
| Medium    | Visibility / connection signals          | How do selection, registration, document connectivity, and actual visibility differ?          |
| As needed | Selector subscriptions                   | Do measured workloads with many portals and frequent updates show a rendering bottleneck?     |

There is currently no demonstrated need for a router, continuously running global observer, or animation engine as a core dependency. The connected-mount option observes only until first attachment. The small store and explicit Slot registration keep behavior predictable.

## Sources

- [MDN: Element.moveBefore](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore)
- [MDN browser compatibility source](https://github.com/mdn/browser-compat-data/blob/main/api/Element.json)
- [MDN: startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [React: Activity](https://react.dev/reference/react/Activity)
- [React: changing a portal destination](https://react.dev/reference/react-dom/createPortal#parameters)
