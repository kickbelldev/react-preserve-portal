import type { PortalAnimation } from '../core/types'

export type MoveStart = DOMRect | 'enter' | null

/** The on-screen box to start from, including any running animation. */
export function measureMoveStart(node: HTMLElement): MoveStart {
  if (!node.isConnected) return 'enter'
  const box = node.getBoundingClientRect()
  // A hidden ancestor (display: none) has no box to animate from.
  return box.width ? box : null
}

/**
 * Animate the container from where it was to where it is now. Only transform
 * and opacity change, so layout runs once (the measurement below) per move.
 */
export function animateMove(
  node: HTMLElement,
  start: MoveStart,
  options: true | PortalAnimation,
): Animation | null {
  if (
    !start ||
    !node.animate ||
    matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
    return null
  // A slight overshoot reads as a spring without per-frame JavaScript.
  const { duration = 450, easing = 'cubic-bezier(.2,.9,.3,1.08)' } =
    options === true ? {} : options
  if (start === 'enter')
    return node.animate([{ opacity: 0 }, { opacity: 1 }], duration / 2)
  const end = node.getBoundingClientRect()
  const dx = start.left - end.left
  const dy = start.top - end.top
  // Uniform scale keeps text and media undistorted while the box resizes.
  const scale = start.width / end.width
  if (!end.width || (!dx && !dy && scale === 1)) return null
  return node.animate(
    [
      {
        transformOrigin: '0 0',
        transform: `translate(${dx}px,${dy}px) scale(${scale})`,
      },
      { transformOrigin: '0 0', transform: 'none' },
    ],
    { duration, easing },
  )
}
