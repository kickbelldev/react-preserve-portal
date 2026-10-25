---
title: 수명과 소유권
description: 초기 측정, Suspense·Activity, 수동 목적지와 ID 해제를 다룰 때 필요한 규칙을 설명합니다.
---

# 수명과 소유권

최초 크기 측정, Suspense·Activity 경계, 수동 DOM 목적지, 동적 포털 ID를 다룰 때 읽는 심화 가이드입니다. 일반적인 이동은 [빠르게 시작하기](./quick-start)의 구성으로 충분합니다.

React는 Host 컨테이너 **안의 콘텐츠**를 관리하고, 라이브러리는 그 컨테이너의 **위치**를 관리합니다. 두 코드가 같은 자식 DOM을 덮어쓰지 않도록 Slot을 비워 두는 것이 기본 규칙입니다.

## Slot은 빈 목적지입니다

Slot에 `children` 또는 `dangerouslySetInnerHTML`을 전달하면 타입 검사와 런타임에서 거부합니다. React가 그 내용을 갱신하면서 포털 컨테이너를 제거할 수 있기 때문입니다. 로딩 표시나 빈 상태는 Slot의 형제 요소로 렌더링하세요. 외부 코드로 Slot의 `textContent`나 `innerHTML`을 덮어쓰는 것도 피하세요.

## 연결 후 처음 마운트하기

```tsx
<Panel.Host mountWhen="connected">
  <Editor />
</Panel.Host>
```

기본값은 기존과 같은 `"immediate"`입니다. `"connected"`는 활성 컨테이너가 문서에 연결된 후에 콘텐츠를 처음 마운트하므로 `autoFocus`나 최초 layout effect의 크기 측정에 적합합니다. 숨겼다가 표시하거나 슬롯을 바꿀 때는 다시 마운트하지 않습니다.

최초 연결을 기다리는 동안에만 문서의 DOM 추가·삭제를 관찰합니다. 연결되거나 Host가 해제되면 관찰을 중지합니다. 수동 목적지는 등록 전에 문서에 붙이는 편이 좋습니다. Shadow DOM 내부의 외부 변경을 자동 추적하는 API는 아닙니다. 숨겨진 조상이나 크기 0인 레이아웃은 연결된 뒤에도 측정값이 0일 수 있습니다. 이후 크기 변경에는 `ResizeObserver`를 사용하세요.

## 숨김 경계와 실제 해제

목적지 Slot이 계속 등록·연결돼 있다면, Host를 감싼 Suspense/Activity의 Effect 정리만으로 컨테이너를 제거하지 않습니다. 콘텐츠의 표시와 Effect는 React의 경계 정책을 따르고, Host가 실제 삭제될 때 컨테이너도 제거됩니다. Activity는 React 19.2 이상에서 사용할 수 있습니다. React 19.0/19.1의 숨겨진 Host 삭제 수정은 0.4.1에 포함돼 있습니다.

`setSlotKey(null)`과 `reset()`은 여전히 컨테이너를 **분리**합니다. Slot 자체가 사라지거나 숨김 경계에서 등록 해제되면 목적지도 없어집니다. 연결을 계속 유지해야 하는 iframe은 지속적으로 마운트된 Slot을 사용하세요. React 상태·DOM 객체·브라우저 문서·Effect의 수명은 서로 다릅니다.

## 등록 소유권과 dispose

같은 요소를 같은 키에 재등록해도 새 등록으로 취급합니다. 이전 cleanup은 최신 등록을 해제하지 않습니다. 스냅샷은 요소가 달라질 때만 갱신하므로 불필요한 렌더는 늘어나지 않습니다. `targets`는 읽기 전용 스냅샷입니다.

```tsx
// 해당 ID의 모든 React 소유자를 실제로 언마운트한 뒤:
root.unmount()
cleanupManualTarget()
const released = Panel.dispose()
```

`dispose(): boolean`은 Host·Slot·훅 소유자, 구독자 또는 수동 목적지가 남아 있으면 `false`를 반환합니다. Activity 안에서 숨겨진 소유자도 포함합니다. 성공하면 ID 저장소를 제거하며 이미 없으면 `true`입니다. 컴포넌트 render 중이나 같은 ID의 마운트 전환 도중에는 호출하지 마세요.

이후 같은 팩토리를 새로 마운트하면 빈 저장소를 사용합니다. 이전에 보관한 액션은 폐기된 저장소를 다시 변경할 수 없으며 오류를 발생시킵니다. 오래된 등록 cleanup은 안전하게 아무 일도 하지 않습니다. 사용 중인 포털을 숨기는 용도는 계속 `reset()`을 사용합니다.

## 지원 경계

목적지는 Host와 같은 `document`에 있어야 하며, 포털 컨테이너 자신이나 자손일 수 없습니다. 이동 전에 검증합니다. 문서를 옮기면 React의 document 이벤트 등록이 따라가지 않는 문제가 있으므로, Document PiP나 iframe 문서로의 adoption을 기본 이동 API로 지원하지 않습니다.

같은 root에서는 React 이벤트와 context가 Host 트리를 따릅니다. 다른 React root로 옮기면 목적지 root의 capture/bubble 핸들러도 실행될 수 있습니다. Shadow DOM의 선택·IME 동작은 React와 브라우저별 제약이 있으며 완전한 지원을 보장하지 않습니다. 이벤트 격리를 위해 전역 전파를 강제로 차단하지 않습니다.
