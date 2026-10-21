# Channel Auditor — product and implementation notes

Added: 2026-10-21. Route: `/channel-auditor`. API base: `/api/channel-audit`.

## What it does

A visitor pastes a public YouTube channel URL, an `@handle` or a `/channel/UC…` URL. The
server resolves the channel through the YouTube Data API and returns:

- channel title, handle, description, creation date, channel keywords, country and subscriber count
  (reported as *hidden* when the creator hides it),
- public uploads with title, description, publication date, tags, category, duration and public
  view / like / comment counts,
- public playlists with item counts,
- derived signals: best and worst performers by views, fastest riser by views per day, engagement
  rate, upload cadence, tag coverage, missing descriptions, category split,
- phrase analysis: strongest and weakest repeated phrases with the views behind them,
- modelled CPM / RPM / monthly run rate / lifetime revenue scenarios.

## What it deliberately does not do

- It never connects a channel account and never requests owner authorization, so private,
  unlisted, deleted and members-only content is out of reach by construction.
- It cannot show a channel's real CPM, RPM, ad impressions, audience-country mix, retention or
  revenue. Every revenue figure is a scenario and is labelled **Estimated**.
- Phrases are inferred from public titles and tags. They are not verified search volumes,
  keyword difficulty scores or live search rankings.
- The audience market in the revenue panel is the visitor's assumption, not channel data.

Each figure carries a provenance label: **Public**, **Inferred**, **Estimated** or **Owner-verified**
(the last one is reserved for a future authorized flow and is not used today).

## Pricing posture

Nothing about price, plans or paid tiers is shown on the public site while the audits are free.
The page, the component and the API responses carry no plan names or amounts, and the browser
suite asserts that. Optional paid features are implemented server-side only: checkout stays closed
until `AUDIT_BILLING_MODE=paid` and Razorpay credentials are configured, so no payment can be taken
and no amount is published before the operator decides to publish it.

## Environment variables

| Variable | Purpose |
|---|---|
| `YOUTUBE_API_KEY` | Server-only YouTube Data API key. Without it, live audits return `503 not_configured` and the UI offers a labeled sample report. |
| `AUDIT_SIGNING_SECRET` | 32+ character secret that signs pagination cursors and export tokens. Generate with `openssl rand -hex 32`. |
| `AUDIT_BILLING_MODE` | `free` (default) keeps every audit free and publishes no pricing. `paid` switches on the optional purchased-depth path. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Enable checkout when billing is switched on. Without both, checkout returns 503 and no payment can be created. |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies the `x-razorpay-signature` HMAC on webhook deliveries. |
| `RAZORPAY_DEEP_AUDIT_PRICE_INR` / `RAZORPAY_COMPLETE_AUDIT_PRICE_INR` | Optional amount overrides for the server-side depth table. |

Credentials are read on the server only. Nothing is exposed to the browser bundle.

## Security decisions

- Channel input is parsed, never fetched. Only `@handle`, `/channel/UC…` and `/user/…` forms are
  accepted, so a user-supplied URL can never become a request target (SSRF).
- Pagination cursors and export tokens are HMAC-signed with `AUDIT_SIGNING_SECRET` and expire.
- The CSV export endpoint re-fetches the rows server-side from the signed token, so a paid export
  cannot be forged from browser-supplied data.
- Audit, checkout, verify, webhook and export endpoints are same-origin only, rate limited and
  marked `no-store` / `noindex`.
- The Razorpay amount always comes from the server plan table; the client never sends an amount.
  A captured payment is confirmed against Razorpay before a signed, HttpOnly entitlement cookie
  is issued.

## Depth levels (internal, not published)

| Depth | Videos | Playlists | Pages |
|---|---|---|---|
| `standard` | 50 | 20 | 1 |
| `deep` | 300 | 100 | 6 |
| `complete` | 1,000 | 500 | 20 |

In `free` mode every visitor receives the `complete` depth, so a free audit already covers the
whole public channel. The other depths exist only for a future paid path and are not named,
priced or shown anywhere on the site right now.

## Page SEO and content architecture

The page is the single owner of the "audit a YouTube channel" intent. Variants of that intent
(auditor, audit tool, analyzer, analysis, stats, competitor research, keyword analysis) are covered
by sections, headings, FAQ answers and schema on this one page rather than by thin sibling pages.

- Metadata: focus keyword in the title, the full output list in the description, twelve keyword
  variants, `category: finance`, and a `googleBot` directive with `max-image-preview: large`.
- Social image: `src/app/channel-auditor/opengraph-image.tsx` renders a 1200×630 card with the
  tool name and the Public/Inferred/Estimated promise; `og:image` and `twitter:image` point at it.
- JSON-LD: BreadcrumbList, WebPage, WebApplication (`isAccessibleForFree`, feature list),
  HowTo (three steps) and FAQPage (ten questions, matching the visible disclosures exactly).
- Server-rendered body: output panel, three-step "how it works", coverage table with a source
  column, a public-audit vs. YouTube Studio comparison table, a data-label explainer, four use
  cases, a limitations block, ten FAQ entries, a next-step panel and a sources list.
- Internal links: outbound to the niche/country benchmarks, the CPM and RPM calculators, the
  Studio CPM guide, methodology, sources and the tools index; inbound from the guides, niche and
  country indexes, methodology, sources, homepage, tools index, header and footer.
- Editorial copy lives in `src/lib/auditor/content.ts` so the page, the schema and the tests share
  one source of truth.

## Tests

- `src/lib/__tests__/auditor.test.ts` — input parsing, signed tokens, phrase analysis, insights,
  duration parsing, scenario ordering, plan gating, summary wording, category labels.
- `src/lib/__tests__/auditor-route.test.ts` — API guards: malformed body, non-YouTube URL,
  missing key, tampered cursor, oversized body, cross-origin request, no-store headers.
- `src/lib/__tests__/auditor-youtube.test.ts` — mocked Data API: channel resolution, pagination,
  quota and missing-channel errors, and the guarantee that only `googleapis.com` is called.
- `npm run test:channel-auditor` — browser run: title/description/keywords, canonical and OG URL,
  route-specific OG and Twitter images, the JSON-LD graph (BreadcrumbList, WebPage, WebApplication,
  HowTo, FAQPage), editorial depth and section headings, primary-source links, sample dashboard,
  all four tabs, clipboard copy, a check that no pricing or plan wording is visible, the CSV
  fallback message, the FAQ working without JavaScript, five widths and axe checks.
