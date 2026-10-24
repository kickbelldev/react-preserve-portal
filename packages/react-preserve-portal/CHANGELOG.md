## Unreleased

- Reject Slot children/HTML that could overwrite the portal container.
- Give each target registration an identity, including repeated registrations of the same element.
- Add `Host mountWhen="connected"` for initial measurement and autofocus after attachment.
- Keep Host containers connected when Suspense/Activity cleans up layout effects; remove them on final deletion.
- Add `Portal.dispose()` for unused IDs, with protection for mounted/hidden owners and manual targets.
- Expose targets as a `ReadonlyMap` and reject cross-document or cyclic destinations.

These changes are on the source branch and are not included in npm 0.3.0.

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
