---
title: Migrating to 0.3
description: Compatibility and behavior changes when upgrading from 0.2.x to 0.3.0.
---

# Migrating to 0.3

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
