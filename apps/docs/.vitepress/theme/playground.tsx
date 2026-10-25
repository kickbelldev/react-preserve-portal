import {
  StrictMode,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { exampleVideoSource } from '../../../../assets/media/source'
import poster from '../../../../assets/media/portal-reel.webp?url'
import { createPortal } from '@charley-kim/react-preserve-portal'

const Demo = createPortal({
  id: 'documentation-playground',
  slots: ['main', 'mini'],
})

const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(motionQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const prefersReducedMotion = () => window.matchMedia(motionQuery).matches

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className="demo-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const icons = {
  main: (
    <Icon>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Icon>
  ),
  mini: (
    <Icon>
      <rect x="3" y="4" width="18" height="15" rx="2" />
      <rect
        x="12"
        y="11"
        width="7"
        height="6"
        rx="1"
        fill="currentColor"
        fillOpacity=".25"
      />
    </Icon>
  ),
  hide: (
    <Icon>
      <path d="M10.7 5.1A10 10 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-2.3 3.4M6.6 6.6C4.2 8 2.6 10.2 2 12c1 2.5 5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </Icon>
  ),
  reset: (
    <Icon>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </Icon>
  ),
  play: (
    <Icon>
      <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
    </Icon>
  ),
  pause: (
    <Icon>
      <path d="M8 5v14M16 5v14" strokeWidth="3" />
    </Icon>
  ),
  check: (
    <Icon>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  ),
  info: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Icon>
  ),
}

function formatTime(seconds: number) {
  const s = Number.isFinite(seconds) ? Math.floor(seconds) : 0
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function PreservedCard({ ko, autoPlay }: { ko: boolean; autoPlay: boolean }) {
  const { slotKey } = Demo.usePortal()
  const [count, setCount] = useState(0)
  const [lastSlot, setLastSlot] = useState(slotKey)
  const [moves, setMoves] = useState(0)
  const [media] = useState(exampleVideoSource)
  const [playing, setPlaying] = useState(false)
  const [playbackError, setPlaybackError] = useState(false)
  const request = useRef({ id: 0 })
  const autoplayAttempted = useRef(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const video = useRef<HTMLVideoElement>(null)
  const id = useId()

  // Count moves between destinations; only a preserved instance keeps this.
  if (slotKey !== null && slotKey !== lastSlot) {
    setLastSlot(slotKey)
    if (lastSlot !== null) setMoves(moves + 1)
  }

  useEffect(() => {
    const pending = request.current
    if (slotKey === null || !autoPlay) {
      pending.id++
      video.current?.pause()
      // Enabling motion later must not start previously paused media.
      autoplayAttempted.current = true
    } else if (!autoplayAttempted.current) {
      autoplayAttempted.current = true
      const currentRequest = ++pending.id
      void video.current?.play().catch(() => {
        if (currentRequest === pending.id) setPlaybackError(true)
      })
    }
    return () => {
      pending.id++
    }
  }, [slotKey, autoPlay])

  function togglePlay() {
    const element = video.current
    if (!element) return
    const currentRequest = ++request.current.id
    setPlaybackError(false)
    if (element.paused) {
      void element.play().catch(() => {
        if (currentRequest === request.current.id) setPlaybackError(true)
      })
    } else element.pause()
  }

  return (
    <div className="demo-editor" data-testid="preserved-editor">
      <div className="demo-media">
        <video
          ref={video}
          data-testid="preserved-video"
          poster={poster}
          src={media}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={
            ko
              ? '타임코드가 흐르는 예제 영상'
              : 'Example video with a running timecode'
          }
          onPlay={(event) => {
            setPlaying(!event.currentTarget.paused)
            setPlaybackError(false)
          }}
          onPause={() => setPlaying(false)}
          onError={() => setPlaybackError(true)}
          onLoadedMetadata={(event) =>
            setDuration(event.currentTarget.duration)
          }
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        />
        <div className="demo-media-bar">
          <button
            className="demo-play"
            onClick={togglePlay}
            aria-label={
              playing ? (ko ? '일시정지' : 'Pause') : ko ? '재생' : 'Play'
            }
          >
            {playing ? icons.pause : icons.play}
          </button>
          <span className="demo-time">
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </div>
      </div>
      <div className="demo-body">
        {playbackError && (
          <p role="status" data-testid="playback-error">
            {ko
              ? '재생할 수 없습니다. 재생 버튼으로 다시 시도해 주세요.'
              : 'Playback failed. Use Play to try again.'}
          </p>
        )}
        <div className="demo-card-top">
          <span className="demo-dot" />
          {ko ? '하나의 React 인스턴스' : 'One React instance'}
          <span className="demo-chip">
            {ko
              ? `이동 ${moves}회`
              : `${moves} ${moves === 1 ? 'move' : 'moves'}`}
          </span>
        </div>
        <label htmlFor={id}>
          {ko ? '이 메모는 이동해도 그대로' : 'A note that moves with you'}
        </label>
        <input
          id={id}
          data-testid="preserved-input"
          defaultValue={
            ko
              ? '여기에 입력하고 이동해 보세요'
              : 'Type something, then move me'
          }
        />
        <div className="demo-card-bottom">
          <span>{ko ? 'React 상태' : 'React state'}</span>
          <button
            className="demo-counter"
            data-testid="increment"
            onClick={() => setCount(count + 1)}
            aria-label={
              ko ? `카운터 증가: ${count}` : `Increment counter: ${count}`
            }
          >
            + <strong>{count}</strong>
          </button>
        </div>
      </div>
    </div>
  )
}

function Playground({ ko }: { ko: boolean }) {
  const { slotKey, setSlotKey, reset } = Demo.usePortal()
  const [animate, setAnimate] = useState(false)
  const nativeMove =
    'moveBefore' in Element.prototype &&
    typeof Element.prototype.moveBefore === 'function'
  const transitions = typeof document.startViewTransition === 'function'
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    prefersReducedMotion,
    () => true,
  )

  useEffect(() => {
    setSlotKey('main')
    return reset
  }, [setSlotKey, reset])

  function move(key: 'main' | 'mini' | null) {
    if (animate && transitions && !reducedMotion) {
      // Commit React's update inside the browser's snapshot callback.
      const transition = document.startViewTransition(() =>
        flushSync(() => setSlotKey(key)),
      )
      void transition.ready.catch(() => {})
    } else {
      setSlotKey(key)
    }
  }

  const empty = ko ? '비어 있음' : 'Empty'

  return (
    <section
      aria-label={ko ? '포털 상태 보존 예제' : 'Portal preservation example'}
    >
      <div className="demo-toolbar">
        <span className="demo-eyebrow">
          <span className="demo-live" />
          LIVE
        </span>
        <span
          className="demo-capability"
          data-native={nativeMove}
          title={
            ko
              ? '연결된 슬롯 사이의 이동에 사용하는 브라우저 API'
              : 'Browser API used for moves between connected slots'
          }
        >
          {nativeMove ? icons.check : icons.info}
          {nativeMove
            ? ko
              ? 'moveBefore 지원 브라우저'
              : 'moveBefore supported'
            : ko
              ? 'appendChild 폴백'
              : 'appendChild fallback'}
        </span>
      </div>
      <Demo.Host mountWhen="connected">
        <PreservedCard ko={ko} autoPlay={!reducedMotion} />
      </Demo.Host>
      <div className="demo-destinations">
        <div className="demo-destination" data-active={slotKey === 'main'}>
          <div className="demo-window-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span className="demo-url">/watch/reel</span>
          </div>
          <div className="demo-slot-label">
            <span>{ko ? '메인 화면' : 'Main view'}</span>
            <code>slotKey="main"</code>
          </div>
          <Demo.Slot
            slotKey="main"
            className="demo-slot"
            data-empty={empty}
            data-testid="main-slot"
          />
        </div>
        <div
          className="demo-destination demo-destination-mini"
          data-active={slotKey === 'mini'}
        >
          <div className="demo-window-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <span className="demo-url">/home</span>
          </div>
          <div className="demo-skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="demo-slot-label">
            <span>{ko ? '미니 플레이어' : 'Mini player'}</span>
            <code>slotKey="mini"</code>
          </div>
          <Demo.Slot
            slotKey="mini"
            className="demo-slot"
            data-empty={empty}
            data-testid="mini-slot"
          />
        </div>
      </div>
      <div className="demo-controls">
        <div
          className="demo-segmented"
          role="group"
          aria-label={ko ? '목적지 선택' : 'Choose a destination'}
        >
          <button
            data-testid="to-main"
            aria-pressed={slotKey === 'main'}
            onClick={() => move('main')}
          >
            {icons.main}
            {ko ? '메인으로' : 'Move to main'}
          </button>
          <button
            data-testid="to-mini"
            aria-pressed={slotKey === 'mini'}
            onClick={() => move('mini')}
          >
            {icons.mini}
            {ko ? '미니로' : 'Move to mini'}
          </button>
          <button
            data-testid="hide"
            aria-pressed={slotKey === null}
            onClick={() => move(null)}
          >
            {icons.hide}
            {ko ? '숨기기' : 'Hide'}
          </button>
        </div>
        <button className="demo-reset" data-testid="reset" onClick={reset}>
          {icons.reset}
          <code>reset()</code>
        </button>
      </div>
      <div className="demo-status">
        <span role="status" aria-live="polite">
          slotKey: <code>{slotKey === null ? 'null' : `'${slotKey}'`}</code>
        </span>
        <label className="demo-switch">
          <input
            type="checkbox"
            checked={animate}
            disabled={!transitions || reducedMotion}
            onChange={(event) => setAnimate(event.target.checked)}
          />
          <span className="demo-switch-track" aria-hidden="true" />
          View Transition
        </label>
      </div>
      <p className="demo-hint">
        {ko
          ? '숨기기와 reset()은 영상을 일시정지합니다. 돌아온 뒤 재생 버튼을 눌러 이어 보세요. 메모와 카운터는 유지됩니다.'
          : 'Hide and reset() pause the video. Press Play after bringing it back. The note and counter stay intact.'}
      </p>
    </section>
  )
}

export function mountPlayground(element: HTMLElement, ko: boolean) {
  const root = createRoot(element)
  root.render(
    <StrictMode>
      <Playground ko={ko} />
    </StrictMode>,
  )
  return () => root.unmount()
}
