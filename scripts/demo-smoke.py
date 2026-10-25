"""Verify the built demo's routing and media lifecycle without remote videos.

Run `corepack pnpm exec nx run demo:build` first, then run this script with
Python Playwright and the selected PORTAL_BROWSER installed.
"""
import json
import os
from playwright.sync_api import expect, sync_playwright
from browser_support import launch_browser, preview, wait_for_video

# The mini player's play/pause control matches the element's paused state.
MIRRORS_VIDEO = '''(() => {
  const button = document.querySelector('.fixed button[aria-busy]')
  return button?.getAttribute('aria-label') === (video.paused ? '재생' : '일시정지')
})()'''
# After the test's pause(), the visible control switched to 재생 at least once.
SHOWED_AFTER_PAUSE = '''(() => {
  const start = mediaLog.findLastIndex((entry) => entry.step === 'test: video.pause()')
  const visible = (labels) => labels.split(',').filter((label) => !label.endsWith('(hidden)'))
  return mediaLog.slice(start).some((entry) => entry.ui && visible(entry.ui).every((label) => label === '재생'))
})()'''

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
              // Media and control history, printed only when a check fails.
              const t0 = performance.now();
              const labels = () => [...document.querySelectorAll('button[aria-busy]')]
                .map((b) => b.getAttribute('aria-label') + (b.closest('[hidden]') ? '(hidden)' : ''));
              const snap = () => ({
                t: Math.round(performance.now() - t0),
                paused: video.paused, ended: video.ended,
                time: Math.round(video.currentTime * 100) / 100,
                ready: video.readyState, labels: labels().join(','),
              });
              window.mediaLog = [];
              window.logStep = (step) => mediaLog.push({ step, ...snap() });
              for (const type of ['play', 'playing', 'pause', 'waiting', 'seeking', 'seeked',
                  'ended', 'stalled', 'suspend', 'emptied', 'loadstart', 'canplay', 'ratechange'])
                video.addEventListener(type, () => mediaLog.push({ event: type, ...snap() }));
              new MutationObserver(() => mediaLog.push({ ui: labels().join(','), ...snap() }))
                .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-label', 'aria-busy'] });
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
            try:
                wait_for_video(page)
                page.evaluate("logStep('test: click play')")
                page.get_by_role('button', name='재생', exact=True).click()
                page.wait_for_function('!video.paused && video.currentTime > 0.2')
                expect(page.get_by_role('button', name='일시정지', exact=True)).to_be_visible()
                page.evaluate("logStep('test: go Home')")
                page.get_by_role('link', name='Home', exact=True).click()
                expect(page.locator('.fixed video')).to_be_visible()
                assert page.evaluate('video === document.querySelector(".fixed video")')
                if not fallback and page.evaluate('typeof Element.prototype.moveBefore === "function"'):
                    assert page.evaluate('moves') == ['moveBefore']
                    assert page.evaluate('!video.paused')
                else:
                    assert page.evaluate('moves') == ['appendChild']
                # Native changes must update controls even without a button click.
                # Linux WebKit can resume an H.264 video by itself right after a
                # pause that follows a DOM move, so check events, not that the
                # pause sticks: the control must show 재생 when `pause` fires and
                # must then mirror the element's actual state.
                page.evaluate("logStep('test: video.pause()'); video.pause()")
                page.wait_for_function(SHOWED_AFTER_PAUSE)
                page.wait_for_function(MIRRORS_VIDEO)
                page.evaluate("logStep('test: video.play()'); video.play()")
                page.wait_for_function('!video.paused && ' + MIRRORS_VIDEO)
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
            except Exception:
                print('MEDIA LOG (' + ('fallback' if fallback else 'native') + '):')
                for entry in page.evaluate('mediaLog'):
                    print('  ' + json.dumps(entry, ensure_ascii=False))
                raise
            page.close()
            print(f'PASS: demo {os.environ.get("PORTAL_BROWSER", "chromium")} {"fallback" if fallback else "native"}: persistent slots, video identity, playback events, close/reopen, rejected play/retry')
        assert not errors, errors
        browser.close()
