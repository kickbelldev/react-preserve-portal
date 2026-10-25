---
layout: home
title: DOM은 그대로, 위치만 새롭게
hero:
  name: React Preserve Portal
  text: 상태를 지키며 옮기는 UI
  tagline: 재생 중인 영상, 쓰던 에디터, 그리던 캔버스. 다시 마운트하지 않고 DOM과 React 상태를 그대로 들고 원하는 자리로 옮깁니다.
  image:
    src: /hero.svg
    alt: 메인 화면에서 재생 중인 플레이어가 재생을 멈추지 않고 미니 플레이어 자리로 이동하는 모습
  actions:
    - theme: brand
      text: 5분 만에 시작하기
      link: /guide/quick-start
    - theme: alt
      text: 직접 옮겨 보기
      link: '#playground'
    - theme: alt
      text: API
      link: /api
features:
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="13" height="10" rx="2"/><rect x="11.5" y="12.5" width="10" height="8" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M6 17.5h3.5M7.5 15.5l2 2-2 2"/></svg>
    title: 한 번 마운트, 어디로든
    details: 컨테이너째 옮겨 DOM과 입력값, 컴포넌트 상태를 유지합니다. 같은 Host 안에서 이동할 때 다시 마운트하지 않습니다.
    link: /guide/preservation
    linkText: 보존 원리
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4.5H6.5a2 2 0 0 0-2 2v3.2a2.3 2.3 0 0 1-1.5 2.3 2.3 2.3 0 0 1 1.5 2.3v3.2a2 2 0 0 0 2 2H8M16 4.5h1.5a2 2 0 0 1 2 2v3.2a2.3 2.3 0 0 0 1.5 2.3 2.3 2.3 0 0 0-1.5 2.3v3.2a2 2 0 0 1-2 2H16"/><path d="m9 12 2 2 4-4"/></svg>
    title: 슬롯 이름까지 타입으로
    details: Host, Slot, usePortal 세 가지가 전부입니다. 선언한 슬롯 이름이 자동으로 추론되어 오타는 컴파일 단계에서 걸러집니다. React 18 이상.
    link: /api
    linkText: API 레퍼런스
  - icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="17" rx="2.5"/><path d="M2.5 8h19"/><circle cx="5.5" cy="5.8" r=".5" fill="currentColor"/><circle cx="7.8" cy="5.8" r=".5" fill="currentColor"/><path d="m12.8 10.5-3 4.5h4l-1 3.5 3.2-4.8h-4z"/></svg>
    title: 브라우저 상태까지 보존
    details: 연결된 슬롯 사이의 moveBefore 이동은 포커스, iframe, 애니메이션 상태도 보존합니다. appendChild 폴백과 숨김·복귀의 보장 범위는 가이드에서 확인하세요.
    link: /guide/web-platform
    linkText: 브라우저 지원
---

<div class="home-lab" id="playground">
  <span class="section-kicker">LIVE PLAYGROUND</span>
  <h2>재생 중에 옮겨 보세요.</h2>
  <p>영상이 재생되는 동안 메모를 쓰고 카운터를 올린 뒤 미니 플레이어로 보내 보세요. 입력값과 카운터가 유지되는지 확인하세요. 연결된 moveBefore 이동에서는 재생도 이어지며, 폴백에서는 재생 버튼을 다시 눌러야 할 수 있습니다.</p>
  <PortalPlayground />
</div>
