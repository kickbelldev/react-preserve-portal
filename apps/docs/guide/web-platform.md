---
title: 최신 Web API와 대안
description: moveBefore, View Transition, Popover, Activity를 비교하고 더 단순한 구현 경로를 선택합니다.
---

# 최신 Web API와 대안

기술은 역할에 맞게 선택하는 편이 API를 작게 유지합니다. 이 페이지는 **2026-10-23에 공식 문서와 MDN 호환성 데이터를 확인한 결과**입니다. 브라우저 지원은 바뀔 수 있으므로 버전 문자열 대신 기능을 감지하세요.

## `Element.moveBefore`: 코어에 적용됨

기존 `appendChild`는 같은 노드를 옮겨도 분리·재삽입을 수행합니다. `moveBefore`는 연결 상태를 보존하며 이동하므로 포커스, iframe 문서, CSS 애니메이션, 열린 팝오버·모달 등의 상태를 유지할 수 있습니다.

0.3.0은 지원 환경에서 이 경로를 자동 선택합니다. 조건은 **같은 문서이며 출발 컨테이너와 목적지가 모두 연결되어 있을 것**입니다. 그 외에는 `appendChild`를 사용합니다. 숨김이나 라우트 제거로 이미 분리된 컨테이너에는 같은 보장을 할 수 없습니다.

확인한 MDN 데이터는 Chrome 133+, Firefox 144+에 지원이 있고 Safari에는 아직 지원이 없는 것으로 기록합니다. 실제 실행 환경은 다음처럼 확인합니다.

```ts
const supportsStatePreservingMove =
  'moveBefore' in Element.prototype &&
  typeof Element.prototype.moveBefore === 'function'
```

일반 `<video>`·`<audio>`의 재생 상태와 iframe에 들어 있는 플레이어는 구분해야 합니다. MDN은 일반 미디어 요소의 재생 상태가 분리·재삽입에서도 유지된다고 설명합니다. iframe 문서 재생성, 플레이어 라이브러리의 자체 동작, 라우트 전환 중 분리 여부까지 일괄 보장하는 것은 아닙니다.

커스텀 엘리먼트를 보존한다면 `connectedMoveCallback()`도 확인하세요. 이동 시 초기화·정리 콜백이 불필요하게 반복되는 문제를 엘리먼트 구현에서 처리할 수 있습니다.

## View Transition: 선택적 애니메이션

View Transition은 이전·이후 화면 사이의 시각적 전환입니다. 컴포넌트나 DOM을 보존하는 기능은 아닙니다. 코어 이동 위에 덧붙이는 앱 수준 기능으로 적합합니다.

```tsx
import { flushSync } from 'react-dom'

function moveToMini() {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    setSlotKey('mini')
    return
  }

  const transition = document.startViewTransition(() => {
    flushSync(() => setSlotKey('mini'))
  })
  // 애니메이션이 생략되어도 슬롯 변경은 그대로 적용됩니다.
  void transition.ready.catch(() => {})
}
```

이 조각의 `setSlotKey`는 `Player.usePortal()`에서 가져옵니다. `flushSync`는 이벤트 핸들러 안에서 화면 스냅샷 전에 React 변경을 반영하기 위해 사용합니다. 일반적인 슬롯 이동에는 필요하지 않습니다. `view-transition-name`은 페이지에서 중복되지 않게 지정하세요. [플레이그라운드](../playground)에서 선택적으로 켤 수 있습니다.

## 더 간단한 경로 선택

| 필요한 동작                                | 먼저 검토할 방법                 | 이 라이브러리와의 관계                                   |
| ------------------------------------------ | -------------------------------- | -------------------------------------------------------- |
| overflow에 잘리지 않는 메뉴·툴팁           | 네이티브 Popover + CSS 위치 지정 | 실제 DOM 재배치 없이 top layer에 표시할 수 있음          |
| 모달과 포커스 관리                         | `<dialog>`의 `showModal()`       | 단순 모달이면 포털 라이브러리가 필요 없을 수 있음        |
| 같은 위치의 탭 숨김·복원                   | React 19.2 `Activity`            | 상태와 DOM을 유지하지만 숨길 때 Effect를 정리함          |
| 반응형 화면의 시각적 재배치                | CSS Grid/Flex                    | DOM 이동 자체를 없앨 수 있음. 읽기 순서와 탭 순서에 주의 |
| DOM 위치를 실제로 바꾸면서 React 상태 유지 | Preserve Portal                  | stable 컨테이너 + `moveBefore` / `appendChild`           |
| 상태 보존이 필요 없는 오버레이             | React DOM `createPortal`         | 더 작은 구성으로 충분                                    |

Popover는 React 부모나 DOM 위치를 바꾸지 않습니다. `Activity`는 서로 다른 DOM 부모 사이로 이동하는 API가 아니며 React 18 지원을 대체할 수도 없습니다. `Activity` 안의 Effect 정리 정책은 이 라이브러리의 “숨겨도 Effect 유지”와 다르므로 무조건 결합하지 마세요.

명시적 dispose와 선택적 연결 후 마운트는 main에 구현했습니다. [미출시 수명 개선](./lifecycle-safety)을 참고하세요. npm 0.3.0에서는 사용할 수 없습니다.

## 다음 기능으로 검토할 것

다음은 **설계 후보이며 0.3.0에 제공되는 API가 아닙니다.**

| 우선순위 | 후보                                | 먼저 해결해야 할 질문                                                                    |
| -------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| 높음     | 연결된 parking 영역에 콘텐츠 숨기기 | iframe 문서를 살려둘 필요가 있는가? 숨김 시 포커스·접근성·미디어·Effect 정책은 무엇인가? |
| 중간     | 가시성 / 연결 상태 신호             | “선택됨”, “목적지가 등록됨”, “문서에 연결됨”, “화면에 보임”을 어떻게 구분할 것인가?      |
| 필요 시  | selector 구독                       | 실제 많은 포털·빈번한 업데이트에서 불필요한 렌더가 병목인지 측정 필요                    |

라우터, 상시 전역 관찰자, 애니메이션 엔진을 코어 의존성으로 추가할 이유는 아직 없습니다. 새 연결 후 마운트 옵션의 관찰은 최초 연결까지로 한정합니다. 현재의 작은 저장소와 명시적 Slot 등록이 동작을 예측하기 쉽습니다.

## 근거

- [MDN: Element.moveBefore](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore)
- [MDN 브라우저 호환성 원본](https://github.com/mdn/browser-compat-data/blob/main/api/Element.json)
- [MDN: startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
- [MDN: Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [React: Activity](https://react.dev/reference/react/Activity)
- [React: createPortal의 목적지 변경](https://react.dev/reference/react-dom/createPortal#parameters)
