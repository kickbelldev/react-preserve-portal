## 0.2.0 (2026-01-01)

### 🚀 Features

- ⚠️ **react-preserve-portal:** add type-safe createPortal factory API ([#1](https://github.com/kickbelldev/react-preserve-portal/pull/1))
- API 리네이밍 (mode -> slotKey) ([07b80bb](https://github.com/kickbelldev/react-preserve-portal/commit/07b80bb))

### ⚠️ Breaking Changes

- **react-preserve-portal:** add type-safe createPortal factory API ([#1](https://github.com/kickbelldev/react-preserve-portal/pull/1))
  Replace Portal.Host/Slot/usePortal with createPortal factory.
  Before: <Portal.Host><video /></Portal.Host>
  After: const P = createPortal({id, slots}); <P.Host node={<video />} />
  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
  - refactor(react-preserve-portal): rename components to Internal prefix
  * Rename PortalHost to InternalPortalHost
  * Rename PortalSlot to InternalPortalSlot
  * Change children prop to node prop in InternalPortalHost
  * Components are now internal implementation details
    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
  - test(react-preserve-portal): add createPortal integration tests
  * Add comprehensive tests for createPortal factory function
  * Rename existing tests to match Internal component names
  * Update test imports to use node prop instead of children
  * Test type safety, slot switching, multiple instances
    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
  - docs(react-preserve-portal): update README for new createPortal API
  * Document createPortal factory function usage
  * Add type safety section with examples
  * Update all code examples to use new API
  * Add migration guide from v0.1.x
    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
  - refactor(demo): migrate to new createPortal API
  * Add VideoPortal definition using createPortal factory
  * Update App.tsx to use VideoPortal.Host with node prop
  * Update MainPortal, MiniPortal to use VideoPortal.Slot
  * Update MiniPortalContainer to use VideoPortal.usePortal
  * Remove portalId prop (now encapsulated in factory)
    🤖 Generated with [Claude Code](https://claude.com/claude-code)
    Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

### ❤️ Thank You

- Charley Kim
- Claude Opus 4.5
- Jongchan

## 0.1.0 (2026-01-01)

### 🚀 Features

- API 리네이밍 (mode -> slotKey) ([07b80bb](https://github.com/kickbelldev/react-preserve-portal/commit/07b80bb))

### ❤️ Thank You

- Charley Kim

## 0.0.1 (2026-01-01)

### 🚀 Features

- Portal 컴파운드 컴포넌트 패턴 추가 및 export 개선 ([a963109](https://github.com/kickbelldev/react-preserve-portal/commit/a963109))
- **portal:** Introduce compound component pattern with PortalHost and PortalSlot ([95f15df](https://github.com/kickbelldev/react-preserve-portal/commit/95f15df))
- Nx 통합 및 설정 개선 ([9a5a877](https://github.com/kickbelldev/react-preserve-portal/commit/9a5a877))
- Nx 모노레포 전환 및 포털 라이브러리 패키지화 ([e7400ab](https://github.com/kickbelldev/react-preserve-portal/commit/e7400ab))
- TanStack Router 플러그인 설정 추가 ([ae10d8e](https://github.com/kickbelldev/react-preserve-portal/commit/ae10d8e))

### 🩹 Fixes

- demo 앱 빌드 오류 수정 ([b315c10](https://github.com/kickbelldev/react-preserve-portal/commit/b315c10))

### ❤️ Thank You

- Claude Opus 4.5
- Jongchan
