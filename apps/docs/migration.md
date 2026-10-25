---
title: 0.4 마이그레이션
description: 0.3.x와 0.2.x에서 0.4로 올릴 때 바꿔야 할 코드를 확인합니다.
---

# 0.4 마이그레이션

## 0.3.x에서 0.4.0으로

기존 팩토리 호출, `node` prop과 훅 액션은 계속 지원합니다. 이번 1.0 이전 마이너 릴리스에서는 안전하지 않은 사용 패턴을 제한합니다.

- Slot은 비워 두세요. 자식과 HTML 플레이스홀더를 형제 요소로 옮기세요. `children`과 `dangerouslySetInnerHTML`은 이제 타입 검사와 런타임에서 거부됩니다.
- `targets`는 `ReadonlyMap`입니다. 스냅샷 수정 대신 등록 액션을 사용하세요.
- 목적지는 Host와 같은 문서에 있고 컨테이너 바깥에 있어야 합니다. 다른 문서나 순환 구조로의 이동은 DOM 변경 전에 거부됩니다.

기본 마운트는 즉시 실행됩니다. 최초 측정이나 자동 포커스에 연결이 필요하면 `mountWhen="connected"`를 선택하세요. Host는 바깥의 Suspense/Activity에 숨겨져도 컨테이너 연결을 유지하고 React 18에서도 최종 삭제 시 정리됩니다. 명시적 숨기기·reset이나 Slot 제거는 여전히 콘텐츠를 분리합니다.

`Player.dispose()`는 모든 React 소유자와 수동 목적지가 사라진 뒤 사용하지 않는 ID를 해제하는 선택적 API입니다. 숨겨진 소유자를 포함해 사용 중이면 해제를 거부합니다. 성공 후 오래된 액션은 오류를 발생시키며 새 마운트는 빈 저장소를 사용합니다. [수명 가이드](./guide/lifecycle-safety)와 [API 레퍼런스](./api)를 참고하세요.

## 0.2.x에서 업그레이드

기존 팩토리, 슬롯 키, `node`, 훅 메서드는 계속 사용할 수 있습니다. 다음 동작과 타입 요구 사항을 확인하세요.

### JSX children 지원

```tsx
// 0.2.x 문법도 계속 지원합니다.
<Player.Host node={<VideoPlayer />} />

// 0.3.0에서는 일반 JSX로도 작성할 수 있습니다.
<Player.Host><VideoPlayer /></Player.Host>
```

`node`와 `children`을 동시에 전달하지 마세요. 슬롯 이름 리터럴은 `as const` 없이 추론되며, 공개 타입 선언은 **TypeScript 5 이상**이 필요합니다.

### `reset()`의 목적지 유지

기존에는 `reset()`이 목적지 등록도 비웠습니다. 0.3.0은 **콘텐츠를 숨기고 `returnPath`만 비우며**, 마운트된 목적지를 유지합니다. 따라서 바로 슬롯을 다시 선택할 수 있습니다.

수동 등록을 지우기 위해 `reset()`을 사용했다면 `registerTarget()`이 반환하는 정리 함수를 호출하는 방식으로 변경하세요.

### 등록 정리와 SSR

`registerTarget()`은 이제 정리 함수를 반환합니다. 기존 코드는 반환값을 무시해도 동작하지만, Effect에서 반환하면 대체 등록을 잘못 해제하지 않도록 보호됩니다.

Host는 서버 렌더에서 콘텐츠를 출력하지 않고 하이드레이션 후에 마운트합니다. [SSR 가이드](./guide/ssr)를 확인하세요. React context와 이벤트가 Host의 트리를 따른다는 규칙은 그대로입니다.

### 이동과 구독

지원 브라우저의 연결된 이동에는 `moveBefore`를 사용합니다. 미지원 환경은 `appendChild`로 동작합니다. 저장소 구독은 포털 ID별로 분리되어 다른 포털 변경으로 인한 알림을 줄였습니다.

전체 이력은 [CHANGELOG](https://github.com/kickbelldev/react-preserve-portal/blob/main/packages/react-preserve-portal/CHANGELOG.md)를 참고하세요.
