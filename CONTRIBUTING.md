# Contributing

Run all commands from the repository root using the pinned `corepack pnpm`.
Node 22.12+ or Node 24 is recommended. Install with `--frozen-lockfile`.

## Architecture

- `core/createPortal.tsx` binds the public typed components and hook to an ID.
- `core/types.ts` defines the public API; existing `Host node` consumers remain supported.
- `model/store.ts` owns per-ID snapshots, subscriptions, and stable actions. It has no React dependency.
- `model/usePortal.ts` connects a store to React through `useSyncExternalStore`.
- `components/InternalPortalHost.tsx` owns one stable DOM container, hydration, and movement.
- `components/InternalPortalSlot.tsx` registers destinations with an ownership-safe callback ref.

Preserve the same unmanaged container and React subtree when moving or hiding
content. Keep server rendering DOM-free and hydration deterministic. Never mutate
a published snapshot in place. Portal IDs retain sharing semantics within one
loaded module; use different IDs for independent portals.

## Validation

```bash
corepack pnpm test
corepack pnpm build
corepack pnpm exec nx run-many --target=typecheck --all
corepack pnpm lint
corepack pnpm dev
```

Regression tests cover StrictMode, DOM identity and React state, hide/show/reset,
late and replaced slots, stale cleanup, independent subscriptions, type inference,
legacy API calls, server rendering, and hydration. Use the demo to verify routing
and main/mini player transitions in a real browser. Browser-managed state can
behave differently with `moveBefore` and the `appendChild` fallback; do not claim
universal iframe or uninterrupted-media preservation.

Lint does not rewrite source. To autofix intentionally, pass `--fix=true` to the
Nx lint task. In a container that cannot create Nx plugin sockets, use
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false`; run browser/server checks in an
execution context that permits local sockets.

## Release

1. Update the package version and its CHANGELOG. Document compatibility changes.
2. Run the checks above without reusing stale results (`--skip-nx-cache` when verifying a release).
3. Pack the actual package and inspect its files and public ESM/CJS/types entry points:

   ```bash
   mkdir -p /tmp/react-preserve-portal-release
   corepack pnpm --dir packages/react-preserve-portal pack --pack-destination /tmp/react-preserve-portal-release
   npm publish /tmp/react-preserve-portal-release/charley-kim-react-preserve-portal-VERSION.tgz --access public --dry-run
   ```

4. Install that tarball in isolated React 18 and React 19 consumers:

   ```bash
   node scripts/verify-package.mjs /tmp/react-preserve-portal-release/charley-kim-react-preserve-portal-VERSION.tgz 18
   node scripts/verify-package.mjs /tmp/react-preserve-portal-release/charley-kim-react-preserve-portal-VERSION.tgz 19
   ```

   These checks exercise the
   public types, server rendering, and DOM/state preservation in both. The packed
   package must contain the README, MIT license, and all three dist entry points.

5. Check `npm view @charley-kim/react-preserve-portal version` and `npm whoami`.
   Publish the **same verified tarball** using a maintainer account with package
   write access, completing any required npm authentication/2FA securely:

   ```bash
   npm publish /tmp/react-preserve-portal-release/charley-kim-react-preserve-portal-VERSION.tgz --access public
   ```

6. Confirm the registry version, dist tag, and tarball integrity. Record the
   release commit and tag in Git only when the publication has succeeded.

Never commit npm tokens or credential-bearing configuration. A dry run or packed
artifact is not a published release. Do not publish a version that already exists.
