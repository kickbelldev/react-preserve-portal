import assert from 'node:assert/strict'
import test from 'node:test'
import { packageName, repository, releaseContext, validateArchive, publicationState } from './release-policy.mjs'

const context = { event: 'push', ref: 'refs/tags/v0.4.1', version: '0.4.1', repo: repository, onMain: true }
test('merged matching stable tags may publish; manual main runs only rehearse', () => {
  assert.deepEqual(releaseContext(context), { dryRun: false })
  assert.deepEqual(releaseContext({ ...context, event: 'workflow_dispatch', ref: 'refs/heads/main' }), { dryRun: true })
})
for (const [name, change] of [
  ['fork', { repo: 'someone/fork' }],
  ['unmerged commit', { onMain: false }],
  ['branch push', { ref: 'refs/heads/main' }],
  ['mismatched tag', { ref: 'refs/tags/v0.4.2' }],
  ['prerelease', { ref: 'refs/tags/v0.4.1-beta.1', version: '0.4.1-beta.1' }],
  ['untrusted event', { event: 'pull_request' }],
  ['manual feature branch', { event: 'workflow_dispatch', ref: 'refs/heads/feature' }],
]) {
  test(`refuses publication context: ${name}`, () => assert.throws(() => releaseContext({ ...context, ...change })))
}
const manifest = {
  name: packageName, version: '0.4.1', repository: { url: `https://github.com/${repository}.git` },
  exports: { '.': {
    import: { types: './dist/index.d.ts', default: './dist/index.js' },
    require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
  } },
}
const files = ['CHANGELOG.md', 'LICENSE', 'README.md', 'package.json', 'dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'dist/index.d.cts'].map(name => `package/${name}`)
test('checks both declaration formats and refuses unexpected packed files', () => {
  validateArchive(manifest, files)
  assert.throws(() => validateArchive(manifest, files.filter(name => !name.endsWith('.d.cts'))))
  assert.throws(() => validateArchive(manifest, [...files, 'package/.npmrc']))
  assert.throws(() => validateArchive({ ...manifest, name: 'another-package' }, files))
  assert.throws(() => validateArchive({ ...manifest, exports: { '.': { types: './dist/index.d.ts' } } }, files))
})
const metadata = { version: '0.4.1', integrity: 'sha512-verified' }
test('only publishes a newer absent stable version', () => {
  assert.equal(publicationState(metadata, { 'dist-tags': { latest: '0.4.0' }, versions: {} }), 'publish')
  assert.equal(publicationState(metadata, null), 'publish')
  assert.throws(() => publicationState(metadata, { 'dist-tags': { latest: '0.5.0' }, versions: {} }))
})
test('reruns skip an identical publication without rolling back latest', () => {
  const packument = { 'dist-tags': { latest: '0.5.0' }, versions: { '0.4.1': { dist: { integrity: metadata.integrity } } } }
  assert.equal(publicationState(metadata, packument), 'already-published')
  packument.versions['0.4.1'].dist.integrity = 'sha512-different'
  assert.throws(() => publicationState(metadata, packument))
})
