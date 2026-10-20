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
