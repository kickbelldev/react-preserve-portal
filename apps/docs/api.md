---
title: API 레퍼런스
description: createPortal, Host, Slot, usePortal, dispose의 타입과 동작을 찾아봅니다.
---

# API 레퍼런스

팩토리로 포털을 정의하고, Host에 콘텐츠를 넣고, Slot을 선택해 이동합니다. 처음 사용한다면 [빠르게 시작하기](./guide/quick-start)의 전체 예제를 먼저 실행해 보세요. 이 페이지는 각 API의 타입과 정확한 동작을 찾아볼 때 사용합니다.

## `createPortal({ id, slots })`

```tsx
import { createPortal } from '@charley-kim/react-preserve-portal'

export const Player = createPortal({ id: 'player', slots: ['main', 'mini'] })
// 반환값: { id, slots, Host, Slot, usePortal, dispose }
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

| Prop        | 타입 / 기본값                                | 의미                                                                            |
| ----------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `children`  | `ReactNode`                                  | 보존할 콘텐츠. `node`와 둘 중 하나만 전달합니다.                                |
| `node`      | `ReactNode`                                  | 이전 API와의 호환을 위한 콘텐츠 prop.                                           |
| `as`        | HTML 태그 / `'div'`                          | 컨테이너 태그. 최초 생성 시 결정되므로 마운트 중 변경하지 않습니다.             |
| `mountWhen` | `'immediate' \| 'connected'` / `'immediate'` | 즉시 마운트하거나 최초 문서 연결을 기다립니다.                                  |
| `animate`   | `boolean \| { duration, easing }` / `false`  | 슬롯을 옮길 때 이전 위치에서 새 위치로 애니메이션합니다. [아래](#animate) 참고. |

`mountWhen="connected"`를 선택하면 최초 layout effect와 `autoFocus`는 연결 후 실행됩니다. 이후 이동하거나 숨겨도 콘텐츠를 다시 마운트하지 않습니다. 연결됐다는 사실이 가시성이나 0보다 큰 크기를 보장하지는 않습니다.

Host는 일반 HTML 속성이나 ref를 전달하는 래퍼가 아닙니다. 스타일·이벤트·ARIA 속성은 콘텐츠나 Slot에 적용하세요. 서버에서는 `null`을 렌더링합니다.

### 이동 애니메이션 {#animate}

`animate`와 공개 타입 `PortalAnimation`은 0.5.0부터 사용할 수 있습니다.

`animate`를 켜면 `setSlotKey`로 슬롯을 바꿀 때 Host가 컨테이너를 이전 위치에서 새 위치로 애니메이션합니다. 콘텐츠 종류와 관계없이 동작하고, 별도 라이브러리가 필요 없습니다.

```tsx
<Player.Host animate>
  <VideoPlayer />
</Player.Host>

// 시간과 easing을 바꿀 수 있습니다.
<Player.Host animate={{ duration: 300, easing: 'ease-out' }}>…</Player.Host>
```

성능을 위해 다음 원칙으로 동작합니다.

- **transform과 opacity만 바꿉니다.** 브라우저의 Web Animations API로 실행되므로 컴포지터가 처리하고, 애니메이션 중에 레이아웃을 다시 계산하지 않습니다.
- **이동 전후에 위치를 잽니다.** `setSlotKey` 직전에 화면상의 위치를 기록하고, 옮긴 뒤 화면을 그리기 전에 새 위치를 잽니다. 매 프레임 측정하지 않습니다.
- **도중에 끊어도 자연스럽습니다.** 애니메이션 중에 다시 옮기면 지금 화면에 보이는 위치에서 이어서 움직입니다.
- **꺼져 있으면 비용이 없습니다.** `animate`가 없으면 위치를 재지 않습니다.
- **모션 줄이기 설정을 따릅니다.** `prefers-reduced-motion: reduce`이면 애니메이션하지 않습니다.

기본 시간은 450ms이고 easing은 끝에서 살짝 넘어갔다 돌아오는 `cubic-bezier(.2,.9,.3,1.08)`입니다. 숨김(`null`)에서 다시 나타날 때는 설정한 시간의 절반으로 페이드인합니다. 숨겨진 부모 안에 있어 크기가 0인 위치에서는 애니메이션하지 않습니다. 크기가 다른 슬롯 사이에서는 글자와 영상이 찌그러지지 않도록 가로·세로를 같은 비율로 키우거나 줄입니다.

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
| `ref`     | 해당 태그의 `Ref`            | 목적지 요소를 받습니다. 크기 측정 등에 사용합니다.  |
| HTML 속성 | 해당 태그의 `HTMLAttributes` | `className`, `id`, 이벤트, ARIA, data 속성 등.      |

Slot은 마운트 시 등록되고 언마운트 시 해제되며 숨김 경계에서도 ref가 해제될 수 있습니다. 콘텐츠는 Host가 렌더링합니다. `children`과 `dangerouslySetInnerHTML`은 타입과 런타임에서 거부합니다. 빈 상태나 설명은 형제 요소로 배치하고 외부 DOM 코드로 Slot 내용을 덮어쓰지 마세요.

Slot의 `ref`는 React 18과 19 모두에서 목적지 요소를 받습니다. 매 렌더 새로 만드는 인라인 함수 ref를 넘겨도 목적지를 다시 등록하지 않습니다. React가 만들지 않은 요소를 목적지로 쓰려면 아래의 [외부 DOM 등록](#external-targets)을 사용하세요.

같은 키의 Slot이 겹치면 **마지막 등록이 우선**합니다. 오래된 Slot의 정리는 새 Slot을 해제하지 않습니다. 새 Slot이 먼저 제거되면 아직 등록된 이전 Slot으로 콘텐츠가 돌아갑니다. exit 애니메이션처럼 두 Slot이 잠시 겹쳐도 콘텐츠가 사라지지 않습니다.

개발 빌드에서는 한 포털 ID에 Host가 둘 이상 마운트될 때, 선언하지 않은 슬롯 키를 쓸 때(`setSlotKey`, `Slot`, `registerTarget`), 같은 ID를 다른 `slots`로 만들 때, Host의 `as`가 마운트 후 바뀔 때 한 번씩 경고합니다. 프로덕션 빌드에서는 제거됩니다.

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

| 멤버                           | 타입                                | 동작                                                                         |
| ------------------------------ | ----------------------------------- | ---------------------------------------------------------------------------- |
| `slotKey`                      | 슬롯 키 또는 `null`                 | 현재 선택. 초기값 `null`.                                                    |
| `setSlotKey(key)`              | `(key: SlotKey \| null) => void`    | 목적지를 선택합니다. `null`은 숨기기.                                        |
| `returnPath`                   | `string \| null`                    | 라우터를 위한 선택적 메타데이터. 초기값 `null`.                              |
| `setReturnPath(path)`          | `(string \| null) => void`          | 메타데이터만 변경하며 URL은 바꾸지 않습니다.                                 |
| `targets`                      | `ReadonlyMap<SlotKey, HTMLElement>` | 등록된 목적지 스냅샷. 직접 수정하지 마세요.                                  |
| `registerTarget(key, element)` | `() => void` 반환                   | 수동 목적지를 등록하고 안전한 정리 함수를 반환합니다.                        |
| `unregisterTarget(key)`        | `(key: SlotKey) => void`            | 해당 키의 등록을 모두 해제합니다.                                            |
| `reset()`                      | `() => void`                        | 숨기고 `returnPath`를 비웁니다. 목적지 등록과 콘텐츠 내부 상태는 유지합니다. |

`slotKey`는 선택한 이름이며 실제 연결·가시성을 뜻하지 않습니다. 목적지가 아직 없거나 숨겨져 있을 수 있습니다. `setSlotKey(null)`은 선택만 비우고, `reset()`은 `returnPath`도 비웁니다. 둘 다 콘텐츠의 React 상태를 초기화하지 않습니다.

액션 함수 참조는 ID별로 안정적이고, 반환 객체도 상태가 바뀌지 않으면 같은 객체입니다. 그래서 반환값 전체를 Effect 의존성에 넣어도 됩니다. 다른 ID의 변경은 이 포털의 구독자에게 알리지 않습니다. 이 훅은 선택한 ID의 전체 스냅샷을 구독합니다.

콘텐츠가 실제로 목적지에 붙어 있는지는 `slotKey !== null && targets.has(slotKey)`로 알 수 있습니다. 선택만 되고 Slot이 아직 없거나 숨긴 상태면 `false`입니다. 숨겨진 영상을 멈출 때 쓸 수 있습니다.

### 외부 DOM 목적지 등록 {#external-targets}

기존 DOM 요소를 목적지로 써야 할 때 사용합니다. 일반적인 React 화면에서는 `Slot`이 등록과 해제를 대신 처리하므로 이 메서드를 직접 부를 필요가 없습니다. 아래 `Player`는 위에서 정의한 팩토리입니다.

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

같은 요소를 다시 등록해도 각 등록에는 고유한 소유권이 있습니다. 반환된 정리 함수는 자신이 만든 등록만 제거하며, 다른 등록은 유지합니다. 뒤에 등록된 대체 요소를 실수로 지우지 않도록 수동 `unregisterTarget`보다 이 방식을 권장합니다. 목적지는 Host와 같은 문서에 있어야 하며 포털 컨테이너 자신이나 자손일 수 없습니다. 다른 문서로의 adoption과 순환 이동은 DOM을 변경하기 전에 라이브러리가 거부합니다.

## `dispose(): boolean`

기능을 완전히 제거하거나 오래 실행되는 앱에서 동적 포털 ID를 더 이상 쓰지 않을 때 사용합니다. 숨김·이동·일반적인 라우트 변경에는 필요하지 않습니다. 아래 순서는 앱이 React root와 수동 목적지 등록을 직접 관리하는 경우입니다.

```tsx
// 해당 ID의 모든 React 소유자를 언마운트한 뒤:
root.unmount()
cleanupManualTarget()
const released = Player.dispose()
```

Host·Slot·훅 소유자·구독자·수동 목적지가 남아 있으면 `false`를 반환합니다. 숨겨진 소유자도 해제를 막습니다. ID 저장소를 제거했거나 이미 없으면 `true`입니다. `reset()`은 콘텐츠를 숨길 뿐 저장소를 해제하지 않습니다.

소유권이 모두 끝난 뒤 호출하세요. render 중이나 소유자가 마운트·전환되는 중에는 호출하지 마세요. 폐기된 저장소에서 보관한 액션은 오류를 발생시키며, 오래된 등록 cleanup은 안전하게 아무 일도 하지 않습니다. 이후 같은 팩토리를 새로 마운트하면 빈 저장소를 사용합니다.

## 공개 타입

`CreatePortalOptions`, `HostProps`, `PortalAnimation`, `SlotProps`, `UsePortalReturn`, `TypedPortal`을 패키지 루트에서 `import type`으로 가져올 수 있습니다. 내부 저장소·컴포넌트 경로는 공개 API가 아닙니다.
