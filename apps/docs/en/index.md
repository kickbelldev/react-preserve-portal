---
layout: home
title: Same DOM. New destination.
hero:
  name: React Preserve Portal
  text: Move your UI. Keep its state.
  tagline: Players, editors, canvases. One React tree, one DOM container, wherever your interface needs it next.
  image:
    src: /hero.svg
    alt: One piece of content moving from a main view into a compact view
  actions:
    - theme: brand
      text: Start in five minutes →
      link: /en/guide/quick-start
    - theme: alt
      text: Explore the API
      link: /en/api
features:
  - title: Mount once. Move anywhere.
    details: Move the same container between destinations. React state and DOM identity survive without reinitializing the subtree.
  - title: A small, typed API
    details: Host, Slot, usePortal. TypeScript infers your slot names. Works with React 18 and later.
  - title: Built on the platform
    details: Connected moves use moveBefore where supported, preserving browser-managed state. Older browsers fall back to appendChild.
---

<div class="home-lab">
  <span class="section-kicker">TRY THE REAL THING</span>
  <h2>See what stays with you.</h2>
  <p>Edit the note, increment the counter, then move them between destinations.</p>
  <PortalPlayground />
</div>
