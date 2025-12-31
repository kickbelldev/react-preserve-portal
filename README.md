# Double Portal Video Player

React Portal을 두 번 사용해 video DOM 인스턴스를 유지하면서 메인 ↔ 미니플레이어 전환하는 예시.

## 핵심 아이디어

```
PortalHost                    PortalSlot (main)           PortalSlot (mini)
    │                              │                            │
    └── createPortal ──→ target ←── appendChild ──┬── appendChild ──┘
                           │                      │
                      detached DOM          mode에 따라 위치 결정
```

1. **PortalHost**: `createPortal`로 children을 detached DOM(target)에 렌더링
2. **PortalSlot**: 현재 mode에 맞으면 target을 자신의 위치에 `appendChild`
3. **결과**: video DOM이 언마운트되지 않고 위치만 이동

## 구조

```
src/features/
├── portal/                    # DOM 인스턴스 유지 메커니즘
│   ├── model/
│   │   ├── store.ts          # mode, onClose 상태
│   │   └── target.ts         # lazy singleton container
│   └── components/
│       ├── PortalHost.tsx    # children을 target에 렌더링
│       ├── PortalSlot.tsx    # target을 현재 위치에 표시
│       ├── MainPortal.tsx
│       └── MiniPortal.tsx
└── player/                    # 비디오 플레이어 UI
    ├── model/store.ts        # src 상태
    └── components/
        ├── VideoElement.tsx  # 실제 <video>
        ├── MainPlayer.tsx    # 메인 영역 UI
        └── MiniPlayer.tsx    # 미니플레이어 UI
```

## 사용 흐름

```tsx
// __root.tsx - 전역에서 video 렌더링
<PortalHost>
  <VideoElement />
</PortalHost>
<MiniPlayer />

// video.$id.tsx - 비디오 페이지
useEffect(() => {
  activate(stop)  // 이전 비디오 정리 + onClose 등록
  play(src)
  return () => setMode('mini')  // 언마운트 시 미니로 전환
}, [src])

<MainPlayer />
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
- TanStack Router
- Zustand
- TailwindCSS
