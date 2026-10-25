---
title: Interactive playground
description: Move a note, counter and video to explore preserved state and hiding.
---

# Interactive playground

Edit the note, increment the counter, then select **Move to mini**. The same card moves into another Slot instead of creating a new player.

<PortalPlayground />

## Check input values and React state

The note is an uncontrolled input; the counter uses React state. Both values survive moving between main and mini. The card's move count is also local React state and increases when you select a different slot.

To copy a minimal version into your app, follow the [quick start](./guide/quick-start).

## Distinguish hiding from clearing state

Select **Hide** or **reset()**, then **Move to main**. Your note and count return. `reset()` clears the selected slot and return path, not the content's internal state.

This example pauses video when hidden. Press Play after showing it again to resume. Pausing is behavior implemented by the example; the portal's hide operation does not control media. The [video guide](./guide/video-player) includes a complete example.

## Browser-dependent behavior

The card uses the same `<video>` element. Connected Slot moves with `moveBefore` can preserve playback; `appendChild` fallback moves and hide/show can pause it.

The label at the top reports **browser support**, not the operation used for every move. Even supporting browsers use `appendChild` for first attachment and return from hiding because the container is detached. Clicking a control moves focus to that control, so the click itself is not a focus-preservation test. See [how preservation works](./guide/preservation) for the conditions.

## Enable transition animation

View Transition is an optional animation in supporting browsers. Preservation does not require it. A reduced-motion preference disables the animation and video autoplay; enabling that preference also pauses a playing video immediately.

Leaving this page unmounts Host, so a fresh instance on returning is expected. See [playground.tsx](https://github.com/kickbelldev/react-preserve-portal/blob/main/apps/docs/.vitepress/theme/playground.tsx) for the implementation.
