---
title: SSR과 하이드레이션
description: 서버 HTML, 클라이언트 경계와 하이드레이션 시점의 동작을 알아봅니다.
---

# SSR과 하이드레이션

`Host`는 서버와 최초 하이드레이션 렌더에서 `null`을 반환합니다. 하이드레이션 이후 클라이언트에서 DOM 컨테이너를 생성하고 콘텐츠를 마운트합니다. `Slot`은 서버에서도 일반 HTML 요소를 출력합니다.

## 클라이언트 경계

React Server Component 프레임워크에서는 팩토리와 포털을 사용하는 코드를 `'use client'` 경계 뒤에 둡니다.

```tsx
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
        <input aria-label="메모" />
      </Panel.Host>
      <Panel.Slot slotKey="main" style={{ minHeight: 120 }} />
    </>
  )
}
```

서버에서 검색 엔진이나 JavaScript 없이 읽어야 하는 본문은 Host 밖에 두세요. 콘텐츠가 나타날 공간을 Slot에 확보하면 레이아웃 이동을 줄일 수 있습니다.

## 서버 상태 격리

훅의 서버 스냅샷은 빈 초기 상태입니다. 서버 렌더가 변경 가능한 클라이언트 저장소를 읽지 않도록 설계되어 있습니다. 하지만 ID 저장소를 요청별 데이터 저장소로 사용해서는 안 됩니다. 사용자·요청 데이터는 프레임워크의 정상적인 props와 데이터 로딩 경로로 전달하세요.

`Host`가 서버에서 자식을 렌더하지 않더라도 모듈 import 자체는 실행될 수 있습니다. 브라우저 전용 에디터가 모듈 최상위에서 `window`를 읽는다면 프레임워크의 클라이언트 전용 동적 import 기능도 필요할 수 있습니다.
