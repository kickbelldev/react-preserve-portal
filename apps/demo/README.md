# Demo App

Demo application for `@charley-kim/react-preserve-portal`.

## Run

```bash
corepack pnpm exec nx run demo:dev
```

## Features

- Video player with mini-player mode
- Slot switching between main and mini views
- State preservation during DOM movement
- Both destinations stay mounted in the shared layout, allowing connected moves
- Native playback-event synchronization, explicit pause on close, and play-error handling

The demo uses the unreleased workspace source, including `mountWhen="connected"`.
That option is not available in the published npm 0.3.0 package yet.

Run `corepack pnpm exec nx run demo:test` for media-store regressions. After
building the demo, run `python scripts/demo-smoke.py` with Playwright and Chromium
to test routing and real video playback using a local canvas stream. A browser
without `moveBefore` still preserves the DOM object, but can interrupt browser
state during an `appendChild` move.
