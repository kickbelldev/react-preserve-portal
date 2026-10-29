import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Panel = createPortal({
  id: 'browser-regression',
  slots: ['main', 'mini'],
})
const state = { measurements: [], effects: 0, cleanup: 0, moves: [] }
const Activity = React.Activity
let controls, setHidden, setPresent, setAnimation
let blocked = false
const pending = new Promise(() => {})
const root = createRoot(document.getElementById('root'))

function Content() {
  const input = useRef(null)
  const [count, setCount] = useState(0)
  useLayoutEffect(() => {
    state.measurements.push({
      connected: input.current.isConnected,
      width: input.current.getBoundingClientRect().width,
    })
  }, [])
  useEffect(() => {
    state.effects++
    return () => {
      state.cleanup++
    }
  }, [])
  return (
    <div id="content">
      <input
        id="note"
        autoFocus
        ref={input}
        defaultValue="persistent"
        style={{ width: 200 }}
      />
      <button id="counter" onClick={() => setCount((n) => n + 1)}>
        {count}
      </button>
      <iframe id="frame" srcDoc="<p>Frame ready</p>" />
    </div>
  )
}
function Blocker() {
  if (blocked) throw pending
  return null
}
function App({ mode, animated = false }) {
  controls = Panel.usePortal()
  const [animation, changeAnimation] = useState(
    animated ? { duration: 60_000 } : false,
  )
  setAnimation = changeAnimation
  const [hidden, hide] = useState(false)
  const [present, show] = useState(true)
  setHidden = (value) => {
    blocked = value
    hide(value)
  }
  setPresent = show
  useEffect(() => {
    controls.setSlotKey('main')
  }, [])
  const host = (
    <Panel.Host mountWhen="connected" animate={animation}>
      <Content />
    </Panel.Host>
  )
  return (
    <>
      <Panel.Slot slotKey="main" id="main" style={{ width: 400 }} />
      <Panel.Slot
        slotKey="mini"
        id="mini"
        style={{ width: 200, marginLeft: 450 }}
      />
      {present &&
        (mode === 'activity' ? (
          <Activity mode={hidden ? 'hidden' : 'visible'}>{host}</Activity>
        ) : (
          <Suspense fallback={<p id="loading">Loading</p>}>
            <Blocker />
            {host}
          </Suspense>
        ))}
    </>
  )
}
const nativeMove = Element.prototype.moveBefore
if (nativeMove) {
  Element.prototype.moveBefore = function (node, reference) {
    if (node.querySelector?.('#note')) state.moves.push('moveBefore')
    return nativeMove.call(this, node, reference)
  }
}

window.portalFixture = {
  reactVersion: React.version,
  supportsActivity: !!Activity,
  nativeMove: !!nativeMove,
  mount: (mode = 'suspense') =>
    flushSync(() => root.render(<App mode={mode} />)),
  mountAnimated: (mode = 'suspense') =>
    flushSync(() => root.render(<App mode={mode} animated />)),
  setAnimation: (value) => flushSync(() => setAnimation(value)),
  move: (key) => flushSync(() => controls.setSlotKey(key)),
  hide: (value) => flushSync(() => setHidden(value)),
  remove: () => flushSync(() => setPresent(false)),
  unmount: () => flushSync(() => root.unmount()),
  dispose: Panel.dispose,
  state: () => ({ ...state }),
}
