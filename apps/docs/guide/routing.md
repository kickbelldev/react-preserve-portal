---
description: 라우트 변경에도 콘텐츠를 유지하도록 Host를 배치하고 목적지를 전환합니다.
---

# 라우팅

라우트가 바뀔 때도 살아 있어야 하는 `Host`와 미니 슬롯을 **공통 레이아웃**에 둡니다. 라우트 페이지에는 해당 페이지의 슬롯만 둡니다. 라이브러리는 특정 라우터에 의존하지 않습니다.

## 레이아웃에서 목적지 선택

다음 예제의 `pathname`과 `navigate`는 사용하는 라우터에서 전달합니다. `Player`는 별도 모듈에서 한 번 정의합니다.

```tsx
import { useEffect, type ReactNode } from 'react'
import { Player } from './player-portal'
import { VideoPlayer } from './VideoPlayer'

export function Layout({
  pathname,
  navigate,
  children,
}: {
  pathname: string
  navigate: (path: string) => void
  children: ReactNode
}) {
  const { setSlotKey, returnPath, setReturnPath } = Player.usePortal()

  useEffect(() => {
    if (pathname.startsWith('/watch/')) {
      setReturnPath(pathname)
      setSlotKey('main')
    } else {
      setSlotKey('mini')
    }
  }, [pathname, setSlotKey, setReturnPath])

  return (
    <>
      <Player.Host>
        <VideoPlayer />
      </Player.Host>
      {children}
      <aside>
        <Player.Slot slotKey="mini" />
        {returnPath && (
          <button onClick={() => navigate(returnPath)}>돌아가기</button>
        )}
      </aside>
    </>
  )
}

export function WatchPage() {
  return <Player.Slot slotKey="main" />
}
```

`returnPath`는 문자열 메타데이터입니다. 뒤로 가기 히스토리, URL 변경, 재생 시작 조건은 애플리케이션에서 관리합니다. 실제 서비스에서는 콘텐츠를 선택했을 때만 미니 플레이어를 표시하는 조건을 추가하세요.

## 라우트 전환과 브라우저 상태

출발 Slot을 먼저 제거하면 컨테이너가 잠시 분리될 수 있습니다. React 상태는 유지되지만 `moveBefore`의 브라우저 상태 보존 조건을 만족하지 못합니다. iframe이나 포커스의 연속성이 필요하면 출발 슬롯을 제거하기 전에 지속적으로 마운트된 미니 슬롯으로 옮기세요. 라우터의 전환 타이밍에 맞춘 앱 수준 제어가 필요합니다.

공통 레이아웃까지 교체되거나 Host의 key를 pathname으로 지정하면 콘텐츠가 재마운트됩니다. 사이트 전체 새로고침이나 브라우저 문서 이동까지 상태를 유지하지는 않습니다.
