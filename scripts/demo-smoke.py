"""Verify the built demo's routing and media lifecycle without remote videos.

Run `corepack pnpm exec nx run demo:build` first, then run this script with
Python Playwright and the selected PORTAL_BROWSER installed.
"""
import os
from playwright.sync_api import expect, sync_playwright
from browser_support import launch_browser, preview, wait_for_video

with preview('demo') as base:
    with sync_playwright() as p:
        browser = launch_browser(p)
        errors = []
        for fallback in [False, True]:
            page = browser.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            if fallback:
                page.add_init_script('''
        Element.prototype.moveBefore = undefined;
        const canPlay = HTMLMediaElement.prototype.canPlayType;
        HTMLMediaElement.prototype.canPlayType = function(type) {
          return type.startsWith('video/mp4') ? '' : canPlay.call(this, type);
        };
    ''')
            page.goto(base, wait_until='networkidle')
            expect(page.get_by_label('미니플레이어 닫기')).not_to_be_visible()
            page.get_by_role('link', name='Video 1', exact=True).click()
            expect(page.locator('main video')).to_be_visible()
            page.evaluate('''() => {
              window.video = document.querySelector('video');
              video.muted = true;
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
            wait_for_video(page)
            page.get_by_role('button', name='재생', exact=True).click()
            page.wait_for_function('!video.paused && video.currentTime > 0.2')
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
            # Rewind first: on slow runners the 16s clip can be near its end, so
            # play() would reach `ended` before the playing label is observed.
            page.evaluate('video.currentTime = 1; video.pause()')
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
            page.get_by_role('link', name='Video 2', exact=True).click()
            page.wait_for_function("video.currentSrc.endsWith('#t=4') && video.readyState >= 2")
            assert page.evaluate('video === document.querySelector("main video")')
            expect(page.get_by_role('button', name='재생', exact=True)).to_be_visible()
            page.close()
            print(f'PASS: demo {os.environ.get("PORTAL_BROWSER", "chromium")} {"fallback" if fallback else "native"}: persistent slots, video identity, playback events, close/reopen, rejected play/retry')
        assert not errors, errors
        browser.close()
