import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { resetPortal, setMode, register } from '../model/store'
import { PortalHost } from './PortalHost'

describe('PortalHost', () => {
  beforeEach(() => {
    resetPortal('test-portal')
    resetPortal('default')
  })

  it('기본 포털 ID로 렌더링', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)

    register('default', 'main', target)
    setMode('default', 'main')

    render(
      <PortalHost>
        <div>Test Content</div>
      </PortalHost>,
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
    expect(
      target.contains(screen.getByText('Test Content').parentElement),
    ).toBe(true)

    document.body.removeChild(target)
  })

  it('커스텀 포털 ID로 렌더링', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)

    register('custom-portal', 'main', target)
    setMode('custom-portal', 'main')

    render(
      <PortalHost portalId="custom-portal">
        <div>Custom Portal Content</div>
      </PortalHost>,
    )

    expect(screen.getByText('Custom Portal Content')).toBeInTheDocument()

    document.body.removeChild(target)
  })

  it('커스텀 컨테이너 태그로 렌더링', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)

    register('default', 'main', target)
    setMode('default', 'main')

    render(
      <PortalHost as="section">
        <div>Section Content</div>
      </PortalHost>,
    )

    const content = screen.getByText('Section Content')
    const container = content.parentElement

    expect(container?.tagName.toLowerCase()).toBe('section')

    document.body.removeChild(target)
  })

  it('모드가 설정되지 않으면 렌더링되지 않음', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)

    register('default', 'main', target)
    // setMode를 호출하지 않음

    render(
      <PortalHost>
        <div>Should Not Render</div>
      </PortalHost>,
    )

    // 포털이 타겟에 연결되지 않았으므로 body에 직접 렌더링되지 않음
    expect(screen.queryByText('Should Not Render')).not.toBeInTheDocument()

    document.body.removeChild(target)
  })

  it('모드가 변경되면 새로운 타겟으로 이동', async () => {
    const target1 = document.createElement('div')
    const target2 = document.createElement('div')
    target1.id = 'target1'
    target2.id = 'target2'
    document.body.appendChild(target1)
    document.body.appendChild(target2)

    register('default', 'mode1', target1)
    register('default', 'mode2', target2)
    setMode('default', 'mode1')

    render(
      <PortalHost>
        <div>Moving Content</div>
      </PortalHost>,
    )

    await waitFor(() => {
      expect(
        target1.contains(screen.getByText('Moving Content').parentElement),
      ).toBe(true)
    })

    act(() => {
      setMode('default', 'mode2')
    })

    await waitFor(() => {
      expect(
        target2.contains(screen.getByText('Moving Content').parentElement),
      ).toBe(true)
    })

    document.body.removeChild(target1)
    document.body.removeChild(target2)
  })

  it('언마운트 시 DOM에서 제거', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)

    register('default', 'main', target)
    setMode('default', 'main')

    const { unmount } = render(
      <PortalHost>
        <div>Will Be Removed</div>
      </PortalHost>,
    )

    expect(target.children.length).toBeGreaterThan(0)

    unmount()

    expect(target.children.length).toBe(0)

    document.body.removeChild(target)
  })

  it('여러 PortalHost가 같은 포털을 사용할 수 있음', () => {
    const target = document.createElement('div')
    document.body.appendChild(target)

    register('default', 'main', target)
    setMode('default', 'main')

    render(
      <>
        <PortalHost>
          <div>Content 1</div>
        </PortalHost>
        <PortalHost>
          <div>Content 2</div>
        </PortalHost>
      </>,
    )

    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()

    document.body.removeChild(target)
  })
})
