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

## Environment variables

| Variable | Purpose |
|---|---|
| `YOUTUBE_API_KEY` | Server-only YouTube Data API key. Without it, live audits return `503 not_configured` and the UI offers a labeled sample report. |
| `AUDIT_SIGNING_SECRET` | 32+ character secret that signs pagination cursors and export tokens. Generate with `openssl rand -hex 32`. |
| `AUDIT_BILLING_MODE` | `free` (default) keeps every depth free during launch. `paid` requires a purchased plan for Half/Full audits, copy and CSV export. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Enable checkout when billing is switched on. Without both, checkout returns 503 and no payment can be created. |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies the `x-razorpay-signature` HMAC on webhook deliveries. |
| `RAZORPAY_HALF_AUDIT_PRICE_INR` / `RAZORPAY_FULL_AUDIT_PRICE_INR` | Optional price overrides. Defaults: ₹499 and ₹1499. |

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

## Plans (catalogue)

| Plan | Price | Depth |
|---|---|---|
| Free Overview | ₹0 | 12 videos, 8 playlists |
| Half Audit | ₹499 | up to 200 videos, 50 playlists, full keyword table, copy and CSV |
| Full Audit | ₹1499 | up to 1,000 videos, every playlist, per-video scenarios |

Audits are free while `AUDIT_BILLING_MODE=free`. The pricing dialog states plainly that checkout
is not switched on, so no payment can be taken today.

## Tests

- `src/lib/__tests__/auditor.test.ts` — input parsing, signed tokens, phrase analysis, insights,
  duration parsing, scenario ordering, plan gating, summary wording, category labels.
- `src/lib/__tests__/auditor-route.test.ts` — API guards: malformed body, non-YouTube URL,
  missing key, tampered cursor, oversized body, cross-origin request, no-store headers.
- `src/lib/__tests__/auditor-youtube.test.ts` — mocked Data API: channel resolution, pagination,
  quota and missing-channel errors, and the guarantee that only `googleapis.com` is called.
- `npm run test:channel-auditor` — browser run: sample dashboard, all four tabs, clipboard copy,
  plan dialog, five widths and axe checks.
