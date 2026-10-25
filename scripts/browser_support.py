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


# Vite's preview servers handle video range requests and application base paths.
from contextlib import contextmanager
from pathlib import Path
import signal
import socket
import subprocess
import tempfile
import time
from urllib.request import urlopen
from urllib.error import URLError


@contextmanager
def preview(project, prefix=''):
    root = Path(__file__).resolve().parent.parent
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        port = listener.getsockname()[1]
    base = f'http://127.0.0.1:{port}/{prefix}'
    with tempfile.TemporaryFile(mode='w+') as log:
        process = subprocess.Popen(
            ['corepack', 'pnpm', 'exec', 'nx', 'run', f'{project}:preview',
             f'--port={port}', '--host=127.0.0.1'], cwd=root,
            env={**os.environ, 'NX_DAEMON': 'false', 'NX_TUI': 'false', 'NODE_ENV': 'production'},
            stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            ready = False
            for _ in range(120):
                if process.poll() is not None:
                    break
                try:
                    with urlopen(base, timeout=1) as response:
                        if response.status == 200:
                            ready = True
                            break
                except (URLError, TimeoutError):
                    time.sleep(0.5)
            if not ready:
                log.seek(0)
                raise RuntimeError(f'{project} preview did not start: {log.read()}')
            yield base
        finally:
            if process.poll() is None:
                os.killpg(process.pid, signal.SIGTERM)
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait()
