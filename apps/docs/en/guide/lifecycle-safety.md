---
title: Lifecycle and ownership
description: Rules for first measurements, Suspense and Activity, manual destinations, and disposing portal IDs.
---

# Lifecycle and ownership

Use this guide when integrating initial measurements, Suspense/Activity boundaries, manually owned DOM targets, or dynamic portal IDs. For ordinary movement, the [quick start](./quick-start) is sufficient.

The basic rule is that React owns the content **inside** Host's container, while the library owns the container's placement. Keep Slots empty so the two do not compete for their children.

## Slots are empty destinations

Passing `children` or `dangerouslySetInnerHTML` to Slot is rejected by types and at runtime. React could otherwise overwrite the portal container when updating that content. Render loading indicators and placeholders as siblings. External code must not overwrite a Slot's `textContent` or `innerHTML` either.

## Mount after connecting

```tsx
<Panel.Host mountWhen="connected">
  <Editor />
</Panel.Host>
```

The default remains `"immediate"`. `"connected"` delays the first content mount until the active container connects to the document, supporting initial layout-effect measurements and `autoFocus`. Moving or hiding it afterwards does not remount the content.

Document child-list changes are observed only while waiting for that first connection. Observation stops after connecting or deleting Host. Prefer connecting manual destinations before registering them. This is not an API for automatically tracking external changes inside Shadow DOM. Connected content can still measure zero under hidden ancestors or zero-sized layouts. Use `ResizeObserver` for later size changes.

## Hidden boundaries versus deletion

If the destination Slot stays registered and connected, Effect cleanup by Suspense/Activity around Host does not by itself remove the container. React controls visibility and Effects according to the boundary; actual Host deletion removes the container. Activity requires React 19.2 or later. The hidden-Host deletion fix for React 19.0/19.1 is included in 0.4.1.

`setSlotKey(null)` and `reset()` still **detach** the container. A Slot that disappears or unregisters under a hidden boundary is no longer a destination. Use persistent Slots for iframes that must remain connected. React state, DOM objects, browser documents, and Effects have distinct lifetimes.

## Registration ownership and disposal

Re-registering the same element under the same key creates a new registration. Old cleanup cannot remove the latest registration. The snapshot still changes only when the destination element changes, avoiding additional renders. `targets` is a read-only snapshot.

```tsx
// After actually unmounting every React owner of this ID:
root.unmount()
cleanupManualTarget()
const released = Panel.dispose()
```

`dispose(): boolean` returns `false` while a Host, Slot, hook owner, subscriber, or manual target remains. This includes owners hidden by Activity. Success removes the ID store; an absent store also returns `true`. Do not call it during component render or while mounting/transferring ownership of the same ID.

Mounting the same factory again uses a fresh empty store. Previously retained actions throw instead of mutating a retired store. Old registration cleanup remains a safe no-op. Keep using `reset()` to hide an active portal.

## Supported boundaries

Destinations must belong to the same `document` as Host and cannot be the portal container or its descendants. Moves are validated first. Adopting the container into another document does not migrate React's document-level event subscriptions, so moving into Document PiP or iframe documents is not supported by the basic API.

Within one root, React events and context follow Host's tree. When moving into another React root, that destination root's capture/bubble handlers may also run. Shadow DOM selection and IME behavior have React/browser constraints and are not fully guaranteed. The library does not globally stop event propagation to simulate isolation.
