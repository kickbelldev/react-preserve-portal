---
title: Introduction
description: Use React Preserve Portal to move an existing DOM instance to another place in the page without recreating it.
---

# Introduction

React Preserve Portal **moves an existing DOM instance to another place without recreating it**. Send a playing `<video>`, a loaded `<iframe>`, a WebGL canvas, or an editor from the main view to a mini player or another panel, and it keeps using the same DOM nodes. Because nothing is recreated, the React components inside are not remounted either, so component state and effects carry on.

## What problem does it solve?

Rendering one `<VideoPlayer />` in the main view and another in a mini player creates two instances. Removing one and creating the other recreates both the components and their DOM nodes.

React state can be lifted into a store and restored after a remount. **State held by DOM instances cannot be moved that way:**

- the data a `<video>` has already loaded and its decoder state
- the document loaded inside an `<iframe>`
- a `<canvas>` WebGL context
- DOM created by map or editor libraries
- the caret, selection, and scroll position of text being edited

Recreating the node reloads or interrupts all of this. The only way to keep it is to move the same node, which is what this library does.

Usage is simple: render the content **once in a Host** and define its possible locations with **Slots**. Changing the location moves the container node that holds the content instead of creating another instance.

| API                  | Your responsibility                                                   |
| -------------------- | --------------------------------------------------------------------- |
| `createPortal()`     | Define a portal ID and its slot names outside component render.       |
| `Player.Host`        | Render the content to preserve. Usually use one Host per portal.      |
| `Player.Slot`        | Register a destination such as `main` or `mini`. Keep the Slot empty. |
| `Player.usePortal()` | Read the selection and change it with `setSlotKey()`.                 |

Two Slots are two destinations for one portal. They do not create two players.

## How is this different from React DOM's `createPortal`?

React DOM's `createPortal(children, target)` renders into `target`. If you change `target` to another node to move the content, React treats it as a different portal and **unmounts and remounts** the content. Both the DOM nodes and component state are recreated.

This library always passes the same container to React DOM and **moves that container node itself between Slots.** From React's point of view the rendering destination never changes, so there is nothing to remount; from the browser's point of view the same node simply changes place. Context and events continue to follow the Host. See [how preservation works](./preservation) for details.

## When to use it

- A playing video moves to a mini player without loading it again from scratch.
- An element that is expensive to recreate, such as an iframe, WebGL canvas, or map, moves to another panel.
- An editor moves while keeping the text being typed and the caret position.
- A widget needs to survive route changes while its display location changes.

If CSS Grid or Flex can provide the layout, no DOM move is needed. Modals, popovers, and tabs in a fixed location may also have simpler solutions. See [browser APIs and alternatives](./web-platform) for a comparison by task.

## Before you start

Unmounting Host or changing the content's `key` ends preservation, following React's normal rules. Keep Host in a shared layout when it must survive routing.

Keeping the same DOM node does not guarantee focus, iframe or playback state in every browser. See the [preservation table](./preservation#what-survives) for connected moves and hiding.

Requires React and React DOM **18 or later**, and **TypeScript 5 or later** if you use TypeScript. ESM and CommonJS are supported.

Follow the [quick start](./quick-start) to install the package and build your first portal.
