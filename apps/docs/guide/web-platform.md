---
title: 브라우저 API와 대안
description: 필요한 동작에 맞춰 CSS, React 포털, moveBefore, View Transition과 Activity를 선택합니다.
---

# 브라우저 API와 대안

먼저 실제 DOM 위치를 바꿔야 하는지 확인하세요. 화면 배치만 바꾸는 경우와 살아 있는 컴포넌트를 다른 부모 요소로 옮기는 경우는 필요한 도구가 다릅니다.

## 필요한 동작으로 선택하기

| 필요한 동작                                       | 먼저 검토할 방법                                        |
| ------------------------------------------------- | ------------------------------------------------------- |
| 반응형 레이아웃에서 위치나 순서만 바꾸기          | CSS Grid / Flex. DOM을 옮기지 않아도 되는지 확인하세요. |
| 메뉴나 팝오버를 다른 요소 위에 띄우기             | 네이티브 Popover API와 CSS 위치 지정                    |
| 모달을 열고 포커스 관리하기                       | `<dialog>`와 `showModal()`                              |
| 같은 위치의 탭을 숨겼다가 다시 표시하기           | React 19.2 이상의 `Activity`                            |
| 콘텐츠를 고정된 다른 DOM 위치에 렌더링하기        | React DOM의 `createPortal`                              |
| 같은 컴포넌트와 DOM을 여러 목적지 사이에서 옮기기 | React Preserve Portal                                   |

CSS로 순서를 바꿀 때는 화면의 순서와 키보드·스크린리더의 읽기 순서가 맞는지도 확인하세요. Popover와 dialog는 자체적으로 React 컴포넌트를 목적지 사이로 옮기는 기능이 아닙니다.

## 라이브러리가 사용하는 `moveBefore`

이동 전 컨테이너와 목적지가 같은 문서에 연결돼 있고 목적지가 `moveBefore`를 지원하면, 라이브러리가 자동으로 이 API를 사용합니다. 앱에서 직접 호출할 필요는 없습니다. 그 외의 정상적인 이동에는 `appendChild`를 사용하며, 다른 문서로의 이동은 거부합니다.

```ts
const supportsMoveBefore = typeof Element.prototype.moveBefore === 'function'
```

지원 여부는 [MDN 호환성 표](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore#browser_compatibility)와 실제 실행 환경에서 확인하세요. API가 있어도 첫 표시나 숨김 후 복귀처럼 이미 분리된 요소를 붙일 때는 `appendChild` 경로가 필요합니다.

`moveBefore`는 연결된 이동에서 포커스, iframe 문서, 애니메이션 등 브라우저 상태를 보존하도록 설계돼 있습니다. 영상 파일의 재생, iframe 안의 플레이어, 앱이 직접 실행하는 초기화 코드는 각각 별개의 동작입니다. DOM을 유지한다는 이유만으로 모든 미디어의 연속 재생을 가정하지 마세요. [비디오 예제](./video-player)에서 앱이 관리할 재생 정책을 설명합니다.

## 이동에 애니메이션 더하기

View Transition은 이동 전후 화면을 애니메이션으로 연결합니다. 컴포넌트 상태 보존은 포털이 담당하므로, 애니메이션 없이 `setSlotKey()`만 호출해도 이동합니다.

아래 함수는 클릭 같은 이벤트 핸들러에서 호출하는 선택적 보조 함수입니다. 인자로 `Player.usePortal()`의 `setSlotKey`를 전달하세요.

```tsx
import { flushSync } from 'react-dom'

export function moveToMini(setSlotKey: (slot: 'mini') => void) {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    setSlotKey('mini')
    return
  }
  const transition = document.startViewTransition(() => {
    flushSync(() => setSlotKey('mini'))
  })
  void transition.ready.catch(() => {})
}
```

`flushSync`는 전환 스냅샷 전에 React 변경을 반영하기 위해 이 핸들러 안에서만 사용합니다. 일반적인 이동에는 필요하지 않습니다. 전환이 생략돼도 슬롯 변경은 적용되며, 모션 줄이기 설정에서는 애니메이션을 시작하지 않습니다. [실제 예제](../playground)의 View Transition 스위치로 확인할 수 있습니다.

## Activity와 함께 사용할 때

React 19.2의 `Activity`는 같은 자리의 UI를 숨기면서 상태와 DOM을 유지하고 Effect를 정리합니다. 서로 다른 DOM 부모 사이로 옮기는 API는 아닙니다.

반면 포털의 `setSlotKey(null)`은 컨테이너를 문서에서 분리하고 React 콘텐츠를 마운트한 채 둡니다. 두 숨김 방식의 Effect·연결 동작이 다릅니다. 함께 쓴다면 Host와 Slot 중 어떤 요소를 Activity 안에 둘지 [수명과 소유권](./lifecycle-safety)에서 확인하세요.

## 관련 문서

- [MDN: Element.moveBefore](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore)
- [MDN: startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [React: Activity](https://react.dev/reference/react/Activity)
- [React: createPortal](https://react.dev/reference/react-dom/createPortal)
