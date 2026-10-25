# Contributing

Run all commands from the repository root using the pinned `corepack pnpm`.
Node 22.12+ or Node 24 is recommended. Install with `--frozen-lockfile`.

## Architecture

- `core/createPortal.tsx` binds the public typed components and hook to an ID.
- `core/types.ts` defines the public API; existing `Host node` consumers remain supported.
- `model/store.ts` owns per-ID snapshots, subscriptions, and stable actions. It has no React dependency.
- `model/usePortal.ts` connects a store to React through `useSyncExternalStore`.
- `model/useCommittedEffect.ts` handles final cleanup across React 18 Suspense and React 19 Activity.
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

Run `python scripts/lifecycle-smoke.py` with Python Playwright and a browser
installed for real-browser connection, focus, iframe, hidden-deletion, and
disposal regressions. `REACT_MODULES` can point to a separate `node_modules`
containing React and React DOM. Set `PORTAL_BROWSER` to `chromium` (default),
`firefox`, or `webkit`. CI tests React 18.3.1 and 19.2.3 on all three engines,
plus React 18.0.0, 18.2.0, 19.0.0 and 19.1.0 on Chromium. Each engine runs its
native capability path and a forced `appendChild` fallback. Activity is tested
on React 19.2. WebKit coverage is engine coverage, not a claim of testing every
Safari/iOS device. Do not replace this matrix with jsdom alone: React 18
and React 19.0/19.1 skip insertion cleanup when deleting a suspended tree, while Activity-capable React
disconnects passive effects when hiding it.

After building the demo, `python scripts/demo-smoke.py` serves the production
output and tests persistent main/mini Slots, real media events, close/reopen,
and rejected play requests. It uses a local canvas stream and blocks remote
video downloads. CI includes the same native and fallback routing checks.

Lint does not rewrite source. To autofix intentionally, pass `--fix=true` to the
Nx lint task. In a container that cannot create Nx plugin sockets, use
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false`; run browser/server checks in an
execution context that permits local sockets.

## Documentation website

The bilingual VitePress site lives in `apps/docs`. Keep Korean pages and their
`en/` counterparts in sync. Document actual guarantees separately from proposals.
The playground dynamically mounts the real React library after hydration; React
and the interactive example are not required to read the static documentation.

```bash
corepack pnpm docs:dev
corepack pnpm docs:build
corepack pnpm docs:preview
```

The production build writes `dist/apps/docs` and fails on broken internal page
links. The site base is `/react-preserve-portal/`; use VitePress-relative links so
assets, search, and navigation work under that subpath. Validate both locales,
mobile layouts, local search, dark mode, and preservation in the real playground.
With Python Playwright and Chromium installed, `python scripts/docs-smoke.py`
checks these flows against the preview. Pass a site base URL to check a deployment.
Set `CHROMIUM_PATH` if the browser is not at `/usr/bin/chromium`. Restart the preview
after rebuilding so its static-file cache matches the new assets.

GitHub Pages uses **GitHub Actions** as its build source. The Documentation
workflow builds and uploads the static artifact, then deploys from `main` using
the `github-pages` environment. It can also be dispatched manually from `main`.
No npm token or third-party hosting account is needed. In repository Settings →
Pages, choose GitHub Actions when setting this up in a fork. The expected URL is
https://kickbelldev.github.io/react-preserve-portal/.

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
   package must contain the README, MIT license, and ESM/CJS runtime entries and their matching `.d.ts`/`.d.cts` declarations.
   The consumer check accepts `18`, `19`, or an exact supported React version and
   type-checks both ESM (`.tsx`) and CommonJS (`.cts`) callers.

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
