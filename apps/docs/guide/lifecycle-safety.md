---
title: 수명과 소유권
description: 0.4.0의 DOM 소유권, 초기 연결, 숨김 경계와 ID 저장소 해제를 설명합니다.
---

# 수명과 소유권

::: info 0.4.0부터 제공
이 페이지의 API는 **0.4.0**부터 제공됩니다. React 19.0/19.1에서 숨겨진 Host의 최종 삭제 정리는 **0.4.1**에서 수정했습니다. 0.3.x를 사용 중이면 업그레이드하세요. 강화된 빈 Slot·동일 문서 계약은 [마이그레이션 가이드](../migration)를 참고하세요.
:::

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

Host의 컨테이너 제거를 최종 삭제 시점으로 옮겼습니다. Host 바깥의 Suspense/Activity가 layout effect를 정리하더라도 컨테이너는 연결된 채 남고, 콘텐츠 표시와 Effect 처리는 React의 정책을 따릅니다. React 18.0·18.2·18.3·19.0·19.1·19.2에서 확인하며 Activity는 React 19.2 이상 기능입니다.

`setSlotKey(null)`과 `reset()`은 여전히 컨테이너를 **분리**합니다. Slot 자체가 사라지거나 숨김 경계에서 등록 해제되면 목적지도 없어집니다. 연결을 계속 유지해야 하는 iframe은 지속적으로 마운트된 Slot을 사용하세요. React 상태·DOM 객체·브라우저 문서·Effect의 수명은 서로 다릅니다.

## 등록 소유권과 dispose

같은 요소를 같은 키에 재등록해도 새 등록으로 취급합니다. 이전 cleanup은 최신 등록을 해제하지 않습니다. 스냅샷은 요소가 달라질 때만 갱신하므로 불필요한 렌더는 늘어나지 않습니다. `targets` 타입은 `ReadonlyMap`입니다.

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
