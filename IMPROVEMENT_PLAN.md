# react-preserve-portal 개선 플랜

기준: `main` @ `d5a9aa6` (npm 0.3.0 + 미출시 lifecycle 수정). 2026-10-24 점검.
확인 방법: 소스 정독, 라이브러리 테스트 실행(74개 통과), 패키지 빌드 후
`@arethetypeswrong/cli` 검사, 데모 영상 URL 응답 확인, 배포된 문서 사이트 확인.

우선순위: **P0** 지금 깨져 있거나 사용자가 바로 밟음 · **P1** 다음 릴리스에 넣을 것 · **P2** 여유 있을 때.

---

## P0 — 지금 깨져 있음

### 1. 데모 앱 영상이 재생되지 않음

`apps/demo/src/shared/constants/VIDEO_SOURCES.tsx`의 두 URL
(`commondatastorage.googleapis.com/gtv-videos-bucket/...`)이 모두 **HTTP 403 AccessDenied**를
돌려줍니다. Google이 샘플 버킷을 비공개로 돌린 것으로 보입니다. 지금 데모는 "재생할 수 없습니다"만 보여 줍니다.

- 해결: 영상을 저장소에 직접 넣습니다(이 브랜치에서 문서용으로 만든
  `apps/docs/public/media/portal-reel.{mp4,webm}`를 데모에서도 같이 씀). 외부 URL을 쓰려면 CORS·핫링크가
  허용되는 CC0 소스를 쓰고, `scripts/demo-smoke.py`에서 영상 로드까지 확인하도록 보강합니다.

### 2. CommonJS 사용자에게 타입이 잘못 잡힘 ("Masquerading as ESM")

`package.json`이 `"type": "module"`이고 `exports["."].types`가 `index.d.ts` 하나뿐입니다.
`moduleResolution: node16/nodenext` + CJS 프로젝트에서 `require`하면 TS는 이 선언을 ESM으로 해석하고,
런타임은 `index.cjs`를 읽습니다. attw 결과:

```
node16 (from CJS)  👺 Masquerading as ESM
```

- 해결: 조건별 타입을 나눕니다. `vite-plugin-dts`로 `index.d.cts`도 내보내고(또는 빌드 후 복사)

  ```json
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    }
  }
  ```

  `files`에도 `dist/index.d.cts`를 추가하고, CI의 `verify-package.mjs` 옆에 `attw --pack`을 붙입니다.

### 3. 미출시 수정이 너무 오래 source에만 있음

README·문서 사이드바가 "npm 0.3.0과 다르다 / 미출시"를 계속 안내하고 있습니다. 사용자는 문서대로
`mountWhen`, `dispose()`를 쓰다가 타입 에러를 만납니다.

- 해결: 위 2번을 고친 뒤 **0.4.0**으로 출시하고, 문서의 "미출시" 경고·`v0.3.0` 네비 표기를 정리합니다.
  네비 버전은 `package.json`에서 읽도록 바꾸면 다음부터 손이 덜 갑니다.

---

## P1 — 다음 릴리스

### 4. 라우트 전환 시 "연결된 이동"이 깨짐 → 레이아웃에 슬롯을 다 깔아야 함

지금 구조에서 Slot이 언마운트되면 그 DOM과 함께 Host 컨테이너도 문서에서 떨어집니다. 새 Slot이 등록될 때
컨테이너는 이미 분리된 상태라 `moveBefore` 조건(`isConnected`)을 만족하지 못하고 `appendChild`로 붙습니다.
그래서 iframe 재로드, 포커스 유실, CSS 애니메이션 재시작이 생깁니다.

라우팅 가이드는 이를 피하려고 "Host와 **양쪽 Slot 모두** 공통 레이아웃에 두고 CSS로 숨기라"고 안내합니다.
라우트 페이지 안에 `<Player.Slot slotKey="main" />`을 두는 가장 자연스러운 코드가 막혀 있는 셈입니다.

- 제안: **파킹(parking) 컨테이너.** Slot의 ref 해제는 React가 해당 DOM을 실제로 제거하기 _전에_
  호출됩니다(deletion 단계에서 `safelyDetachRef` → `removeChild` 순서). 이때 컨테이너가 그 Slot 안에 있으면
  `document.body` 끝의 숨겨진 파킹 요소로 `moveBefore` 해 둡니다. 다음 커밋에서 새 Slot으로 옮길 때는
  연결 → 연결 이동이므로 브라우저 상태가 유지됩니다.
- 범위: Slot ref 콜백 + Host 배치 effect. 옵트인(`Host keepConnected`)으로 시작해 기본값 전환은 다음에.
- 검증: `lifecycle-smoke.py`에 "라우트 안 Slot ↔ 다른 라우트 Slot 이동 시 iframe `contentWindow` 동일성,
  `<video>` `currentTime` 연속성" 케이스 추가 (React 18/19 매트릭스).

### 5. 같은 key의 Slot이 겹치면, 최신 Slot이 빠질 때 콘텐츠가 사라짐

`registerTarget`은 key당 토큰 하나만 기억합니다. A(구) → B(신) 순으로 같은 key가 등록된 뒤 B가 먼저
언마운트되면 등록이 지워지고, 아직 마운트된 A로 돌아가지 않아 콘텐츠가 사라집니다. README에 "자동 복원되지
않는다"고 적혀 있지만, exit 애니메이션(Framer Motion `AnimatePresence`, View Transition 라우터)에서
쉽게 생기는 순서입니다.

- 제안: key별 등록을 **스택**으로 관리. 최신 등록이 해제되면 그 아래(아직 살아 있는) 등록으로 되돌아갑니다.
  토큰 기반 소유권 체크는 그대로 유지됩니다. `store.ts` 수십 줄 수준의 변경.

### 6. 잘못된 사용을 조용히 넘김 → 개발 모드 경고

다음 경우에 지금은 아무 신호가 없습니다. `process.env.NODE_ENV !== 'production'`에서 한 번씩 경고합니다.

- 같은 portal ID에 Host가 둘 이상 마운트됨 (두 컨테이너가 같은 슬롯에 같이 붙음)
- 같은 key의 Slot이 동시에 둘 이상 등록됨
- `slots`에 선언되지 않은 key로 `setSlotKey` 호출 (JS 사용자, `as` 캐스팅)
- Host의 `as`가 마운트 후 바뀜 (지금은 무시됨)
- 같은 ID로 `createPortal`을 다른 `slots`와 함께 다시 호출 (HMR 외의 충돌)

### 7. `useCommittedEffect`의 React 버전 판별이 취약함

```ts
Number.parseInt(version, 10) >= 19 ? useInsertionEffect : useEffect
```

React experimental 빌드는 버전이 `0.0.0-experimental-…`라서 19+ 동작인데도 `useEffect` 분기로 갑니다.
또 `useInsertionEffect`를 DOM 정리·소유권 집계용으로 쓰는 것은 문서화된 용도가 아니어서, React 마이너
업데이트에서 타이밍이 바뀌면 조용히 깨질 수 있습니다.

- 제안: 버전 문자열 대신 기능으로 판별(예: `'Activity' in React` 또는 `unstable_Activity`), 그리고 CI 브라우저
  매트릭스에 `react@canary`를 추가해 회귀를 미리 잡습니다. 실패해도 머지는 막지 않는 `continue-on-error` 잡으로.

### 8. `moveBefore` 예외 시 폴백 없음

지금은 조건을 미리 확인한 뒤 `moveBefore`를 호출하지만, 브라우저 구현 초기 버그나 shadow root 경계 등에서
`HierarchyRequestError`가 나면 layout effect에서 그대로 터집니다.

- 제안: `try { target.moveBefore(node, null) } catch { target.appendChild(node) }`. 비용 없음.

---

## P2 — 다듬기

9. **`usePortal()` 반환 객체가 매 렌더 새로 생성됨.** 반환값 전체를 deps에 넣으면 effect가 매번 돕니다.
   `useMemo`로 묶거나, 문서에 "액션만 구조분해해서 쓰라"를 명시.
10. **Slot에 사용자 `ref`를 넘길 수 없음.** 레이아웃 측정용으로 자주 필요합니다. React 19에서는 `ref`가
    props로 들어오지만 내부 ref가 덮어씁니다. 내부 콜백 ref와 합쳐 주고 타입에 `ref?: Ref<HTMLElementTagNameMap[T]>`
    추가.
11. **`mountWhen="connected"`의 MutationObserver가 `document` 전체 subtree를 감시.** 연결 전 짧은 시간만이지만,
    DOM 변경이 많은 페이지에서는 콜백이 많습니다. 등록된 target이 생기면 그 target의 `isConnected`만 확인하는
    방식(target 등록 시 즉시 판정)으로 대부분의 경우 observer 없이 끝낼 수 있습니다.
12. **숨김 상태에서도 미디어가 계속 재생됨.** 분리된 `<video>`는 소리가 계속 납니다. 라이브러리 책임은
    아니지만 FAQ/트러블슈팅에 "숨길 때 `pause()`" 패턴을 넣어 두면 좋습니다.
13. **데모 앱 정리.** About 페이지가 `Hello "/about"!` 플레이스홀더, 컨트롤 아이콘이 이모지(▶ ⏸ ✕),
    영어/한국어 혼용. 데모를 문서 사이트와 같은 톤으로 맞추고 GitHub Pages `/demo/`에 함께 배포하면
    README에서 "라이브 데모" 링크를 걸 수 있습니다.
14. **번들 크기 표시.** README 배지에 bundlephobia 또는 `size-limit` CI 체크(현재 ESM 4.6KB, min+gzip 기준 측정 필요).

---

## 이 브랜치에서 한 것 (`docs/refresh-landing-video-demo`)

문서 사이트 랜딩의 틀은 그대로 두고 다음을 바꿨습니다.

- **플레이그라운드에 실제 영상 추가.** 타임코드가 박힌 짧은 루프 영상을 저장소에 넣고(`public/media/`),
  메모·카운터와 한 카드로 묶었습니다. 메인 ↔ 미니로 옮겨도 영상 시간이 끊기지 않는 걸 눈으로 확인할 수 있습니다.
  카드에 "마운트 1회" 배지를 달아 다시 마운트되지 않았음을 보여 줍니다.
- **아이콘.** 기능 카드 3개, 이동 버튼(메인 / 미니 / 숨기기 / reset), `moveBefore` 지원 표시에 SVG 아이콘.
- **카피.** 한국어 페이지의 영어 기능 제목을 한국어로 바꾸고, 히어로·기능 설명을 구체적인 이점 위주로 다시 썼습니다.
- **히어로 이미지.** 메인 화면의 플레이어가 미니 플레이어로 이동하고 재생 바가 이어지는 애니메이션 SVG
  (모션 줄이기 설정 시 정지).
- 기존 `scripts/docs-smoke.py`가 쓰는 `data-testid`와 접근성 이름은 유지했습니다.

## 실행 순서 제안

| 순서 | 작업                                                 | 크기   |
| ---- | ---------------------------------------------------- | ------ |
| 1    | P0-1 데모 영상 교체                                  | 30분   |
| 2    | P0-2 CJS 타입 분리 + attw CI                         | 1시간  |
| 3    | P1-8 moveBefore 폴백, P1-7 버전 판별                 | 1시간  |
| 4    | P1-5 슬롯 등록 스택 + 테스트                         | 반나절 |
| 5    | P1-6 개발 모드 경고                                  | 반나절 |
| 6    | **0.4.0 릴리스** (P0-3)                              | —      |
| 7    | P1-4 파킹 컨테이너 스파이크 → `keepConnected` 옵트인 | 1~2일  |
| 8    | P2 항목들, 데모 Pages 배포                           | 틈틈이 |
