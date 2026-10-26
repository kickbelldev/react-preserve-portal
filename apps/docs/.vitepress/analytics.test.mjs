import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { analyticsHead } from './analytics.ts'

// Deliberately synthetic, used only in tests; never a production site identifier.
const token = '0'.repeat(32)
const origin = 'https://kickbelldev.github.io'
const base = '/react-preserve-portal/'

function fixture(overrides = {}) {
  const scripts = []
  const listeners = []
  const context = {
    location: { origin, pathname: base },
    navigator: {},
    window: {},
    document: {
      readyState: 'complete',
      getElementById: (id) => scripts.find((script) => script.id === id),
      createElement: (tag) => {
        assert.equal(tag, 'script')
        return {
          attributes: {},
          setAttribute(name, value) {
            this.attributes[name] = value
          },
        }
      },
      body: { appendChild: (script) => scripts.push(script) },
      addEventListener: (event, callback, options) =>
        listeners.push({ event, callback, options }),
    },
    ...overrides,
  }
  const [, , source] = analyticsHead('true', token, origin, base)[0]
  return {
    scripts,
    listeners,
    context,
    run: () => runInNewContext(source, context),
  }
}

test('disabled configuration emits no loader, even with a stale token', () => {
  for (const enabled of [undefined, '', 'false']) {
    assert.deepEqual(analyticsHead(enabled, undefined, origin, base), [])
    assert.deepEqual(analyticsHead(enabled, 'stale-token', origin, base), [])
  }
})

test('enabled configuration fails closed for missing or malformed site tokens', () => {
  for (const value of [
    undefined,
    '',
    'not-a-token',
    '</script>',
    token + 'x',
  ]) {
    assert.throws(
      () => analyticsHead('true', value, origin, base),
      /DOCS_ANALYTICS_TOKEN/,
    )
  }
  assert.throws(
    () => analyticsHead('yes', token, origin, base),
    /DOCS_ANALYTICS_ENABLED/,
  )
})

test('loads one official beacon with SPA tracking and no custom events', () => {
  const { run, scripts } = fixture()
  run()
  run()
  assert.equal(scripts.length, 1)
  assert.equal(
    scripts[0].src,
    'https://static.cloudflareinsights.com/beacon.min.js',
  )
  assert.equal(scripts[0].type, 'module')
  assert.deepEqual(JSON.parse(scripts[0].attributes['data-cf-beacon']), {
    token,
    spa: true,
  })
})

test('waits for the document body and still prevents duplicate loading', () => {
  const { run, scripts, listeners, context } = fixture()
  context.document.readyState = 'loading'
  run()
  run()
  assert.equal(scripts.length, 0)
  for (const { event, callback, options } of listeners) {
    assert.equal(event, 'DOMContentLoaded')
    assert.equal(options.once, true)
    callback()
  }
  assert.equal(scripts.length, 1)
})

test('accepts both language paths and direct deep links', () => {
  for (const pathname of [
    base,
    `${base}en/`,
    `${base}en/guide/quick-start.html`,
  ]) {
    const { run, scripts } = fixture({ location: { origin, pathname } })
    run()
    assert.equal(scripts.length, 1, pathname)
  }
})

test('does not load on local previews, forks or other projects', () => {
  for (const location of [
    { origin: 'http://localhost:4173', pathname: base },
    { origin: 'https://fork.github.io', pathname: base },
    { origin, pathname: '/' },
    { origin, pathname: '/react-preserve-portal-other/' },
  ]) {
    const { run, scripts } = fixture({ location })
    run()
    assert.equal(scripts.length, 0, JSON.stringify(location))
  }
})

test('respects GPC and browser DNT signals before contacting the service', () => {
  for (const overrides of [
    { navigator: { globalPrivacyControl: true } },
    { navigator: { doNotTrack: '1' } },
    { window: { doNotTrack: '1' } },
  ]) {
    const { run, scripts } = fixture(overrides)
    run()
    assert.equal(scripts.length, 0)
  }
})

test('escapes HTML-sensitive configuration in the inline loader', () => {
  const [, , source] = analyticsHead('true', token, origin, '</script>')[0]
  assert(!source.includes('</script>'))
})
