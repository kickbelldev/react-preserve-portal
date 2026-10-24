---
title: 인터랙티브 예제
description: 동일한 DOM과 React 상태가 슬롯 이동과 숨기기 이후에도 유지되는지 직접 확인합니다.
---

# 인터랙티브 예제

실제 라이브러리의 Host와 두 Slot으로 동작합니다. 영상이 재생되는 동안 메모와 카운터를 바꾼 뒤 메인·미니 사이를 이동하거나 숨겼다가 다시 표시해 보세요.

<PortalPlayground />

## 확인할 것

1. 영상은 하나의 `<video>` 요소입니다. 요소를 다시 만들지 않으므로 이동하는 동안에도 타임코드가 계속 흐릅니다.
2. 입력값은 React state에 저장하지 않는 uncontrolled 값입니다. 이동 후에도 같은 DOM 노드에 남습니다.
3. 카운터는 React state입니다. 슬롯을 바꿔도 초기화되지 않습니다.
4. `reset()`은 포털을 숨깁니다. 다시 메인을 선택하면 내부 상태가 그대로 돌아옵니다.
5. 카드의 이동 횟수는 카드 자신의 React state입니다. 다시 마운트되지 않으므로 줄어들지 않고 계속 쌓입니다.
6. View Transition은 지원 브라우저에서 선택할 수 있는 애니메이션입니다. 모션 줄이기 설정이 켜져 있으면 비활성화됩니다.

표시되는 `moveBefore` / `appendChild`는 브라우저 기능 지원 여부입니다. `moveBefore` 지원 환경도 최초 연결과 숨김 후 복귀는 분리된 노드를 붙이므로 `appendChild`를 사용합니다. 예제의 버튼을 클릭하면 버튼 자체로 포커스가 이동하므로 포커스 보존 테스트와는 다릅니다.

페이지를 벗어나면 예제의 Host가 언마운트됩니다. 다시 방문하면 새 콘텐츠가 생성되는 것이 정상입니다. 코드는 [문서 테마의 playground.tsx](https://github.com/kickbelldev/react-preserve-portal/blob/main/apps/docs/.vitepress/theme/playground.tsx)에 있습니다.
