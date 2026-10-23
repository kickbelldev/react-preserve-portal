// @vitest-environment node
import { renderToString } from 'react-dom/server'
import { expect, it } from 'vitest'

import { setSlotKey } from '../model/store'
import { createPortal } from './createPortal'

it('renders without a DOM and isolates the server snapshot from mutable portal state', () => {
  const Portal = createPortal({ id: 'server-only', slots: ['main'] })
  setSlotKey('server-only', 'main')
  function App() {
    const { slotKey } = Portal.usePortal()
    return (
      <>
        <span>{slotKey ?? 'hidden'}</span>
        <Portal.Host>client only</Portal.Host>
        <Portal.Slot slotKey="main" />
      </>
    )
  }
  expect(typeof document).toBe('undefined')
  expect(renderToString(<App />)).toBe('<span>hidden</span><div></div>')
})
