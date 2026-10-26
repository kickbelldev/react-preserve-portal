import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import React, { useLayoutEffect, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import * as esm from '@charley-kim/react-preserve-portal'

// React.act was added in 18.3; older supported versions expose it via test-utils.
const act = React.act ?? (await import('react-dom/test-utils')).act
const require = createRequire(import.meta.url)
const cjs = require('@charley-kim/react-preserve-portal')
const h = React.createElement
const ssrErrors = []
const originalError = console.error
console.error = (...args) => ssrErrors.push(args.map(String).join(' '))
try {
  for (const [format, library] of [
    ['ESM', esm],
    ['CJS', cjs],
  ]) {
    const Server = library.createPortal({
      id: `server-${format}`,
      slots: ['main'],
    })
    assert.equal(
      renderToString(
        h(
          React.Fragment,
          null,
          h(Server.Host, null, 'client only'),
          h(Server.Slot, { slotKey: 'main' }),
        ),
      ),
      '<div></div>',
    )
  }
} finally {
  console.error = originalError
}
assert.deepEqual(ssrErrors, [], 'SSR must not emit React warnings or errors')

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.MutationObserver = dom.window.MutationObserver
globalThis.IS_REACT_ACT_ENVIRONMENT = true
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: dom.window.navigator,
})
const { createRoot } = await import('react-dom/client')

for (const [format, library] of [
  ['ESM', esm],
  ['CJS', cjs],
]) {
  const Portal = library.createPortal({
    id: `consumer-${format}`,
    slots: ['main', 'mini'],
  })
  let actions
  let connectedOnMount = false
  function Counter() {
    const [count, setCount] = useState(0)
    useLayoutEffect(() => {
      connectedOnMount = !!document.querySelector('button')?.isConnected
    }, [])
    return h('button', { onClick: () => setCount(count + 1) }, count)
  }
  function App() {
    actions = Portal.usePortal()
    return h(
      React.Fragment,
      null,
      h(Portal.Host, { mountWhen: 'connected' }, h(Counter)),
      h(Portal.Slot, { slotKey: 'main', id: 'main' }),
      h(Portal.Slot, { slotKey: 'mini', id: 'mini', ref: miniRef }),
    )
  }
  // Slot forwards refs on React 18, where ref is not a regular prop.
  const miniRef = React.createRef()
  const root = createRoot(document.getElementById('root'))
  await act(() => root.render(h(React.StrictMode, null, h(App))))
  assert.equal(Portal.dispose(), false)
  assert.equal(miniRef.current, document.getElementById('mini'))
  assert.equal(document.querySelector('button'), null)
  await act(() => actions.setSlotKey('main'))
  const button = document.querySelector('button')
  assert(button)
  assert.equal(connectedOnMount, true)
  await act(() =>
    button.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })),
  )
  await act(() => actions.setSlotKey('mini'))
  assert.equal(document.querySelector('#mini button'), button)
  assert.equal(button.textContent, '1')
  await act(() => actions.reset())
  assert.equal(button.isConnected, false)
  await act(() => actions.setSlotKey('main'))
  assert.equal(document.querySelector('#main button'), button)
  assert.equal(button.textContent, '1')
  await act(() => root.unmount())
  assert.equal(button.isConnected, false)
  assert.equal(miniRef.current, null)
  assert.equal(Portal.dispose(), true)
  assert.throws(() => actions.setSlotKey('main'), /disposed/)
  console.log(
    `PASS: ${format} SSR, StrictMode, connected mount, Slot ref, DOM identity, React state, reset, unmount and disposal`,
  )
}
dom.window.close()
