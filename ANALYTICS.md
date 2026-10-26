# Documentation analytics setup

Analytics is **off by default**. This configuration does not create an account,
register a site, set repository variables, or deploy anything. The npm package
contains no analytics code.

## Service and metrics

[Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/)
is free and works on GitHub Pages without moving DNS or adding a server.
Its built-in SPA support covers VitePress navigation without an additional
page-view hook or custom event collection.

The dashboard provides page views, visits, paths, referrers, browser/device/country
breakdowns, page-load performance and Core Web Vitals. **Visits are not unique
people**: Cloudflare counts a visit when a page view comes directly or from a
different referring hostname. Counts are estimates affected by blockers, privacy
signals, disabled JavaScript and incomplete loads.

No collector was found in the existing site configuration or public runtime.
Enabling this setup starts collecting future traffic; it cannot recover earlier
page views. GitHub repository Insights → Traffic measures repository traffic,
not this GitHub Pages documentation site.

## Optional activation by a maintainer

These are manual steps for a separately approved activation. No real site token
is stored in this repository.

1. In a Cloudflare account, open **Web Analytics → Add a site** and register
   `kickbelldev.github.io` using the
   [non-proxied site setup](https://developers.cloudflare.com/web-analytics/get-started/#sites-not-proxied-through-cloudflare).
   No DNS, proxy or nameserver change is needed. This code only runs under
   `/react-preserve-portal/` on that hostname.
2. Open **Manage site** and copy the `token` from its JavaScript snippet.
   It is a public, 32-character hexadecimal **site beacon token**, visible to
   browsers. Do not supply a Cloudflare API token, account key or password.
3. In GitHub repository **Settings → Secrets and variables → Actions → Variables**,
   set these repository variables:

   | Variable                 | Value                                             |
   | ------------------------ | ------------------------------------------------- |
   | `DOCS_ANALYTICS_TOKEN`   | The actual site token from the Cloudflare snippet |
   | `DOCS_ANALYTICS_ENABLED` | `true` only when collection is approved           |

4. After the configuration is merged and activation is approved, run the existing
   **Documentation** workflow on `main`. These variables are build-time values;
   changing a variable alone does not update already deployed pages. The same
   environment variable names work for a local build, but the runtime hostname
   guard keeps local previews from sending data.

Unset, empty or `false` enablement produces no analytics loader. Enabling without
a valid token fails the build. The docs build cache includes both variables so
enabling, disabling or changing the token cannot reuse the wrong cached pages.
To stop collection, set `DOCS_ANALYTICS_ENABLED=false` and redeploy. Pages already
open in a browser may continue until closed or reloaded.

## SPA navigation and verification

The beacon uses `spa: true`. Cloudflare's
[SPA tracking](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/)
uses supported navigation APIs or History API events; we do not send a second
page-view event from VitePress. The loader appends at most one beacon per document.

After an approved activation, check a direct page load, Korean/English navigation,
and Back/Forward in the public site. The network panel should show one script
from `static.cloudflareinsights.com` and collection requests to
`cloudflareinsights.com/cdn-cgi/rum`. The dashboard can take a few minutes to update;
check paths as well as total views. Performance reports may be sent when the page
becomes hidden. A local preview is intentionally not a dashboard verification.

Run the configuration checks with:

```sh
corepack pnpm exec nx run docs:test
corepack pnpm exec nx run-many --projects=docs --targets=typecheck,lint,check-output
```

Tests use a synthetic token and do not contact Cloudflare. They verify the disabled
default, validation, hostname/path restrictions, privacy signals and single script
loading. Real ingestion and dashboard totals require an approved site token and
live activation; passing local tests does not establish those results.

## Data and privacy

Cloudflare states that its beacon does not use cookies, browser storage or
cross-site user tracking. We add no user IDs, form-field values or custom events.
The loader skips browsers that signal Global Privacy Control or Do Not Track.

When enabled, the browser still contacts a third party. Cloudflare receives URL /
referrer and performance data, including navigation timings and Core Web Vitals;
its network endpoint sees the source IP while handling the request. Cloudflare
states it discards that IP at its nearest data center and does not store it in
core databases or logs. Do not put private information in documentation URLs.
Cookie-less collection alone does not determine the site's notice or consent
requirements; review these before activation for the audience being served.

See the official [data collection and privacy reference](https://developers.cloudflare.com/speed/observatory/rum-beacon/)
and [metric definitions](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/).
