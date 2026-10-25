---
description: 설치부터 Host와 Slot 구성까지, 하나의 실행 가능한 예제로 시작합니다.
---

# 빠르게 시작하기

## 설치

::: code-group

```sh [npm]
npm install @charley-kim/react-preserve-portal
```

```sh [pnpm]
pnpm add @charley-kim/react-preserve-portal
```

```sh [yarn]
yarn add @charley-kim/react-preserve-portal
```

:::

React와 React DOM 18 이상이 필요합니다. 이 문서는 **0.4.0 API**를 기준으로 합니다.

## 포털 정의와 사용

팩토리는 **컴포넌트 바깥에서 한 번만** 호출합니다. 슬롯 문자열은 `as const` 없이 자동 추론됩니다.

```tsx
import { useEffect, useState } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Panel = createPortal({ id: 'editor', slots: ['main', 'mini'] })

function Editor() {
  const [count, setCount] = useState(0)
  return (
    <section>
      <input defaultValue="이동해도 유지되는 메모" aria-label="메모" />
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </section>
  )
}

export default function App() {
  const { slotKey, setSlotKey } = Panel.usePortal()
  useEffect(() => setSlotKey('main'), [setSlotKey])

  return (
    <>
      <Panel.Host>
        <Editor />
      </Panel.Host>
      <main>
        <Panel.Slot slotKey="main" />
      </main>
      <aside>
        <Panel.Slot slotKey="mini" />
      </aside>
      <button onClick={() => setSlotKey(slotKey === 'main' ? 'mini' : 'main')}>
        이동
      </button>
      <button onClick={() => setSlotKey(null)}>숨기기</button>
    </>
  )
}
```

처음 `slotKey`는 `null`입니다. `Host`는 콘텐츠를 분리된 컨테이너에 마운트하고, 등록된 슬롯을 선택하면 컨테이너를 화면에 붙입니다. 슬롯이 아직 없어도 먼저 선택할 수 있습니다. 슬롯이 나타나면 자동으로 연결됩니다.

## 지켜야 할 두 가지

1. 상태가 살아 있어야 하는 동안 `Host`를 마운트한 채 유지하세요. 라우팅 시 공통 레이아웃에 두는 것이 일반적입니다.
2. 서로 다른 포털은 서로 다른 `id`를 사용하세요. 동일한 ID는 같은 라이브러리 인스턴스에서 상태를 공유합니다.

[인터랙티브 예제](../playground)에서 확인하거나 [API 레퍼런스](../api)를 이어서 읽어보세요.
