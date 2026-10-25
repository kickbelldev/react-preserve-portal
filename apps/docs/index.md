---
layout: home
title: DOM은 그대로, 위치만 새롭게
hero:
  name: React Preserve Portal
  text: 같은 컴포넌트를 다른 자리로
  tagline: 영상, 에디터, 캔버스를 다시 마운트하지 않고 옮기는 React 포털 라이브러리입니다. 콘텐츠는 한 곳에 두고, 표시할 슬롯을 선택하세요.
  image:
    src: /hero.svg
    alt: 메인 화면에서 재생 중인 플레이어가 재생을 멈추지 않고 미니 플레이어 자리로 이동하는 모습
  actions:
    - theme: brand
      text: 시작하기
      link: /guide/quick-start
    - theme: alt
      text: 직접 옮겨 보기
      link: '#playground'
    - theme: alt
      text: API
      link: /api
features:
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="13" height="10" rx="2"/><rect x="11.5" y="12.5" width="10" height="8" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M6 17.5h3.5M7.5 15.5l2 2-2 2"/></svg>
    title: Host에 콘텐츠 한 번
    details: 유지할 플레이어나 에디터를 Host 안에 넣습니다. 표시 위치를 바꿔도 같은 컴포넌트 상태와 DOM 노드를 사용합니다.
    link: /guide/preservation
    linkText: 보존 원리
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4.5H6.5a2 2 0 0 0-2 2v3.2a2.3 2.3 0 0 1-1.5 2.3 2.3 2.3 0 0 1 1.5 2.3v3.2a2 2 0 0 0 2 2H8M16 4.5h1.5a2 2 0 0 1 2 2v3.2a2.3 2.3 0 0 0 1.5 2.3 2.3 2.3 0 0 0-1.5 2.3v3.2a2 2 0 0 1-2 2H16"/><path d="m9 12 2 2 4-4"/></svg>
    title: Slot으로 표시 위치 지정
    details: 메인 화면과 미니 화면에 비어 있는 Slot을 둡니다. 각 Slot은 같은 콘텐츠를 표시할 위치에 이름을 붙입니다.
    link: /api
    linkText: API 레퍼런스
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="17" rx="2.5"/><path d="M2.5 8h19"/><circle cx="5.5" cy="5.8" r=".5" fill="currentColor"/><circle cx="7.8" cy="5.8" r=".5" fill="currentColor"/><path d="m12.8 10.5-3 4.5h4l-1 3.5 3.2-4.8h-4z"/></svg>
    title: usePortal로 위치 선택
    details: setSlotKey에 슬롯 이름을 전달하면 이동하고, null을 전달하면 숨깁니다. 정의한 슬롯 이름은 TypeScript가 검사합니다.
    link: /guide/quick-start
    linkText: 첫 포털 만들기
---

<div class="home-lab" id="playground">
  <span class="section-kicker">직접 확인하기</span>
  <h2>재생 중에 옮겨 보세요.</h2>
  <p>메모를 바꾸고 카운터를 올린 뒤 미니로 보내 보세요. 같은 플레이어와 입력값이 함께 이동합니다. 숨겼다가 다시 표시해도 값이 남는지 확인해 보세요.</p>
  <PortalPlayground />
  <p class="home-note">폴백 이동이나 숨김에서는 재생이 멈출 수 있습니다. 브라우저에 따라 달라지는 동작은 <a href="./guide/preservation.html">보존 범위</a>에서 확인하세요.</p>
  <nav class="home-next" aria-label="다음 단계">
    <a href="./guide/quick-start.html"><strong>첫 포털 만들기</strong><span>Host·Slot·usePortal로 5분 안에</span></a>
    <a href="./guide/video-player.html"><strong>미니플레이어에 적용하기</strong><span>재생 중인 영상을 옮기는 실전 예제</span></a>
    <a href="./guide/routing.html"><strong>라우팅에 연결하기</strong><span>페이지를 옮겨 다녀도 유지</span></a>
  </nav>
</div>
