---
layout: home
title: Same DOM. New destination.
hero:
  name: React Preserve Portal
  text: Move your UI. Keep its state.
  tagline: A playing video, a half-written draft, a live canvas. Move them anywhere in your layout without remounting. DOM nodes and React state come along.
  image:
    src: /hero.svg
    alt: A playing video moves from the main view into a mini player without stopping
  actions:
    - theme: brand
      text: Start in five minutes
      link: /en/guide/quick-start
    - theme: alt
      text: Try it live
      link: '#playground'
    - theme: alt
      text: API
      link: /en/api
features:
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="13" height="10" rx="2"/><rect x="11.5" y="12.5" width="10" height="8" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M6 17.5h3.5M7.5 15.5l2 2-2 2"/></svg>
    title: Mount once, move anywhere
    details: The container itself moves, preserving DOM identity, input values and component state. Moves within the same Host do not remount its children.
    link: /en/guide/preservation
    linkText: How it works
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4.5H6.5a2 2 0 0 0-2 2v3.2a2.3 2.3 0 0 1-1.5 2.3 2.3 2.3 0 0 1 1.5 2.3v3.2a2 2 0 0 0 2 2H8M16 4.5h1.5a2 2 0 0 1 2 2v3.2a2.3 2.3 0 0 0 1.5 2.3 2.3 2.3 0 0 0-1.5 2.3v3.2a2 2 0 0 1-2 2H16"/><path d="m9 12 2 2 4-4"/></svg>
    title: Typed down to slot names
    details: Host, Slot and usePortal are the whole API. Slot names are inferred, so a typo fails at compile time. Works with React 18 and later.
    link: /en/api
    linkText: API reference
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="17" rx="2.5"/><path d="M2.5 8h19"/><circle cx="5.5" cy="5.8" r=".5" fill="currentColor"/><circle cx="7.8" cy="5.8" r=".5" fill="currentColor"/><path d="m12.8 10.5-3 4.5h4l-1 3.5 3.2-4.8h-4z"/></svg>
    title: Browser state, too
    details: Connected moves with moveBefore preserve focus, iframe and animation state. See the guide for the limits of appendChild and hiding.
    link: /en/guide/web-platform
    linkText: Browser support
---

<div class="home-lab" id="playground">
  <span class="section-kicker">LIVE PLAYGROUND</span>
  <h2>Move it while it plays.</h2>
  <p>While the reel plays, type a note and bump the counter, then send it to the mini player. Your note and count stay put. Connected moveBefore moves also preserve playback; the fallback may require pressing Play again.</p>
  <PortalPlayground />
</div>
