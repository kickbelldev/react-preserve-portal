import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const output = resolve(process.argv[2])
const modules =
  process.env.REACT_MODULES ||
  resolve(root, 'packages/react-preserve-portal/node_modules')
const { build } = createRequire(
  resolve(root, 'node_modules/vite/package.json'),
)('esbuild')
mkdirSync(output, { recursive: true })
await build({
  entryPoints: [resolve(root, 'scripts/browser/lifecycle.jsx')],
  outfile: resolve(output, 'fixture.js'),
  bundle: true,
  format: 'esm',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  alias: {
    '@charley-kim/react-preserve-portal': process.env.PORTAL_PACKAGE_ENTRY
      ? resolve(process.env.PORTAL_PACKAGE_ENTRY)
      : resolve(root, 'packages/react-preserve-portal/src/index.ts'),
    react: resolve(modules, 'react'),
    'react-dom': resolve(modules, 'react-dom'),
  },
})
writeFileSync(
  resolve(output, 'index.html'),
  '<!doctype html><html><head><meta charset="utf-8"><title>Portal regression fixture</title></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
)
