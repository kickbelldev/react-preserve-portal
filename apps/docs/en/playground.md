---
title: Interactive playground
description: Verify that the same DOM and React state survive slot changes and hiding.
---

# Interactive playground

This example uses the actual library, one Host, and two Slots. Let the video play, edit the note and counter, then move between main and mini or hide and show the content.

<PortalPlayground />

## What to check

1. The video is a single `<video>` element. Its timecode keeps running through moves because the element is never recreated.
2. The note is an uncontrolled input, not a value stored in React state. It stays on the same DOM node after a move.
3. The counter uses React state. Changing slots does not reset it.
4. `reset()` hides the portal. Selecting main again restores the content with its internal state intact.
5. The move count lives in the card's own React state. It only grows because the card is never remounted.
6. View Transition is an optional animation in supporting browsers. It is disabled when reduced motion is preferred.

The `moveBefore` / `appendChild` label indicates browser support. Even supporting browsers use `appendChild` for the initial attachment and after hiding, because the node is detached. Clicking the demo's buttons moves focus to those buttons, so this interaction is not a focus-preservation test.

Leaving this page unmounts the example's Host. A fresh instance on returning is expected. See the [playground.tsx source](https://github.com/kickbelldev/react-preserve-portal/blob/main/apps/docs/.vitepress/theme/playground.tsx).
