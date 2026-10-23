---
description: Diagnose missing content, state resets, focus loss, and iframe reloads.
---

# Troubleshooting

## Content is not visible

The initial `slotKey` is `null`. Check that you called `setSlotKey('main')` and mounted a Slot with that key. Selecting a missing destination leaves the content in a detached container.

Use `targets.has(slotKey)` to check registration, and inspect whether that element is actually connected to the document. Check for `display: none` or zero dimensions on it and its ancestors. Manually moving the portal container in developer tools can put the DOM out of sync with library state.

## State resets during a move

- Check whether the factory is called inside a component function.
- Check whether Host is conditionally removed or receives a new key.
- Check whether the content's component type or key changes.
- Confirm that your router actually preserves the shared layout.

Development Strict Mode may run additional Effect setup and cleanup. Distinguish that from remounting during a real move. Check both an uncontrolled input's value and its DOM object identity.

## An iframe reloads or focus disappears

DOM identity alone does not guarantee browser-managed state. Check `moveBefore` support, both elements' `isConnected` status before the move, and a shared `ownerDocument`. Removing the source Slot first or hiding content breaks the connected-move conditions.

Cross-origin iframe content may prevent your application from inspecting its internal state. Test your actual supported browsers and player. See [modern Web APIs](./web-platform) for the conditions.

## Timers or media keep running while hidden

This is expected: hiding is not a React unmount. Your content can observe `slotKey === null` and stop work as needed, or manage playback state separately. Remember that `slotKey !== null` does not mean the content is actually visible.

## Show content again after `reset()`

In 0.3.0, mounted Slots stay registered. Call `setSlotKey('main')` to show the content again. To clear the content's internal state, provide an explicit reset action or intentionally remount it with a different key.

## A target registration gets replaced

Check for multiple destinations using the same portal ID and slot key. The last registration wins. For external destinations, use [the returned cleanup function](../api#register-an-external-dom-destination). Mutating the `targets` Map directly bypasses notifications and cleanup.

## Report a bug

Open a [GitHub issue](https://github.com/kickbelldev/react-preserve-portal/issues) with library, React, and browser versions, a reproduction, Host/Slot lifetime around the move, and `moveBefore` support. Remove private data and credentials from reproductions.
