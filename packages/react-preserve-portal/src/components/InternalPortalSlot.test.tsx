import { render } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { resetPortal, getOrCreatePortal } from '../model/store'
import { InternalPortalSlot } from './InternalPortalSlot'

describe('InternalPortalSlot', () => {
  beforeEach(() => {
    resetPortal('test-portal')
    resetPortal('default')
  })

  it('renders with default portal ID', () => {
    const { container } = render(<InternalPortalSlot slotKey="main" />)

    const element = container.firstChild as HTMLElement
    expect(element).toBeInTheDocument()
    expect(element.tagName.toLowerCase()).toBe('div')

    const instance = getOrCreatePortal('default')
    expect(instance.targets.get('main')).toBe(element)
  })

  it('renders with custom portal ID', () => {
    const { container } = render(
      <InternalPortalSlot portalId="custom-portal" slotKey="main" />,
    )

    const element = container.firstChild as HTMLElement
    expect(element).toBeInTheDocument()

    const instance = getOrCreatePortal('custom-portal')
    expect(instance.targets.get('main')).toBe(element)
  })

  it('renders with custom container tag', () => {
    const { container } = render(
      <InternalPortalSlot slotKey="main" as="section" />,
    )

    const element = container.firstChild as HTMLElement
    expect(element.tagName.toLowerCase()).toBe('section')

    const instance = getOrCreatePortal('default')
    expect(instance.targets.get('main')).toBe(element)
  })

  it('passes HTML attributes', () => {
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

  it('updates target when slot key changes', () => {
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

  it('removes target on unmount', () => {
    const { container, unmount } = render(<InternalPortalSlot slotKey="main" />)

    const element = container.firstChild as HTMLElement
    const instanceBefore = getOrCreatePortal('default')
    expect(instanceBefore.targets.get('main')).toBe(element)

    unmount()

    const instanceAfter = getOrCreatePortal('default')
    expect(instanceAfter.targets.has('main')).toBe(false)
  })

  it('registers multiple InternalPortalSlot with different slot keys', () => {
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

  it('registers last one when multiple InternalPortalSlot use same slot key', () => {
    const { unmount: unmount1 } = render(
      <InternalPortalSlot slotKey="main" id="slot1" />,
    )
    const { container: container2 } = render(
      <InternalPortalSlot slotKey="main" id="slot2" />,
    )

    const element2 = container2.firstChild as HTMLElement

    const instance = getOrCreatePortal('default')
    // Second one is rendered later, so it's registered
    expect(instance.targets.get('main')).toBe(element2)

    unmount1()

    // Stale cleanup must leave the newer mounted Slot registered.
    const instanceAfter = getOrCreatePortal('default')
    expect(instanceAfter.targets.get('main')).toBe(element2)
  })

  it('manages multiple InternalPortalSlot with different portal IDs independently', () => {
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
