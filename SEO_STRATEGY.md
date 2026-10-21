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
| youtube channel auditor, youtube channel audit tool, audit youtube channel, youtube channel analyzer, free youtube channel audit | `/channel-auditor` | Dedicated tool page; public-data audit of any channel with labelled estimates |
| youtube channel analysis, youtube competitor analysis, youtube channel stats checker | `/channel-auditor` | Same page owns the analysis intent — no separate "analysis" or "stats" pages |
| youtube keyword analysis tool, youtube tag analyzer, best performing videos finder | `/channel-auditor` | Keyword/tag/ranking panels live inside the audit report, not as standalone tools |
| youtube channel revenue estimate | `/channel-auditor` (scenarios) + `/youtube-rpm-calculator` (real numbers) | The audit only models scenarios; measured CPM/RPM arithmetic stays on the calculators |
| audit vs youtube studio analytics, youtube channel audit limitations | `/channel-auditor` | Comparison table and limitations section answer this on the same page |

The auditor cluster is one page with one user task: paste a channel, read the public picture. Keyword variants (auditor / audit tool / analyzer / analysis / stats / competitor) are synonyms of that task and are covered by sections, headings, FAQ answers and JSON-LD on the single page. Do not split them into thin pages, and do not add a page for "audit my own channel's private analytics" — that needs an owner-connected OAuth flow that does not exist.

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

## Channel Auditor page rebuild — 2026-10-21

`/channel-auditor` was rebuilt around a single intent: audit any public YouTube channel.

- **Metadata.** Title carries the focus keyword plus intent ("YouTube Channel Auditor — Free Channel Audit & Analysis Tool"); description states the full output list (category, every video, playlists, tags, keywords, best/worst performers, labeled CPM/RPM/revenue scenarios) and the no-signup condition. Twelve keyword variants, `category`, and a `googleBot` directive with `max-image-preview: large` / `max-snippet: -1` were added.
- **Route-specific social image.** `src/app/channel-auditor/opengraph-image.tsx` renders a 1200×630 card with the tool name and the Public/Inferred/Estimated promise, instead of the site-wide default card. `og:image` and `twitter:image` both point at it.
- **JSON-LD.** BreadcrumbList, WebPage, WebApplication (with `isAccessibleForFree` and a feature list), HowTo (three steps) and FAQPage (ten questions) now sit in one validated graph. The FAQ schema mirrors the visible disclosures exactly, so no markup claims content the page does not show.
- **Editorial depth.** The page now carries: a "what the report returns" panel, a three-step "how it works" block, a coverage table that names the source of every data class, a public-audit vs. YouTube Studio comparison table, a "how to read the three data labels" explainer, four creator use cases, a five-item limitations block, ten FAQ entries, a next-step panel and a sources list. Server-rendered main text exceeds 6,000 characters, which is what lets the page rank for long-tail questions instead of only the head term.
- **Internal links.** The page links out to the niche and country benchmarks, the CPM and RPM calculators, the Studio CPM guide, the methodology, the sources page and the tools index. Inbound links were added from the guide pages, the niche index, the country index, the methodology page, the sources page, the homepage, the tools index, the header and the footer.
- **UI/UX.** Hero rebuilt as a two-column layout with a labelled output panel and trust chips; the dashboard empty state now previews the six report sections instead of showing a placeholder; a Public/Inferred/Estimated legend was added to the dashboard toolbar; data tables became keyboard-scrollable regions.
- **Honesty preserved.** No price, plan name, upgrade prompt or Half/Full audit wording appears anywhere. Owner-only analytics, search volumes, live rankings and real channel revenue are still stated as unavailable. Estimated figures remain labelled.

Browser checks: `test:channel-auditor` (metadata, schema graph, editorial depth, no-JS FAQ, 5 widths, axe), `test:seo`, `test:creator-tools`, `test:project` (68 pages), `test:ui`, `test:branding` and the full accessibility sweep all pass; the sweep reports 0 rule/page violations.

## Legal-page follow-up

The legal center and four separate policies now have descriptive topic-specific titles and descriptions, Open Graph/Twitter metadata, visible topic labels, breadcrumbs and WebPage/CollectionPage schema. Regional information is conditional educational context with official authority reference links, not a claim of global legal compliance. Useful summaries, native FAQs and responsive section navigation improve access to the disclosures; no obsolete meta-keywords or tool-keyword stuffing was added. Policies should support transparency and user understanding, not become thin landing pages targeting unrelated calculator queries. Operator/deployment-specific facts still need professional review.

## Site-wide SEO sweep — 2026-10-21

Every one of the 68 indexable routes was audited page by page and brought to a zero-warning state. The audit is reproducible with `npm run test:seo-audit` (writes `/tmp/ytcpm-seo-audit.json`).

**Central SEO layer**

- `src/lib/seo.ts` — `pageMetadata(title, description, path, options?)` now accepts `focus`, `keywords[]`, `image {url,width,height,alt}`, `type`, `publishedTime`, `modifiedTime`, `robots` and `category`. It always emits a canonical, `og:locale: "en_US"`, `og:site_name`, `twitter:image` + `twitter:image:alt`, `og:image:alt`, and a `max-image-preview: large` robots directive. `webPageSchema()` builds a `WebPage` node with `@id`, `isPartOf`, `publisher`, `primaryImageOfPage` and an `about` array; `serializeJsonLd()` escapes `<` so a JSON-LD payload can never break out of its script tag.
- `src/lib/seo-keywords.ts` — the focus-keyword registry. `STATIC_PAGE_SEO` (13 static routes), `LEGAL_PAGE_SEO` (4 policies) plus `countrySeo()`, `nicheSeo()`, `toolSeo()`, `guideSeo()` and `allPageSeo()`. One page owns one intent; a regression test fails the build if two pages claim the same focus keyword.

**What changed per page type**

| Surface | Before | After |
| --- | --- | --- |
| Title | 54 of 68 pages over the 60-character SERP budget | every title ≤ 60 characters including the ` \| ytcpm.online` template |
| Meta description | 20 over 160 characters, 12 under 90 | every description 90–160 characters |
| `meta[name="keywords"]` | 67 pages missing | every page carries ≥ 4 keyword variants from the registry |
| `WebPage` JSON-LD | 64 pages missing | every page emits a `WebPage` node with a stable `@id` |
| `BreadcrumbList` JSON-LD | 22 pages missing | every page emits a breadcrumb trail |
| `twitter:image:alt` / `og:image:alt` | 61 pages missing | every page carries a descriptive alt for its social card |
| `og:locale` | 68 pages missing | `en_US` everywhere |
| Heading hierarchy | `/disclaimer` H1 was the single word "Disclaimer" | every H1 is descriptive (≥ 12 characters) and carries the page intent |
| Image alt text | 42 empty-alt flags | decorative artwork is labelled or hidden from assistive tech; flags carry their country name |
| Internal links | lowest inbound was 2 | lowest inbound is now 4; every tool and benchmark page is reachable from its peers and from the index |

**Structured data per route**

- Country and niche pages: `WebPage` + `FAQPage` + `BreadcrumbList`.
- Tool pages (`/[tool]`): `WebApplication` + `FAQPage` + `WebPage` + `BreadcrumbList`, with a route-specific social card.
- The two report-based calculators (`/youtube-cpm-calculator`, `/youtube-rpm-calculator`): `WebApplication` + `WebPage` + `BreadcrumbList`.
- Static editorial pages: `WebPage` + `BreadcrumbList`; `/guides` adds `CollectionPage`; `/legal` adds `CollectionPage`; legal policies add `FAQPage`.
- Home: `WebApplication` + `FAQPage` + `WebPage` + `BreadcrumbList`.

**Images**

- `src/app/image-sitemap.xml/route.ts` publishes a Google-style image sitemap with `<image:loc>`, `<image:title>` and `<image:caption>` for the home card, the Channel Auditor card, all 23 country cards, all 18 niche cards and the 7 tool screenshots. `robots.ts` advertises both sitemaps.
- The country-selector flag now uses a meaningful alt (`"India flag"`) instead of an empty string.

**Content that was thin**

`/about` gained "Who these tools are for" and "How the numbers are maintained"; `/contact` gained "Before you write", "What not to send" and "What happens after you write"; `/guides` was rebuilt with guide cards, a "What these guides cover" section and a "Turn a guide into a number" section. The three previously thin pages now clear the content threshold.

**Verification**

- `npm run test:seo-audit` — 68/68 routes, **0 errors, 0 warnings, 0 info**.
- `npm run test:seo` — extended to 22 routes; asserts a descriptive H1, a ≤ 60-character title, a 90–160-character description, ≥ 4 keywords, `og:locale`, `og:image:alt`, `twitter:image:alt`, a `WebPage` node, a `BreadcrumbList` node and a non-null `alt` on every `<img>`; also checks the image sitemap and the robots reference.
- `src/lib/__tests__/seo.test.ts` — 14 permanent regression tests over the registry, the metadata builder and the structured-data helpers.
- Full suite: `npm test` (14 files / 335 tests), `test:seo`, `test:creator-tools`, `test:project` (68 pages), `test:ui`, `test:branding`, `test:country-selector`, `test:animation`, `test:calculator-menus`, `test:channel-auditor` and `test:accessibility` (0 violations) all pass.

Titles, descriptions, keyword sets and schema are now generated from one registry, so a new route inherits the full SEO surface by default instead of relying on a hand-written metadata object.
