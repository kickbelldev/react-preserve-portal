import { StrictMode, useEffect, useState } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'

import { createPortal } from './createPortal'

describe('portal lifecycle', () => {
  it('preserves DOM, React state and effects across moves, hiding and reset in StrictMode', () => {
    const Portal = createPortal({ id: 'preservation', slots: ['main', 'mini'] })
    const mount = vi.fn()
    const unmount = vi.fn()
    function Content() {
      const [count, setCount] = useState(0)
      useEffect(() => {
        mount()
        return unmount
      }, [])
      return <button onClick={() => setCount(count + 1)}>{count}</button>
    }
    const view = render(
      <StrictMode>
        <Portal.Host>
          <Content />
        </Portal.Host>
        <Portal.Slot slotKey="main" data-testid="main" />
        <Portal.Slot slotKey="mini" data-testid="mini" />
      </StrictMode>,
    )
    const { result } = renderHook(() => Portal.usePortal())
    act(() => result.current.setSlotKey('main'))
    const button = screen.getByRole('button')
    fireEvent.click(button)
    const mounts = mount.mock.calls.length
    const unmounts = unmount.mock.calls.length
    act(() => result.current.setSlotKey('mini'))
    expect(screen.getByTestId('mini')).toContainElement(button)
    expect(button).toHaveTextContent('1')
    act(() => result.current.setSlotKey(null))
    expect(button.isConnected).toBe(false)
    act(() => result.current.setSlotKey('main'))
    expect(screen.getByRole('button')).toBe(button)
    act(() => result.current.reset())
    expect(button.isConnected).toBe(false)
    expect(result.current.targets.size).toBe(2)
    act(() => result.current.setSlotKey('mini'))
    expect(screen.getByRole('button')).toBe(button)
    expect(button).toHaveTextContent('1')
    expect(mount).toHaveBeenCalledTimes(mounts)
    expect(unmount).toHaveBeenCalledTimes(unmounts)
    view.unmount()
    expect(button.isConnected).toBe(false)
    expect(unmount).toHaveBeenCalledTimes(unmounts + 1)
  })

  it('reattaches the same content when an active destination mounts later or changes tag', () => {
    const Portal = createPortal({ id: 'late-slot', slots: ['main'] })
    const { result } = renderHook(() => Portal.usePortal())
    act(() => result.current.setSlotKey('main'))
    render(
      <Portal.Host>
        <input defaultValue="preserved" />
      </Portal.Host>,
    )
    expect(screen.queryByRole('textbox')).toBeNull()
    const slot = render(<Portal.Slot slotKey="main" as="section" />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'edited' } })
    slot.rerender(<Portal.Slot slotKey="main" as="article" />)
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input.closest('article')).not.toBeNull()
    slot.unmount()
    expect(input.isConnected).toBe(false)
    render(<Portal.Slot slotKey="main" />)
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).toHaveValue('edited')
  })

  it('does not confuse an empty slot key with a hidden portal', () => {
    const Portal = createPortal({ id: 'empty-key', slots: [''] })
    render(
      <>
        <Portal.Host>empty key</Portal.Host>
        <Portal.Slot slotKey="" />
      </>,
    )
    const { result } = renderHook(() => Portal.usePortal())
    expect(screen.queryByText('empty key')).toBeNull()
    act(() => result.current.setSlotKey(''))
    expect(screen.getByText('empty key')).toBeInTheDocument()
    act(() => result.current.setSlotKey(null))
    expect(screen.queryByText('empty key')).toBeNull()
  })

  it('does not rerender unrelated portals or subscribers after unchanged updates', () => {
    const First = createPortal({ id: 'subscriptions-first', slots: ['main'] })
    const Second = createPortal({ id: 'subscriptions-second', slots: ['main'] })
    const renders = vi.fn()
    const first = renderHook(() => First.usePortal())
    const second = renderHook(() => {
      renders()
      return Second.usePortal()
    })
    const actions = first.result.current
    act(() => first.result.current.setSlotKey('main'))
    expect(renders).toHaveBeenCalledTimes(1)
    expect(first.result.current.setSlotKey).toBe(actions.setSlotKey)
    act(() => second.result.current.setSlotKey(null))
    expect(renders).toHaveBeenCalledTimes(1)
  })

  it('returns a cleanup function that cannot remove a newer manual destination', () => {
    const Portal = createPortal({ id: 'manual-cleanup', slots: ['main'] })
    const { result } = renderHook(() => Portal.usePortal())
    const first = document.createElement('div')
    const second = document.createElement('div')
    let cleanup: () => void
    act(() => {
      cleanup = result.current.registerTarget('main', first)
    })
    act(() => {
      result.current.registerTarget('main', second)
    })
    act(() => cleanup())
    expect(result.current.targets.get('main')).toBe(second)
  })

  it('hydrates server-rendered slots without errors and mounts client content', async () => {
    const Portal = createPortal({ id: 'hydration', slots: ['main'] })
    function App() {
      const { setSlotKey } = Portal.usePortal()
      useEffect(() => setSlotKey('main'), [setSlotKey])
      return (
        <>
          <Portal.Host>
            <input defaultValue="hydrated" />
          </Portal.Host>
          <Portal.Slot slotKey="main" />
        </>
      )
    }
    const container = document.createElement('div')
    container.innerHTML = renderToString(<App />)
    expect(container.querySelector('input')).toBeNull()
    document.body.appendChild(container)
    const recoverableError = vi.fn()
    const root = hydrateRoot(container, <App />, {
      onRecoverableError: recoverableError,
    })
    await act(async () => {})
    expect(container.querySelector('input')?.value).toBe('hydrated')
    expect(recoverableError).not.toHaveBeenCalled()
    act(() => root.unmount())
    container.remove()
  })

  it('infers literal slot types without as const and retains the legacy node API', () => {
    const Portal = createPortal({ id: 'inference', slots: ['main', 'mini'] })
    const { result } = renderHook(() => Portal.usePortal())
    expectTypeOf(result.current.slotKey).toEqualTypeOf<'main' | 'mini' | null>()
    expectTypeOf(Portal.id).toEqualTypeOf<'inference'>()
    // @ts-expect-error Unknown slot keys must fail the type check.
    const invalidSlot = <Portal.Slot slotKey="other" />
    // @ts-expect-error Host cannot receive both content APIs.
    const invalidHost = <Portal.Host node="old">new</Portal.Host>
    void invalidSlot
    void invalidHost
    render(
      <>
        <Portal.Host node={<span>legacy</span>} />
        <Portal.Slot slotKey="main" />
      </>,
    )
    act(() => result.current.setSlotKey('main'))
    expect(screen.getByText('legacy')).toBeInTheDocument()
  })
})
