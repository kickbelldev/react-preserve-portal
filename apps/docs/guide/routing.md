---
title: 라우팅
description: 공통 레이아웃에 플레이어를 유지하고 현재 경로에 따라 표시할 슬롯을 선택합니다.
---

# 라우팅

라우트가 바뀌어도 유지되는 레이아웃에 Host를 두세요. 경로 변경은 플레이어를 다시 만드는 대신 Slot을 선택하도록 연결합니다. 라우팅 없는 기본 구성은 [비디오 플레이어](./video-player)에서 먼저 확인할 수 있습니다.

## 라우터와 공통 레이아웃 연결

아래 컴포넌트는 `pathname`, `navigate`, 현재 페이지의 `children`을 props로 받습니다. 사용하는 라우터에서 이 값을 받아 페이지 위에 `PlayerLayout`을 배치하세요. React Router라면 `useLocation().pathname`, `useNavigate()`, `<Outlet />`을 각각 연결할 수 있습니다. **라이브러리가 라우터를 설치하거나 제어하지는 않습니다.**

예제는 `/watch/*`를 메인 플레이어 화면으로 취급합니다. `/video.mp4`에 영상을 준비하거나 URL을 바꾸세요. 이 예제는 라우트를 옮겨도 하나의 영상 소스를 유지합니다.

```tsx [PlayerLayout.tsx]
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Player = createPortal({ id: 'routed-player', slots: ['main', 'mini'] })

type Props = {
  pathname: string
  navigate: (path: string) => void
  children: ReactNode
}

export function PlayerLayout({ pathname, navigate, children }: Props) {
  const { slotKey, setSlotKey, returnPath, setReturnPath, reset } =
    Player.usePortal()
  const watching = pathname.startsWith('/watch/')
  const wasWatching = useRef(false)
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (watching) {
      setReturnPath(pathname)
      setSlotKey('main')
    } else if (wasWatching.current) {
      setSlotKey('mini')
    }
    wasWatching.current = watching
  }, [pathname, watching, setSlotKey, setReturnPath])

  useEffect(() => {
    if (slotKey === null) video.current?.pause()
  }, [slotKey])

  return (
    <>
      <Player.Host mountWhen="connected">
        <video
          ref={video}
          src="/video.mp4"
          controls
          playsInline
          style={{ width: '100%' }}
        />
      </Player.Host>
      {children}
      <section hidden={!watching} aria-label="메인 플레이어">
        <Player.Slot slotKey="main" />
      </section>
      <aside
        hidden={slotKey !== 'mini'}
        aria-label="미니플레이어"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          width: 'min(320px, 90vw)',
        }}
      >
        <Player.Slot slotKey="mini" />
        {returnPath && (
          <button onClick={() => navigate(returnPath)}>
            영상으로 돌아가기
          </button>
        )}
        <button onClick={reset}>플레이어 닫기</button>
      </aside>
    </>
  )
}
```

## 전환별 결과 확인

| 동작                                           | 결과                                                        |
| ---------------------------------------------- | ----------------------------------------------------------- |
| 처음 홈에 방문                                 | 선택한 Slot이 없어 플레이어를 숨깁니다.                     |
| `/watch/1`에 방문                              | `main`을 선택하고 `returnPath`에 `/watch/1`을 저장합니다.   |
| `/watch/1`에서 다른 페이지로 이동              | `mini`를 선택해 같은 영상을 미니플레이어로 옮깁니다.        |
| 미니플레이어를 닫은 뒤 다른 일반 페이지로 이동 | 숨긴 상태를 유지합니다. 경로 변경만으로 다시 열지 않습니다. |
| 시청 경로에 다시 방문                          | 메인 플레이어를 보여줍니다. 재생은 사용자가 조작합니다.     |

`returnPath`는 메타데이터입니다. 돌아가기 버튼이 앱의 `navigate`를 호출하며, `setReturnPath()`나 `reset()` 자체는 URL을 바꾸지 않습니다.

## 연결을 유지하려면 Slot도 유지하기

이 레이아웃은 두 Slot을 계속 마운트합니다. `hidden`은 가시성을 바꾸지만 DOM에서 요소를 제거하지 않습니다. 페이지 안의 Slot을 먼저 제거하면 다음 페이지가 목적지를 등록하기 전에 콘텐츠가 잠시 분리될 수 있습니다. Host가 유지되면 React 상태는 이어질 수 있지만, iframe 문서와 포커스는 영향을 받을 수 있습니다.

지속적으로 마운트된 Slot은 지원 브라우저에서 연결된 `moveBefore` 이동을 가능하게 합니다. 브라우저의 미디어 재생 정책까지 바꾸지는 않습니다. 숨김이나 폴백 이동에서는 재생이 멈출 수 있으므로 다시 재생할 컨트롤을 유지하세요.

공통 레이아웃이 언마운트되거나 Host에 `key={pathname}`을 지정하면 콘텐츠가 새로 만들어집니다. 전체 페이지 이동도 새 문서를 생성합니다. [보존 원리와 수명](./preservation)에서 유지되는 범위를 확인하세요.
