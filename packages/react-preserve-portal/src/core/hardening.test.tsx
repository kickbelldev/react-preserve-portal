import { StrictMode, useState } from 'react'
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPortal } from './createPortal'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('same-key slot registrations', () => {
  it('falls back to the previous Slot when the newest one unmounts', () => {
    const Portal = createPortal({ id: 'stack-slots', slots: ['main'] })
    function Counter() {
      const [count, setCount] = useState(0)
      return <button onClick={() => setCount(count + 1)}>{count}</button>
    }
    function App({ showNewer }: { showNewer: boolean }) {
      return (
        <>
          <Portal.Host>
            <Counter />
          </Portal.Host>
          <Portal.Slot slotKey="main" data-testid="older" />
          {showNewer && <Portal.Slot slotKey="main" data-testid="newer" />}
        </>
      )
    }
    const view = render(<App showNewer />)
    const { result } = renderHook(() => Portal.usePortal())
    act(() => result.current.setSlotKey('main'))
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(screen.getByTestId('newer')).toContainElement(button)

    // An exit transition keeps the older Slot mounted while the newer one leaves.
    view.rerender(<App showNewer={false} />)
    expect(screen.getByTestId('older')).toContainElement(button)
    expect(screen.getByRole('button')).toBe(button)
    expect(button).toHaveTextContent('1')
  })

  it('keeps the newest registration when an older or middle one is removed', () => {
    const Portal = createPortal({ id: 'stack-manual', slots: ['main'] })
    const { result } = renderHook(() => Portal.usePortal())
    const [first, second, third] = [1, 2, 3].map(() =>
      document.createElement('div'),
    )
    let cleanups: (() => void)[] = []
    act(() => {
      cleanups = [first, second, third].map((target) =>
        result.current.registerTarget('main', target),
      )
    })
    expect(result.current.targets.get('main')).toBe(third)

    act(() => cleanups[1]())
    expect(result.current.targets.get('main')).toBe(third)
    act(() => cleanups[2]())
    expect(result.current.targets.get('main')).toBe(first)
    // A repeated cleanup is ignored.
    act(() => cleanups[2]())
    expect(result.current.targets.get('main')).toBe(first)
    act(() => cleanups[0]())
    expect(result.current.targets.has('main')).toBe(false)
  })

  it('removes every registration for a key with unregisterTarget(key)', () => {
    const Portal = createPortal({ id: 'stack-clear', slots: ['main'] })
    const { result } = renderHook(() => Portal.usePortal())
    act(() => {
      result.current.registerTarget('main', document.createElement('div'))
      result.current.registerTarget('main', document.createElement('div'))
    })
    act(() => result.current.unregisterTarget('main'))
    expect(result.current.targets.has('main')).toBe(false)
  })
})

describe('moveBefore fallback', () => {
  it('reinserts the container with appendChild when moveBefore throws', () => {
    const Portal = createPortal({ id: 'move-fallback', slots: ['a', 'b'] })
    render(
      <>
        <Portal.Host>
          <input data-testid="field" />
        </Portal.Host>
        <Portal.Slot slotKey="a" data-testid="a" />
        <Portal.Slot slotKey="b" data-testid="b" />
      </>,
    )
    const { result } = renderHook(() => Portal.usePortal())
    act(() => result.current.setSlotKey('a'))
    const field = screen.getByTestId('field')
    const b = screen.getByTestId('b')
    const moveBefore = vi.fn(() => {
      throw new DOMException('Unsupported move', 'HierarchyRequestError')
    })
    Object.defineProperty(b, 'moveBefore', { value: moveBefore })

    act(() => result.current.setSlotKey('b'))
    expect(moveBefore).toHaveBeenCalledTimes(1)
    expect(b).toContainElement(field)
    expect(screen.getByTestId('field')).toBe(field)
  })
})

describe('development warnings', () => {
  it('warns when two Hosts are mounted for the same portal', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Portal = createPortal({ id: 'warn-hosts', slots: ['main'] })
    render(
      <>
        <Portal.Host>first</Portal.Host>
        <Portal.Host>second</Portal.Host>
      </>,
    )
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('2 Hosts are mounted for portal "warn-hosts"'),
    )
  })

  it('does not count a StrictMode remount as a second Host', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Portal = createPortal({ id: 'warn-strict', slots: ['main'] })
    render(
      <StrictMode>
        <Portal.Host>only</Portal.Host>
      </StrictMode>,
    )
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns for slot keys the portal does not declare', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Portal = createPortal({ id: 'warn-keys', slots: ['main'] })
    const { result } = renderHook(() => Portal.usePortal())
    const untyped = result.current.setSlotKey as (key: string | null) => void
    act(() => untyped('mian'))
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('setSlotKey used slot "mian"'),
    )
    act(() => {
      ;(result.current.registerTarget as (k: string, t: HTMLElement) => void)(
        'side',
        document.createElement('div'),
      )
    })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('used slot "side", which portal "warn-keys"'),
    )
    warn.mockClear()
    act(() => result.current.setSlotKey('main'))
    act(() => result.current.setSlotKey(null))
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns when one id is created with different slots', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createPortal({ id: 'warn-redeclare', slots: ['main'] })
    createPortal({ id: 'warn-redeclare', slots: ['main'] })
    expect(warn).not.toHaveBeenCalled()
    createPortal({ id: 'warn-redeclare', slots: ['main', 'mini'] })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('called twice for id "warn-redeclare"'),
    )
  })

  it('warns when Host "as" changes after mount', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Portal = createPortal({ id: 'warn-as', slots: ['main'] })
    const view = render(<Portal.Host as="div">content</Portal.Host>)
    expect(warn).not.toHaveBeenCalled()
    view.rerender(<Portal.Host as="section">content</Portal.Host>)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Host "as" changed from "div" to "section"'),
    )
  })
})
