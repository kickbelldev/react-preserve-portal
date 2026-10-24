import {
  Activity,
  StrictMode,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  act,
  render,
  renderHook,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createPortal } from './createPortal'
import { disposePortal, getPortalStore } from '../model/store'

describe('portal ownership and lifetime boundaries', () => {
  it('rejects Slot children and HTML at the type and runtime boundaries', () => {
    const P = createPortal({ id: 'empty-slot-contract', slots: ['main'] })
    // @ts-expect-error Slot is an empty destination.
    const children = <P.Slot slotKey="main">placeholder</P.Slot>
    // @ts-expect-error React must not overwrite the portal container.
    const html = (
      <P.Slot
        slotKey="main"
        dangerouslySetInnerHTML={{ __html: 'placeholder' }}
      />
    )
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() => render(children)).toThrow('Slot must be empty')
      expect(() => render(html)).toThrow('Slot must be empty')
    } finally {
      error.mockRestore()
    }
    expect(P.dispose()).toBe(true)
  })

  it('gives every manual registration ownership even for the same element', () => {
    const store = getPortalStore('same-element-ownership')
    const target = document.createElement('div')
    const first = store.registerTarget('main', target)
    const snapshot = store.getSnapshot()
    const second = store.registerTarget('main', target)
    // Re-registering does not cause a pointless React render.
    expect(store.getSnapshot()).toBe(snapshot)
    first()
    expect(store.getSnapshot().targets.get('main')).toBe(target)
    second()
    expect(store.getSnapshot().targets.size).toBe(0)
    expect(disposePortal('same-element-ownership')).toBe(true)
  })

  it('mounts connected content once, measures connected DOM and preserves it after hiding', () => {
    const P = createPortal({ id: 'connected-mount', slots: ['main', 'mini'] })
    const measured = vi.fn()
    function Content() {
      const ref = useRef<HTMLInputElement>(null)
      useLayoutEffect(() => {
        measured(ref.current?.isConnected)
      }, [])
      return <input ref={ref} autoFocus defaultValue="keep me" />
    }
    const controls = renderHook(() => P.usePortal())
    const view = render(
      <>
        <P.Host mountWhen="connected">
          <Content />
        </P.Host>
        <P.Slot slotKey="main" />
        <P.Slot slotKey="mini" />
      </>,
    )
    expect(measured).not.toHaveBeenCalled()
    act(() => controls.result.current.setSlotKey('main'))
    const input = screen.getByRole('textbox')
    expect(measured).toHaveBeenCalledExactlyOnceWith(true)
    expect(document.activeElement).toBe(input)
    fireEvent.change(input, { target: { value: 'edited' } })
    act(() => controls.result.current.setSlotKey(null))
    act(() => controls.result.current.setSlotKey('mini'))
    expect(screen.getByRole('textbox')).toBe(input)
    expect(input).toHaveValue('edited')
    expect(measured).toHaveBeenCalledTimes(1)
    view.unmount()
    controls.unmount()
    expect(P.dispose()).toBe(true)
  })

  it('detects the first connection of a manually registered detached destination', async () => {
    const P = createPortal({ id: 'late-manual-connection', slots: ['main'] })
    const store = getPortalStore(P.id)
    const target = document.createElement('div')
    const cleanup = store.registerTarget('main', target)
    store.setSlotKey('main')
    const mounted = vi.fn()
    function Content() {
      useLayoutEffect(() => {
        mounted()
      }, [])
      return <input />
    }
    const view = render(
      <P.Host mountWhen="connected">
        <Content />
      </P.Host>,
    )
    expect(mounted).not.toHaveBeenCalled()
    await act(async () => {
      document.body.appendChild(target)
    })
    await waitFor(() => expect(mounted).toHaveBeenCalledTimes(1))
    view.unmount()
    cleanup()
    target.remove()
    expect(P.dispose()).toBe(true)
  })

  it.each(['activity', 'suspense'] as const)(
    'keeps a hidden %s Host connected and releases it on final deletion',
    async (boundary) => {
      const P = createPortal({ id: `hidden-host-${boundary}`, slots: ['main'] })
      const controls = renderHook(() => P.usePortal())
      const pending = new Promise<void>(() => {})
      function Blocker({ hide }: { hide: boolean }) {
        if (hide) throw pending
        return null
      }
      function Content() {
        const [count, setCount] = useState(0)
        return <button onClick={() => setCount(count + 1)}>{count}</button>
      }
      function App({
        hide,
        remove = false,
      }: {
        hide: boolean
        remove?: boolean
      }) {
        const host = (
          <P.Host>
            <Content />
          </P.Host>
        )
        return (
          <>
            <P.Slot slotKey="main" data-testid="destination" />
            {!remove &&
              (boundary === 'activity' ? (
                <Activity mode={hide ? 'hidden' : 'visible'}>{host}</Activity>
              ) : (
                <Suspense fallback={<p>loading</p>}>
                  <Blocker hide={hide} />
                  {host}
                </Suspense>
              ))}
          </>
        )
      }
      const view = render(
        <StrictMode>
          <App hide={false} />
        </StrictMode>,
      )
      act(() => controls.result.current.setSlotKey('main'))
      const button = screen.getByRole('button')
      fireEvent.click(button)
      view.rerender(
        <StrictMode>
          <App hide />
        </StrictMode>,
      )
      expect(button.isConnected).toBe(true)
      expect(button).not.toBeVisible()
      view.rerender(
        <StrictMode>
          <App hide={false} />
        </StrictMode>,
      )
      expect(screen.getByRole('button')).toBe(button)
      expect(button).toHaveTextContent('1')
      view.rerender(
        <StrictMode>
          <App hide />
        </StrictMode>,
      )
      view.rerender(
        <StrictMode>
          <App hide remove />
        </StrictMode>,
      )
      expect(screen.getByTestId('destination').childNodes.length).toBe(0)
      view.unmount()
      controls.unmount()
      expect(P.dispose()).toBe(true)
    },
  )

  it('refuses disposal while hidden components still own the store', () => {
    const P = createPortal({ id: 'hidden-dispose', slots: ['main'] })
    function Owner() {
      P.usePortal()
      return null
    }
    const view = render(
      <Activity mode="visible">
        <Owner />
      </Activity>,
    )
    expect(P.dispose()).toBe(false)
    view.rerender(
      <Activity mode="hidden">
        <Owner />
      </Activity>,
    )
    expect(P.dispose()).toBe(false)
    view.unmount()
    expect(P.dispose()).toBe(true)
  })

  it('blocks disposal with registrations, retires stale actions and permits fresh reuse', () => {
    const P = createPortal({ id: 'dispose-reuse', slots: ['main'] })
    const old = getPortalStore(P.id)
    const cleanup = old.registerTarget('main', document.createElement('div'))
    expect(P.dispose()).toBe(false)
    cleanup()
    const unsubscribe = old.subscribe(() => {})
    expect(P.dispose()).toBe(false)
    unsubscribe()
    expect(P.dispose()).toBe(true)
    expect(P.dispose()).toBe(true)
    expect(() => old.setSlotKey('main')).toThrow('disposed')
    expect(() =>
      old.registerTarget('main', document.createElement('div')),
    ).toThrow('disposed')
    expect(() => cleanup()).not.toThrow()
    const fresh = getPortalStore(P.id)
    expect(fresh).not.toBe(old)
    expect(fresh.getSnapshot().slotKey).toBeNull()
    expect(P.dispose()).toBe(true)
  })

  it('rejects document adoption before moving portal content', () => {
    const P = createPortal({ id: 'foreign-document-guard', slots: ['main'] })
    const store = getPortalStore(P.id)
    const target = document.implementation.createHTMLDocument().body
    const cleanup = store.registerTarget('main', target)
    store.setSlotKey('main')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() =>
        render(
          <P.Host>
            <input />
          </P.Host>,
        ),
      ).toThrow('same document')
      expect(target.childNodes.length).toBe(0)
    } finally {
      error.mockRestore()
      cleanup()
    }
    expect(P.dispose()).toBe(true)
  })
})
