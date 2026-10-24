---
description: 라우트 변경에도 콘텐츠를 유지하도록 Host를 배치하고 목적지를 전환합니다.
---

# 라우팅

라우트가 바뀌어도 유지되는 공통 레이아웃에 `Host`와 **양쪽 Slot 모두**를 둡니다. 비활성 목적지는 언마운트하지 않고 CSS로 숨깁니다. 라우트 페이지는 제목과 상세 내용을 렌더링하며 라이브러리는 라우터에 의존하지 않습니다.

## 레이아웃에서 목적지 선택

다음 예제의 `pathname`과 `navigate`는 사용하는 라우터에서 전달합니다. `Player`는 별도 모듈에서 한 번 정의합니다.

```tsx
import { useEffect, useRef, type ReactNode } from 'react'
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
  const { slotKey, setSlotKey, returnPath, setReturnPath } = Player.usePortal()
  const watching = pathname.startsWith('/watch/')
  const wasWatching = useRef(false)

  useEffect(() => {
    if (watching) {
      setReturnPath(pathname)
      setSlotKey('main')
    } else if (wasWatching.current) {
      setSlotKey('mini')
    }
    wasWatching.current = watching
  }, [pathname, watching, setSlotKey, setReturnPath])

  return (
    <>
      <Player.Host>
        <VideoPlayer />
      </Player.Host>
      {children}
      <section hidden={!watching}>
        <Player.Slot slotKey="main" />
      </section>
      <aside hidden={slotKey !== 'mini'}>
        <Player.Slot slotKey="mini" />
        {returnPath && (
          <button onClick={() => navigate(returnPath)}>돌아가기</button>
        )}
      </aside>
    </>
  )
}
```

`returnPath`는 문자열 메타데이터입니다. 뒤로 가기 히스토리, URL 변경, 재생 시작 조건은 애플리케이션에서 관리합니다. 예제는 시청 라우트에서 나갈 때만 mini를 선택하므로 첫 홈 방문이나 닫기 이후에는 미니플레이어를 표시하지 않습니다. 닫을 때는 미디어의 `pause()`를 먼저 호출한 뒤 `reset()`으로 숨기세요. 포털은 재생 상태를 관리하지 않습니다.

## 라우트 전환과 브라우저 상태

출발 Slot을 먼저 제거하면 컨테이너가 잠시 분리될 수 있습니다. React 상태는 유지되지만 `moveBefore`의 브라우저 상태 보존 조건을 만족하지 못합니다. 위처럼 양쪽 Slot을 계속 마운트하면 라우터의 제거 타이밍과 별도 조율 없이 연결된 이동이 가능합니다. 저장소 데모도 이 구조를 사용합니다. 미지원 브라우저는 여전히 `appendChild`를 사용하므로 DOM 정체성은 유지되지만 브라우저 내부 상태까지 일괄 보장하지는 않습니다.

공통 레이아웃까지 교체되거나 Host의 key를 pathname으로 지정하면 콘텐츠가 재마운트됩니다. 사이트 전체 새로고침이나 브라우저 문서 이동까지 상태를 유지하지는 않습니다.
