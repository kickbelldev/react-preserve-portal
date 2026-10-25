import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PortalAnimation } from '../index'
import { createPortal } from './createPortal'

type Keyframes = Keyframe[]
let animate: ReturnType<typeof vi.fn>
let animations: { cancel: ReturnType<typeof vi.fn> }[]

beforeEach(() => {
  animations = []
  animate = vi.fn(() => {
    const animation = { cancel: vi.fn() }
    animations.push(animation)
    return animation
  })
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    configurable: true,
    value: animate,
  })
  // jsdom has no layout: each Slot declares its box in data-rect.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      const owner = this.closest<HTMLElement>('[data-rect]')
      const [left, top, width, height] = (owner?.dataset.rect ?? '0,0,0,0')
        .split(',')
        .map(Number)
      return { left, top, width, height, x: left, y: top } as DOMRect
    },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (HTMLElement.prototype as { animate?: unknown }).animate
  vi.unstubAllGlobals()
})

function setup(id: string, animateProp?: boolean | PortalAnimation) {
  const Portal = createPortal({ id, slots: ['a', 'b'] })
  render(
    <>
      <Portal.Host animate={animateProp}>
        <span data-testid="content">content</span>
      </Portal.Host>
      <Portal.Slot slotKey="a" data-rect="0,0,400,200" data-testid="a" />
      <Portal.Slot slotKey="b" data-rect="500,300,200,100" data-testid="b" />
    </>,
  )
  const { result } = renderHook(() => Portal.usePortal())
  return { Portal, actions: () => result.current }
}

describe('Host animate', () => {
  it('fades in from hidden, then moves from the old box with transform only', () => {
    const { actions } = setup('animate-move', true)
    act(() => actions().setSlotKey('a'))
    expect(animate).toHaveBeenCalledTimes(1)
    expect((animate.mock.calls[0][0] as Keyframes)[0]).toMatchObject({
      opacity: 0,
    })

    act(() => actions().setSlotKey('b'))
    expect(screen.getByTestId('b')).toContainElement(
      screen.getByTestId('content'),
    )
    expect(animate).toHaveBeenCalledTimes(2)
    const [frames, timing] = animate.mock.calls[1] as [
      Keyframes,
      KeyframeAnimationOptions,
    ]
    // From a(0,0,400) to b(500,300,200): start 500px left, 300px up, 2x size.
    expect(frames[0]).toMatchObject({
      transform: 'translate(-500px,-300px) scale(2)',
      transformOrigin: '0 0',
    })
    expect(frames[1]).toMatchObject({ transform: 'none' })
    expect(Object.keys(frames[0]).sort()).toEqual([
      'transform',
      'transformOrigin',
    ])
    expect(timing.duration).toBe(450)
  })

  it('does nothing without the animate prop', () => {
    const { actions } = setup('animate-off')
    act(() => actions().setSlotKey('a'))
    act(() => actions().setSlotKey('b'))
    expect(animate).not.toHaveBeenCalled()
  })

  it('respects reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    )
    const { actions } = setup('animate-reduced', true)
    act(() => actions().setSlotKey('a'))
    act(() => actions().setSlotKey('b'))
    expect(animate).not.toHaveBeenCalled()
  })

  it('cancels a running animation when interrupted or hidden', () => {
    const { actions } = setup('animate-interrupt', true)
    act(() => actions().setSlotKey('a'))
    act(() => actions().setSlotKey('b'))
    act(() => actions().setSlotKey('a'))
    expect(animations[1].cancel).toHaveBeenCalled()
    act(() => actions().setSlotKey(null))
    expect(animations[2].cancel).toHaveBeenCalled()
  })

  it('passes custom duration and easing', () => {
    const { actions } = setup('animate-options', {
      duration: 300,
      easing: 'ease-in-out',
    })
    act(() => actions().setSlotKey('a'))
    act(() => actions().setSlotKey('b'))
    expect(animate.mock.calls[1][1]).toEqual({
      duration: 300,
      easing: 'ease-in-out',
    })
  })

  it('skips moves from a hidden (zero-size) box', () => {
    const Portal = createPortal({ id: 'animate-zero', slots: ['a', 'b'] })
    render(
      <>
        <Portal.Host animate>content</Portal.Host>
        <Portal.Slot slotKey="a" data-rect="0,0,0,0" />
        <Portal.Slot slotKey="b" data-rect="500,300,200,100" />
      </>,
    )
    const { result } = renderHook(() => Portal.usePortal())
    act(() => result.current.setSlotKey('a'))
    animate.mockClear()
    act(() => result.current.setSlotKey('b'))
    expect(animate).not.toHaveBeenCalled()
  })
})
