"""Verify the built demo's routing and media lifecycle without remote videos.

Run `corepack pnpm exec nx run demo:build` first, then run this script with
Python Playwright and Chromium installed.
"""
import functools
import http.server
import os
from pathlib import Path
import shutil
import threading

from playwright.sync_api import expect, sync_playwright

root = Path(__file__).resolve().parent.parent

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0),
    functools.partial(Handler, directory=str(root / 'dist/apps/demo')))
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),
            args=['--no-sandbox', '--disable-dev-shm-usage'])
        errors = []
        for fallback in [False, True]:
            page = browser.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('https://commondatastorage.googleapis.com/**', lambda route: route.abort())
            if fallback:
                page.add_init_script('Element.prototype.moveBefore = undefined')
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='networkidle')
            expect(page.get_by_label('미니플레이어 닫기')).not_to_be_visible()
            page.get_by_role('link', name='Video 1', exact=True).click()
            expect(page.locator('main video')).to_be_visible()
            page.evaluate('''() => {
              window.video = document.querySelector('video');
              video.removeAttribute('src'); video.load(); video.muted = true;
              const canvas = document.createElement('canvas');
              canvas.width = 320; canvas.height = 180;
              const context = canvas.getContext('2d');
              window.paint = setInterval(() => {
                context.fillStyle = 'blue'; context.fillRect(0, 0, 320, 180);
                context.fillStyle = 'white'; context.fillText(String(Date.now()), 20, 40);
              }, 30);
              video.srcObject = canvas.captureStream(30);
              window.moves = [];
              const move = Element.prototype.moveBefore;
              if (move) Element.prototype.moveBefore = function(node, ref) {
                if (node.contains(video)) moves.push('moveBefore');
                return move.call(this, node, ref);
              };
              const append = Node.prototype.appendChild;
              Node.prototype.appendChild = function(node) {
                if (node.contains?.(video)) moves.push('appendChild');
                return append.call(this, node);
              };
            }''')
            page.wait_for_function('video.readyState >= 2')
            page.get_by_role('button', name='재생', exact=True).click()
            page.wait_for_function('!video.paused')
            expect(page.get_by_role('button', name='일시정지', exact=True)).to_be_visible()
            page.get_by_role('link', name='Home', exact=True).click()
            expect(page.locator('.fixed video')).to_be_visible()
            assert page.evaluate('video === document.querySelector(".fixed video")')
            if not fallback and page.evaluate('typeof Element.prototype.moveBefore === "function"'):
                assert page.evaluate('moves') == ['moveBefore']
                assert page.evaluate('!video.paused')
            else:
                assert page.evaluate('moves') == ['appendChild']
            # Native changes must update controls even without a button click.
            page.evaluate('video.pause()')
            expect(page.get_by_role('button', name='재생', exact=True)).to_be_visible()
            page.evaluate('video.play()')
            expect(page.get_by_role('button', name='일시정지', exact=True)).to_be_visible()
            page.get_by_role('link', name='돌아가기').click()
            expect(page.locator('main video')).to_be_visible()
            assert page.evaluate('video === document.querySelector("main video")')
            if not fallback and page.evaluate('typeof Element.prototype.moveBefore === "function"'):
                assert page.evaluate('moves') == ['moveBefore', 'moveBefore']
                assert page.evaluate('!video.paused')
            page.get_by_role('link', name='Home', exact=True).click()
            page.get_by_label('미니플레이어 닫기').click()
            assert page.evaluate('video.paused && !video.isConnected')
            page.get_by_role('link', name='About', exact=True).click()
            expect(page.get_by_label('미니플레이어 닫기')).not_to_be_visible()
            page.get_by_role('link', name='Video 1', exact=True).click()
            expect(page.locator('main video')).to_be_visible()
            assert page.evaluate('video === document.querySelector("main video") && video.paused')
            expect(page.get_by_role('button', name='재생', exact=True)).to_be_visible()
            page.evaluate('''() => {
              window.playOriginal = video.play;
              video.play = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
            }''')
            page.get_by_role('button', name='재생', exact=True).click()
            expect(page.get_by_role('status').filter(visible=True)).to_contain_text('재생할 수 없습니다')
            expect(page.get_by_role('button', name='재생', exact=True)).to_be_visible()
            page.evaluate('() => { video.play = playOriginal }')
            page.get_by_role('button', name='재생', exact=True).click()
            expect(page.get_by_role('button', name='일시정지', exact=True)).to_be_visible()
            page.evaluate('''() => {
              video.pause(); video.srcObject.getTracks().forEach(track => track.stop());
              clearInterval(paint);
            }''')
            page.close()
            print(f'PASS: demo {"fallback" if fallback else "native"}: persistent slots, video identity, playback events, close/reopen, rejected play/retry')
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
    server.server_close()
