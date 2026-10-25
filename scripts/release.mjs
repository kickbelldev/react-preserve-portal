import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { packageName, releaseContext, validateArchive, publicationState } from './release-policy.mjs'

const directory = resolve(process.argv[3] ?? 'release')
const manifest = JSON.parse(readFileSync('packages/react-preserve-portal/package.json', 'utf8'))
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const sourceCommit = git('rev-parse', 'HEAD')
const sourceTree = git('rev-parse', 'HEAD^{tree}')
function context() {
  assert.equal(sourceCommit, process.env.GITHUB_SHA, 'Checkout must match the triggering commit')
  let onMain = false
  try {
    git('merge-base', '--is-ancestor', sourceCommit, 'origin/main')
    onMain = true
  } catch { /* Unmerged source must not publish. */ }
  return releaseContext({ event: process.env.GITHUB_EVENT_NAME, ref: process.env.GITHUB_REF,
    repo: process.env.GITHUB_REPOSITORY, version: manifest.version, onMain })
}
function inspect(file) {
  const bytes = readFileSync(file)
  const files = execFileSync('tar', ['-tzf', file], { encoding: 'utf8' }).trim().split('\n')
  const packed = JSON.parse(execFileSync('tar', ['-xOf', file, 'package/package.json'], { encoding: 'utf8' }))
  validateArchive(packed, files)
  assert.deepEqual(packed, manifest, 'Packed manifest must match the release source')
  return { name: packed.name, version: packed.version, sourceCommit, sourceTree,
    tarball: basename(file), integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
    shasum: createHash('sha1').update(bytes).digest('hex') }
}
function verify() {
  const expected = JSON.parse(readFileSync(join(directory, 'metadata.json'), 'utf8'))
  assert.equal(expected.tarball, basename(expected.tarball), 'Archive filename cannot contain a path')
  assert.equal(expected.tarball, `charley-kim-react-preserve-portal-${manifest.version}.tgz`)
  const file = join(directory, expected.tarball)
  assert.deepEqual(inspect(file), expected, 'Archive or source differs from the verified build')
  return { metadata: expected, file }
}
async function registry() {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
    headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 404) return null
  assert(response.ok, `Registry lookup failed: HTTP ${response.status}`)
  return response.json()
}
async function confirm(metadata, packument) {
  const published = packument?.versions?.[metadata.version]
  assert(published, 'Version is not visible in the registry; inspect its state before retrying')
  assert.equal(published.dist?.integrity, metadata.integrity)
  assert.equal(published.dist?.shasum, metadata.shasum)
  assert.deepEqual(published.exports, manifest.exports)
  const url = new URL(published.dist.tarball)
  assert.equal(url.origin, 'https://registry.npmjs.org')
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  assert(response.ok, `Published archive download failed: HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  assert.equal(`sha512-${createHash('sha512').update(bytes).digest('base64')}`, metadata.integrity)
  writeFileSync(join(directory, 'registry-confirmation.json'), JSON.stringify({
    version: metadata.version, latest: packument['dist-tags']?.latest,
    integrity: metadata.integrity, sourceCommit, verifiedAt: new Date().toISOString(),
  }, null, 2) + '\n')
  return packument['dist-tags']?.latest
}
function summary(message) {
  console.log(message)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${message}\n`)
}

const mode = process.argv[2]
if (mode === 'context') {
  summary(context().dryRun ? 'Manual rehearsal: publication is disabled.' : `Release tag verified: ${manifest.version}`)
} else if (mode === 'prepare') {
  context()
  const archives = readdirSync(directory).filter(name => name.endsWith('.tgz'))
  assert.equal(archives.length, 1, 'Expected exactly one packed archive')
  const metadata = inspect(join(directory, archives[0]))
  writeFileSync(join(directory, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n')
  summary(`Verified archive ${metadata.tarball} from ${sourceCommit}.`)
} else if (mode === 'publish') {
  const { dryRun } = context()
  const { metadata, file } = verify()
  const args = ['publish', file, '--access', 'public', '--tag', 'latest', '--ignore-scripts',
    '--registry=https://registry.npmjs.org/', '--browser=false']
  if (dryRun) {
    const existing = (await registry())?.versions?.[metadata.version]
    if (existing) summary(`Version ${metadata.version} already exists; skipping npm publish --dry-run, which rejects existing versions. Archive and consumer checks still apply.`)
    else execFileSync('npm', [...args, '--dry-run'], { stdio: 'inherit' })
    summary(`Rehearsal passed for ${packageName}@${metadata.version}. Nothing was published; npm OIDC trust has not been verified.`)
  } else {
    assert(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
      'Publishing requires GitHub Actions OIDC; no credential fallback is configured')
    let packument = await registry()
    const state = publicationState(metadata, packument)
    if (state === 'publish') {
      let failure
      try { execFileSync('npm', args, { stdio: 'inherit', timeout: 180_000 }) }
      catch (error) { failure = error }
      // A failed CLI response may still mean a successful publication. Never blindly republish.
      for (let attempt = 0; attempt < 6; attempt++) {
        packument = await registry()
        if (packument?.versions?.[metadata.version]) break
        if (attempt < 5) await setTimeout(10_000)
      }
      if (!packument?.versions?.[metadata.version] && failure) throw failure
    }
    const latest = await confirm(metadata, packument)
    if (state === 'publish') assert.equal(latest, metadata.version, 'Published version is not latest; inspect dist-tags')
    summary(`${state === 'publish' ? 'Published and verified' : 'Already published; verified without changing dist-tags'}: ${packageName}@${metadata.version}; latest=${latest}; source=${sourceCommit}.`)
  }
} else {
  throw new Error('Usage: node scripts/release.mjs context|prepare|publish [artifact-directory]')
}
