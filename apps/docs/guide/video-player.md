---
title: 비디오 플레이어
description: 본문과 미니플레이어가 하나의 video 요소를 공유하고, 닫을 때 명시적으로 일시정지합니다.
---

# 비디오 플레이어

Host 안의 `<video>` 하나와 비어 있는 Slot 두 개로 메인·미니플레이어를 구성합니다. 포털은 **표시 위치**를 바꾸고, 앱은 **재생·소스 변경·닫기 동작**을 관리합니다.

## 전체 예제

[빠르게 시작하기](./quick-start)대로 패키지를 설치하세요. 앱의 `/video.mp4` 주소에 재생 가능한 영상을 준비하거나 `src`를 자신의 영상 URL로 바꾸세요. Vite 앱이라면 `public/video.mp4`에 파일을 두면 됩니다. 앱이 하위 경로에 배포된다면 해당 경로에 맞게 URL도 조정하세요.

브라우저의 기본 `controls`를 사용하므로 별도의 재생 상태 저장소가 필요하지 않습니다. 자동 재생은 하지 않습니다. 영상을 재생한 뒤 **미니로**를 눌러보세요.

```tsx [App.tsx]
import { useEffect, useRef } from 'react'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Player = createPortal({ id: 'video-player', slots: ['main', 'mini'] })

function Video({ src }: { src: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const { slotKey } = Player.usePortal()

  useEffect(() => {
    if (slotKey === null) video.current?.pause()
  }, [slotKey])

  return (
    <video
      ref={video}
      src={src}
      controls
      playsInline
      preload="metadata"
      aria-label="예제 영상"
      style={{ display: 'block', width: '100%' }}
    />
  )
}

export default function App() {
  const { slotKey, setSlotKey, reset } = Player.usePortal()
  useEffect(() => setSlotKey('main'), [setSlotKey])

  return (
    <main>
      <Player.Host mountWhen="connected">
        <Video src="/video.mp4" />
      </Player.Host>

      <h1>영상 보기</h1>
      <Player.Slot slotKey="main" style={{ maxWidth: 720, minHeight: 180 }} />
      <button onClick={() => setSlotKey('main')}>메인으로</button>
      <button onClick={() => setSlotKey('mini')}>미니로</button>

      <aside
        hidden={slotKey !== 'mini'}
        aria-label="미니플레이어"
        style={{ position: 'fixed', right: 16, bottom: 16, width: 'min(320px, 90vw)' }}
      >
        <Player.Slot slotKey="mini" />
        <button onClick={() => setSlotKey('main')}>메인으로 돌아가기</button>
        <button onClick={reset}>플레이어 닫기</button>
      </aside>
    </main>
  )
}
```

## 두 Slot을 계속 마운트하는 이유

미니플레이어의 `hidden` 속성은 보이기만 바꾸고 Slot을 언마운트하지 않습니다. 메인 Slot도 문서에 남습니다. 이렇게 해야 `moveBefore`를 지원하는 브라우저에서 연결된 요소 사이의 이동이 가능합니다.

`mountWhen="connected"`는 첫 목적지가 연결된 뒤에 영상을 마운트하도록 합니다. 이후의 이동이나 숨김 동작을 바꾸는 옵션은 아닙니다.

## 닫았다가 다시 열기

닫기 버튼은 `reset()`을 호출합니다. 영상 컴포넌트는 `slotKey === null`을 확인해 일시정지합니다. **메인으로**를 누르면 같은 요소가 다시 보이며, 영상의 재생 버튼으로 이어 볼 수 있습니다.

일시정지는 이 예제에서 구현한 정책입니다. 라이브러리의 `reset()`이 `pause()`를 호출하거나 재생 시간·컴포넌트 상태를 초기화하지는 않습니다. 커스텀 컨트롤을 만든다면 `play`, `pause`, `ended` 이벤트로 상태를 갱신하고 `play()`의 실패도 처리하세요. [문제 해결](./troubleshooting#playback-state)에서 설명합니다.

## 이동할 때 유지되는 것

Host와 그 자식이 마운트된 동안 비디오 요소와 React 상태는 유지됩니다. 연결된 `moveBefore` 이동은 브라우저 내부 상태도 보존할 수 있습니다. `appendChild` 이동이나 숨김·복귀에서는 재생이 멈출 수 있으므로 사용자가 다시 재생할 수 있게 하세요. `src`를 바꾸면 같은 요소여도 다른 영상이 로드됩니다.

먼저 [실제 동작 예제](../playground)를 확인하고, URL에 따라 위치를 바꾸려면 [라우팅 가이드](./routing)를 이어서 읽어보세요.
