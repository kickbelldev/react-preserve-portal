import type { HeadConfig } from 'vitepress'

// Only build configuration supplies these values. No token is bundled by default.
export function analyticsHead(
  enabled: string | undefined,
  token: string | undefined,
  origin: string,
  base: string,
): HeadConfig[] {
  if (!enabled || enabled === 'false') return []
  if (enabled !== 'true') {
    throw new Error('DOCS_ANALYTICS_ENABLED must be true, false, or unset')
  }
  if (!token || !/^[a-f0-9]{32}$/i.test(token)) {
    throw new Error(
      'DOCS_ANALYTICS_TOKEN must be the 32-character site token from the Cloudflare Web Analytics snippet',
    )
  }

  // Escape HTML-sensitive characters even though the site token is validated.
  const config = JSON.stringify({ origin, base, token }).replace(
    /</g,
    '\\u003c',
  )
  return [
    [
      'script',
      { id: 'portal-analytics-loader' },
      `(() => {
  const config = ${config};
  if (location.origin !== config.origin || !location.pathname.startsWith(config.base)) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  function load() {
    if (document.getElementById('portal-analytics-beacon')) return;
    const script = document.createElement('script');
    script.id = 'portal-analytics-beacon';
    script.type = 'module';
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute('data-cf-beacon', JSON.stringify({ token: config.token, spa: true }));
    document.body.appendChild(script);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();`,
    ],
  ]
}
