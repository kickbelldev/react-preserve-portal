"""Browser smoke check. Requires Python Playwright and the selected PORTAL_BROWSER.

Run after `corepack pnpm docs:build`:
  python scripts/docs-smoke.py --local
Or pass the deployed base URL (including /react-preserve-portal/).
"""

from contextlib import nullcontext
import os
import re
import sys
from playwright.sync_api import expect, sync_playwright
from browser_support import launch_browser, preview, wait_for_video

base = (sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] != '--local' else
        'http://127.0.0.1:4173/react-preserve-portal/').rstrip('/') + '/'


def check_metadata(page, route):
    canonical = 'https://kickbelldev.github.io/react-preserve-portal/' + route
    expect(page.locator('link[rel="canonical"]')).to_have_count(1)
    expect(page.locator('link[rel="canonical"]')).to_have_attribute('href', canonical)
    expect(page.locator('meta[property="og:url"]')).to_have_count(1)
    expect(page.locator('meta[property="og:url"]')).to_have_attribute('content', canonical)
    expect(page.locator('meta[property="og:title"]')).to_have_count(1)
    title = page.locator('meta[property="og:title"]').get_attribute('content')
    assert page.title() == title or page.title().startswith(title + ' | ')
    expect(page.locator('meta[name="twitter:title"]')).to_have_attribute('content', title)
    expect(page.locator('meta[property="og:description"]')).to_have_attribute('content', page.locator('meta[name="description"]').get_attribute('content'))
    expect(page.locator('meta[property="og:locale"]')).to_have_attribute('content', 'en_US' if route.startswith('en/') else 'ko_KR')
    expect(page.locator('link[rel="alternate"][hreflang]')).to_have_count(2)
    expect(page.locator('meta[name="robots"]')).to_have_count(0)


def check_preservation(page, fallback=False):
    if fallback:
        page.add_init_script('''
        Element.prototype.moveBefore = undefined;
        const canPlay = HTMLMediaElement.prototype.canPlayType;
        HTMLMediaElement.prototype.canPlayType = function(type) {
          return type.startsWith('video/mp4') ? '' : canPlay.call(this, type);
        };
    ''')
    page.goto(base + 'playground.html', wait_until='networkidle')
    note = page.get_by_test_id('preserved-input')
    expect(note).to_be_visible()
    wait_for_video(page)
    page.evaluate('''() => {
      window.originalVideo = document.querySelector('video');
      originalVideo.pause();
    }''')
    page.get_by_role('button', name='재생', exact=True).click()
    page.wait_for_function('!originalVideo.paused && originalVideo.currentTime > 0.2')
    expect(page.get_by_role('button', name='일시정지', exact=True)).to_be_visible()
    note.fill('Persistent note / 유지되는 메모')
    page.get_by_test_id('increment').click()
    page.get_by_test_id('increment').click()
    page.evaluate('''() => {
      window.originalNote = document.querySelector('[data-testid="preserved-input"]');
      window.originalNote.focus();
      window.originalNote.setSelectionRange(2, 8);
      document.querySelector('[data-testid="to-mini"]').click();
    }''')
    expect(page.get_by_test_id('mini-slot').locator('input')).to_be_visible()
    assert page.evaluate('window.originalNote === document.querySelector("[data-testid=preserved-input]")')
    assert page.evaluate('originalVideo === document.querySelector("video")')
    expect(note).to_have_value('Persistent note / 유지되는 메모')
    expect(page.get_by_test_id('increment')).to_contain_text('2')
    if not fallback and page.evaluate("typeof Element.prototype.moveBefore === 'function'"):
        assert page.evaluate('!originalVideo.paused')
        assert page.evaluate('document.activeElement === window.originalNote')
        assert page.evaluate('[window.originalNote.selectionStart, window.originalNote.selectionEnd]') == [2, 8]
    for action in ['hide', 'reset']:
        page.get_by_test_id(action).click()
        expect(note).to_have_count(0)
        page.wait_for_function('originalVideo.paused && !originalVideo.isConnected')
        page.get_by_test_id('to-main').click()
        expect(note).to_have_value('Persistent note / 유지되는 메모')
        assert page.evaluate('window.originalNote === document.querySelector("[data-testid=preserved-input]")')
        expect(page.get_by_test_id('increment')).to_contain_text('2')
        assert page.evaluate('originalVideo === document.querySelector("video") && originalVideo.paused')
    page.evaluate('''() => {
      window.originalPlay = originalVideo.play;
      originalVideo.play = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
    }''')
    page.get_by_role('button', name='재생', exact=True).click()
    expect(page.get_by_test_id('playback-error')).to_be_visible()
    page.evaluate('() => { originalVideo.play = originalPlay }')
    page.get_by_role('button', name='재생', exact=True).click()
    expect(page.get_by_role('button', name='일시정지', exact=True)).to_be_visible()
    expect(page.get_by_test_id('playback-error')).to_have_count(0)
    page.emulate_media(reduced_motion='reduce')
    expect(page.get_by_role('checkbox', name='View Transition')).to_be_disabled()
    page.wait_for_function('originalVideo.paused')
    page.emulate_media(reduced_motion='no-preference')
    toggle = page.get_by_role('checkbox', name='View Transition')
    if page.evaluate("typeof document.startViewTransition === 'function'"):
        expect(toggle).to_be_enabled()
        page.locator('.demo-switch').click()
        expect(toggle).to_be_checked()
        toggle.focus()
        toggle.press('Space')
        expect(toggle).not_to_be_checked()
        toggle.press('Space')
        expect(toggle).to_be_checked()
        page.get_by_test_id('to-mini').click()
        expect(page.get_by_test_id('mini-slot').locator('input')).to_have_value('Persistent note / 유지되는 메모')
        page.get_by_test_id('to-main').click()
        expect(page.get_by_test_id('main-slot').locator('input')).to_be_visible()


server = preview('docs', 'react-preserve-portal/') if '--local' in sys.argv else nullcontext(base)
with server as base, sync_playwright() as p:
    browser = launch_browser(p)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    errors = []
    context.on('page', lambda page: page.on('pageerror', lambda error: errors.append(str(error))))
    page = context.new_page()
    not_found_response = page.goto(base + '404.html', wait_until='networkidle')
    not_found_html = not_found_response.text()
    expect(page.get_by_role('heading', name='PAGE NOT FOUND', exact=True)).to_be_visible()
    expect(page.locator('meta[name="robots"]')).to_have_attribute('content', 'noindex, follow')
    expect(page.locator('link[rel="canonical"]')).to_have_count(0)
    page.get_by_role('link', name='go to home', exact=True).click()
    expect(page.get_by_test_id('preserved-input')).to_be_visible()
    check_metadata(page, '')
    for missing in ['__missing_page__.html', 'en/__missing__/page.html']:
        url = base + missing
        if '--local' in sys.argv:
            # Model GitHub Pages serving the same 404.html at an unknown URL.
            page.route(url, lambda route: route.fulfill(status=404, content_type='text/html', body=not_found_html))
        response = page.goto(url, wait_until='networkidle')
        assert response.status == 404
        expect(page.get_by_role('heading', name='PAGE NOT FOUND', exact=True)).to_be_visible()
        expect(page.locator('meta[name="robots"]')).to_have_count(1)
        expect(page.locator('meta[name="robots"]')).to_have_attribute('content', 'noindex, follow')
        expect(page.locator('link[rel="canonical"]')).to_have_count(0)
        page.get_by_role('link', name='go to home', exact=True).click()
        expect(page.get_by_test_id('preserved-input')).to_be_visible()
        check_metadata(page, 'en/' if missing.startswith('en/') else '')
    image_page = context.new_page()
    image = image_page.goto(base + 'social-card.png')
    assert image.status == 200 and image.headers['content-type'].startswith('image/png')
    image_page.close()
    check_preservation(page)

    page.goto(base + 'guide/introduction.html', wait_until='networkidle')
    check_metadata(page, 'guide/introduction.html')
    page.locator('.VPNavBarSearch button').click()
    page.locator('#localsearch-input').fill('보존')
    expect(page.locator('.VPLocalSearchBox')).to_contain_text('보존 원리와 수명')
    page.keyboard.press('Escape')
    page.get_by_role('button', name='Change language').click()
    page.locator('.VPNavBarTranslations').get_by_role('link', name='English').click()
    expect(page).to_have_url(base + 'en/guide/introduction.html')
    expect(page.locator('h1')).to_have_text('Introduction')
    check_metadata(page, 'en/guide/introduction.html')
    page.locator('.VPNavBarSearch button').click()
    page.locator('#localsearch-input').fill('preservation')
    expect(page.locator('.VPLocalSearchBox')).to_contain_text('How preservation works')
    page.keyboard.press('Escape')
    page.locator('.VPNavBarAppearance button').click()
    expect(page.locator('html')).to_have_class(re.compile(r'(^|\s)dark(\s|$)'))  # VitePress adds 'mac' on macOS
    page.get_by_role('link', name='Playground', exact=True).first.click()
    expect(page.get_by_test_id('preserved-input')).to_be_visible()
    check_metadata(page, 'en/playground.html')
    expect(page.get_by_test_id('increment')).to_contain_text('0')
    page.get_by_test_id('to-mini').click()
    expect(page.get_by_test_id('mini-slot').locator('input')).to_be_visible()

    mobile = context.new_page()
    mobile.set_viewport_size({'width': 390, 'height': 844})
    mobile.goto(base, wait_until='networkidle')
    expect(mobile.get_by_test_id('preserved-input')).to_be_visible()
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Mobile horizontal overflow'
    mobile.get_by_role('button', name='mobile navigation').click()
    mobile.locator('.VPNavScreen').get_by_role('link', name='API', exact=True).click()
    expect(mobile.locator('h1')).to_have_text('API 레퍼런스')
    check_metadata(mobile, 'api.html')
    mobile.emulate_media(reduced_motion='reduce')
    mobile.goto(base + 'playground.html', wait_until='networkidle')
    expect(mobile.get_by_role('checkbox', name='View Transition')).to_be_disabled()
    assert mobile.locator('video').evaluate('(video) => video.paused && !video.autoplay')

    fallback = context.new_page()
    check_preservation(fallback, fallback=True)
    assert errors == [], errors
    browser.close()
    print(f'PASS: docs {os.environ.get("PORTAL_BROWSER", "chromium")}: real video, play failure/retry, dynamic reduced motion, native/fallback DOM identity, state, hide/reset, native focus/selection, View Transition, Korean/English search, locale navigation, dark mode, mobile navigation, reduced motion, metadata on client navigation, 404 recovery, share image; no page errors.')
