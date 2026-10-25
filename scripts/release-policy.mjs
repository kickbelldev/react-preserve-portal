import assert from 'node:assert/strict'

export const packageName = '@charley-kim/react-preserve-portal'
export const repository = 'kickbelldev/react-preserve-portal'
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

export function releaseContext({ event, ref, version, repo, onMain }) {
  assert.equal(
    repo,
    repository,
    'Release workflow must run in the package repository',
  )
  assert(
    stableVersion.test(version),
    'Only stable x.y.z versions are supported',
  )
  assert(onMain, 'Release source must already be merged into main')
  if (event === 'workflow_dispatch') {
    assert.equal(ref, 'refs/heads/main', 'Manual rehearsal must run from main')
    return { dryRun: true }
  }
  assert.equal(event, 'push', 'Only tag pushes may publish')
  assert.equal(
    ref,
    `refs/tags/v${version}`,
    'Release tag must match the package version exactly',
  )
  return { dryRun: false }
}

export function validateArchive(manifest, files) {
  assert.equal(manifest.name, packageName, 'Unexpected package name')
  assert(
    stableVersion.test(manifest.version),
    'Expected a stable package version',
  )
  assert.equal(manifest.repository?.url, `https://github.com/${repository}.git`)
  assert.deepEqual(
    manifest.exports,
    {
      '.': {
        import: { types: './dist/index.d.ts', default: './dist/index.js' },
        require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
      },
    },
    'ESM and CommonJS need matching runtime and declaration exports',
  )
  assert.deepEqual(
    [...files].sort(),
    [
      'package/CHANGELOG.md',
      'package/LICENSE',
      'package/README.md',
      'package/package.json',
      'package/dist/index.js',
      'package/dist/index.cjs',
      'package/dist/index.d.ts',
      'package/dist/index.d.cts',
    ].sort(),
    'Unexpected or missing archive files',
  )
}

export function publicationState(metadata, packument) {
  const existing = packument?.versions?.[metadata.version]
  if (existing) {
    assert.equal(
      existing.dist?.integrity,
      metadata.integrity,
      'Published version differs from this archive; do not retry or overwrite it',
    )
    return 'already-published'
  }
  const latest = packument?.['dist-tags']?.latest
  if (latest) {
    assert(
      stableVersion.test(latest),
      'Inspect the non-stable latest tag before publishing',
    )
    const current = latest.split('.').map(Number)
    const next = metadata.version.split('.').map(Number)
    const difference = next.findIndex((part, i) => part !== current[i])
    assert(
      difference !== -1 && next[difference] > current[difference],
      'Refusing to move latest backwards or reuse its version',
    )
  }
  return 'publish'
}
