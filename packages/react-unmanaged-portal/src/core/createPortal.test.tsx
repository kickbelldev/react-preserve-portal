import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { resetPortal } from '../model/store'
import { createPortal } from './createPortal'

describe('createPortal', () => {
  beforeEach(() => {
    resetPortal('test-video')
    resetPortal('test-audio')
  })

  it('id와 slots를 반환', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini', 'pip'],
    } as const)

    expect(VideoPortal.id).toBe('test-video')
    expect(VideoPortal.slots).toEqual(['main', 'mini', 'pip'])
  })

  it('Host, Slot, usePortal을 반환', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini'],
    } as const)

    expect(VideoPortal.Host).toBeDefined()
    expect(VideoPortal.Slot).toBeDefined()
    expect(VideoPortal.usePortal).toBeDefined()
  })

  it('Host와 Slot이 함께 동작', async () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini'],
    } as const)

    function TestComponent() {
      const { setSlotKey } = VideoPortal.usePortal()

      return (
        <>
          <VideoPortal.Host node={<div>Video Content</div>} />
          <VideoPortal.Slot slotKey="main" data-testid="main-slot" />
          <button onClick={() => setSlotKey('main')}>Show Main</button>
        </>
      )
    }

    render(<TestComponent />)

    // 초기에는 slotKey가 null이므로 콘텐츠가 보이지 않음
    expect(screen.queryByText('Video Content')).not.toBeInTheDocument()

    // setSlotKey로 main 슬롯 활성화
    act(() => {
      screen.getByText('Show Main').click()
    })

    await waitFor(() => {
      expect(screen.getByText('Video Content')).toBeInTheDocument()
    })
  })

  it('슬롯 간 이동', async () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini'],
    } as const)

    function TestComponent() {
      const { setSlotKey } = VideoPortal.usePortal()

      return (
        <>
          <VideoPortal.Host node={<div>Video Content</div>} />
          <div data-testid="main-container">
            <VideoPortal.Slot slotKey="main" />
          </div>
          <div data-testid="mini-container">
            <VideoPortal.Slot slotKey="mini" />
          </div>
          <button onClick={() => setSlotKey('main')}>Main</button>
          <button onClick={() => setSlotKey('mini')}>Mini</button>
        </>
      )
    }

    render(<TestComponent />)

    // main 슬롯으로 이동
    act(() => {
      screen.getByText('Main').click()
    })

    await waitFor(() => {
      const mainContainer = screen.getByTestId('main-container')
      expect(mainContainer.textContent).toContain('Video Content')
    })

    // mini 슬롯으로 이동
    act(() => {
      screen.getByText('Mini').click()
    })

    await waitFor(() => {
      const miniContainer = screen.getByTestId('mini-container')
      expect(miniContainer.textContent).toContain('Video Content')
    })
  })

  it('여러 Portal 인스턴스가 독립적으로 동작', async () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini'],
    } as const)

    const AudioPortal = createPortal({
      id: 'test-audio',
      slots: ['player', 'widget'],
    } as const)

    function TestComponent() {
      const videoPortal = VideoPortal.usePortal()
      const audioPortal = AudioPortal.usePortal()

      return (
        <>
          <VideoPortal.Host node={<div>Video</div>} />
          <AudioPortal.Host node={<div>Audio</div>} />

          <div data-testid="video-main">
            <VideoPortal.Slot slotKey="main" />
          </div>
          <div data-testid="audio-player">
            <AudioPortal.Slot slotKey="player" />
          </div>

          <button onClick={() => videoPortal.setSlotKey('main')}>
            Show Video
          </button>
          <button onClick={() => audioPortal.setSlotKey('player')}>
            Show Audio
          </button>
        </>
      )
    }

    render(<TestComponent />)

    // 비디오만 활성화
    act(() => {
      screen.getByText('Show Video').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('video-main').textContent).toContain('Video')
      expect(screen.getByTestId('audio-player').textContent).not.toContain(
        'Audio',
      )
    })

    // 오디오도 활성화
    act(() => {
      screen.getByText('Show Audio').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('video-main').textContent).toContain('Video')
      expect(screen.getByTestId('audio-player').textContent).toContain('Audio')
    })
  })

  it('usePortal이 올바른 상태를 반환', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini'],
    } as const)

    let portalState: ReturnType<typeof VideoPortal.usePortal> | null = null

    function TestComponent() {
      portalState = VideoPortal.usePortal()
      return (
        <>
          <VideoPortal.Slot slotKey="main" />
          <VideoPortal.Slot slotKey="mini" />
        </>
      )
    }

    render(<TestComponent />)

    expect(portalState).not.toBeNull()
    expect(portalState!.slotKey).toBeNull()
    expect(portalState!.returnPath).toBeNull()
    expect(portalState!.targets.size).toBe(2)
    expect(portalState!.targets.has('main')).toBe(true)
    expect(portalState!.targets.has('mini')).toBe(true)
  })

  it('returnPath 설정 및 조회', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main'],
    } as const)

    let portalState: ReturnType<typeof VideoPortal.usePortal> | null = null

    function TestComponent() {
      portalState = VideoPortal.usePortal()
      return <VideoPortal.Slot slotKey="main" />
    }

    render(<TestComponent />)

    act(() => {
      portalState!.setReturnPath('/video/123')
    })

    expect(portalState!.returnPath).toBe('/video/123')
  })

  it('reset으로 상태 초기화', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main'],
    } as const)

    let portalState: ReturnType<typeof VideoPortal.usePortal> | null = null

    function TestComponent() {
      portalState = VideoPortal.usePortal()
      return <VideoPortal.Slot slotKey="main" />
    }

    render(<TestComponent />)

    act(() => {
      portalState!.setSlotKey('main')
      portalState!.setReturnPath('/video/123')
    })

    expect(portalState!.slotKey).toBe('main')
    expect(portalState!.returnPath).toBe('/video/123')

    act(() => {
      portalState!.reset()
    })

    expect(portalState!.slotKey).toBeNull()
    expect(portalState!.returnPath).toBeNull()
  })

  it('Slot에 HTML 속성 전달', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main'],
    } as const)

    render(
      <VideoPortal.Slot
        slotKey="main"
        className="video-slot"
        data-testid="video-slot"
      />,
    )

    const slot = screen.getByTestId('video-slot')
    expect(slot.className).toBe('video-slot')
  })

  it('Host에 커스텀 컨테이너 태그 사용', async () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main'],
    } as const)

    function TestComponent() {
      const { setSlotKey } = VideoPortal.usePortal()

      return (
        <>
          <VideoPortal.Host as="section" node={<div>Content</div>} />
          <VideoPortal.Slot slotKey="main" />
          <button onClick={() => setSlotKey('main')}>Show</button>
        </>
      )
    }

    render(<TestComponent />)

    act(() => {
      screen.getByText('Show').click()
    })

    await waitFor(() => {
      const content = screen.getByText('Content')
      expect(content.parentElement?.tagName.toLowerCase()).toBe('section')
    })
  })
})
