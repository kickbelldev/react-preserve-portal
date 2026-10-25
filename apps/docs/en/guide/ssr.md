---
title: SSR & hydration
description: Understand server HTML, client boundaries, and when portal content mounts.
---

# SSR & hydration

`Host` returns `null` on the server and on the first hydration render. After hydration, it creates a DOM container and mounts its content on the client. `Slot` renders its ordinary HTML element on the server too.

## Client boundaries

In React Server Component frameworks, put the factory and code using the portal behind a `'use client'` boundary.

```tsx [ClientPanel.tsx]
'use client'

import { useEffect } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Panel = createPortal({ id: 'persistent-panel', slots: ['main'] })

export function ClientPanel() {
  const { setSlotKey } = Panel.usePortal()
  useEffect(() => setSlotKey('main'), [setSlotKey])
  return (
    <>
      <Panel.Host>
        <input aria-label="Note" />
      </Panel.Host>
      <Panel.Slot slotKey="main" style={{ minHeight: 120 }} />
    </>
  )
}
```

Keep essential text that must be readable by search engines or without JavaScript outside Host. Reserve space on the Slot to reduce layout shifts when client content appears.

## Server state isolation

The hook's server snapshot is the empty initial state. Server rendering therefore does not read mutable client store state. Do not use the ID store for request-specific data. Pass user and request data through your framework's normal props and data-loading paths.

Even though Host does not render its children on the server, module imports may still execute. If a browser-only editor accesses `window` at module scope, you may also need your framework's client-only dynamic import mechanism.
