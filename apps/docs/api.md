---
title: API 레퍼런스
description: createPortal, Host, Slot, usePortal의 타입, 기본값과 동작을 설명합니다.
---

# API 레퍼런스

이 레퍼런스는 npm **0.3.0** 기준입니다. main의 새 API와 강화된 소유권 검사는 [미출시 수명 개선](./guide/lifecycle-safety)을 참고하세요.

## `createPortal({ id, slots })`

```tsx
import { createPortal } from '@charley-kim/react-preserve-portal'

export const Player = createPortal({ id: 'player', slots: ['main', 'mini'] })
// 반환값: { id, slots, Host, Slot, usePortal }
// Player.Slot의 slotKey: 'main' | 'mini'
```

| 옵션    | 타입                | 의미                                                                                       |
| ------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `id`    | `string`            | 같은 라이브러리 인스턴스 안에서 상태를 공유하는 키. 독립적인 포털마다 고유하게 지정합니다. |
| `slots` | `readonly string[]` | 허용할 슬롯 키. 리터럴은 TypeScript 5+에서 자동 추론합니다.                                |

컴포넌트 렌더 중에 호출하면 Host와 Slot의 컴포넌트 타입이 매번 달라져 재마운트됩니다. 모듈 수준에서 정의하세요. 슬롯 목록은 타입 검사에 사용되며 JavaScript 런타임 검증기는 아닙니다. TypeScript 밖에서 전달하는 값은 애플리케이션에서 검증하세요.

## `Host`

```tsx
<Player.Host><VideoPlayer /></Player.Host>
// 이전 API도 지원
<Player.Host node={<VideoPlayer />} />
```

| Prop       | 타입 / 기본값       | 의미                                                                |
| ---------- | ------------------- | ------------------------------------------------------------------- |
| `children` | `ReactNode`         | 보존할 콘텐츠. `node`와 둘 중 하나만 전달합니다.                    |
| `node`     | `ReactNode`         | 이전 API와의 호환을 위한 콘텐츠 prop.                               |
| `as`       | HTML 태그 / `'div'` | 컨테이너 태그. 최초 생성 시 결정되므로 마운트 중 변경하지 않습니다. |

Host는 일반 HTML 속성이나 ref를 전달하는 래퍼가 아닙니다. 스타일·이벤트·ARIA 속성은 콘텐츠나 Slot에 적용하세요. 서버에서는 `null`을 렌더링합니다.

## `Slot`

```tsx
<Player.Slot
  slotKey="main"
  as="section"
  className="player-area"
  aria-label="플레이어"
/>
```

| Prop      | 타입 / 기본값                | 의미                                                |
| --------- | ---------------------------- | --------------------------------------------------- |
| `slotKey` | 선언한 슬롯 키               | 이 목적지의 키.                                     |
| `as`      | HTML 태그 / `'div'`          | 목적지 태그. 자식을 담을 수 있는 요소를 사용하세요. |
| HTML 속성 | 해당 태그의 `HTMLAttributes` | `className`, `id`, 이벤트, ARIA, data 속성 등.      |

Slot은 마운트 시 등록되고 언마운트 시 해제됩니다. 콘텐츠는 Host가 렌더링합니다. Slot 안에 React 자식을 추가하는 대신, 별도 형제 요소로 빈 상태나 설명을 배치하는 편이 안전합니다.

같은 키의 Slot이 겹치면 **마지막 등록이 우선**합니다. 오래된 Slot의 정리는 새 Slot을 해제하지 않습니다. 새 Slot을 제거해도 이전 등록을 자동 복원하지는 않습니다.

## `usePortal()`

```tsx
const {
  slotKey,
  setSlotKey,
  returnPath,
  setReturnPath,
  targets,
  registerTarget,
  unregisterTarget,
  reset,
} = Player.usePortal()
```

| 멤버                           | 타입                        | 동작                                                                         |
| ------------------------------ | --------------------------- | ---------------------------------------------------------------------------- |
| `slotKey`                      | 슬롯 키 또는 `null`         | 현재 선택. 초기값 `null`.                                                    |
| `setSlotKey(key)`              | `(key) => void`             | 목적지를 선택합니다. `null`은 숨기기.                                        |
| `returnPath`                   | `string \| null`            | 라우터를 위한 선택적 메타데이터. 초기값 `null`.                              |
| `setReturnPath(path)`          | `(string \| null) => void`  | 메타데이터만 변경하며 URL은 바꾸지 않습니다.                                 |
| `targets`                      | `Map<SlotKey, HTMLElement>` | 등록된 목적지 스냅샷. 직접 수정하지 마세요.                                  |
| `registerTarget(key, element)` | `() => void` 반환           | 수동 목적지를 등록하고 안전한 정리 함수를 반환합니다.                        |
| `unregisterTarget(key)`        | `(key) => void`             | 해당 키의 현재 등록을 해제합니다.                                            |
| `reset()`                      | `() => void`                | 숨기고 `returnPath`를 비웁니다. 목적지 등록과 콘텐츠 내부 상태는 유지합니다. |

액션 함수 참조는 ID별로 안정적입니다. 다른 ID의 변경은 이 포털의 구독자에게 알리지 않습니다. 이 훅은 선택한 ID의 전체 스냅샷을 구독합니다.

### 외부 DOM 목적지 등록

```tsx
import { useEffect } from 'react'

function ExternalTarget({ element }: { element: HTMLElement | null }) {
  const { registerTarget } = Player.usePortal()
  useEffect(() => {
    if (!element) return
    return registerTarget('mini', element)
  }, [element, registerTarget])
  return null
}
```

반환된 정리 함수는 등록한 요소가 아직 현재 소유자일 때만 해제합니다. 뒤에 등록된 대체 요소를 실수로 지우지 않도록 수동 `unregisterTarget`보다 이 방식을 권장합니다. 포털 자신의 자손을 목적지로 등록하지 마세요. DOM 순환 구조가 되어 브라우저가 이동을 거부합니다.

## 공개 타입

`CreatePortalOptions`, `HostProps`, `SlotProps`, `UsePortalReturn`, `TypedPortal`을 패키지 루트에서 `import type`으로 가져올 수 있습니다. 내부 저장소·컴포넌트 경로는 공개 API가 아닙니다.
