import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { resetPortal, register } from './store'
import { usePortal } from './usePortal'

describe('usePortal', () => {
  beforeEach(() => {
    resetPortal('test-portal')
    resetPortal('default')
  })

  it('기본 포털 ID로 훅을 사용할 수 있음', () => {
    const { result } = renderHook(() => usePortal())

    expect(result.current.mode).toBeNull()
    expect(result.current.returnPath).toBeNull()
    expect(result.current.targets.size).toBe(0)
    expect(typeof result.current.setMode).toBe('function')
    expect(typeof result.current.setReturnPath).toBe('function')
    expect(typeof result.current.reset).toBe('function')
    expect(typeof result.current.registerTarget).toBe('function')
    expect(typeof result.current.unregisterTarget).toBe('function')
  })

  it('커스텀 포털 ID로 훅을 사용할 수 있음', () => {
    const { result } = renderHook(() => usePortal('custom-portal'))

    expect(result.current.mode).toBeNull()
    expect(result.current.returnPath).toBeNull()
  })

  it('setMode로 모드를 설정할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setMode('test-mode')
    })

    expect(result.current.mode).toBe('test-mode')
  })

  it('setMode로 모드를 null로 설정할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setMode('test-mode')
      result.current.setMode(null)
    })

    expect(result.current.mode).toBeNull()
  })

  it('setReturnPath로 리턴 경로를 설정할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setReturnPath('/test-path')
    })

    expect(result.current.returnPath).toBe('/test-path')
  })

  it('setReturnPath로 리턴 경로를 null로 설정할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setReturnPath('/test-path')
      result.current.setReturnPath(null)
    })

    expect(result.current.returnPath).toBeNull()
  })

  it('reset으로 포털을 초기화할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))

    act(() => {
      result.current.setMode('test-mode')
      result.current.setReturnPath('/test-path')
      result.current.reset()
    })

    expect(result.current.mode).toBeNull()
    expect(result.current.returnPath).toBeNull()
    expect(result.current.targets.size).toBe(0)
  })

  it('registerTarget으로 타겟을 등록할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))
    const target = document.createElement('div')

    act(() => {
      result.current.registerTarget('test-mode', target)
    })

    expect(result.current.targets.get('test-mode')).toBe(target)
  })

  it('unregisterTarget으로 타겟을 제거할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))
    const target = document.createElement('div')

    act(() => {
      result.current.registerTarget('test-mode', target)
      result.current.unregisterTarget('test-mode')
    })

    expect(result.current.targets.has('test-mode')).toBe(false)
  })

  it('외부에서 등록된 타겟을 감지할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))
    const target = document.createElement('div')

    act(() => {
      register('test-portal', 'external-mode', target)
    })

    expect(result.current.targets.get('external-mode')).toBe(target)
  })

  it('여러 타겟을 등록하고 관리할 수 있음', () => {
    const { result } = renderHook(() => usePortal('test-portal'))
    const target1 = document.createElement('div')
    const target2 = document.createElement('div')

    act(() => {
      result.current.registerTarget('mode1', target1)
      result.current.registerTarget('mode2', target2)
    })

    expect(result.current.targets.size).toBe(2)
    expect(result.current.targets.get('mode1')).toBe(target1)
    expect(result.current.targets.get('mode2')).toBe(target2)
  })

  it('포털 ID가 변경되면 다른 포털 인스턴스를 참조', () => {
    const { result, rerender } = renderHook(
      ({ portalId }) => usePortal(portalId),
      {
        initialProps: { portalId: 'portal1' },
      },
    )

    act(() => {
      result.current.setMode('mode1')
    })

    expect(result.current.mode).toBe('mode1')

    rerender({ portalId: 'portal2' })

    expect(result.current.mode).toBeNull()
  })
})
