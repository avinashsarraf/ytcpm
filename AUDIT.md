# UI, functionality & production-readiness audit

Reviewed: 2026-10-20. Scope: current repository, supplied screenshot, local build, browser smoke checks and API regression tests. This is not a penetration test, live hosting assessment or verification of YouTube market benchmarks.

## Verdict

**Improved and build-ready, but not an unconditional production sign-off.** The public calculator works without PostgreSQL. The usage monitor and persistent API logging still require a configured, migrated database. The homepage is a browser-only long-form estimator, not a YouTube channel lookup or a live-data service.

## Fixed in this change

| Priority | Finding | Resolution |
|---|---|---|
| High | `null` JSON could crash `/api/calculate`; arbitrary strings/booleans were coerced into numbers and unknown content types silently became long-form. | Validate unknown JSON as an object, reject invalid fields with 422, require integer view counts and known type/season/niche/country. |
| High | API size check read the entire body and counted UTF-16 characters instead of transmitted bytes. | Stream with a 4 KiB byte limit, cancel oversized requests, reject malformed JSON and invalid UTF-8. |
| Medium | Unhandled idle PostgreSQL pool errors could terminate the Node process. | Add an error listener; retain existing best-effort logging and query timeouts. |
| Medium | Input icons overlap numbers: unlayered `.field`/`.select-field` padding beats Tailwind `pl-*` utilities. | Explicit component-level icon padding and consistent 46px field height. Verified computed padding in Chromium. |
| Medium | CPM entry loses decimal points while typing; clearing it becomes zero rather than restoring the benchmark. | Keep editable text separately from numeric calculations; preserve `3.`/`3.50`, accept explicit zero, restore benchmark on empty blur, bound CPM. |
| Medium | Homepage and calculator duplicate worldwide/default CPM arithmetic, including an unsafe `as never` cast. | Shared typed benchmark, worldwide record, revenue calculation and view parser in `src/lib/calculator.ts`. |
| Medium | Browser counts could exceed API/database limits. | Shared one-billion-view maximum across browser inputs and API; zero views is now valid. |
| Medium | Ad fill is discussed but not adjustable; 0% fill previously produced nonzero long-form earnings. | Add an accessible 0–100% ad-fill slider in Assumptions; use it in results, earnings tables and channel mode. Zero fill returns zero long-form earnings. |
| Medium | Q4 projection could multiply an already-seasonal estimate a second time. | Normalize the selected season before applying the maximum documented seasonal multiplier. |
| Medium | Gross advertiser revenue is labelled as earnings, inviting confusion with the creator payout. | Label gross ad revenue and creator earnings separately; disclose long-form model, fill, share and before-tax assumptions. |
| Medium | 1920px content shell, enlarged hero and asymmetric ultrawide grids create stretched fields/cards. | Full-bleed section backgrounds retained; shared content grid capped at 1600px with fluid gutters. Hero stops growing at desktop sizes. At 1440px the page remains near-full-width; ultrawides gain balanced margins. |
| Medium | Country-list/map split squeezes country names at intermediate desktop widths. | Keep a full-width list at laptop widths; restore decorative map only when there is room. |
| Medium | Two-column result tiles leave insufficient space on narrow phones. | Stack below 420px; retain two/four columns at wider breakpoints and improve coarse-pointer calculator hit areas. |
| Medium | Reveal animations can leave large sections blank until observation or a timeout, including screenshots/slow hydration. | Keep content visible from initial render; use only a subtle position transition and honor reduced motion. Add a calculator no-JavaScript notice. |
| Medium | External flag CDN causes broken assets when unavailable and a third-party browser request. | Bundle all 23 flag SVGs locally, retain MIT license, remove CDN configuration and update privacy copy. |
| Medium | “YouTube Stats”, “Blog”, “Check Channel” and “live benchmark” promise features that are not implemented. | Use Usage Monitor, Methodology and monthly-view projection terminology; describe reference benchmarks honestly. |
| Low | Footer social icons point to platform homepages, not site profiles. | Remove placeholder destinations; replace with a real methodology/help link. |
| Low | Header flex spacer contributes to uneven desktop navigation. | Right-align desktop navigation directly; reserve mobile control wrapper for mobile. |
| Low | Primary gradient's orange end has poor white-label contrast. | Darken gradient stops; preserve brand accent elsewhere. This is not a whole-site WCAG certification. |
| Low | Duplicated card/panel and text-gradient base CSS. | Combine shared declarations while preserving existing page aliases. |
| Medium | Public production health failures expose raw database-driver messages. | Keep detailed messages in non-production responses only; production retains state/code/actionable hints. |
| High (build tooling) | Direct PostCSS version has published security advisories. | Update pinned PostCSS from 8.5.8 to 8.5.31. |

## Validation performed

- ESLint and TypeScript checks pass.
- Production Next.js build passes without a configured database; 56 static outputs generated.
- **74 automated unit/API tests** across dataset invariants, calculations, validation, UTF-8/body limits, rate limits, route responses and bundled flag coverage.
- Added repeatable `npm run test:ui` using Playwright.
- Chromium browser smoke checks passed at **320, 375, 768, 1024, 1440, 1920 and 2560px**: no document-level horizontal overflow, bounded shell, correct icon padding, no broken homepage images.
- Browser interaction checks: decimal CPM input, empty reset, country benchmark reset, 0%/70% fill, quick earnings row selection, channel mode and Escape-to-close mobile navigation.
- Ten supporting routes checked at mobile width, including representative country/niche detail pages and monitor fallback.
- Real HTTP checks for 400/413/422 and valid API calculation with database-unavailable fallback; no uncaught browser page errors in the smoke run.
- Browser smoke checks passed against both the development server and a local `next start` production server. Production HTTP checks also verified the homepage, frame-guard header, 400/413/422 responses and no-database calculation fallback. A hosted production deployment was not exercised.
- Generated production headers retain `X-Frame-Options: DENY`, `frame-ancestors 'none'`, and exclude development eval/WebSocket exceptions. Embedded Arena preview exceptions require explicit `ARENA_PREVIEW=true` in non-production only.
- `npm audit --omit=dev --audit-level=high`: **0 runtime dependency advisories** at review time.
- `git diff --check`: clean.

## Remaining production gates / incomplete features

1. **PostgreSQL integration — high priority.** Provision a real database, run migrations, verify successful insert (`logged: true`), `/monitor` aggregates, `/api/health` readiness, outage recovery and backups/restore. Those database-backed paths were not integration-tested here. Without DB configuration `/api/health` deliberately returns 503 even though the public site works; do not use it as a database-independent liveness probe.
2. **Development dependency advisories — medium/high priority.** Full `npm audit` still reports **9 findings (5 high, 4 moderate)** in build/development dependency chains, notably `braces`/Next ESLint tooling and Drizzle Kit's old esbuild-kit/esbuild chain. Registry `braces` currently has no patched release. Audit proposes major framework-tool downgrades for some chains; these were not applied blindly. Re-evaluate upstream releases, constrain untrusted lint/glob input, and do not expose development/DB Studio servers publicly. Runtime-only audit being clean does not mean the entire dependency tree is clean.
3. **Benchmark provenance — medium priority.** Dataset review dates and methodology exist, but there is no per-record source ledger or verified traffic weighting. Manually curated rates/FX must not be represented as live market data. Worldwide is an unweighted average of tracked countries. Validate and cite the underlying market assumptions before making accuracy claims.
4. **Feature boundary — product decision.** Homepage supports long-form midpoint/custom CPM calculations. Shorts ranges exist in the API/data/detail pages, not as a homepage Shorts mode. No channel URL/handle lookup, OAuth, live YouTube API, actual YouTube statistics, blog CMS or channel scraping is implemented. Do not market those as working features.
5. **Usage analytics boundary — product decision.** Browser interactions intentionally do not call `/api/calculate`. The monitor tracks direct calculation API records, not every homepage click. Privacy/FAQ/schema comments now distinguish the two. If tracking browser usage is required, design an explicit event contract for custom CPM/worldwide inputs rather than silently sending mismatched benchmark requests.
6. **Scaling and proxy trust — before multiple replicas.** Limiter/cache are in-process. Move limits to shared storage and configure the ingress to overwrite trusted client-IP headers; direct public access to the origin permits forwarding-header spoofing. Add edge body/read timeouts for slow request streams. The route bounds bytes, not upload duration.
7. **TLS / secrets — deployment check.** Configure HTTPS, HSTS at the ingress and verified database TLS for managed providers (`DATABASE_SSL_STRICT=true` with appropriate CA). Existing sample defaults are not a managed-production TLS policy. Verify SMTP/mailbox ownership for `hello@ytcpm.online`; mail links do not establish that support is operational.
8. **CSP hardening — follow-up.** Production still permits inline scripts for Next hydration. A nonce/hash-based CSP needs an explicit rendering/caching design. Current header improvements should not be mistaken for strict-CSP certification.
9. **Accessibility/performance — before launch.** Complete keyboard/screen-reader and contrast audits, test real iOS Safari/Android and landscape behavior, then measure Lighthouse/Core Web Vitals on the actual host. Chromium smoke tests do not establish WCAG compliance or real-world performance scores. Extreme financial figures can still be visually truncated in some compact cards.
10. **Release operations.** Verify Docker/Coolify deployment, migration concurrency/retry behavior, retention policy, uptime monitoring, request/error logs and rollback. No Docker engine or real deployment validation was performed in this pass.

## Reproduce checks

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev --audit-level=high

# In a separate terminal; production server can also be used after build:
npm run dev -- --hostname 0.0.0.0

# Browser smoke checks (install Playwright browser/system dependencies first):
npx playwright install --with-deps chromium
npm run test:ui
# Optional:
BASE_URL=http://localhost:3000 SCREENSHOT_DIR=/tmp/ytcpm-screens npm run test:ui
```

`CHROMIUM_EXECUTABLE_PATH` can point to an existing compatible Chromium binary. Do not run the smoke script against a live production database without approval: it deliberately submits API test requests. Screenshots and browser downloads are not committed.

## Screenshot follow-up: UI/UX polish

The subsequent screenshot review has been addressed:

- Reduced stacked calculator/benefits spacing and feature-grid padding without changing full-bleed backgrounds or the readable desktop content cap.
- Hero artwork now keeps its natural 4:3 aspect ratio; edge masks follow the actual image instead of a letterboxed fill box, with feathering on both sides and top/bottom.
- Increased homepage supporting text, calculator metric captions, quick-view chips, FAQ text and navigation/footer link sizes. Darkened secondary copy and comparison links.
- Chose the instant-calculation interaction consistently: explicit instant-update notice and **View Results** anchor, not a misleading submit-style Calculate action.
- Added an always-visible selected-assumptions summary and **100% ad fill — optimistic scenario** label, retaining an explicit full-fill default rather than claiming an arbitrary fill rate is realistic.
- Assumptions can be opened from all three modes; niche, country, season and fill share one state. Limitations and the methodology link now sit directly beside the results.
- Removed the separate channel-check component/section and its New badge. There is only one channel estimator, within the calculator, using the same CPM, location, niche, season, fill and views as the other modes.
- Corrected the channel per-1,000-view figure to include selected ad fill; clarified annualized projection wording and scenario labels.
- Removed the decorative homepage world map so country comparisons get the full card width.
- Extended browser smoke checks for the single shared channel projection, fill-dependent RPM, visible optimistic-scenario notice, disclosure and instant-mode CTA, plus header overflow at every tested width.

Validation for this follow-up: 74 unit/API tests, lint, TypeScript and production build pass. Chromium smoke checks pass at 320, 375, 768, 1024, 1440, 1920 and 2560px. Hosted deployment and remaining production gates above are unchanged.

## Mobile/tablet screenshot follow-up

- Replaced the calculator's flex-mode strip with three equal-width grid buttons. Icons stack above wrapping labels on phones/small tablets; wider tablets use horizontal icon/label controls. Labels are no longer truncated or pushed outside the card around the old 480px breakpoint.
- Quick view presets now form balanced 3×2 rows on phones and one 6-button row from 640px, with 44px minimum hit targets (no orphaned 50M preset).
- Hero switches to a side-by-side layout at 768px rather than 1024px, reducing the tall, mostly empty tablet hero. Phone illustration size is capped to keep the calculator closer to the first screen.
- Benefits use compact icon-plus-text rows below 640px, retaining the two/four-card desktop grid. Balanced heading measure avoids an excessively long heading at intermediate widths.
- Financial values can wrap rather than silently truncate. Channel projection detail rows can reflow without colliding labels/amounts.
- Mobile navigation gets a viewport-bounded, scrollable region so links remain reachable in landscape/short windows.
- Browser regression coverage expanded to **12 widths: 320, 375, 420, 480, 600, 768, 820, 970, 1024, 1440, 1920, 2560px**, including checks for internal tab clipping, equal preset row counts, touch-target size, bounded tablet hero height, compact phone benefits, enlarged text and landscape navigation.

## Content/SEO follow-up — 2026-10-20

Implemented dedicated report-input CPM/RPM tools, three sourced guides, editorial policy/source page, no-JavaScript FAQs, homepage learning links, updated canonical/social metadata, identity/article/breadcrumb/application structured data and sitemap coverage. Country/niche figures are explicitly unverified directional model scenarios; shared category copy no longer promises payout improvements or ad-policy eligibility. Usage Monitor is explicitly API analytics, not a connected YouTube account dashboard. See `SEO_STRATEGY.md` for the intent map, source registry and measurement limits.

Validation: lint/typecheck passed; 100 unit tests passed; production build generated 63 outputs; production UI smoke passed at 12 widths (320–2560px) with no browser errors; SEO smoke passed no-JS HTML/FAQ, canonical/social/schema/sitemap/404, responsive guides/tools and CPM/RPM interactions. No keyword volumes, indexing, rankings, AI recommendations or live channel monitoring are claimed as verified.

## Separate legal pages — 2026-10-20

Added dedicated `/disclaimer` and `/cookies` documents plus a `/legal` overview; retained and rewrote separate `/privacy` and `/terms` URLs. Each policy has its own canonical/social metadata, update date independent of benchmark data, table of contents and related-policy navigation. Footer now separates legal policies from About/Contact, and all policy routes are included in the sitemap.

Corrected privacy claims that previously declared no personal-data processing or guaranteed anonymity: policies now distinguish local inputs, stored API records, in-memory rate counters, possible infrastructure logs and the absence of an automatic retention job. No operator identity, jurisdiction, retention deadline or legal-compliance certification was invented. Operator/deployment-specific details should be reviewed before relying on these documents as legal advice.

Validation: lint/typecheck, 100 unit tests, build (66 outputs), production UI smoke (12 widths) and expanded SEO smoke all passed. Legal pages were checked without JavaScript, for unique metadata/sitemap coverage and responsive overflow at 320–1920px.

## Legal content, global context and UI/SEO enhancement — 2026-10-20

Expanded all four policies with international-use context: conditional EEA/UK, California/US and India privacy considerations; cross-border infrastructure uncertainty; children/sensitive-information guidance; mandatory consumer rights; consistent currencies/reporting periods; exchange-rate, tax and net-receipt limitations; regional cookie concepts and browser privacy signals. Added official authority reference links without implying endorsement, legal review, universal applicability or worldwide compliance. Operator identity, actual hosting locations/transfer safeguards and jurisdiction-specific obligations still require real deployment/legal review.

Redesigned the legal center and policy reader with topic chips, summaries, reading-time estimates, breadcrumb navigation, numbered sections, bounded reading width, sticky desktop contents, a native collapsible mobile contents menu, three no-JS FAQs per policy, contact panels and cross-links. The shared editorial shell retains its previous default width on other pages. Added specific SEO titles, descriptions, canonical/social tags, WebPage/CollectionPage and breadcrumb JSON-LD reflecting visible content. Deliberately did not add obsolete meta-keywords, keyword stuffing or FAQ rich-result promises.

Final validation: lint and typecheck passed; 106 tests in 8 files passed; production build generated 66 outputs. Production UI smoke passed at all 12 existing viewport widths; expanded SEO smoke passed metadata/schema/sitemap checks, no-JS legal FAQs and mobile contents links, and legal-page overflow checks at 320/480/768/1024/1920px. Desktop/mobile policy screenshots were visually inspected. Existing nonblocking Vitest configuration warning remains.

## Homepage reference calculator redesign — 2026-10-21

Replaced the primary tab-and-external-tiles layout with the supplied reference's two-pane calculator: left controls, logarithmic views slider and presets, niche/country selectors and long-form/Shorts controls; right monthly result, range and four metric cards, followed by the formula strip. Defaults now match the example (100,000 monthly views, technology/software, US audience): $825 midpoint with $440–$1,210 model scenarios. The badge explicitly says model/not live, and ranges are not advertised as measured confidence intervals.

Preserved custom USD CPM, ad fill and seasonal assumptions in an expandable panel; preserved comparison-by-views and channel projections in a secondary disclosure. Added optional local-currency display using existing indicative FX, a dedicated Shorts engaged-view scenario (without a second share deduction), appropriate non-applicable advertiser CPM for Shorts, dynamic range fill and bound-safe manual counts. Updated the public FAQ and methodology to reflect the newly available homepage Shorts mode. No API calls or private-channel access were added.

Validation: lint/typecheck, 106 unit tests and production build (66 outputs) passed. Production UI smoke passed all 12 widths, custom CPM/zero/70% fill, reset and country updates, secondary projections, Shorts vs long-form, local currency, max inputs, slider endpoints and no browser errors; SEO smoke passed no-JS content, metadata, sitemap and dedicated tools. Desktop/mobile calculator screenshots inspected. Image checks now explicitly decode lazy-loaded images (the taller calculator can place flags below the initial viewport); homepage FAQ tests are scoped to actual FAQ IDs rather than counting the new planning disclosure as a FAQ.

## Reference footer, ticker and typography — 2026-10-21

Added the supplied country-rate marquee as a data-driven homepage component immediately after the calculator. It uses fourteen country scenarios from the central dataset, actual country-detail links, a visually duplicated inert/aria-hidden track, hover/keyboard pause, an explicit pause/resume control and a reduced-motion static wrapped list. Rates are labeled USD model scenarios, not live prices.

Rebuilt the shared footer in the supplied light editorial style: muted gray text, small red/green monospace headings, four desktop columns, country/niche detail links, thin dividers and a large decorative faded brand wordmark. Preserved calculators, guides, methodology, source policy, API Usage Monitor, all separate legal policies, About and Contact. Counts derive from data; no unsupported provenance or quarterly-refresh promises were copied. Updated global semantic gray/green/border colors and added the reference-style serif italic hero accent while retaining existing locally hosted fonts and readable contrast.

Validation: lint/typecheck, 106 unit tests and production build (66 outputs) passed. Production UI smoke passed all twelve widths (320–2560px), interactions and browser-error checks; SEO smoke passed. New `npm run test:branding` smoke passed footer/ticker overflow checks at eight widths, all footer destinations, 44px link targets, pause/resume state, duplicate accessibility exclusion and reduced-motion behavior. Desktop footer screenshot inspected. Vitest's pre-existing nonblocking configuration warning remains.

## Searchable country selection and automatic local results — 2026-10-21

Removed the requested below-calculator limitations/report-input paragraphs and the entire secondary comparison/projection disclosure (including all three mode controls/state). Retained the in-card model badge, scenario labels, assumptions and formula.

Reordered controls to monthly views → audience country → channel niche → content type. Added an inline searchable country list with self-hosted flags, full name, currency code/symbol, selected state, no-results feedback, bounded scrolling, arrow/Home/End/Enter handling, Escape/outside/blur dismissal and focus restoration. Worldwide uses a globe and USD. Options are programmatically focusable so clicking them does not trigger premature blur-dismissal before selection.

All result amounts now automatically use the selected country's local currency and existing approximate FX (monthly/range, RPM, CPM, annual, per-million). Removed the manual USD/local toggle. Niche option ranges are also scaled to the selected country/season and displayed locally. Custom CPM input is denominated in the selected currency, converted to base USD exactly once for arithmetic, and reset on country/niche/season changes; the original USD-equivalent input bounds remain. FX assumptions remain clearly approximate, not live.

Validation: lint/typecheck and 106 unit tests passed; production build generated 66 outputs. Production UI smoke passed all twelve widths and removed-feature assertions. New `npm run test:country-selector` passed at 320/375/768/1024/1920px with search by country/currency, flags, no-match results, control order, keyboard navigation, Escape/outside dismissal and automatic currency changes across INR/GBP/JPY/EUR/AUD/KRW/IDR/USD/Worldwide. Custom INR CPM arithmetic, Shorts local currency and maximum inputs passed. SEO and footer/ticker smoke also passed. INR calculator screenshot visually inspected. No live FX feed or new API/data collection was introduced.

## Animated amounts and tiered selections — 2026-10-21

Added 450ms eased count-up/count-down transitions to monthly estimates, scenario bounds, RPM/CPM bounds, annual projection and per-million output. Calculations remain immediate; only the visible monetary display interpolates. Rapid input changes cancel/restart from the current displayed value; currency-unit changes snap rather than mixing units. Reduced-motion preference skips animation (and stops an active animation if toggled). Screen readers receive the final amount separately; animated intermediate text is aria-hidden.

Country search retains flags/name/currency and keyboard selection, now with sticky Worldwide/Tier 1 Premium/Tier 2 Strong/Tier 3 Emerging/Tier 4 Volume headers derived from existing model tiers. Niche options are grouped into S/A and B/C model tiers; removed all monetary ranges from niche option labels without hiding the result cards. Tier labels describe model groupings, not independently verified worldwide rankings.

Validation: lint/typecheck, 106 unit tests and production build (66 outputs) passed. New `npm run test:animation` production browser checks passed increasing/decreasing intermediate values, exact final amounts, interruption, reduced motion, currency-unit safety, country headers and niche group membership/no prices. All existing production country-selector, 12-width UI, SEO and footer/ticker smoke tests passed as well.

## Creator planning suite and site-wide SEO verification — 2026-10-21

Added a premium responsive `/tools` hub and seven intent-specific static tool pages: Shorts earnings, views-to-money, revenue goals, CPM-to-RPM modeling, sponsorship quotes, engagement rate and watch time. One pure bounded-input calculation module, reusable calculator/cards, worked examples, original responsive formula artwork, source links and three native FAQs per tool. Sponsorship defaults are hypothetical quotes, Shorts uses engaged views and creator RPM without another share deduction, CPM conversion includes ad density, engagement is not a unique-person rate, and watch-time arithmetic explicitly does not confirm YPP eligibility.

Reused all existing country/niche canonical URLs instead of publishing duplicate landing pages; embedded the existing calculator with the appropriate country/niche selected. Added homepage/header/footer/hub/related-tool internal navigation. Implemented dedicated tool social previews, self-canonicals, title/description, headings, WebApplication/BreadcrumbList/FAQPage schemas and sitemap entries. Full sitemap crawl found and fixed missing social image metadata and homepage OG URL inheritance on about/contact/methodology. Primary-keyword map and external launch/multilingual limitations documented in `docs/seo/creator-tools-launch.md`; no unsupported ranking promises, meta-keyword stuffing, mass translated pages or Search Console submissions.

Validation: lint/typecheck; 285 unit tests; production build 74 outputs. New browser smoke audited all 67 indexable sitemap routes without JavaScript (unique title/description, H1, canonical/OG URLs, images, valid JSON-LD, internal content targets), tool images/404s/FAQs, seven calculations/invalid/reset cases and six widths 320–1920. Existing animation, country-selector, UI (12 widths up to 2560), SEO and branding smoke tests all passed. Mobile, tablet and desktop screenshots inspected. No external links placed and no PR merge.

## Full-project re-audit and verified remediation — 2026-10-21

Detailed findings, fixes, validation matrix and remaining limitations: `docs/audits/2026-10-21-project-review.md`.

Fixed client-navigation state leakage in tool/country/niche calculator instances; invalid calculator definition-list HTML; brand/policy contrast; keyboard access to scrollable content; Creator Tools active navigation and mobile Escape focus; excessive masthead spacing; duplicate unused animation implementations; misleading average/ranking and API-monitor instructions. Added 41 first-party prerendered country/niche OG/Twitter images, shorter descriptive titles, safer JSON-LD and contextual guide/tool links. Migration startup now retries with fresh pg.Client instances, cleans failed clients, bounds connection/retry behavior, sanitizes logs and serializes concurrent startup sessions with a PostgreSQL advisory lock. Renamed Vitest config to .mts.

Final verification: lint/typecheck/diff checks; 285 unit tests + 11 migration-connection tests; production build 115 outputs without font fetch warnings; all existing six browser suites plus new project and accessibility audits pass. Entire 67-page sitemap checked for metadata/SSR and link/image correctness: 80 image resources, 256 fragment links, unique IDs, robots/404s and actual client transitions. Accessibility audit: 67 sitemap pages plus monitor/404 at 375/1440, four extra interaction states = 142 scans, zero detected automated rule violations; not a blanket WCAG certification. Screenshots reviewed at mobile/tablet/desktop sizes.

Production dependency audit reports 0 vulnerabilities; 9 development-tool advisories remain documented, without unsafe forced major downgrades. No live database, production deployment, Search Console submission, ranking/traffic measurement or translated pages claimed. No external backlinks placed and no PR merge.

## Premium earnings workspace and searchable dropdowns — 2026-10-21

Refined the shared homepage/country/niche earnings workspace: compact studio toolbar, framed editable views, balanced preset buttons, softer green results surface, lighter currency badge and consistent result-card borders. Country and niche now share a reusable anchored searchable picker, rather than a layout-expanding country list and browser-dependent native niche select. Menus have rounded group-level search focus, distinct active/selected states, checkmarks, flag/icon tiles, tier dividers, keyboard hints, bounded scrolling and empty-search recovery. Niche options remain name-only with S/A or B/C model grouping; no monetary ranges beside names.

Addressed the reference screenshot's clipped initial Worldwide option and square nested search focus. Menu keyboard navigation scrolls only the menu, not the document; pointer hover no longer invokes scrollIntoView. Popovers do not move subsequent fields, can open above when space is limited, restore focus after selection/Escape, close outside/when tabbing away, respect reduced motion and keep 44px-or-larger option/close controls. Financial calculations, FX conversion, animations, content-format switching and custom CPM behavior are unchanged. Updated older smoke assertions for the new searchable niche control and workspace toolbar without removing behavioral coverage.

Validation: lint/typecheck, 285 unit tests and production build (115 outputs) pass. New `test:calculator-menus` verifies both selectors at six widths 320–1920, no layout reflow, bounds/sticky-header visibility, keyboard/mouse search/select/reset/empty/Tab flows, currencies and automated accessibility of both open menus. Country-selector, amount-animation, 12-width UI, creator-tools, whole-project link/image audit, SEO and branding browser suites pass. Desktop country/niche and mobile calculator screenshots visually inspected. GitHub push only; no PR merge.


## Channel Auditor addition — 2026-10-21

Added a public-channel auditor at `/channel-auditor` with a matching premium dashboard, plus the
server-side groundwork for paid Half and Full audits. The feature reads public YouTube Data API
responses only: channel statistics, public video details, tags, categories, playlists, derived
performance signals and inferred phrases. It never requests a channel login and cannot reach
private, unlisted, deleted or owner-only data, so a channel's real CPM, RPM, impressions,
audience-country mix and revenue remain out of reach — every revenue figure is a labelled model
scenario with a visitor-controlled market assumption.

User input is parsed rather than fetched, so a submitted string can never become a request target.
Pagination cursors and export tokens are HMAC-signed and expire; CSV exports are re-fetched
server-side from the signed token instead of trusting browser-supplied rows. Any optional payment
amount comes from a server-side depth table and a captured payment is verified before a signed,
HttpOnly access cookie is issued. Checkout stays closed until credentials are configured, so no
payment can be taken right now.

Because every audit is currently free, the page, the component and the API responses carry no
price, plan name or paid-tier wording anywhere; the browser suite asserts that no pricing string is
visible. A free audit already runs at the deepest internal depth, so it covers the whole public
channel rather than a shortened preview.

Credentials (`YOUTUBE_API_KEY`, `AUDIT_SIGNING_SECRET`, `RAZORPAY_*`, `AUDIT_BILLING_MODE`) live
only in environment variables and are documented in `.env.example` and
`docs/product/channel-auditor.md`. Privacy, terms, disclaimer and sources pages now describe what
the auditor does and cannot show.

Validation: lint, typecheck, production build and 315 unit tests pass (30 new). The new browser
suite covers API guards, the sample dashboard, all four tabs, clipboard copy, the plan dialog,
five widths and axe checks. The 68-page project audit, creator-tools, SEO, branding, 12-width UI,
calculator-menu, country-selector, animation and the full accessibility suite (all sitemap routes
at 375px and 1440px) pass with zero violations.
