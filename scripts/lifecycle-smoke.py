"""Run real-browser portal lifecycle regressions with Python Playwright.

Requires the workspace dependencies and a Playwright browser.
PORTAL_BROWSER selects chromium (default), firefox, or webkit.
REACT_MODULES can point to a separate node_modules with React 18 or 19.
"""
import functools
import http.server
from pathlib import Path
import subprocess
import tempfile
import threading

from playwright.sync_api import expect, sync_playwright
from browser_support import launch_browser

root = Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory(prefix='portal-browser-') as output:
    subprocess.run(['corepack', 'pnpm', 'exec', 'nx', 'exec', '--', 'node',
                    str(root / 'scripts/browser/build.mjs'), output], cwd=root, check=True)

    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *_args):
            pass

    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0),
        functools.partial(Handler, directory=output))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        with sync_playwright() as p:
            browser = launch_browser(p)
            errors = []
            for mode in ['suspense', 'activity', 'fallback']:
                page = browser.new_page()
                page.on('pageerror', lambda error: errors.append(str(error)))
                if mode == 'fallback':
                    page.add_init_script('Element.prototype.moveBefore = undefined')
                page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='networkidle')
                if mode == 'activity' and not page.evaluate('portalFixture.supportsActivity'):
                    page.close()
                    continue
                page.evaluate('(mode) => portalFixture.mount(mode)', mode)
                expect(page.locator('#note')).to_be_visible()
                expect(page.locator('#note')).to_be_focused()
                measured = page.evaluate('portalFixture.state().measurements')
                assert len(measured) == 1 and measured[0]['connected'] and measured[0]['width'] > 0
                page.locator('#note').fill('edited')
                page.locator('#counter').click()
                page.frame_locator('#frame').get_by_text('Frame ready').wait_for()
                page.evaluate('''() => {
                  window.original = document.querySelector('#note');
                  original.focus(); original.setSelectionRange(1, 4);
                  document.querySelector('#frame').contentWindow.marker = 42;
                  portalFixture.move('mini');
                }''')
                expect(page.locator('#mini #note')).to_have_value('edited')
                assert page.evaluate('original === document.querySelector("#note")')
                if page.evaluate('portalFixture.nativeMove'):
                    assert page.evaluate('document.activeElement === original')
                    assert page.evaluate('[original.selectionStart, original.selectionEnd]') == [1, 4]
                    assert page.evaluate('portalFixture.state().moves.includes("moveBefore")')
                    assert page.evaluate('document.querySelector("#frame").contentWindow.marker') == 42
                page.frame_locator('#frame').get_by_text('Frame ready').wait_for()
                page.evaluate('document.querySelector("#frame").contentWindow.marker = 99')
                page.evaluate('portalFixture.hide(true)')
                assert page.evaluate('original.isConnected')
                expect(page.locator('#note')).not_to_be_visible()
                assert page.evaluate('portalFixture.dispose()') is False
                page.evaluate('portalFixture.hide(false)')
                expect(page.locator('#note')).to_be_visible()
                assert page.evaluate('original === document.querySelector("#note")')
                assert page.evaluate('document.querySelector("#frame").contentWindow.marker') == 99
                expect(page.locator('#counter')).to_have_text('1')
                page.locator('#counter').click()
                expect(page.locator('#counter')).to_have_text('2')
                page.evaluate('portalFixture.move(null)')
                assert page.evaluate('!original.isConnected')
                page.evaluate('portalFixture.move("main")')
                expect(page.locator('#main #note')).to_have_value('edited')
                page.evaluate('portalFixture.hide(true); portalFixture.remove()')
                assert page.locator('#main').evaluate('(e) => e.childNodes.length') == 0
                page.evaluate('portalFixture.unmount()')
                assert page.evaluate('portalFixture.dispose()') is True
                counts = page.evaluate('portalFixture.state()')
                assert counts['effects'] == counts['cleanup']
                print(f'PASS: {browser.browser_type.name} React {page.evaluate("portalFixture.reactVersion")} {mode}; connection, autofocus, DOM/state, iframe lifetime, deletion/disposal')
                page.close()
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
