import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const archive = resolve(process.argv[2] ?? '')
const requested = process.argv[3]
const react =
  requested === '18' ? '18.3.1' : requested === '19' ? '19.2.3' : requested
assert(
  /^(18|19)\.\d+\.\d+$/.test(react ?? ''),
  'Usage: node scripts/verify-package.mjs PACKAGE.tgz 18|19|EXACT_REACT_VERSION',
)
const major = react.split('.')[0]
const directory = mkdtempSync(join(tmpdir(), 'preserve-portal-consumer-'))
const typescript = major === '18' ? '5.0.4' : '5.9.3'
function run(command, args) {
  execFileSync(command, args, { cwd: directory, stdio: 'inherit' })
}

try {
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  )
  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--package-lock=false',
    archive,
    `react@${react}`,
    `react-dom@${react}`,
    `@types/react@${major}`,
    `@types/react-dom@${major}`,
    `typescript@${typescript}`,
    'jsdom@25.0.1',
  ])
  writeFileSync(
    join(directory, 'consumer.tsx'),
    `
import { createPortal } from '@charley-kim/react-preserve-portal'
const Portal = createPortal({ id: 'typed-consumer', slots: ['main', 'mini'] })
const children = <Portal.Host><input defaultValue="ok" /></Portal.Host>
const legacy = <Portal.Host node={<input />} />
const slot = <Portal.Slot slotKey="main" as="section" />
const connected = <Portal.Host mountWhen="connected"><input autoFocus /></Portal.Host>
const disposed: boolean = Portal.dispose()
// @ts-expect-error Slot content would overwrite the portal's DOM.
const invalidChildren = <Portal.Slot slotKey="main">placeholder</Portal.Slot>
// @ts-expect-error Raw HTML also overwrites the portal's DOM.
const invalidHTML = <Portal.Slot slotKey="main" dangerouslySetInnerHTML={{ __html: 'bad' }} />
// @ts-expect-error Slot keys must be inferred without as const.
const invalidSlot = <Portal.Slot slotKey="wrong" />
// @ts-expect-error The two content props are mutually exclusive.
const invalidHost = <Portal.Host node="old">new</Portal.Host>
void [children, legacy, slot, connected, disposed, invalidChildren, invalidHTML, invalidSlot, invalidHost]
`,
  )
  writeFileSync(
    join(directory, 'consumer.cts'),
    `
import { createPortal } from '@charley-kim/react-preserve-portal'
const Portal = createPortal({ id: 'commonjs-types', slots: ['main'] })
const released: boolean = Portal.dispose()
// @ts-expect-error Slot keys must remain checked in CommonJS consumers.
Portal.Slot({ slotKey: 'missing' })
void released
`,
  )
  run(process.execPath, [
    'node_modules/typescript/bin/tsc',
    '--noEmit',
    '--strict',
    '--skipLibCheck',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--jsx',
    'react-jsx',
    'consumer.tsx',
    'consumer.cts',
  ])
  const { readFileSync } = await import('node:fs')
  writeFileSync(
    join(directory, 'smoke.mjs'),
    readFileSync(
      fileURLToPath(new URL('./package-smoke.mjs', import.meta.url)),
    ),
  )
  run(process.execPath, ['smoke.mjs'])
  console.log(
    `PASS: packed consumer React ${react}, TypeScript ${typescript}, ESM and CJS`,
  )
} finally {
  rmSync(directory, { recursive: true, force: true })
}
