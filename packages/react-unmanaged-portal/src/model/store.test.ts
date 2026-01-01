import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_PORTAL_ID,
  getOrCreatePortal,
  register,
  unregister,
  setMode,
  setReturnPath,
  resetPortal,
} from './store'

describe('store', () => {
  beforeEach(() => {
    // 각 테스트 전에 포털 상태 초기화
    // 테스트에서 사용한 포털 ID들을 리셋
    resetPortal('test-portal')
    resetPortal('new-portal')
    resetPortal('portal1')
    resetPortal('portal2')
  })

  describe('DEFAULT_PORTAL_ID', () => {
    it('기본 포털 ID가 올바른지 확인', () => {
      expect(DEFAULT_PORTAL_ID).toBe('default')
    })
  })

  describe('getOrCreatePortal', () => {
    it('존재하지 않는 포털 ID로 호출하면 새 인스턴스를 생성', () => {
      const instance = getOrCreatePortal('test-portal')
      expect(instance).toEqual({
        targets: new Map(),
        mode: null,
        returnPath: null,
      })
    })

    it('이미 존재하는 포털 ID로 호출하면 기존 인스턴스를 반환', () => {
      const instance1 = getOrCreatePortal('test-portal')
      instance1.mode = 'test-mode'
      const instance2 = getOrCreatePortal('test-portal')
      expect(instance2.mode).toBe('test-mode')
    })
  })

  describe('register', () => {
    it('새로운 타겟을 등록', () => {
      const target = document.createElement('div')
      register('test-portal', 'test-mode', target)

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.get('test-mode')).toBe(target)
    })

    it('같은 모드에 다른 타겟을 등록하면 덮어쓰기', () => {
      const target1 = document.createElement('div')
      const target2 = document.createElement('div')

      register('test-portal', 'test-mode', target1)
      register('test-portal', 'test-mode', target2)

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.get('test-mode')).toBe(target2)
      expect(instance.targets.size).toBe(1)
    })

    it('여러 모드를 등록할 수 있음', () => {
      const target1 = document.createElement('div')
      const target2 = document.createElement('div')

      register('test-portal', 'mode1', target1)
      register('test-portal', 'mode2', target2)

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.size).toBe(2)
      expect(instance.targets.get('mode1')).toBe(target1)
      expect(instance.targets.get('mode2')).toBe(target2)
    })
  })

  describe('unregister', () => {
    it('등록된 타겟을 제거', () => {
      const target = document.createElement('div')
      register('test-portal', 'test-mode', target)
      unregister('test-portal', 'test-mode')

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.has('test-mode')).toBe(false)
    })

    it('존재하지 않는 포털에서 제거 시도해도 에러가 발생하지 않음', () => {
      expect(() => {
        unregister('non-existent', 'test-mode')
      }).not.toThrow()
    })

    it('존재하지 않는 모드를 제거 시도해도 에러가 발생하지 않음', () => {
      register('test-portal', 'mode1', document.createElement('div'))
      expect(() => {
        unregister('test-portal', 'non-existent')
      }).not.toThrow()
    })
  })

  describe('setMode', () => {
    it('포털 모드를 설정', () => {
      setMode('test-portal', 'test-mode')
      const instance = getOrCreatePortal('test-portal')
      expect(instance.mode).toBe('test-mode')
    })

    it('모드를 null로 설정 가능', () => {
      setMode('test-portal', 'test-mode')
      setMode('test-portal', null)
      const instance = getOrCreatePortal('test-portal')
      expect(instance.mode).toBeNull()
    })

    it('존재하지 않는 포털에 모드를 설정하면 새 인스턴스 생성', () => {
      setMode('new-portal', 'new-mode')
      const instance = getOrCreatePortal('new-portal')
      expect(instance.mode).toBe('new-mode')
    })
  })

  describe('setReturnPath', () => {
    it('리턴 경로를 설정', () => {
      setReturnPath('test-portal', '/test-path')
      const instance = getOrCreatePortal('test-portal')
      expect(instance.returnPath).toBe('/test-path')
    })

    it('리턴 경로를 null로 설정 가능', () => {
      setReturnPath('test-portal', '/test-path')
      setReturnPath('test-portal', null)
      const instance = getOrCreatePortal('test-portal')
      expect(instance.returnPath).toBeNull()
    })

    it('존재하지 않는 포털에 리턴 경로를 설정하면 새 인스턴스 생성', () => {
      setReturnPath('new-portal', '/new-path')
      const instance = getOrCreatePortal('new-portal')
      expect(instance.returnPath).toBe('/new-path')
    })
  })

  describe('resetPortal', () => {
    it('포털 인스턴스를 초기 상태로 리셋', () => {
      const target = document.createElement('div')
      register('test-portal', 'test-mode', target)
      setMode('test-portal', 'test-mode')
      setReturnPath('test-portal', '/test-path')

      resetPortal('test-portal')

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.size).toBe(0)
      expect(instance.mode).toBeNull()
      expect(instance.returnPath).toBeNull()
    })

    it('존재하지 않는 포털을 리셋해도 에러가 발생하지 않음', () => {
      expect(() => {
        resetPortal('non-existent')
      }).not.toThrow()
    })
  })

  describe('usePortalStore', () => {
    it('getOrCreatePortal을 통해 등록된 데이터를 확인할 수 있음', () => {
      const target = document.createElement('div')
      register('test-portal', 'test-mode', target)

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.get('test-mode')).toBe(target)
    })

    it('여러 포털을 독립적으로 관리할 수 있음', () => {
      const target1 = document.createElement('div')
      const target2 = document.createElement('div')

      register('portal1', 'mode1', target1)
      register('portal2', 'mode2', target2)

      const instance1 = getOrCreatePortal('portal1')
      const instance2 = getOrCreatePortal('portal2')

      expect(instance1.targets.get('mode1')).toBe(target1)
      expect(instance2.targets.get('mode2')).toBe(target2)
    })
  })
})
