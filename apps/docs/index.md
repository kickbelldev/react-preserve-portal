---
layout: home
title: DOM은 그대로, 위치만 새롭게
hero:
  name: React Preserve Portal
  text: 이동해도 이어지는 UI.
  tagline: 플레이어, 에디터, 캔버스. 하나의 React 트리와 DOM을 유지하면서 필요한 자리로 옮기세요.
  image:
    src: /hero.svg
    alt: 하나의 콘텐츠가 메인 화면에서 작은 화면으로 이동하는 구조
  actions:
    - theme: brand
      text: 5분 만에 시작하기 →
      link: /guide/quick-start
    - theme: alt
      text: API 살펴보기
      link: /api
features:
  - title: Mount once. Move anywhere.
    details: 같은 컨테이너를 이동하므로 React 상태와 DOM 정체성이 유지됩니다. 이동마다 다시 초기화할 필요가 없습니다.
  - title: 작고 명확한 API
    details: Host, Slot, usePortal. 슬롯 이름은 TypeScript가 추론하고, React 18 이상에서 사용할 수 있습니다.
  - title: 브라우저의 기능을 그대로
    details: 지원 환경에서는 moveBefore로 브라우저 상태까지 보존합니다. 구형 환경은 appendChild로 이동합니다.
---

<div class="home-lab">
  <span class="section-kicker">TRY THE REAL THING</span>
  <h2>직접 움직여 보세요.</h2>
  <p>메모를 입력하고 카운터를 올린 뒤, 두 화면 사이를 이동해 보세요.</p>
  <PortalPlayground />
</div>
