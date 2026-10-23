---
description: React Preserve Portal이 해결하는 문제와 적합한 사용 사례를 알아봅니다.
---

# 소개

**React Preserve Portal**은 React 콘텐츠를 다시 마운트하지 않고 여러 DOM 위치 사이에서 이동시키는 작은 라이브러리입니다.

일반적인 React 포털은 목적지 DOM 노드가 바뀌면 콘텐츠를 다시 생성합니다. 이 라이브러리는 React 포털의 목적지 컨테이너를 고정하고, 그 컨테이너 자체를 이동합니다. 컴포넌트의 상태, DOM 참조, uncontrolled 입력값이 이어집니다.

## 언제 사용하나요?

- 상세 화면에서 작은 플레이어로 이동하는 미디어 UI
- 여러 패널 사이를 이동하는 에디터나 캔버스
- 라우트가 바뀌어도 유지해야 하는 상태가 많은 위젯

단순 모달이나 툴팁은 React의 `createPortal`, 네이티브 `dialog` 또는 Popover API로 충분할 수 있습니다. 같은 자리에 있는 탭을 숨기고 복구하는 문제라면 React 19.2의 `Activity`도 검토하세요. [최신 Web API와 대안](./web-platform)에서 비교합니다.

## 세 가지 구성 요소

| 구성 요소     | 역할                                             |
| ------------- | ------------------------------------------------ |
| `Host`        | 보존할 콘텐츠를 React 트리에 한 번 마운트합니다. |
| `Slot`        | 콘텐츠를 표시할 DOM 목적지를 등록합니다.         |
| `usePortal()` | 활성 슬롯을 선택하고 포털 상태를 읽습니다.       |

```text
Host (React 트리의 위치는 고정)
  └─ React portal → 같은 컨테이너
                       ├─ main Slot 으로 이동
                       └─ mini Slot 으로 이동
```

## 지원 범위

React / React DOM **18 이상**, TypeScript **5 이상**을 지원합니다. ESM과 CommonJS를 제공합니다. React peer dependency 외에 별도의 런타임 의존성이 없습니다.

React 상태와 DOM 정체성을 보존하는 것과 브라우저의 모든 내부 상태를 보존하는 것은 다릅니다. iframe, 포커스, 애니메이션은 이동 방식과 브라우저에 영향을 받습니다. [보존 원리](./preservation)에서 정확한 범위를 확인하세요.

[빠르게 시작하기 →](./quick-start)
