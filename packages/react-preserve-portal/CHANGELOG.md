## 0.4.0 (2026-10-24)

- Reject Slot children/HTML that could overwrite the portal container.
- Give each target registration an identity, including repeated registrations of the same element.
- Add `Host mountWhen="connected"` for initial measurement and autofocus after attachment.
- Keep Host containers connected when Suspense/Activity cleans up layout effects; remove them on final deletion.
- Add `Portal.dispose()` for unused IDs, with protection for mounted/hidden owners and manual targets.
- Expose targets as a `ReadonlyMap` and reject cross-document or cyclic destinations.

### Compatibility and migration

This pre-1.0 minor release tightens the destination contract: Slots must be empty,
`targets` is now typed as `ReadonlyMap`, and cross-document/cyclic destinations
are rejected. Move placeholders beside Slots, use registration actions instead of
mutating the snapshot, and keep destinations in Host's document. The default
immediate mount, `Host node`, and existing hook actions remain supported.

`mountWhen="connected"` is opt-in. `dispose()` only releases an unused ID after
its React owners and manual registrations are gone; stale actions throw after
successful disposal. Explicit hide/reset still detach content.

### Validation and documentation

- Add React 18/19 browser regressions for native/fallback moves, iframe lifetimes,
  hidden deletion, connected mounting and disposal.
- Keep both demo destinations mounted across routes and synchronize playback
  with media events, rejected play promises and explicit pause on close.
- Update the bilingual API, migration and lifecycle guides for 0.4.0.

## 0.3.0 (2026-10-24)

### API

- Accept JSX children in `Host`; retain the `node` prop for existing consumers.
- Infer literal portal IDs and slot keys without `as const` (TypeScript 5+).
- Return an ownership-safe cleanup function from `registerTarget`.

### Fixes and performance

- Subscribe to each portal independently and ignore unchanged state updates.
- Keep mounted destinations registered after `reset()` so content can be shown again.
- Prevent an old Slot cleanup from removing a newer destination with the same key.
- Register replacement Slot elements when their `as` tag changes.
- Render safely on the server and hydrate without creating server-side DOM nodes.
- Allocate one unmanaged container per mounted Host and preserve React state through moves.
- Prefer native `moveBefore` for connected moves where supported, falling back to `appendChild`.
- Treat an empty slot key separately from the hidden (`null`) state.

### Documentation and development

- Document lifecycle, SSR, browser limitations, migration, and reproducible release checks.
- Make the library watcher continuous so the documented demo command can start.
- Make lint read-only and fail test tasks if no tests are found.

### Migration

Existing `createPortal`, `Host node`, `Slot`, and hook calls remain supported. `Host`
accepts either `children` or `node`, not both. `reset()` now clears navigation state
without unregistering mounted destinations; use `unregisterTarget` for manual
registrations that must be removed. Do not mutate the `targets` snapshot.

## 0.2.5 (2026-01-04)

This was a version bump only for @charley-kim/react-preserve-portal to align it with other projects, there were no code changes.

## 0.2.4 (2026-01-02)

This was a version bump only for @charley-kim/react-preserve-portal to align it with other projects, there were no code changes.

## 0.2.3 (2026-01-02)

### Performance

- Reduce bundle size by 18% (3.38KB → 2.76KB) by reusing usePortal hook in createPortal

### Chores

- Fix react-compiler lint errors in tests using renderHook pattern
- Translate all test names and comments to English
