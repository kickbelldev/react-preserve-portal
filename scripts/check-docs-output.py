"""Check crawler-visible HTML, sitemap, share assets and links without JavaScript.

Run through `nx run docs:check-output`; an optional directory supports fixture checks.
Only the Python standard library is needed.
"""
from collections import defaultdict
from html.parser import HTMLParser
import json
from pathlib import Path
import struct
import sys
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

REPOSITORY = Path(__file__).resolve().parent.parent
OUTPUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else REPOSITORY / 'dist/apps/docs'
BASE = 'https://kickbelldev.github.io/react-preserve-portal/'
IMAGE = BASE + 'social-card.png'


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lang = ''
        self.title = ''
        self.meta = defaultdict(list)
        self.head_links = []
        self.links = []
        self.ids = set()
        self.in_head = False
        self.in_title = False

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if tag == 'head':
            self.in_head = True
        if tag == 'html':
            self.lang = attributes.get('lang')
        if tag == 'title' and self.in_head:
            self.in_title = True
        if tag == 'meta' and self.in_head:
            key = attributes.get('property') or attributes.get('name')
            self.meta[key].append(attributes.get('content', ''))
        if tag == 'link' and self.in_head:
            self.head_links.append(attributes)
        if tag == 'a' and attributes.get('href'):
            self.links.append(attributes['href'])
        if 'id' in attributes:
            self.ids.add(attributes['id'])

    def handle_endtag(self, tag):
        if tag == 'head':
            self.in_head = False
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def canonical(relative):
    return BASE + relative.removesuffix('index.html')


pages = {}
for file in OUTPUT.rglob('*.html'):
    page = Page()
    page.feed(file.read_text())
    pages[file.relative_to(OUTPUT).as_posix()] = page
assert 'index.html' in pages and '404.html' in pages, 'Build the docs before checking output'

indexable = {relative: page for relative, page in pages.items() if relative != '404.html'}
expected_urls = {canonical(relative) for relative in indexable}
for relative, page in pages.items():
    def meta(key):
        values = page.meta[key]
        assert len(values) == 1 and values[0].strip(), f'{relative}: expected one nonempty {key}, got {values}'
        return values[0]

    canonicals = [link['href'] for link in page.head_links if link.get('rel') == 'canonical']
    alternates = [link for link in page.head_links if link.get('rel') == 'alternate' and 'hreflang' in link]
    if relative == '404.html':
        assert 'noindex' in meta('robots').split(', '), '404 must not be indexed'
        assert not canonicals and not alternates and not page.meta['og:url'], '404 must not advertise a canonical/translation/share URL'
        continue

    en = relative.startswith('en/')
    url = canonical(relative)
    assert page.lang == ('en' if en else 'ko-KR'), f'{relative}: incorrect document language'
    assert canonicals == [url], f'{relative}: canonical mismatch {canonicals}'
    assert not any('noindex' in value for value in page.meta['robots']), f'{relative}: unexpectedly excluded from search'
    assert meta('og:url') == url, f'{relative}: sharing URL differs from canonical'
    title = meta('og:title')
    assert title == meta('twitter:title') and (page.title == title or page.title.startswith(title + ' | ')), f'{relative}: sharing title differs from HTML title'
    assert meta('og:description') == meta('twitter:description') == meta('description'), f'{relative}: sharing description differs from HTML description'
    assert meta('og:locale') == ('en_US' if en else 'ko_KR'), f'{relative}: incorrect sharing language'
    assert meta('og:image') == meta('twitter:image') == IMAGE, f'{relative}: share image URL mismatch'
    assert meta('og:image:type') == 'image/png'
    assert meta('og:image:width') == '1200' and meta('og:image:height') == '630'
    assert meta('twitter:card') == 'summary_large_image'
    assert meta('og:image:alt') == meta('twitter:image:alt')

    unlocalized = relative.removeprefix('en/')
    expected = {lang: canonical(path) for lang, path in [('ko-KR', unlocalized), ('en', 'en/' + unlocalized)] if path in indexable}
    actual = {link['hreflang']: link['href'] for link in alternates}
    assert actual == expected and len(alternates) == len(expected), f'{relative}: missing, duplicate or incorrect language links {actual}'
    other_locale = ['ko_KR' if en else 'en_US'] if len(expected) == 2 else []
    assert page.meta['og:locale:alternate'] == other_locale, f'{relative}: incorrect alternate sharing locale'

image = OUTPUT / 'social-card.png'
png = image.read_bytes()
assert png[:8] == b'\x89PNG\r\n\x1a\n' and png[12:16] == b'IHDR', 'Share image must be a PNG'
assert struct.unpack('>II', png[16:24]) == (1200, 630), 'Share image dimensions must match metadata'

namespaces = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'x': 'http://www.w3.org/1999/xhtml'}
sitemap = ET.parse(OUTPUT / 'sitemap.xml').getroot()
urls = [entry.find('s:loc', namespaces).text for entry in sitemap]
assert len(urls) == len(set(urls)) and set(urls) == expected_urls, 'Sitemap must contain each indexable canonical exactly once, excluding 404'
by_url = {canonical(relative): page for relative, page in indexable.items()}
for entry, url in zip(sitemap, urls):
    expected = {link['hreflang']: link['href'] for link in by_url[url].head_links if link.get('rel') == 'alternate' and 'hreflang' in link}
    links = entry.findall('x:link', namespaces)
    assert len(links) == len(expected) and {link.get('hreflang'): link.get('href') for link in links} == expected, f'{url}: sitemap language links differ from HTML'

checked = 0
for relative, page in pages.items():
    for href in page.links:
        url = urlsplit(urljoin(canonical(relative), href))
        # External links and other projects on the same GitHub Pages origin are outside this build.
        if url.netloc != urlsplit(BASE).netloc or not url.path.startswith(urlsplit(BASE).path):
            continue
        path = unquote(url.path[len(urlsplit(BASE).path):])
        if url.path.endswith('/'):
            path += 'index.html'
        elif not Path(path).suffix:
            path += '.html'
        assert (OUTPUT / path).is_file(), f'{relative}: missing internal link {href}'
        if path in pages and url.fragment:
            assert unquote(url.fragment) in pages[path].ids, f'{relative}: missing section link {href}'
        checked += 1

manifest = json.loads((REPOSITORY / 'packages/react-preserve-portal/package.json').read_text())
assert manifest['homepage'] == BASE, 'npm homepage must lead to the canonical documentation site'
print(f'PASS: {len(indexable)} indexable pages, localized social metadata, reciprocal language links, sitemap, 404 exclusion, PNG, npm homepage and {checked} internal links')
