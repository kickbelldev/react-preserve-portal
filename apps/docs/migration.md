---
title: 0.3 마이그레이션
description: 0.2.x에서 0.3.0으로 이동할 때 확인할 호환성과 동작 변경입니다.
---

# 0.3 마이그레이션

기존 팩토리, 슬롯 키, `node`, 훅 메서드는 계속 사용할 수 있습니다. 다음 동작과 타입 요구 사항을 확인하세요.

## JSX children 지원

```tsx
// 0.2.x 문법도 계속 지원합니다.
<Player.Host node={<VideoPlayer />} />

// 0.3.0에서는 일반 JSX로도 작성할 수 있습니다.
<Player.Host><VideoPlayer /></Player.Host>
```

`node`와 `children`을 동시에 전달하지 마세요. 슬롯 이름 리터럴은 `as const` 없이 추론되며, 공개 타입 선언은 **TypeScript 5 이상**이 필요합니다.

## `reset()`의 목적지 유지

기존에는 `reset()`이 목적지 등록도 비웠습니다. 0.3.0은 **콘텐츠를 숨기고 `returnPath`만 비우며**, 마운트된 목적지를 유지합니다. 따라서 바로 슬롯을 다시 선택할 수 있습니다.

수동 등록을 지우기 위해 `reset()`을 사용했다면 `registerTarget()`이 반환하는 정리 함수를 호출하는 방식으로 변경하세요.

## 등록 정리와 SSR

`registerTarget()`은 이제 정리 함수를 반환합니다. 기존 코드는 반환값을 무시해도 동작하지만, Effect에서 반환하면 대체 등록을 잘못 해제하지 않도록 보호됩니다.

Host는 서버 렌더에서 콘텐츠를 출력하지 않고 하이드레이션 후에 마운트합니다. [SSR 가이드](./guide/ssr)를 확인하세요. React context와 이벤트가 Host의 트리를 따른다는 규칙은 그대로입니다.

## 이동과 구독

지원 브라우저의 연결된 이동에는 `moveBefore`를 사용합니다. 미지원 환경은 `appendChild`로 동작합니다. 저장소 구독은 포털 ID별로 분리되어 다른 포털 변경으로 인한 알림을 줄였습니다.

전체 이력은 [CHANGELOG](https://github.com/kickbelldev/react-preserve-portal/blob/main/packages/react-preserve-portal/CHANGELOG.md)를 참고하세요.
