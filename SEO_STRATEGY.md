# YTCPM search-intent and content implementation plan

Research/implementation date: 2026-10-20. Domain: https://ytcpm.online. No ranking, traffic, indexing, AI citation or endorsement guarantee.

## Research method and limits

Reviewed live search results for YouTube money/earnings/CPM/RPM calculators, official YouTube metric and authorization documentation, and Google Search AI guidance. Competitor titles demonstrate naming patterns; they do not establish keyword volume, keyword difficulty, or benchmark accuracy. We do not have an authenticated Keyword Planner/Search Console export. No invented monthly searches, popularity ranking, CPC or organic-difficulty scores are used.

Research examples (not numerical data sources):
- https://creaticalc.com/youtube-money-calculator
- https://creaticalc.com/youtube-cpm-calculator
- https://youtuberpmcalculator.com/

Official references:
- Metric definitions: https://support.google.com/youtube/answer/9314357?hl=en
- Metric reporting: https://developers.google.com/youtube/analytics/metrics
- Private channel reports: https://developers.google.com/youtube/analytics/channel_reports
- Revenue-share context: https://support.google.com/youtube/answer/72902?hl=en
- AI search fundamentals: https://developers.google.com/search/docs/appearance/ai-features
- No special AI files/markup requirement: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Keyword-volume measurement: https://support.google.com/google-ads/answer/3022575?hl=en
- Domain-name relevance is not a ranking shortcut: https://developers.google.com/search/docs/appearance/ranking-systems-guide

## Keyword-to-page ownership (priority by relevance, not measured volume)

| Intent cluster | Primary page | Status |
| --- | --- | --- |
| youtube earnings calculator, youtube money calculator, income/revenue estimator | `/` | Updated copy; existing earnings tool retained |
| youtube cpm calculator, calculate youtube cpm | `/youtube-cpm-calculator` | Real gross revenue/ad-impression arithmetic |
| youtube rpm calculator, revenue per 1000 views | `/youtube-rpm-calculator` | Creator revenue/matching views arithmetic |
| how to check youtube cpm, youtube cpm checker, monitor my CPM | `/guides/how-to-check-youtube-cpm` | Studio workflow, consistent monitoring, authorization limits |
| youtube cpm vs rpm, playback based cpm meaning | `/guides/youtube-cpm-vs-rpm` | Definitions and a three-metric worked example |
| how much does youtube pay per 1000 views, 100000 views, 1 million views | `/guides/youtube-earnings-per-1000-views` | One substantial guide, not thin copies per count |
| youtube cpm by country, youtube cpm india/us/etc. | Existing country routes | Retained URLs; model scope and payout assumptions clarified |
| youtube cpm by niche | Existing niche routes | Retained URLs; not marketed as verified national/channel averages |

Do not create separate money/income/revenue pages with identical tools solely for synonyms. Avoid pages for every country × niche × year × view-count permutation. Add a page only when it has a distinct user task and substantive evidence or functionality.

## Architecture decision

Retain Next.js hybrid architecture. Public tools, guides and benchmarks are statically generated with crawlable content; client components add calculation interactivity. API usage monitoring remains dynamic and noindex. Static does not mean non-interactive. ISR is optional when there is a real publishing workflow, not needed for manually maintained constants.

A future owner-connected monitoring dashboard would require OAuth, appropriate scopes, channel eligibility, secure token storage, revocation/deletion controls and accurate refresh status. It is not implemented or advertised as currently available. `/monitor` explicitly describes calculation API activity, not YouTube revenue analytics.

## Implemented content and technical changes

- Two dedicated calculators, three unique guides, a guide index and public sources/editorial policy.
- Homepage answer-first learning section, precise FAQs and honest distinction between estimating earnings and calculating CPM.
- Native HTML FAQ disclosures: every answer exists in initial HTML and works without JavaScript.
- Per-page canonical, description and social metadata for new pages; site identity graph, article citations and breadcrumbs without fabricated reviews, authors' credentials or endorsements.
- New public routes in sitemap; contact included. Private/API routes excluded from sitemap. Existing robots policy permits public crawling and disallows APIs.
- Navigation/footer/internal links connect tools, concepts and official sources. No special bot-only text, keyword stuffing, paid-link campaign, AI prompt injection or claim that an llms.txt file produces recommendations.
- Benchmark pages explicitly disclose full-fill assumptions; removed several unsupported revenue multipliers and “actual average” claims. Source policy openly identifies the missing first-party per-record benchmark ledger.

## Trust is a publishing practice, not a badge

Official links support definitions, not our directional ranges. A source ledger, independently checked benchmark samples and real editor verification are still required before claiming market-data accuracy. Current copy discloses AI drafting assistance and does not claim an independent expert review. Do not advance dates automatically, fabricate an editorial team biography, invent channel case studies, or display “recommended by ChatGPT/Gemini/Claude/Grok” logos.

Google's AI guidance says normal SEO principles remain relevant, that no special AI markup/file is required, and that eligibility does not guarantee indexing or inclusion. Different AI services make their own retrieval/citation choices. This implementation improves clarity and accessibility; it does not control those choices.

## Next measurement and editorial steps

1. Verify the HTTPS domain property in Search Console and submit `/sitemap.xml`; inspect representative rendered pages and robots/noindex behavior on the actual host/CDN.
2. Export keyword candidates for India and worldwide separately using the same date range and network settings. Keyword Planner numbers are estimates and may combine variants; Ads competition is not organic keyword difficulty.
3. Track organic queries, impressions, clicks, CTR and tool usage over a meaningful period; do not promise traffic after a fixed number of days.
4. Build an opt-in, redacted benchmark evidence ledger (format, audience, date range, metric, sample size, provenance). Replace model defaults only when supported; otherwise retain their scenario labeling.
5. Add Hindi content only with substantive translation/local examples and a reviewed hreflang/canonical plan, not auto-generated doorway pages.
6. Measure real mobile Core Web Vitals and review the actual server/CDN cache, TLS, crawler access and error responses. No Lighthouse/SEO score is fabricated here.
7. Prioritize a secure connected dashboard only after demand and consent/privacy requirements are validated.

## Reproduce checks

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
# Run a local server in another terminal, then:
npx playwright install --with-deps chromium
npm run test:ui
npm run test:seo
```

`test:seo` checks canonical/description/H1/schema HTML, no-JS FAQs, source links, sitemap inclusion, invalid-guide 404, responsive tools and CPM/RPM input handling. `BASE_URL` and `CHROMIUM_EXECUTABLE_PATH` are supported. Tests are not certification of deployment, financial accuracy, accessibility compliance or AI trust.

## Final verification — 2026-10-20

- `npm run lint`, `npm run typecheck`: passed.
- `npm test`: 100 tests in 7 files passed.
- `npm run build`: 63 generated outputs; new editorial/tool routes are static.
- Production browser UI smoke: all 12 widths (320–2560px), existing public routes, API/calculator interactions and browser-error checks passed.
- Production SEO browser smoke: initial HTML without JavaScript, native FAQ disclosures, canonicals/social URLs, JSON-LD syntax, sitemap entries, guide 404, responsive guides/tools and real CPM/RPM calculations passed. The comparison guide uses a visible semantic table.
- Homepage canonical assertions normalize equivalent origin URLs (`https://ytcpm.online` and `https://ytcpm.online/`) rather than treating that serialization difference as an indexing defect.
- Removed unsupported niche payout/format guarantees and misleading health/kids policy advice from shared category copy; numerical model defaults remain unchanged. Seasonal descriptions now identify scenarios rather than forecast universal quarterly behavior.

Browser commands used `BASE_URL=http://127.0.0.1:3100` against `next start`, with the available sandbox Chromium executable. This validates the local production build, not a deployed domain, Search Console indexing or actual search/AI visibility. The existing nonblocking Vitest config warning remains.
