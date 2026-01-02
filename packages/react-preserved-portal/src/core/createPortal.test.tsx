import { render, screen, waitFor, act, renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { resetPortal } from '../model/store'
import { createPortal } from './createPortal'

describe('createPortal', () => {
  beforeEach(() => {
    resetPortal('test-video')
    resetPortal('test-audio')
  })

  it('returns id and slots', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini', 'pip'],
    } as const)

    expect(VideoPortal.id).toBe('test-video')
    expect(VideoPortal.slots).toEqual(['main', 'mini', 'pip'])
  })

  it('returns Host, Slot, and usePortal', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini'],
    } as const)

    expect(VideoPortal.Host).toBeDefined()
    expect(VideoPortal.Slot).toBeDefined()
    expect(VideoPortal.usePortal).toBeDefined()
  })

  it('Host and Slot work together', async () => {
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

    // Initially content is not visible because slotKey is null
    expect(screen.queryByText('Video Content')).not.toBeInTheDocument()

    // Activate main slot with setSlotKey
    act(() => {
      screen.getByText('Show Main').click()
    })

    await waitFor(() => {
      expect(screen.getByText('Video Content')).toBeInTheDocument()
    })
  })

  it('moves content between slots', async () => {
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

    // Move to main slot
    act(() => {
      screen.getByText('Main').click()
    })

    await waitFor(() => {
      const mainContainer = screen.getByTestId('main-container')
      expect(mainContainer.textContent).toContain('Video Content')
    })

    // Move to mini slot
    act(() => {
      screen.getByText('Mini').click()
    })

    await waitFor(() => {
      const miniContainer = screen.getByTestId('mini-container')
      expect(miniContainer.textContent).toContain('Video Content')
    })
  })

  it('multiple Portal instances work independently', async () => {
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

    // Activate video only
    act(() => {
      screen.getByText('Show Video').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('video-main').textContent).toContain('Video')
      expect(screen.getByTestId('audio-player').textContent).not.toContain(
        'Audio',
      )
    })

    // Activate audio as well
    act(() => {
      screen.getByText('Show Audio').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('video-main').textContent).toContain('Video')
      expect(screen.getByTestId('audio-player').textContent).toContain('Audio')
    })
  })

  it('usePortal returns correct state', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main', 'mini'],
    } as const)

    render(
      <>
        <VideoPortal.Slot slotKey="main" />
        <VideoPortal.Slot slotKey="mini" />
      </>,
    )

    const { result } = renderHook(() => VideoPortal.usePortal())

    expect(result.current.slotKey).toBeNull()
    expect(result.current.returnPath).toBeNull()
    expect(result.current.targets.size).toBe(2)
    expect(result.current.targets.has('main')).toBe(true)
    expect(result.current.targets.has('mini')).toBe(true)
  })

  it('sets and gets returnPath', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main'],
    } as const)

    render(<VideoPortal.Slot slotKey="main" />)

    const { result } = renderHook(() => VideoPortal.usePortal())

    act(() => {
      result.current.setReturnPath('/video/123')
    })

    expect(result.current.returnPath).toBe('/video/123')
  })

  it('resets state with reset()', () => {
    const VideoPortal = createPortal({
      id: 'test-video',
      slots: ['main'],
    } as const)

    render(<VideoPortal.Slot slotKey="main" />)

    const { result } = renderHook(() => VideoPortal.usePortal())

    act(() => {
      result.current.setSlotKey('main')
      result.current.setReturnPath('/video/123')
    })

    expect(result.current.slotKey).toBe('main')
    expect(result.current.returnPath).toBe('/video/123')

    act(() => {
      result.current.reset()
    })

    expect(result.current.slotKey).toBeNull()
    expect(result.current.returnPath).toBeNull()
  })

  it('passes HTML attributes to Slot', () => {
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

  it('uses custom container tag for Host', async () => {
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
