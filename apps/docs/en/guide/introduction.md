---
description: Learn when to use React Preserve Portal and how its three building blocks work.
---

# Introduction

**React Preserve Portal** moves React content between DOM locations without remounting it.

A normal React portal recreates its content when its destination DOM node changes. This library keeps that destination container stable and moves the container itself. Component state, DOM references, and uncontrolled input values survive.

## When to use it

- A media player that moves from a detail page to a compact player
- An editor or canvas that moves between panels
- A stateful widget that needs to survive route changes

For an ordinary modal or tooltip, React's `createPortal`, native `dialog`, or the Popover API may be sufficient. For hiding and restoring tabs in the same location, consider React 19.2's `Activity`. See [modern Web APIs](./web-platform) for the tradeoffs.

## Three building blocks

| Building block | Responsibility                                  |
| -------------- | ----------------------------------------------- |
| `Host`         | Mounts the content in the React tree.           |
| `Slot`         | Registers a DOM destination for that content.   |
| `usePortal()`  | Selects the active slot and reads portal state. |

```text
Host (stable position in the React tree)
  └─ React portal → same container
                       ├─ moves to the main Slot
                       └─ moves to the mini Slot
```

## Requirements

React and React DOM **18 or later**; TypeScript **5 or later**. ESM and CommonJS are available. There are no runtime dependencies beyond the React peer dependencies.

Preserving React state and DOM identity is different from preserving all browser-managed state. Iframes, focus, and animations depend on the move mechanism and browser. Read [how preservation works](./preservation) for the precise guarantees.

[Get started →](./quick-start)
