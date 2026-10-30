# Lighthouse / PageSpeed run — 2026-10-30

The owner ran PageSpeed Insights against `https://ytcpm.online/` on a Moto G Power
profile with simulated slow 4G. Scores: **Performance 98, Accessibility 100,
Best Practices 92, SEO 100**, Agentic Browsing 2/2. This records what was wrong,
what changed, and what is deliberately left alone.

## What the report actually flagged

| Area | Finding | Cause |
| --- | --- | --- |
| Best Practices 92 | `static.cloudflareinsights.com/beacon.min.js` blocked by CSP, on every page view | The policy listed `'self'` only. Cloudflare appends that beacon at the edge; the code cannot remove it, so the only options were allow it or log an error on every visit |
| LCP request discovery | "LCP resources shouldn't use `loading=lazy`", "`fetchpriority=high` should be applied" | `next/image` `priority` is a deprecated alias in Next 16. It still type-checks and no longer emits the preload link or the priority hint |
| Efficient cache lifetimes | `/flags/*.svg` served with a 4-hour TTL | Files in `public/` are served `Cache-Control: public, max-age=0`, so the CDN's fallback TTL applied |

## Changes

1. **CSP allows the edge beacon.** `src/lib/analytics.ts` now holds one list of
   third-party origins split by directive — `scripts` for downloads, `connect`
   for the endpoints they report to — and `next.config.ts` builds both
   directives from it. Cloudflare serves the script from
   `static.cloudflareinsights.com` and the beacon posts to
   `cloudflareinsights.com`: two hosts, and allowing only the first still blocks
   the report.

2. **The hero image is actually preloaded.** `priority` → `preload` plus an
   explicit `fetchPriority="high"` on the homepage and every creator-tool page.
   Verified in the served HTML: `<img … fetchpriority="high">`, no `loading`
   attribute, and a `<link rel="preload" as="image" fetchPriority="high">`.

3. **Static artwork is cacheable for a year.** `next.config.ts` sets
   `public, max-age=31536000, immutable` on `/flags/*`, `/images/*` and
   `/hero-illustration.webp`. These paths are not hashed, so the rule is written
   out per directory rather than as a wildcard, and a test fails if any other
   source is ever marked immutable.

## Verification

- Served headers: `script-src` and `connect-src` carry both the Ahrefs and the
  Cloudflare origins; the flag, tool-image and hero responses carry the
  one-year cache header; `/api/health` stays `no-store`.
- A browser probe injected the exact blocked beacon URL and called the beacon
  endpoint: **no Content Security Policy violation**.
- `scripts/audit-project.mjs` now asserts the LCP rules on the rendered
  homepage, so a future page cannot quietly reintroduce `lazy` or lose the
  preload.
- `src/lib/__tests__/analytics.test.ts` and `security-headers.test.ts` pin the
  policy and the cache rules as unit tests, because both fail silently.

## Left alone, on purpose

- **Unused JavaScript (~53 KiB) and legacy polyfills (~14 KiB).** The unused
  share is `framer-motion`, which drives the reveal animations the design
  requires across every page; the polyfills are not from this project's
  dependencies. Removing either is a visual or bundler change, not a hook the
  report offers.
- **Render-blocking CSS (17 KiB, ~200 ms).** One stylesheet, already a single
  request. Inlining it would trade a cached request for bytes on every HTML
  response.
- **`'unsafe-inline'` for scripts.** Lighthouse's Trust and Safety note is
  accurate: a nonce-based policy would be stronger. It also forces every page
  to render dynamically, which costs more than it saves on a statically
  generated site — a deliberate trade, recorded here rather than silently
  accepted.

## Reproducing

```bash
npm run build && npx next start --port 3100 &
BASE_URL=http://127.0.0.1:3100 node scripts/audit-project.mjs
npx lighthouse http://127.0.0.1:3100/ --only-categories=performance,best-practices,seo \
  --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --view
```

A local run scores lower than PageSpeed Insights on this container; compare the
audit list, not the number.
