"""Shared Playwright engine selection for the repository's browser checks."""
import os
import shutil


def launch_browser(playwright):
    name = os.environ.get('PORTAL_BROWSER', 'chromium')
    if name not in ('chromium', 'firefox', 'webkit'):
        raise ValueError('PORTAL_BROWSER must be chromium, firefox, or webkit')
    options = {}
    if name == 'chromium':
        options['executable_path'] = os.environ.get('CHROMIUM_PATH') or shutil.which('chromium')
        options['args'] = ['--no-sandbox', '--disable-dev-shm-usage']
    return getattr(playwright, name).launch(**options)
