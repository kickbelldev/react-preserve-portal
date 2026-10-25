---
title: 빠르게 시작하기
description: 패키지를 설치하고, 입력창 하나를 두 위치로 옮기는 완전한 React 예제를 실행합니다.
---

# 빠르게 시작하기

입력창과 카운터 하나를 메인·미니 영역 사이로 옮겨 봅니다. 영상 파일이나 라우터 없이 상태가 유지되는지 확인할 수 있는 예제입니다.

## 1. 설치

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

React와 React DOM 18 이상이 설치된 앱에서 사용하세요. TypeScript를 사용한다면 5 이상이 필요합니다.

## 2. 예제 붙여 넣기

아래 코드를 앱의 `App.tsx`에 넣으세요. `Panel`을 컴포넌트 바깥에 정의해야 Host와 Slot의 컴포넌트 타입이 유지됩니다.

```tsx [App.tsx]
import { useEffect, useState } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Panel = createPortal({ id: 'editor', slots: ['main', 'mini'] })

function Editor() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <input aria-label="메모" defaultValue="메모를 바꾸고 이동해 보세요" />
      <button onClick={() => setCount(count + 1)}>횟수: {count}</button>
    </div>
  )
}

export default function App() {
  const { setSlotKey } = Panel.usePortal()
  useEffect(() => setSlotKey('main'), [setSlotKey])

  return (
    <main>
      <Panel.Host>
        <Editor />
      </Panel.Host>

      <section>
        <h2>메인 영역</h2>
        <Panel.Slot slotKey="main" style={{ minHeight: 80 }} />
      </section>
      <section>
        <h2>미니 영역</h2>
        <Panel.Slot slotKey="mini" style={{ minHeight: 80 }} />
      </section>

      <button onClick={() => setSlotKey('main')}>메인으로</button>
      <button onClick={() => setSlotKey('mini')}>미니로</button>
      <button onClick={() => setSlotKey(null)}>숨기기</button>
    </main>
  )
}
```

## 3. 결과 확인

1. 메인 영역에서 메모를 바꾸고 카운터 버튼을 누르세요.
2. **미니로**를 누르면 입력값과 숫자가 함께 이동합니다.
3. **숨기기**를 누른 뒤 **메인으로**를 누르면 이전 값이 다시 나타납니다.

`Editor`는 Host 안에 하나만 있습니다. Slot은 표시 위치를 등록하며 콘텐츠를 복제하지 않습니다. 제목이나 빈 상태 안내는 Slot 안이 아닌 옆에 렌더링합니다.

## 처음에 슬롯을 선택하는 이유

`slotKey`의 초기값은 `null`이라 화면에 아무것도 표시되지 않습니다. 예제의 Effect가 마운트 후 `main`을 선택합니다. 기본 `mountWhen="immediate"`에서는 콘텐츠가 문서에 연결되기 전에 마운트될 수 있습니다. 최초 크기 측정이나 자동 포커스에 연결된 요소가 필요하면 `mountWhen="connected"`를 사용하세요.

Slot이 마운트되기 전에 선택해도 됩니다. 해당 목적지가 등록되면 콘텐츠가 붙습니다. 상태가 필요한 동안 Host를 계속 마운트하고, 서로 독립적인 포털은 다른 ID로 정의하세요.

다음으로 [비디오 플레이어](./video-player), [라우팅](./routing), 또는 [API 레퍼런스](../api)를 읽어보세요.
