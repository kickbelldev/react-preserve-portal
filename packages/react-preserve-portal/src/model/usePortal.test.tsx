import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { resetPortal, register, unregister, getOrCreatePortal } from './store'
import { usePortal } from './usePortal'

describe('usePortal', () => {
  beforeEach(() => {
    for (const id of ['test-portal', 'default']) {
      for (const key of getOrCreatePortal(id).targets.keys())
        unregister(id, key)
    }
    resetPortal('test-portal')
    resetPortal('default')
  })

  it('uses hook with default portal ID', () => {
    const { result } = renderHook(() => usePortal())

    expect(result.current.slotKey).toBeNull()
    expect(result.current.returnPath).toBeNull()
    expect(result.current.targets.size).toBe(0)
    expect(typeof result.current.setSlotKey).toBe('function')
    expect(typeof result.current.setReturnPath).toBe('function')
    expect(typeof result.current.reset).toBe('function')
    expect(typeof result.current.registerTarget).toBe('function')
    expect(typeof result.current.unregisterTarget).toBe('function')
  })

  it('uses hook with custom portal ID', () => {
    const { result } = renderHook(() => usePortal('custom-portal'))

    expect(result.current.slotKey).toBeNull()
    expect(result.current.returnPath).toBeNull()
  })

  it('sets slot key with setSlotKey', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setSlotKey('test-slotKey')
    })

    expect(result.current.slotKey).toBe('test-slotKey')
  })

  it('sets slot key to null with setSlotKey', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setSlotKey('test-slotKey')
      result.current.setSlotKey(null)
    })

    expect(result.current.slotKey).toBeNull()
  })

  it('sets return path with setReturnPath', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setReturnPath('/test-path')
    })

    expect(result.current.returnPath).toBe('/test-path')
  })

  it('sets return path to null with setReturnPath', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setReturnPath('/test-path')
      result.current.setReturnPath(null)
    })

    expect(result.current.returnPath).toBeNull()
  })

  it('resets portal with reset', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setSlotKey('test-slotKey')
      result.current.setReturnPath('/test-path')
      result.current.reset()
    })

    expect(result.current.slotKey).toBeNull()
    expect(result.current.returnPath).toBeNull()
    expect(result.current.targets.size).toBe(0)
  })

  it('registers target with registerTarget', () => {
    const { result } = renderHook(() => usePortal('test-portal'))
    const target = document.createElement('div')

    act(() => {
      result.current.registerTarget('test-slotKey', target)
    })

    expect(result.current.targets.get('test-slotKey')).toBe(target)
  })

  it('removes target with unregisterTarget', () => {
    const { result } = renderHook(() => usePortal('test-portal'))
    const target = document.createElement('div')

    act(() => {
      result.current.registerTarget('test-slotKey', target)
      result.current.unregisterTarget('test-slotKey')
    })

    expect(result.current.targets.has('test-slotKey')).toBe(false)
  })

  it('detects externally registered target', () => {
    const { result } = renderHook(() => usePortal('test-portal'))
    const target = document.createElement('div')

    act(() => {
      register('test-portal', 'external-slotKey', target)
    })

    expect(result.current.targets.get('external-slotKey')).toBe(target)
  })

  it('registers and manages multiple targets', () => {
    const { result } = renderHook(() => usePortal('test-portal'))
    const target1 = document.createElement('div')
    const target2 = document.createElement('div')

    act(() => {
      result.current.registerTarget('slotKey1', target1)
      result.current.registerTarget('slotKey2', target2)
    })

    expect(result.current.targets.size).toBe(2)
    expect(result.current.targets.get('slotKey1')).toBe(target1)
    expect(result.current.targets.get('slotKey2')).toBe(target2)
  })

  it('references different portal instance when portal ID changes', () => {
    const { result, rerender } = renderHook(
      ({ portalId }) => usePortal(portalId),
      {
        initialProps: { portalId: 'portal1' },
      },
    )

    act(() => {
      result.current.setSlotKey('slotKey1')
    })

    expect(result.current.slotKey).toBe('slotKey1')

    rerender({ portalId: 'portal2' })

    expect(result.current.slotKey).toBeNull()
  })
})
