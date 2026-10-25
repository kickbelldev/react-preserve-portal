"""Regenerate the static PNG after changing the existing brand illustration/card."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

from playwright.sync_api import sync_playwright
from browser_support import launch_browser

root = Path(__file__).resolve().parent.parent
destination = root / 'apps/docs/public/social-card.png'
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root / 'apps/docs')))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page(viewport={'width': 1200, 'height': 630},
                                device_scale_factor=1, reduced_motion='reduce')
        page.goto(f'http://127.0.0.1:{server.server_port}/.vitepress/social-card.html')
        page.wait_for_function('Array.from(document.images).every(image => image.complete && image.naturalWidth > 0)')
        page.screenshot(path=str(destination))
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    thread.join()
print(f'Wrote {destination.relative_to(root)} (1200 × 630)')
