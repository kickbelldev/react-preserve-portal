// Fail when the library grows past its budget in a production consumer bundle.
// Run after `pnpm build`: node scripts/check-size.mjs [limitBytes]
import { createRequire } from 'node:module'
import { realpathSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const limit = Number(process.argv[2] ?? 2560)
// esbuild is not hoisted; resolve it from Vite's real (pnpm) location.
const { build } = createRequire(
  realpathSync(resolve(root, 'node_modules/vite/package.json')),
)('esbuild')

const result = await build({
  entryPoints: [resolve(root, 'packages/react-preserve-portal/dist/index.js')],
  bundle: true,
  write: false,
  minify: true,
  format: 'esm',
  // Consumers' bundlers replace NODE_ENV, which strips development warnings.
  define: { 'process.env.NODE_ENV': '"production"' },
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  logLevel: 'error',
})
const code = result.outputFiles[0].contents
const gzip = gzipSync(code, { level: 9 }).length
console.log(
  `react-preserve-portal: ${code.length} B minified, ${gzip} B gzip (limit ${limit} B)`,
)
if (gzip > limit) {
  console.error(`Size budget exceeded by ${gzip - limit} B.`)
  process.exit(1)
}
