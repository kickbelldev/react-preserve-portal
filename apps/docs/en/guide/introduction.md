---
title: Introduction
description: Use React Preserve Portal when one component needs to move between different places in the page.
---

# Introduction

React Preserve Portal **moves one React component between DOM locations**. Send a video from the main view to a mini player, or move an editor into another panel, while keeping the same DOM nodes and component state.

## What problem does it solve?

Rendering one `<VideoPlayer />` in the main view and another in a mini player creates two instances. Removing one and creating the other replaces both its local state and DOM nodes. Lifting state can restore values, but it does not keep the original video element, editor, or canvas alive.

With this library, render the content **once in a Host** and define its possible locations with **Slots**. Moving the content moves its container instead of creating another instance.

| API                  | Your responsibility                                                   |
| -------------------- | --------------------------------------------------------------------- |
| `createPortal()`     | Define a portal ID and its slot names outside component render.       |
| `Player.Host`        | Render the content to preserve. Usually use one Host per portal.      |
| `Player.Slot`        | Register a destination such as `main` or `mini`. Keep the Slot empty. |
| `Player.usePortal()` | Read the selection and change it with `setSlotKey()`.                 |

Two Slots are two destinations for one portal. They do not create two players.

## How is this different from React DOM's `createPortal`?

React DOM's `createPortal(children, target)` renders into `target`. Passing a different DOM node as the target recreates the portal content.

This library always passes the same container to React DOM. **React's rendering destination stays fixed; the container moves to another Slot.** Context and component state continue to follow the Host. See [how preservation works](./preservation) for details.

## When to use it

- A full player and a mini player need to share one video element.
- An editor or canvas moves between panels without losing its internal state.
- A widget needs to survive route changes while its display location changes.

If CSS Grid or Flex can provide the layout, no DOM move is needed. Modals, popovers, and tabs in a fixed location may also have simpler solutions. See [browser APIs and alternatives](./web-platform) for a comparison by task.

## Before you start

Unmounting Host or changing the content's `key` ends preservation, following React's normal rules. Keep Host in a shared layout when it must survive routing.

Keeping the same DOM node does not guarantee focus, iframe or playback state in every browser. See the [preservation table](./preservation#what-survives) for connected moves and hiding.

Requires React and React DOM **18 or later**, and **TypeScript 5 or later** if you use TypeScript. ESM and CommonJS are supported.

Follow the [quick start](./quick-start) to install the package and build your first portal.
