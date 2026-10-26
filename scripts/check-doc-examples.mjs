import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docs = join(root, 'apps/docs')
// The root README links to this same file; check it once for GitHub and npm.
const readme = join(root, 'packages/react-preserve-portal/README.md')
const require = createRequire(import.meta.url)
const cache = join(docs, '.vitepress/cache')
mkdirSync(cache, { recursive: true })
const directory = mkdtempSync(join(cache, 'example-types-'))

function* pages(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const path = join(folder, entry.name)
    if (entry.isDirectory()) yield* pages(path)
    else if (entry.name.endsWith('.md')) yield path
  }
}

// Filename-labelled TSX blocks are complete modules that readers can copy.
// Unlabelled API fragments intentionally depend on the surrounding explanation.
try {
  let count = 0
  let readmeCount = 0
  for (const page of [readme, ...pages(docs)]) {
    const source = readFileSync(page, 'utf8')
    const destination = join(directory, relative(root, page))
    const files = new Set()
    for (const [, name, code] of source.matchAll(
      /^```tsx \[([\w.-]+\.tsx)\]\r?\n([\s\S]*?)^```/gm,
    )) {
      assert(!files.has(name), `Duplicate example filename in ${page}: ${name}`)
      files.add(name)
      mkdirSync(destination, { recursive: true })
      writeFileSync(join(destination, name), code)
      count++
      if (page === readme) readmeCount++
    }
  }
  assert(count > 0, 'No complete documentation examples found')
  assert(readmeCount > 0, 'No complete README example found')
  writeFileSync(
    join(directory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        jsx: 'react-jsx',
        types: ['react', 'react-dom'],
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      },
      include: ['**/*.tsx'],
    }),
  )
  execFileSync(
    process.execPath,
    [
      require.resolve('typescript/bin/tsc'),
      '-p',
      join(directory, 'tsconfig.json'),
    ],
    {
      cwd: root,
      stdio: 'inherit',
    },
  )
  console.log(
    `PASS: ${readmeCount} README and ${count - readmeCount} documentation modules type-check against the public package`,
  )
} finally {
  rmSync(directory, { recursive: true, force: true })
}
