import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import React, { act, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import * as esm from '@charley-kim/react-preserve-portal'

const require = createRequire(import.meta.url)
const cjs = require('@charley-kim/react-preserve-portal')
const h = React.createElement
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

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.HTMLElement = dom.window.HTMLElement
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
  function Counter() {
    const [count, setCount] = useState(0)
    return h('button', { onClick: () => setCount(count + 1) }, count)
  }
  function App() {
    actions = Portal.usePortal()
    return h(
      React.Fragment,
      null,
      h(Portal.Host, null, h(Counter)),
      h(Portal.Slot, { slotKey: 'main', id: 'main' }),
      h(Portal.Slot, { slotKey: 'mini', id: 'mini' }),
    )
  }
  const root = createRoot(document.getElementById('root'))
  await act(() => root.render(h(React.StrictMode, null, h(App))))
  await act(() => actions.setSlotKey('main'))
  const button = document.querySelector('button')
  assert(button)
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
  console.log(
    `PASS: ${format} SSR, StrictMode, DOM identity, React state, reset and unmount`,
  )
}
dom.window.close()
