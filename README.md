# Video Portal

Unmanaged DOM을 활용하여 video DOM 인스턴스를 유지하면서 메인 플레이어 ↔ 미니플레이어 간 전환하는 React 패턴 예시.

## 핵심 개념: Unmanaged DOM Node

React의 `createPortal`만으로는 DOM 인스턴스 유지가 불가능하다. portal의 target이 바뀌면 React는 기존 DOM을 언마운트하고 새로 생성한다.

이 프로젝트는 **React가 관리하지 않는 DOM 노드(Unmanaged DOM)**를 중간에 두어 이 문제를 해결한다:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              React 영역                                  │
│                                                                          │
│   PortalHost                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  unmanagedNodeRef = useRef(document.createElement('div'))       │   │
│   │                           │                                     │   │
│   │              createPortal(children, unmanagedNode)              │   │
│   │                           │                                     │   │
│   │                           ▼                                     │   │
│   │  ┌─────────────────────────────────────────────┐                │   │
│   │  │         Unmanaged DOM Node (div)            │ ◄── React 외부 │   │
│   │  │  ┌───────────────────────────────────────┐  │                │   │
│   │  │  │           <video> 요소                │  │                │   │
│   │  │  │    (재생 상태, 버퍼 등 유지됨)         │  │                │   │
│   │  │  └───────────────────────────────────────┘  │                │   │
│   │  └─────────────────────────────────────────────┘                │   │
│   │                           │                                     │   │
│   │                    appendChild                                  │   │
│   │                           │                                     │   │
│   │              ┌────────────┴────────────┐                        │   │
│   │              ▼                         ▼                        │   │
│   │     PortalSlot (main)          PortalSlot (mini)                │   │
│   │     ┌─────────────┐            ┌─────────────┐                  │   │
│   │     │ <div ref /> │            │ <div ref /> │                  │   │
│   │     └─────────────┘            └─────────────┘                  │   │
│   │          ▲                          ▲                           │   │
│   │          │                          │                           │   │
│   │      register()                 register()                      │   │
│   │          │                          │                           │   │
│   │          └──────────┬───────────────┘                           │   │
│   │                     ▼                                           │   │
│   │              ┌─────────────┐                                    │   │
│   │              │ Zustand     │                                    │   │
│   │              │ targets Map │                                    │   │
│   │              │ mode state  │                                    │   │
│   │              └─────────────┘                                    │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## 동작 원리

### 1. 초기화 단계

```tsx
// App.tsx
<PortalHost>
  <VideoElement />  {/* video 요소 */}
</PortalHost>
<MiniPlayer />      {/* mini slot 포함 */}
```

1. **PortalHost** 마운트: `useRef(document.createElement('div'))`로 unmanaged node 생성
2. **PortalSlot (mini)** 마운트: 자신의 div ref를 store에 `register('mini', ref)`
3. **createPortal**: VideoElement를 unmanaged node에 렌더링

이 시점에서 mode가 null이므로 unmanaged node는 아직 어디에도 붙지 않음.

### 2. 비디오 페이지 진입

```tsx
// VideoPage.tsx
<MainPlayer src={src} />

// MainPlayer.tsx 내부
<MainPortal pathname={pathname} />

// MainPortal.tsx
useEffect(() => {
  setMode('main')        // mode를 'main'으로 변경
  setReturnPath(pathname)
  return () => setMode('mini')  // 언마운트 시 'mini'로
}, [])

return <PortalSlot mode="main" />
```

1. **PortalSlot (main)** 마운트: `register('main', ref)` 호출
2. **setMode('main')** 호출
3. **PortalHost**가 mode 변경 감지:
   ```tsx
   const target = targets.get(mode)  // main slot의 DOM
   target.appendChild(unmanagedNode) // unmanaged node를 main에 붙임
   ```

### 3. 다른 페이지로 이동

1. **MainPortal** 언마운트 → cleanup에서 `setMode('mini')` 호출
2. **PortalHost**가 mode 변경 감지:
   ```tsx
   // cleanup: 기존 위치에서 제거
   unmanagedNode.parentElement.removeChild(unmanagedNode)

   // effect: 새 위치에 붙임
   const target = targets.get('mini')
   target.appendChild(unmanagedNode)
   ```

**핵심**: video DOM은 React의 reconciliation과 무관하게 `appendChild`로만 이동하므로 인스턴스가 유지된다.

## 컴포넌트 역할

### Portal 레이어 (순수 DOM 이동 메커니즘)

| 컴포넌트 | 역할 |
|---------|------|
| **PortalHost** | unmanaged node 생성 + createPortal로 children 렌더링 + mode에 따라 appendChild |
| **PortalSlot** | 자신의 DOM ref를 store에 등록/해제 |
| **MainPortal** | PortalSlot(main) + mode 설정 라이프사이클 관리 |
| **MiniPortal** | PortalSlot(mini) 래퍼 |
| **MiniPortalContainer** | mini 모드 시 보여줄 컨테이너 UI (닫기 버튼, 돌아가기 링크) |

### Player 레이어 (비디오 UI/상태)

| 컴포넌트 | 역할 |
|---------|------|
| **VideoElement** | 실제 `<video>` 요소 + store와 시간 동기화 |
| **VideoControls** | 재생/일시정지 버튼 + 시간 표시 |
| **MainPlayer** | 메인 영역 레이아웃 + VideoControls |
| **MiniPlayer** | MiniPortalContainer + MiniPortal 조합 |

## Store 구조

### Portal Store

다중 포털 인스턴스를 지원하기 위해 `portalId` 기반으로 관리한다.

```typescript
interface PortalInstance {
  targets: Map<string, HTMLElement>  // mode → DOM ref (커스텀 모드 지원)
  mode: string | null                // 현재 활성 슬롯
  returnPath: string | null          // 미니플레이어에서 돌아갈 경로
}

interface PortalState {
  portals: Map<string, PortalInstance>  // portalId → 인스턴스
}

interface PortalActions {
  register: (portalId, mode, target) => void
  unregister: (portalId, mode) => void
  setMode: (portalId, mode) => void
  setReturnPath: (portalId, path) => void
  resetPortal: (portalId) => void
}
```

### Player Store

```typescript
interface PlayerState {
  videoRef: HTMLVideoElement | null
  src: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
}

interface PlayerActions {
  setVideoRef: (ref) => void
  initVideo: (src) => void      // 동일 src 재호출 시 스킵
  togglePlay: () => void
  seek: (time) => void
  syncTime: (current, duration) => void
}
```

## 프로젝트 구조

```
src/
├── App.tsx                        # BrowserRouter + 전역 PortalHost/MiniPlayer
├── layouts/
│   └── RootLayout.tsx             # 네비게이션 + Outlet
├── pages/
│   ├── HomePage.tsx
│   ├── AboutPage.tsx
│   └── VideoPage.tsx              # MainPlayer 사용
├── features/
│   ├── portal/
│   │   ├── model/
│   │   │   └── store.ts           # portals Map (portalId → instance)
│   │   ├── hooks/
│   │   │   └── usePortal.ts       # 특정 포털 인스턴스 접근 훅
│   │   └── components/
│   │       ├── PortalHost.tsx     # unmanaged node + createPortal
│   │       ├── PortalSlot.tsx     # DOM ref 등록
│   │       ├── MainPortal.tsx     # main slot + 라이프사이클
│   │       ├── MiniPortal.tsx     # mini slot
│   │       └── MiniPortalContainer.tsx  # mini 모드 컨테이너 UI
│   └── player/
│       ├── model/store.ts         # videoRef, src, isPlaying, time 상태
│       └── components/
│           ├── VideoElement.tsx   # 실제 <video> + 시간 동기화
│           ├── VideoControls.tsx  # 재생 컨트롤 + 시간 표시
│           ├── MainPlayer.tsx     # 메인 영역 UI
│           └── MiniPlayer.tsx     # 미니플레이어 UI
└── shared/
    └── utils/
        └── cn.ts                  # clsx + tailwind-merge
```

## 왜 이 방식인가?

### 일반적인 createPortal의 한계

```tsx
// 이렇게 하면 target이 바뀔 때마다 video가 재생성됨
createPortal(<video />, mode === 'main' ? mainRef : miniRef)
```

### Unmanaged DOM의 장점

1. **DOM 인스턴스 완전 유지**: video 요소가 절대 언마운트되지 않음
2. **상태 보존**: 재생 위치, 버퍼, 네트워크 연결 등 모든 상태 유지
3. **React와 독립적**: appendChild/removeChild만 사용하여 위치 변경

## 확장성

### 다중 포털 인스턴스

한 앱에서 여러 독립적인 포털 시스템을 운영할 수 있다.

```tsx
// 비디오 포털
<PortalHost portalId="video"><VideoElement /></PortalHost>
<PortalSlot portalId="video" mode="main" />
<PortalSlot portalId="video" mode="mini" />

// 모달 포털 (완전히 독립적)
<PortalHost portalId="modal"><ModalContent /></PortalHost>
<PortalSlot portalId="modal" mode="center" />
```

### 커스텀 모드

'main'/'mini' 외에 원하는 모드를 자유롭게 정의할 수 있다.

```tsx
<PortalSlot portalId="video" mode="pip" />      // PIP 모드
<PortalSlot portalId="video" mode="theater" />  // 극장 모드
<PortalSlot portalId="video" mode="fullscreen" />
```

### usePortal 훅

특정 포털 인스턴스에 대한 편의 훅을 제공한다.

```tsx
function MyComponent() {
  const { mode, setMode, reset } = usePortal('video')

  return (
    <button onClick={() => setMode('pip')}>
      PIP 모드로 전환
    </button>
  )
}
```

## 실행

```bash
pnpm install
pnpm dev
```

## 기술 스택

- React 19 + React Compiler
- TypeScript
- Vite
- React Router
- Zustand
- TailwindCSS
