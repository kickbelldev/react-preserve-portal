import { createRef } from 'react'
import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'

import { getPortalStore } from '../model/store'
import { createPortal } from './createPortal'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function countObservers() {
  const created = { count: 0 }
  class CountingObserver extends MutationObserver {
    constructor(callback: MutationCallback) {
      super(callback)
      created.count++
    }
  }
  vi.stubGlobal('MutationObserver', CountingObserver)
  return created
}

describe('Slot ref', () => {
  it('passes the destination element to object and function refs', () => {
    const Portal = createPortal({ id: 'slot-ref', slots: ['main'] })
    const objectRef = createRef<HTMLElement>()
    const calls: (HTMLElement | null)[] = []
    const view = render(
      <>
        <Portal.Slot
          slotKey="main"
          as="section"
          ref={objectRef}
          data-testid="a"
        />
        <Portal.Slot
          slotKey="main"
          data-testid="b"
          ref={(element) => {
            calls.push(element)
          }}
        />
      </>,
    )
    expect(objectRef.current).toBe(screen.getByTestId('a'))
    expect(calls.at(-1)).toBe(screen.getByTestId('b'))
    view.unmount()
    expect(objectRef.current).toBeNull()
    expect(calls.at(-1)).toBeNull()
  })

  it('does not re-register the destination when an inline ref changes', () => {
    const Portal = createPortal({ id: 'slot-ref-inline', slots: ['main'] })
    const register = vi.spyOn(
      getPortalStore('slot-ref-inline'),
      'registerTarget',
    )
    const seen: (HTMLElement | null)[] = []
    function App({ tick }: { tick: number }) {
      return (
        <Portal.Slot
          slotKey="main"
          data-tick={tick}
          ref={(element) => {
            seen.push(element)
          }}
        />
      )
    }
    const view = render(<App tick={0} />)
    view.rerender(<App tick={1} />)
    view.rerender(<App tick={2} />)
    expect(register).toHaveBeenCalledTimes(1)
    expect(seen.filter(Boolean).length).toBeGreaterThanOrEqual(3)
  })

  it('updates the ref when the destination tag changes', () => {
    const Portal = createPortal({ id: 'slot-ref-as', slots: ['main'] })
    const ref = createRef<HTMLDivElement>()
    const view = render(<Portal.Slot slotKey="main" ref={ref} />)
    expect(ref.current?.tagName).toBe('DIV')
    view.rerender(<Portal.Slot slotKey="main" as="aside" ref={ref} />)
    expect(ref.current?.tagName).toBe('ASIDE')
  })

  it('types the ref by the destination tag', () => {
    const Portal = createPortal({ id: 'slot-ref-types', slots: ['main'] })
    type Props = Parameters<typeof Portal.Slot<'section'>>[0]
    expectTypeOf<Props['ref']>().toEqualTypeOf<
      import('react').Ref<HTMLElement> | undefined
    >()
    expect(Portal.id).toBe('slot-ref-types')
  })
})

describe('usePortal result', () => {
  it('keeps the same object until the portal state changes', () => {
    const Portal = createPortal({ id: 'memo-result', slots: ['main'] })
    const { result, rerender } = renderHook(() => Portal.usePortal())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    act(() => result.current.setSlotKey('main'))
    expect(result.current).not.toBe(first)
    expect(result.current.setSlotKey).toBe(first.setSlotKey)
  })
})

describe('mountWhen="connected" observation', () => {
  it('does not observe the document while no destination is selected', () => {
    const created = countObservers()
    const Portal = createPortal({ id: 'observe-none', slots: ['main'] })
    render(<Portal.Host mountWhen="connected">content</Portal.Host>)
    expect(created.count).toBe(0)
  })

  it('observes a destination in a detached tree until it connects', async () => {
    const created = countObservers()
    const Portal = createPortal({ id: 'observe-detached', slots: ['main'] })
    const { result } = renderHook(() => Portal.usePortal())
    render(
      <Portal.Host mountWhen="connected">
        <span data-testid="content">content</span>
      </Portal.Host>,
    )
    const detached = document.createElement('div')
    act(() => {
      result.current.registerTarget('main', detached)
      result.current.setSlotKey('main')
    })
    expect(created.count).toBe(1)
    expect(screen.queryByTestId('content')).toBeNull()
    // MutationObserver callbacks run as microtasks.
    await act(async () => {
      document.body.append(detached)
    })
    expect(detached).toContainElement(screen.getByTestId('content'))
    detached.remove()
  })
})
