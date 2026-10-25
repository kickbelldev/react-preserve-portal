---
layout: home
title: Same DOM. New destination.
hero:
  name: React Preserve Portal
  text: One component. More than one place.
  tagline: A React portal library for moving a video, editor, or canvas without remounting it. Keep content in one Host, then choose where it appears.
  image:
    src: /hero.svg
    alt: A playing video moves from the main view into a mini player without stopping
  actions:
    - theme: brand
      text: Get started
      link: /en/guide/quick-start
    - theme: alt
      text: Try it live
      link: '#playground'
    - theme: alt
      text: API
      link: /en/api
features:
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="13" height="10" rx="2"/><rect x="11.5" y="12.5" width="10" height="8" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M6 17.5h3.5M7.5 15.5l2 2-2 2"/></svg>
    title: Render content in Host
    details: Keep one player or editor mounted in Host. Its component state and DOM nodes follow it when you change destinations.
    link: /en/guide/preservation
    linkText: How it works
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4.5H6.5a2 2 0 0 0-2 2v3.2a2.3 2.3 0 0 1-1.5 2.3 2.3 2.3 0 0 1 1.5 2.3v3.2a2 2 0 0 0 2 2H8M16 4.5h1.5a2 2 0 0 1 2 2v3.2a2.3 2.3 0 0 0 1.5 2.3 2.3 2.3 0 0 0-1.5 2.3v3.2a2 2 0 0 1-2 2H16"/><path d="m9 12 2 2 4-4"/></svg>
    title: Define destinations with Slot
    details: Place empty Slots in the main view and mini view. Each Slot names a place for the same content to appear.
    link: /en/api
    linkText: API reference
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="17" rx="2.5"/><path d="M2.5 8h19"/><circle cx="5.5" cy="5.8" r=".5" fill="currentColor"/><circle cx="7.8" cy="5.8" r=".5" fill="currentColor"/><path d="m12.8 10.5-3 4.5h4l-1 3.5 3.2-4.8h-4z"/></svg>
    title: Choose a slot with usePortal
    details: Call setSlotKey with a slot name to move the content, or null to hide it. TypeScript checks the names you define.
    link: /en/guide/quick-start
    linkText: Build your first portal
---

<div class="home-lab" id="playground">
  <span class="section-kicker">TRY IT</span>
  <h2>Move it while it plays.</h2>
  <p>Edit the note and increment the counter, then select Move to mini. The same player and values move together. Hide and show it to see which state stays.</p>
  <PortalPlayground />
  <p class="home-note">Playback can pause during fallback moves or hiding. See <a href="./guide/preservation.html">what survives a move</a> for the browser-dependent behavior.</p>
  <nav class="home-next" aria-label="Next steps">
    <a href="./guide/quick-start.html"><strong>Build your first portal</strong><span>Host, Slot and usePortal in five minutes</span></a>
    <a href="./guide/video-player.html"><strong>Add a mini player</strong><span>Move a playing video, end to end</span></a>
    <a href="./guide/routing.html"><strong>Keep it across routes</strong><span>Survive page navigation</span></a>
  </nav>
</div>
