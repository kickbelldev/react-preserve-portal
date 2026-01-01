import { render } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { resetPortal, getOrCreatePortal } from '../model/store'
import { InternalPortalSlot } from './InternalPortalSlot'

describe('InternalPortalSlot', () => {
  beforeEach(() => {
    resetPortal('test-portal')
    resetPortal('default')
  })

  it('기본 포털 ID로 렌더링', () => {
    const { container } = render(<InternalPortalSlot slotKey="main" />)

    const element = container.firstChild as HTMLElement
    expect(element).toBeInTheDocument()
    expect(element.tagName.toLowerCase()).toBe('div')

    const instance = getOrCreatePortal('default')
    expect(instance.targets.get('main')).toBe(element)
  })

  it('커스텀 포털 ID로 렌더링', () => {
    const { container } = render(
      <InternalPortalSlot portalId="custom-portal" slotKey="main" />,
    )

    const element = container.firstChild as HTMLElement
    expect(element).toBeInTheDocument()

    const instance = getOrCreatePortal('custom-portal')
    expect(instance.targets.get('main')).toBe(element)
  })

  it('커스텀 컨테이너 태그로 렌더링', () => {
    const { container } = render(
      <InternalPortalSlot slotKey="main" as="section" />,
    )

    const element = container.firstChild as HTMLElement
    expect(element.tagName.toLowerCase()).toBe('section')

    const instance = getOrCreatePortal('default')
    expect(instance.targets.get('main')).toBe(element)
  })

  it('HTML 속성을 전달할 수 있음', () => {
    const { container } = render(
      <InternalPortalSlot
        slotKey="main"
        className="test-class"
        id="test-id"
        data-testid="test-slot"
      />,
    )

    const element = container.firstChild as HTMLElement
    expect(element.className).toBe('test-class')
    expect(element.id).toBe('test-id')
    expect(element.getAttribute('data-testid')).toBe('test-slot')
  })

  it('슬롯 키가 변경되면 타겟이 업데이트됨', () => {
    const { container, rerender } = render(
      <InternalPortalSlot slotKey="slotKey1" />,
    )

    const element1 = container.firstChild as HTMLElement
    const instance1 = getOrCreatePortal('default')
    expect(instance1.targets.get('slotKey1')).toBe(element1)

    rerender(<InternalPortalSlot slotKey="slotKey2" />)

    const element2 = container.firstChild as HTMLElement
    const instance2 = getOrCreatePortal('default')
    expect(instance2.targets.get('slotKey1')).toBeUndefined()
    expect(instance2.targets.get('slotKey2')).toBe(element2)
  })

  it('언마운트 시 타겟이 제거됨', () => {
    const { container, unmount } = render(
      <InternalPortalSlot slotKey="main" />,
    )

    const element = container.firstChild as HTMLElement
    const instanceBefore = getOrCreatePortal('default')
    expect(instanceBefore.targets.get('main')).toBe(element)

    unmount()

    const instanceAfter = getOrCreatePortal('default')
    expect(instanceAfter.targets.has('main')).toBe(false)
  })

  it('여러 InternalPortalSlot이 다른 슬롯 키로 등록됨', () => {
    const { container: container1 } = render(
      <InternalPortalSlot slotKey="slotKey1" />,
    )
    const { container: container2 } = render(
      <InternalPortalSlot slotKey="slotKey2" />,
    )

    const element1 = container1.firstChild as HTMLElement
    const element2 = container2.firstChild as HTMLElement

    const instance = getOrCreatePortal('default')
    expect(instance.targets.get('slotKey1')).toBe(element1)
    expect(instance.targets.get('slotKey2')).toBe(element2)
    expect(instance.targets.size).toBe(2)
  })

  it('같은 슬롯 키로 여러 InternalPortalSlot을 렌더링하면 마지막 것이 등록됨', () => {
    const { unmount: unmount1 } = render(
      <InternalPortalSlot slotKey="main" id="slot1" />,
    )
    const { container: container2 } = render(
      <InternalPortalSlot slotKey="main" id="slot2" />,
    )

    const element2 = container2.firstChild as HTMLElement

    const instance = getOrCreatePortal('default')
    // 두 번째가 나중에 렌더링되어 마지막 것이 등록됨
    expect(instance.targets.get('main')).toBe(element2)

    unmount1()

    // 첫 번째가 언마운트되면 cleanup으로 'main' 슬롯 키가 제거됨
    // 두 번째 InternalPortalSlot은 여전히 마운트되어 있지만,
    // useLayoutEffect가 다시 실행되지 않으므로 다시 등록되지 않음
    const instanceAfter = getOrCreatePortal('default')
    expect(instanceAfter.targets.has('main')).toBe(false)
  })

  it('다른 포털 ID로 여러 InternalPortalSlot을 독립적으로 관리', () => {
    const { container: container1 } = render(
      <InternalPortalSlot portalId="portal1" slotKey="main" />,
    )
    const { container: container2 } = render(
      <InternalPortalSlot portalId="portal2" slotKey="main" />,
    )

    const element1 = container1.firstChild as HTMLElement
    const element2 = container2.firstChild as HTMLElement

    const instance1 = getOrCreatePortal('portal1')
    const instance2 = getOrCreatePortal('portal2')

    expect(instance1.targets.get('main')).toBe(element1)
    expect(instance2.targets.get('main')).toBe(element2)
  })
})
