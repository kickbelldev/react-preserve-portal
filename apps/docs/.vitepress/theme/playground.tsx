import { StrictMode, useEffect, useId, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Demo = createPortal({
  id: 'documentation-playground',
  slots: ['main', 'mini'],
})

function Editor({ ko }: { ko: boolean }) {
  const [count, setCount] = useState(0)
  const id = useId()
  return (
    <div className="demo-editor" data-testid="preserved-editor">
      <div className="demo-card-top">
        <span className="demo-dot" />
        {ko ? '하나의 React 인스턴스' : 'One React instance'}
        <code>01</code>
      </div>
      <label htmlFor={id}>
        {ko ? '이 메모는 이동해도 그대로' : 'A note that moves with you'}
      </label>
      <input
        id={id}
        data-testid="preserved-input"
        defaultValue={
          ko ? '여기에 입력하고 이동해 보세요' : 'Type something, then move me'
        }
      />
      <div className="demo-card-bottom">
        <span>{ko ? 'React 상태' : 'React state'}</span>
        <button
          data-testid="increment"
          onClick={() => setCount(count + 1)}
          aria-label={
            ko ? `카운터 증가: ${count}` : `Increment counter: ${count}`
          }
        >
          + <strong>{count}</strong>
        </button>
      </div>
    </div>
  )
}

function Playground({ ko }: { ko: boolean }) {
  const { slotKey, setSlotKey, reset } = Demo.usePortal()
  const [animate, setAnimate] = useState(false)
  const nativeMove =
    'moveBefore' in Element.prototype &&
    typeof Element.prototype.moveBefore === 'function'
  const transitions = typeof document.startViewTransition === 'function'
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  useEffect(() => {
    setSlotKey('main')
    return reset
  }, [setSlotKey, reset])

  function move(key: 'main' | 'mini' | null) {
    if (animate && transitions && !reducedMotion) {
      // Commit React's update inside the browser's snapshot callback.
      const transition = document.startViewTransition(() =>
        flushSync(() => setSlotKey(key)),
      )
      void transition.ready.catch(() => {})
    } else {
      setSlotKey(key)
    }
  }

  return (
    <section
      aria-label={ko ? '포털 상태 보존 예제' : 'Portal preservation example'}
    >
      <div className="demo-toolbar">
        <span className="demo-eyebrow">LIVE PLAYGROUND</span>
        <span className="demo-capability">
          {nativeMove ? 'moveBefore' : 'appendChild'} ·{' '}
          {ko ? '이 브라우저' : 'this browser'}
        </span>
      </div>
      <Demo.Host>
        <Editor ko={ko} />
      </Demo.Host>
      <div className="demo-destinations">
        <div className="demo-destination" data-active={slotKey === 'main'}>
          <div className="demo-slot-label">
            <span>01 / MAIN</span>
            <span>{ko ? '메인 화면' : 'Main view'}</span>
          </div>
          <Demo.Slot
            slotKey="main"
            className="demo-slot"
            data-testid="main-slot"
          />
        </div>
        <div className="demo-destination" data-active={slotKey === 'mini'}>
          <div className="demo-slot-label">
            <span>02 / MINI</span>
            <span>{ko ? '작은 화면' : 'Compact view'}</span>
          </div>
          <Demo.Slot
            slotKey="mini"
            className="demo-slot"
            data-testid="mini-slot"
          />
        </div>
      </div>
      <div className="demo-controls">
        <button
          data-testid="to-main"
          aria-pressed={slotKey === 'main'}
          onClick={() => move('main')}
        >
          {ko ? '메인으로' : 'Move to main'}
        </button>
        <button
          data-testid="to-mini"
          aria-pressed={slotKey === 'mini'}
          onClick={() => move('mini')}
        >
          {ko ? '미니로' : 'Move to mini'}
        </button>
        <button
          data-testid="hide"
          aria-pressed={slotKey === null}
          onClick={() => move(null)}
        >
          {ko ? '숨기기' : 'Hide'}
        </button>
        <button data-testid="reset" onClick={reset}>
          reset()
        </button>
      </div>
      <div className="demo-status">
        <span role="status" aria-live="polite">
          slotKey: <code>{slotKey === null ? 'null' : `'${slotKey}'`}</code>
        </span>
        <label>
          <input
            type="checkbox"
            checked={animate}
            disabled={!transitions || reducedMotion}
            onChange={(event) => setAnimate(event.target.checked)}
          />{' '}
          View Transition
        </label>
      </div>
      <p className="demo-hint">
        {ko
          ? '입력값과 카운터를 바꾼 뒤 이동해 보세요. reset()은 콘텐츠를 숨길 뿐, 내부 상태를 초기화하지 않습니다.'
          : 'Edit the note and counter, then move them. reset() hides the content; it does not reset its internal state.'}
      </p>
    </section>
  )
}

export function mountPlayground(element: HTMLElement, ko: boolean) {
  const root = createRoot(element)
  root.render(
    <StrictMode>
      <Playground ko={ko} />
    </StrictMode>,
  )
  return () => root.unmount()
}
