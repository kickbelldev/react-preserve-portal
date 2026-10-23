"""Browser smoke check. Requires Python Playwright and a Chromium installation.

Run after `corepack pnpm docs:build` and `corepack pnpm docs:preview`:
  python scripts/docs-smoke.py
Or pass the deployed base URL (including /react-preserve-portal/).
"""

import os
import sys
from playwright.sync_api import expect, sync_playwright

base = (sys.argv[1] if len(sys.argv) > 1 else
        'http://127.0.0.1:4173/react-preserve-portal/').rstrip('/') + '/'


def check_preservation(page, fallback=False):
    if fallback:
        page.add_init_script("Element.prototype.moveBefore = undefined")
    page.goto(base + 'playground.html', wait_until='networkidle')
    note = page.get_by_test_id('preserved-input')
    expect(note).to_be_visible()
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
    expect(note).to_have_value('Persistent note / 유지되는 메모')
    expect(page.get_by_test_id('increment')).to_contain_text('2')
    if not fallback and page.evaluate("typeof Element.prototype.moveBefore === 'function'"):
        assert page.evaluate('document.activeElement === window.originalNote')
        assert page.evaluate('[window.originalNote.selectionStart, window.originalNote.selectionEnd]') == [2, 8]
    for action in ['hide', 'reset']:
        page.get_by_test_id(action).click()
        expect(note).to_have_count(0)
        page.get_by_test_id('to-main').click()
        expect(note).to_have_value('Persistent note / 유지되는 메모')
        assert page.evaluate('window.originalNote === document.querySelector("[data-testid=preserved-input]")')
        expect(page.get_by_test_id('increment')).to_contain_text('2')
    toggle = page.get_by_role('checkbox', name='View Transition')
    if toggle.is_enabled():
        toggle.check()
        page.get_by_test_id('to-mini').click()
        expect(page.get_by_test_id('mini-slot').locator('input')).to_have_value('Persistent note / 유지되는 메모')
        page.get_by_test_id('to-main').click()
        expect(page.get_by_test_id('main-slot').locator('input')).to_be_visible()


with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
        headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'],
    )
    context = browser.new_context(viewport={'width': 1440, 'height': 1000})
    errors = []
    context.on('page', lambda page: page.on('pageerror', lambda error: errors.append(str(error))))
    page = context.new_page()
    check_preservation(page)

    page.goto(base + 'guide/introduction.html', wait_until='networkidle')
    page.locator('.VPNavBarSearch button').click()
    page.locator('#localsearch-input').fill('보존')
    expect(page.locator('.VPLocalSearchBox')).to_contain_text('보존 원리와 수명')
    page.keyboard.press('Escape')
    page.get_by_role('button', name='Change language').click()
    page.locator('.VPNavBarTranslations').get_by_role('link', name='English').click()
    expect(page).to_have_url(base + 'en/guide/introduction.html')
    expect(page.locator('h1')).to_have_text('Introduction')
    page.locator('.VPNavBarSearch button').click()
    page.locator('#localsearch-input').fill('preservation')
    expect(page.locator('.VPLocalSearchBox')).to_contain_text('How preservation works')
    page.keyboard.press('Escape')
    page.locator('.VPNavBarAppearance button').click()
    expect(page.locator('html')).to_have_class('dark')
    page.get_by_role('link', name='Playground', exact=True).first.click()
    expect(page.get_by_test_id('preserved-input')).to_be_visible()
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
    mobile.emulate_media(reduced_motion='reduce')
    mobile.goto(base + 'playground.html', wait_until='networkidle')
    expect(mobile.get_by_role('checkbox', name='View Transition')).to_be_disabled()

    fallback = context.new_page()
    check_preservation(fallback, fallback=True)
    assert errors == [], errors
    browser.close()
    print('PASS: native/fallback DOM identity, state, hide/reset, native focus/selection, View Transition, Korean/English search, locale navigation, dark mode, mobile navigation, reduced motion; no page errors.')
