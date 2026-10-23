---
description: Understand React state, DOM identity, browser-managed state, and Host lifetime.
---

# How preservation works

`Host` creates one container and always passes that node to React's `createPortal`. Changing slots only changes the container's DOM parent. From React's perspective, the portal destination stays the same.

## What survives?

| Operation                               | React state and DOM identity      | Browser-managed state                                                                 |
| --------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| Connected slot → connected slot         | Preserved                         | `moveBefore` also preserves focus, iframe state, animations, and more where supported |
| Move via `appendChild`                  | Preserved                         | Subject to removal/reinsertion behavior                                               |
| Select `null` or remove the destination | Preserved in a detached container | Focus or iframe state may be lost                                                     |
| Unmount `Host` or change its key        | Discarded                         | Discarded                                                                             |

`moveBefore` does not solve initial attachment, hiding, or cross-document moves. The library checks support, connectivity, and a shared `ownerDocument` before using it.

::: warning Hiding is not pausing
`setSlotKey(null)` and `reset()` do not unmount the React subtree. Effects, timers, and subscriptions continue running. To stop media, call the content's own API, such as `pause()`.
:::

## React tree versus DOM tree

React context and synthetic events follow the React tree containing `Host`. CSS inheritance and native event paths follow the physical DOM. A Provider placed only above a destination Slot does not provide context to the Host's content.

`Host` chooses its `as` tag when creating the container. Keep it stable while mounted. If a different tag is essential, remount the Host with a new key; this resets its internal state.

## Lifetime and IDs

Prefer one Host per portal. Multiple Hosts render separate content while sharing the active slot state.

Stores remain registered by ID for the lifetime of the module. `reset()` does not delete a store. Avoid generating unlimited IDs per render or per item. Use stable application-level IDs. Supporting large numbers of dynamic instances needs an explicit lifetime-management design first.

## Accessibility

Place slots so that reading order remains meaningful after a move. Connected moves can preserve focus in supporting browsers, but hiding detaches the focused element. Your application should decide where focus goes, such as back to the control that hid the content. A portal does not automatically provide modal focus trapping or ARIA semantics.
