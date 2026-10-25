---
title: Migrating to 0.4
description: Compatibility changes for 0.4.0, with earlier 0.2.x migration notes.
---

# Migrating to 0.4

## From 0.4.0 to 0.4.1

This patch fixes compatibility bugs without changing the API: CommonJS
TypeScript NodeNext declarations and final cleanup when deleting a suspended
Host in React 19.0/19.1. The `require` export selects the new `.d.cts` declaration
automatically. Upgrade the package without changing application code.

Consumer checks cover React 18.0.0, 18.2.0, 18.3.1, 19.0.0, 19.1.0 and 19.2.3.
React 18.3.1 and 19.2.3 also run on Chromium, Firefox and WebKit; Activity is
checked on 19.2.3. Engine coverage does not establish support for every Safari/iOS device.

## From 0.3.x to 0.4.0

Existing factory calls, the `node` prop, and hook actions remain supported. This pre-1.0 minor release tightens several unsafe usage patterns:

- Keep Slots empty. Move `children` and HTML placeholders beside them; `children` and `dangerouslySetInnerHTML` now fail type checking and throw at runtime.
- Treat `targets` as `ReadonlyMap`; use registration actions instead of modifying snapshots.
- Keep destinations in Host's document and outside its own container. Cross-document and cyclic moves are rejected before mutation.

The default mount remains immediate. Choose `mountWhen="connected"` when initial measurements or autofocus require attachment. Host containers now survive outer Suspense/Activity hiding, including final cleanup on React 18. Explicit hide/reset and removed Slots still detach content.

`Player.dispose()` optionally releases an unused ID after all React owners and manual registrations are gone. It refuses while owners remain, including hidden ones. Retained actions throw after successful disposal; fresh mounts use a new store. See [the lifecycle guide](./guide/lifecycle-safety) and [API reference](./api).

## From 0.2.x

Existing factories, slot keys, `node`, and hook methods remain available. Review the following behavior and type requirements.

## JSX children

```tsx
// The 0.2.x syntax remains supported.
<Player.Host node={<VideoPlayer />} />

// In 0.3.0, you can also use ordinary JSX children.
<Player.Host><VideoPlayer /></Player.Host>
```

Do not supply both `node` and `children`. Slot-name literals infer without `as const`, and the published declarations require **TypeScript 5 or later**.

## `reset()` keeps destinations

Previously, `reset()` also cleared destination registrations. Version 0.3.0 **hides content and clears `returnPath`**, keeping mounted destinations registered. You can select a slot again immediately.

If you used `reset()` to remove manual registrations, call the cleanup functions returned by `registerTarget()` instead.

## Registration cleanup and SSR

`registerTarget()` now returns a cleanup function. Existing code can ignore the return value, but returning it from an Effect protects newer registrations from stale cleanup.

Host does not emit content during server rendering and mounts it after hydration. See the [SSR guide](./guide/ssr). React context and events still follow Host's React tree.

## Moves and subscriptions

Connected moves use `moveBefore` in supporting browsers, with `appendChild` as the fallback. Store subscriptions are isolated by portal ID, reducing notifications from unrelated portals.

See the [CHANGELOG](https://github.com/kickbelldev/react-preserve-portal/blob/main/packages/react-preserve-portal/CHANGELOG.md) for the full history.
