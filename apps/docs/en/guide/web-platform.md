---
title: Browser APIs and alternatives
description: Choose CSS, React portals, moveBefore, View Transition or Activity for the behavior you need.
---

# Browser APIs and alternatives

First decide whether the DOM really needs to move. Changing a visual layout and moving a live component to a different parent element need different tools.

## Choose by task

| Task | Start with |
| --- | --- |
| Change position or ordering in a responsive layout | CSS Grid / Flex; check whether a DOM move is needed at all |
| Display a menu or popover above other elements | Native Popover API and CSS positioning |
| Open a modal with focus management | `<dialog>` and `showModal()` |
| Hide and restore tabs in the same location | `Activity` in React 19.2 or later |
| Render content into another, fixed DOM location | React DOM's `createPortal` |
| Move the same component and DOM between destinations | React Preserve Portal |

When reordering with CSS, also check keyboard and screen-reader reading order. Popover and dialog do not themselves move React components between destinations.

## How the library uses `moveBefore`

If the container and destination are connected to the same document and the destination supports `moveBefore`, the library uses it automatically. You do not need to call it yourself. Other valid moves use `appendChild`; cross-document destinations are rejected.

```ts
const supportsMoveBefore = typeof Element.prototype.moveBefore === 'function'
```

Check the [MDN compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore#browser_compatibility) and the actual runtime. Even supporting browsers need the `appendChild` path to attach an already detached element, including first display and return from hiding.

`moveBefore` is designed to preserve browser-managed state such as focus, iframe documents and animations during connected moves. A video file, a player inside an iframe, and initialization performed by your application each have their own behavior. Keeping a DOM node does not establish uninterrupted playback for every media integration. The [video guide](./video-player) explains the playback policy your app controls.

## Animate a move

View Transition animates the old and new views. The portal preserves component state, so calling `setSlotKey()` without an animation still moves the content.

This optional helper is intended for an event handler such as a button click. Pass the `setSlotKey` action from `Player.usePortal()` as its argument.

```tsx
import { flushSync } from 'react-dom'

export function moveToMini(setSlotKey: (slot: 'mini') => void) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    setSlotKey('mini')
    return
  }
  const transition = document.startViewTransition(() => {
    flushSync(() => setSlotKey('mini'))
  })
  void transition.ready.catch(() => {})
}
```

Use `flushSync` here to commit the update before the transition snapshot; ordinary moves do not need it. Skipping the animation still applies the selection, and a reduced-motion preference prevents starting an animation. Try the View Transition switch in the [live example](../playground).

## Combining with Activity

React 19.2's `Activity` hides UI in place, preserves its state and DOM, and cleans up Effects. It does not move content between different DOM parents.

The portal's `setSlotKey(null)` detaches the container while keeping the React content mounted. The two forms of hiding have different connection and Effect behavior. If you combine them, see [lifecycle and ownership](./lifecycle-safety) before deciding which Hosts and Slots belong inside Activity.

## References

- [MDN: Element.moveBefore](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore)
- [MDN: startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [React: Activity](https://react.dev/reference/react/Activity)
- [React: createPortal](https://react.dev/reference/react-dom/createPortal)
