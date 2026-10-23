import { describe, it, expect, beforeEach } from 'vitest'
import {
  DEFAULT_PORTAL_ID,
  getOrCreatePortal,
  register,
  unregister,
  setSlotKey,
  setReturnPath,
  resetPortal,
} from './store'

describe('store', () => {
  beforeEach(() => {
    // Remove manually registered destinations between tests.
    for (const id of ['test-portal', 'new-portal', 'portal1', 'portal2']) {
      for (const key of getOrCreatePortal(id).targets.keys())
        unregister(id, key)
    }
    resetPortal('test-portal')
    resetPortal('new-portal')
    resetPortal('portal1')
    resetPortal('portal2')
  })

  describe('DEFAULT_PORTAL_ID', () => {
    it('has correct default portal ID', () => {
      expect(DEFAULT_PORTAL_ID).toBe('default')
    })
  })

  describe('getOrCreatePortal', () => {
    it('creates new instance for non-existent portal ID', () => {
      const instance = getOrCreatePortal('test-portal')
      expect(instance).toEqual({
        targets: new Map(),
        slotKey: null,
        returnPath: null,
      })
    })

    it('returns existing instance for existing portal ID', () => {
      const instance1 = getOrCreatePortal('test-portal')
      const instance2 = getOrCreatePortal('test-portal')
      expect(instance2).toBe(instance1)
    })
  })

  describe('register', () => {
    it('registers new target', () => {
      const target = document.createElement('div')
      register('test-portal', 'test-slotKey', target)

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.get('test-slotKey')).toBe(target)
    })

    it('overwrites when registering different target to same slot key', () => {
      const target1 = document.createElement('div')
      const target2 = document.createElement('div')

      register('test-portal', 'test-slotKey', target1)
      register('test-portal', 'test-slotKey', target2)

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.get('test-slotKey')).toBe(target2)
      expect(instance.targets.size).toBe(1)
    })

    it('registers multiple slot keys', () => {
      const target1 = document.createElement('div')
      const target2 = document.createElement('div')

      register('test-portal', 'slotKey1', target1)
      register('test-portal', 'slotKey2', target2)

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.size).toBe(2)
      expect(instance.targets.get('slotKey1')).toBe(target1)
      expect(instance.targets.get('slotKey2')).toBe(target2)
    })
  })

  describe('unregister', () => {
    it('removes registered target', () => {
      const target = document.createElement('div')
      register('test-portal', 'test-slotKey', target)
      unregister('test-portal', 'test-slotKey')

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.has('test-slotKey')).toBe(false)
    })

    it('does not throw when removing from non-existent portal', () => {
      expect(() => {
        unregister('non-existent', 'test-slotKey')
      }).not.toThrow()
    })

    it('does not throw when removing non-existent slot key', () => {
      register('test-portal', 'slotKey1', document.createElement('div'))
      expect(() => {
        unregister('test-portal', 'non-existent')
      }).not.toThrow()
    })
  })

  describe('setSlotKey', () => {
    it('sets portal slot key', () => {
      setSlotKey('test-portal', 'test-slotKey')
      const instance = getOrCreatePortal('test-portal')
      expect(instance.slotKey).toBe('test-slotKey')
    })

    it('sets slot key to null', () => {
      setSlotKey('test-portal', 'test-slotKey')
      setSlotKey('test-portal', null)
      const instance = getOrCreatePortal('test-portal')
      expect(instance.slotKey).toBeNull()
    })

    it('creates new instance when setting slot key to non-existent portal', () => {
      setSlotKey('new-portal', 'new-slotKey')
      const instance = getOrCreatePortal('new-portal')
      expect(instance.slotKey).toBe('new-slotKey')
    })
  })

  describe('setReturnPath', () => {
    it('sets return path', () => {
      setReturnPath('test-portal', '/test-path')
      const instance = getOrCreatePortal('test-portal')
      expect(instance.returnPath).toBe('/test-path')
    })

    it('sets return path to null', () => {
      setReturnPath('test-portal', '/test-path')
      setReturnPath('test-portal', null)
      const instance = getOrCreatePortal('test-portal')
      expect(instance.returnPath).toBeNull()
    })

    it('creates new instance when setting return path to non-existent portal', () => {
      setReturnPath('new-portal', '/new-path')
      const instance = getOrCreatePortal('new-portal')
      expect(instance.returnPath).toBe('/new-path')
    })
  })

  describe('resetPortal', () => {
    it('resets navigation state while keeping registered targets', () => {
      const target = document.createElement('div')
      register('test-portal', 'test-slotKey', target)
      setSlotKey('test-portal', 'test-slotKey')
      setReturnPath('test-portal', '/test-path')

      resetPortal('test-portal')

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.get('test-slotKey')).toBe(target)
      expect(instance.slotKey).toBeNull()
      expect(instance.returnPath).toBeNull()
    })

    it('does not throw when resetting non-existent portal', () => {
      expect(() => {
        resetPortal('non-existent')
      }).not.toThrow()
    })
  })

  describe('usePortalStore', () => {
    it('verifies registered data via getOrCreatePortal', () => {
      const target = document.createElement('div')
      register('test-portal', 'test-slotKey', target)

      const instance = getOrCreatePortal('test-portal')
      expect(instance.targets.get('test-slotKey')).toBe(target)
    })

    it('manages multiple portals independently', () => {
      const target1 = document.createElement('div')
      const target2 = document.createElement('div')

      register('portal1', 'slotKey1', target1)
      register('portal2', 'slotKey2', target2)

      const instance1 = getOrCreatePortal('portal1')
      const instance2 = getOrCreatePortal('portal2')

      expect(instance1.targets.get('slotKey1')).toBe(target1)
      expect(instance2.targets.get('slotKey2')).toBe(target2)
    })
  })
})
