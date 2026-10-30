# Project audit, fixes and verification — 2026-10-21

## Scope and outcome

Reviewed routes, shared UI, seven creator calculators, country/niche calculators, calculation API/input handling, database startup/migrations, content claims, metadata, crawlability, images, internal navigation and deployment documentation. Changes preserve the existing homepage/footer design, deterministic model math, automatic country currencies and reduced-motion amount animations.

All 67 sitemap pages were crawled in a JavaScript-disabled browser. Automated accessibility checks covered these pages plus the monitor and 404 at 375px and 1440px, with four additional interaction states: **142 scans, no detected rule violations** after fixes. This is automated evidence, not a certification of full WCAG conformance or a substitute for assistive-technology/user testing.

## Findings fixed

| Area | Finding | Resolution / verification |
| --- | --- | --- |
| Tool navigation | React state initialized from props could retain a previous tool's inputs after related-tool client navigation; full reload smoke tests did not cover this | Key calculator instances by tool slug; regression edits Shorts RPM, navigates without reloading to revenue goals, and asserts the correct defaults/result |
| Country/niche navigation | Same route-family navigation could retain the previous market/niche and view count | Key embedded calculator instances by slug; client-navigation tests check default views and newly selected market/niche |
| Result semantics | Calculator definition-list groups contained a paragraph outside their term/definition pair | Place explanatory note within its definition; axe definition-list checks pass |
| Contrast | Brand text and solid buttons used a red with insufficient small-text contrast against white/pastels | Deepened shared brand token without changing the reference layout; darkened green text-gradient stops; full-page axe checks pass |
| Policy navigation | Numbered table-of-contents labels used reduced-opacity body text | Use readable full-contrast text across policies |
| Decorative footer | Large pale watermark was exposed as ordinary rendered text to contrast analysis despite being decorative | Preserve the pale reference artwork as an aria-hidden, unfocusable inline SVG; no test-rule exclusions added |
| Keyboard access | Horizontally scrollable formula and revenue table lacked reliable keyboard access | Named focusable regions for the formula block and scenario table |
| Navigation feedback | Creator tool detail routes did not mark the parent Creator Tools navigation item active | Active parent state for focused creator tools; mobile aria-current and Escape focus restoration added |
| Premium visual consistency | Country/niche pages had excessive top spacing relative to the sticky header; all creator cards had the same icon and uneven CTA placement | Normalize page masthead spacing, distinct tool icons and bottom-aligned card CTAs; mobile/tablet/desktop screenshots reviewed |
| Duplicate implementation | Motion module retained unused CountUp and a second unused AnimatedMoney implementation | Removed unused animation exports and imports; active interruption-safe currency-aware animation remains unchanged |
| Content accuracy | Homepage mentioned average CPM rates; niche tiers and chart labels could imply measured real-world rankings | Explicit directional-model wording, highest/higher model CPM tier labels and model-midpoint chart wording |
| SEO titles | Country titles appended long rate/earnings wording plus the site template | Shortened country/niche titles while retaining unique intent and model qualification; no rendered sitemap title exceeds the audit's 75-character review threshold (not a Google ranking rule) |
| Social previews | Country/niche detail pages reused a generic image | Added 23 country + 18 niche first-party 1200×630 PNG image routes with descriptive alt text and matching OG/Twitter metadata; prerendered without external font/image requests |
| Structured-data safety | Country/niche JSON-LD used raw JSON.stringify | Use the shared script-delimiter-safe serializer; schema and visible FAQ content remain consistent |
| Contextual discovery | Guides linked older report-based tools but not the new planning flows | Added contextual views-to-money, revenue-goal and creator-hub links; existing source/methodology links retained |
| Migration reliability | Retrying the same pg.Client after a failed connect cannot reconnect successfully | New client per attempt, failed-client cleanup, bounded retry settings, 2-second connect timeout and sanitized retry logging; 11 isolated tests pass |
| Concurrent migrations | Two container starts could read the same migration ledger before either applied schema changes | Serialize startup migration sessions using a PostgreSQL advisory lock; live multi-container DB integration is still an external verification requirement |
| Operational docs | Instructions said browser calculator edits populate the API monitor and implied the calculation API returns 503 without DB | Corrected documentation/entrypoint messages to reflect browser-only inputs, unlogged successful estimates and the readiness endpoint's 503 |
| Test configuration | Vitest loaded ESM syntax through a CommonJS-named config | Renamed config to .mts; previous compatibility warning removed |

## SEO coverage

- Every sitemap page: unique title and description, single H1, self-canonical, page-specific OG URL, social image presence, parseable JSON-LD and indexable robots metadata.
- Focus-intent map: see `docs/seo/creator-tools-launch.md`. Country and niche pages retain established canonical URLs rather than duplicate landing pages. Focus phrases are used naturally, not inserted as hidden keywords. No meta-keywords tag or tag-archive spam added.
- Content: explanatory headings/subheadings, introductory descriptions, formulas, examples, native FAQs where appropriate, model/FX limitations and official sources supporting definitions (not supposedly certifying model rates).
- Images: explicit dimensions and alt attributes checked on every page; responsive Next Image optimization for visible images; 41 new route-specific social previews. All **80 distinct referenced image resources** returned image MIME types and HTTP 200.
- Internal links: every same-site HTML link resolves to a known public route; **256 fragment links** point to actual IDs; duplicate IDs checked across all pages. Real client transitions tested, not only direct page loads.
- Crawl controls: sitemap/robots retained, unknown tools/countries/niches/guides return 404 with noindex, monitor remains noindex and outside sitemap, API routes remain excluded from crawling. General indexable pages are not accidentally marked noindex.
- Existing Organization/WebSite/Article/Breadcrumb/WebApplication/FAQ/ItemList structures retained as applicable. Valid schema does not guarantee rich-result eligibility, including restricted FAQ rich results.
- No fabricated external backlinks, review ratings, search volumes, live rates, translations, affiliation or ranking guarantees.

## Final validation

| Check | Result |
| --- | --- |
| ESLint / TypeScript / whitespace checks | Pass |
| Vitest unit tests | 285 pass |
| Migration-connection unit tests | 11 pass |
| Production build | 115 outputs, including 41 new social images; no external-font warnings |
| `test:project` | 67 pages, 80 image resources, 256 fragment links, IDs/robots/404s and client route-state checks pass |
| `test:accessibility` | All 67 sitemap pages + monitor/404 at two widths and 4 interaction states; 142 scans, zero detected WCAG A/AA/best-practice rule violations |
| `test:creator-tools` | Site-wide metadata/SSR, seven calculators, input errors/reset and six viewport sizes pass |
| `test:animation` / `test:country-selector` | Count-up/down, interruption, reduced motion, currency safety, search and keyboard selection pass |
| `test:ui` | 12 widths from 320–2560, interactions and API fallback checks pass |
| `test:seo` / `test:branding` | No-JS SEO/FAQs, footer/ticker, touch targets and reduced motion pass |
| Production-only dependency audit | 0 reported vulnerabilities |

Scripts added: `test:project`, `test:accessibility`, `test:migrations`. Browser scripts accept BASE_URL and CHROMIUM_EXECUTABLE_PATH. Reports/screenshots are written under `/tmp`, not committed as large test artifacts.

## Remaining limitations / follow-up

1. **Development dependency advisories:** npm currently reports 9 development-tool findings (5 high, 4 moderate), propagating through ESLint's glob/braces chain and Drizzle Kit's legacy esbuild loader. Installed braces 3.0.3 is the latest version available in this registry and is covered by GHSA-vfj7-8cjw-p6xm. npm's suggested force fix downgrades Next's lint configuration across major versions and Drizzle Kit; this was not applied blindly. Keep tool inputs trusted, do not expose Drizzle Studio/dev tooling publicly, and re-evaluate compatible upstream patches. Production-only audit is clean, but this does **not** mean the complete development dependency tree is vulnerability-free.
2. **No live database in this sandbox:** missing DATABASE_URL is an intentional graceful fallback. Actual migrations, DB aggregates, advisory-lock behavior under concurrent real PostgreSQL connections and production connection settings need staging verification. Retry logic is isolated-unit-tested, not presented as a live DB integration test.
3. **Deployment/SEO field verification:** no production deployment, Search Console ownership/indexing submission, real-user Core Web Vitals or ranking/traffic measurements performed here. Submit/inspect URLs and monitor field performance after deployment.
4. **Content provenance:** country/niche/FX values remain manually maintained planning assumptions, not verified market averages or live rates. Official external-source availability and mailbox delivery were not verified from the restricted-network sandbox.
5. **Multilingual rollout:** real translations, editorial review and proper hreflang/canonical locale routing remain pending. No fake language pages were created.
6. **Operational scope:** API rate limits are process-local; multi-replica deployments need a shared limiter/trusted proxy configuration. Data retention and TLS options must be reviewed for the actual deployment. Existing disclosure pages describe the current behavior rather than asserting blanket legal compliance.
