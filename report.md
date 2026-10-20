# ytcpm.online — Deep Technical & Product Analysis

**Repository:** [`avinashsarraf/ytcpm`](https://github.com/avinashsarraf/ytcpm)
**Commit analyzed:** `a72fd20` — "Add files via upload" (2026-10-20)
**Branch audited:** `main` (working branch for this analysis: `arena/4884ba2f-ytcpm`)
**Report date:** 2026-10-20
**Scope:** every tracked file in `src/`, all configuration, the data and calculation model, rendering/SEO, API + database layer, security, accessibility, performance, and delivery tooling.

> **Method.** This is a source-level audit combined with executed verification (type-check, lint, production build, `next start`, HTTP probing, dependency audit, and a programmatic data-invariant audit). No production analytics, Search Console data, or Lighthouse measurements were available, so performance notes are structural rather than measured. Code was **not** modified by this audit; recommendations are listed in [§12](#12-findings-register) and [§13](#13-prioritized-roadmap). Three non-code files were added alongside this report: `.gitignore`, `.env.example`, and the generated `package-lock.json`.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Product analysis](#2-product-analysis)
3. [Repository & stack snapshot](#3-repository--stack-snapshot)
4. [Architecture](#4-architecture)
5. [Data model & calculation engine](#5-data-model--calculation-engine)
6. [Frontend, UX & accessibility](#6-frontend-ux--accessibility)
7. [SEO & content architecture](#7-seo--content-architecture)
8. [Backend, API & database](#8-backend-api--database)
9. [Security & privacy](#9-security--privacy)
10. [Performance, reliability & observability](#10-performance-reliability--observability)
11. [Build, testing & delivery](#11-build-testing--delivery)
12. [Findings register](#12-findings-register)
13. [Prioritized roadmap](#13-prioritized-roadmap)
14. [Appendices](#appendix-a--route-inventory)

---

## 1. Executive summary

**ytcpm.online** is a static-first YouTube CPM/RPM calculator built on **Next.js 16.2.6 (App Router, Turbopack)**, **React 19**, **Tailwind CSS v4**, and **Drizzle ORM + PostgreSQL**. It combines:

- a client-side calculator (views slider, 23 countries, 18 niches, long-form vs Shorts),
- 41 programmatically generated country/niche landing pages with local-currency conversion,
- a usage-analytics dashboard (`/monitor`) backed by a `calculations` table,
- unusually complete SEO scaffolding for a v1 (canonical URLs, sitemap, robots, JSON-LD, internal links),
- a polished editorial design system (Tailwind theme tokens, four typefaces, motion).

The codebase is **small (25 files, 1,923 lines), strict-TypeScript, and passes `tsc` and ESLint cleanly**. A production build generates **50 route entries / 45 sitemap URLs** and the static pages are cached with `s-maxage=31536000`. Structurally, this is a well-organized, purpose-built SEO tool rather than a generic template — despite a few leftover template identifiers.

The risks are **not architectural**. They cluster in four areas:

| Area | Verdict | Why it matters |
|---|---|---|
| **Trust in the numbers** | 🔴 Weakest link | Hard-coded 2026 benchmarks with no citations, no "last updated" date, a slider whose tick labels are wrong, a Shorts model that contradicts the site's own FAQ, and an RPM formula that ignores the monetized-view ratio. |
| **Operational readiness** | 🟠 Fragile | Build **hard-fails without `DATABASE_URL`** (verified), missing `public/` assets cause 404s on the hero and every social share, no `.gitignore`/lockfile at audit time, no migrations, no tests, no CI. |
| **Security posture** | 🟠 Needs work | `npm audit` reports **3 production vulnerabilities (1 critical)** in `next@16.2.6`, no security headers, no rate limiting on a public write endpoint. |
| **Business capture** | 🟡 Unrealized | No ads, affiliate links, email capture, accounts, or analytics. High-intent finance/insurance traffic is monetized with $0 revenue per session. |

### Scorecard

| Dimension | Grade | Rationale |
|---|---|---|
| Product clarity & positioning | **A−** | Clear job-to-be-done, strong local-currency differentiator, coherent content model. |
| Architecture & separation of concerns | **B+** | Clean server/client split, one shared data + formula module, typed API. Small surface area. |
| Code quality | **B** | Strict TS, readable components; but dead exports, unused imports, magic numbers, duplicated label maps, 100+ char JSX lines. |
| Data & methodology | **C** | Transparent ranges and seasonality, but no provenance, coarse linear scaling, no audience mix, inconsistent Shorts logic. |
| SEO & content architecture | **A−** | 45 URLs, canonicals, sitemap, robots, JSON-LD, internal linking, SSG. Missing OG asset, breadcrumb schema, authorship. |
| Performance | **B−** | Excellent static caching; but 4 font families (one unused), framer-motion hydration across charts/cards, ~124 KB home HTML, unoptimized flags. |
| Accessibility | **C+** | Semantic headings, real form labels, `aria-expanded` on FAQ; but 4.0:1 red-on-white contrast, unlabeled slider semantics, no skip link, no reduced-motion handling. |
| Security | **C** | No secrets in code beyond a local DB default; but critical framework advisory, no headers, no rate limiting. |
| Reliability & observability | **C−** | Graceful DB-down degradation in the calculator (verified), but import-time env crash, heavy monitor queries, log flooding, no error tracking. |
| Testing | **F** | Zero tests, zero CI, no test runner configured. |
| Documentation | **D** | README is a generic starter template that tells the reader to "add your source code". No env, DB, or deployment docs. |
| **Overall** | **C+** | Strong front-end and SEO foundation; production hardening, data credibility, and testing are the gaps. |

### Top five things to fix first

1. **Add the missing `public/` assets** — `/images/hero-illustration.png` and `/og.png` return **404** (verified); every social share currently has a broken image.
2. **Fix the number presentation** — the views slider's tick labels are off by up to **~16×**, the Shorts FAQ contradicts the engine at both ends of its range, and the seasonality cards use an unexplained base of `12`.
3. **Decouple the build from the database** — the build fails at page-data collection if `DATABASE_URL` is unset; `/monitor` and both APIs return **500** with no env (verified).
4. **Upgrade Next.js** — `npm audit --omit=dev` reports **1 critical + 2 high** vulnerabilities; the fix is `next@16.4.2`.
5. **Add the operational baseline** — `.gitignore` + lockfile (added in this change), committed migrations, a CI pipeline that runs `typecheck → lint → test → build`, and rate limiting on `POST /api/calculate`.

### Five things done well

1. **Single source of truth.** `src/lib/data.ts` is imported by both the client calculator and the server route, so the estimate cannot drift between browser and API.
2. **Graceful degradation.** With PostgreSQL unreachable, `POST /api/calculate` still returns `{ ok: true, logged: false, estimate }` and `/monitor` renders a "Database not connected yet" state (both verified).
3. **Static-first rendering.** 41 detail pages are SSG via `generateStaticParams`; index pages are static; only the monitor and APIs are dynamic.
4. **Local-currency UX.** `Intl.NumberFormat` with per-country locale and ISO currency, plus a USD cross-check and an FX note. This is a genuine differentiator versus most CPM calculators.
5. **SEO plumbing.** Per-page canonicals, a generated 45-URL sitemap, `robots.ts`, `FAQPage` + `WebApplication` JSON-LD, breadcrumb-style navigation, and dense internal linking between countries ↔ niches.

---

## 2. Product analysis

### 2.1 User and job-to-be-done

| Question | Answer |
|---|---|
| **Who** | YouTube creators, channel managers, and media buyers evaluating a channel's earning potential. |
| **Job** | "If I get *N* monthly views in *niche X* with an audience in *country Y*, what will I earn?" |
| **Entry points** | Organic search for "YouTube CPM calculator", "CPM by country", "highest CPM niches", "how much does YouTube pay for 1,000 views". |
| **Core promise** | A free estimate with **2026 country and niche benchmarks**, shown in the visitor's local currency. |
| **Secondary promise** | "Live" aggregate usage data (`/monitor`) and a reference table for every country and niche. |

### 2.2 Funnel as implemented

```
Search → landing page (country / niche / home)
        → calculator (views, niche, country, long/Shorts)
        → estimate in local currency + USD
        → "Earnings Breakdown" (CPM, RPM, yearly projection)
        → ancillary content: seasonality, FAQ, related markets/niches
        → [no email capture] [no account] [no shareable URL] [no ad/affiliate] → exit
```

The content funnel is well built; the **conversion layer is absent**. There is no newsletter, no affiliate placement, no ad slot, no "save/export", and no way to link to a specific estimate (all calculator state is local component state). That makes the site a pure traffic utility with no retained asset.

### 2.3 Competitive position

| Differentiator | Evidence | Strength |
|---|---|---|
| **Country × niche × format model** | `estimateEarnings()` combines niche CPM with a country multiplier and a Shorts branch. | Medium — most competitors show either country or niche tables, not both. |
| **Local currency output** | `localMoney()`, `currencySymbol()`, `fxNote()`; 23 currencies/locales. | High — removes the mental math for non-US creators (a large share of search demand). |
| **Editorial depth per page** | Each country has a `note`; each niche has `desc` + `tip`; 2–3 computed FAQs. | Medium — better than bare tables, still formulaic. |
| **Seasonality content** | Q1–Q4 multiplier cards with commentary. | Medium — but the numbers use an unexplained base (see §5.5). |
| **Transparency of method** | README (pre-audit) had none; `data.ts` has a 5-line comment with source *categories*, no links. | **Low** — the biggest competitive vulnerability. |

### 2.4 Monetization and business model

There is **no monetization in the code**: no AdSense/Ad Manager script, no affiliate parameters, no sponsor blocks, no products. The domain and metadata suggest an AdSense-supported content site, but the required trust pages (`About`, `Contact`, `Privacy`, `Terms`) and `ads.txt` are absent — all typical prerequisites for ad approval.

Realistic paths, in order of effort:

1. **Display ads** (highest RPM on finance/insurance content) — needs consent management (GDPR/UK GDPR), privacy policy, and `ads.txt`.
2. **Affiliate links** to creator tools (VidIQ, TubeBuddy, Epidemic Sound, hosting) placed in "increase your CPM" sections. Requires disclosure.
3. **Lead magnet** — a CSV/PDF "2026 CPM benchmark report" gated by email. The dataset already exists; export is ~1 hour of work.
4. **Sponsorship of country/niche pages** — needs traffic proof first.
5. **API access** for the estimate endpoint — not viable until rate limiting and terms exist.

### 2.5 Product gaps

- **No audience-mix input.** Real channels have mixed geography; a single-country selector overstates precision.
- **No historical comparison.** No "vs last quarter" or trend; `SEASONS` is static.
- **No shareable results.** No URL query state (`?views=&niche=&country=`) and no copy-link action.
- **Fake tabs.** "Advanced" and "Compare Niches" are styled `<span>`s with hover states but no behavior — a trust/UX smell.
- **Hard-coded hero proof points.** The floating "$825 / +12%" card and the "$24 / −45%" CPM-vs-RPM cards are static illustrations, not derived from the dataset.
- **No "how we calculate" page.** The methodology lives in code comments.

---

## 3. Repository & stack snapshot

| Property | Value |
|---|---|
| Repository | `avinashsarraf/ytcpm` (public, created 2026-10-20, 0 stars, no description/homepage/license) |
| Commit history | **1 commit** (`a72fd20`, "Add files via upload") |
| Default branch | `main` |
| Source files | 25 (21 TS/TSX, 1 CSS, 1 SVG, 2 config) |
| Source lines | **1,923** total (1,743 TS/TSX, 169 CSS, 11 SVG) |
| Largest files | `src/app/page.tsx` 248, `src/lib/data.ts` 228, `globals.css` 169, `charts.tsx` 149, `calculator.tsx` 139 |
| Package name | `nextjs-postgresql-template` (**template residue**) |
| Dependencies installed | **397 packages**, `node_modules` ≈ **572 MB** |
| Lockfile | **Absent at audit time** (generated: 284 KB, 8,551 lines) |
| Tests / CI / license / `.gitignore` | **None at audit time** (`.gitignore`, `.env.example`, lockfile added with this report) |
| Node / npm in sandbox | Node 22.22.3 / npm 10.9.8 |

### 3.1 Dependency inventory

| Package | Version | Used by | Notes |
|---|---|---|---|
| `next` | 16.2.6 | 13 files | Pinned exact. Critical advisory; fixed in 16.4.2. |
| `react` / `react-dom` | 19.2.6 | 5 / 0 direct | App Router + RSC. |
| `tailwindcss` + `@tailwindcss/postcss` | 4.1.17 | `globals.css` | v4 CSS-first `@theme` tokens. |
| `framer-motion` | ^14.4.0 | 4 files | Reveals, count-ups, chart bars, FAQ height animation. |
| `lucide-react` | ^1.60.0 | 12 files | Icon set. |
| `drizzle-orm` | 0.45.2 | API, monitor, db | Typed SQL + `sql` template for analytics. |
| `pg` | 8.20.0 | `src/db/index.ts` | Pool. |
| `drizzle-kit` | 0.31.10 | dev | Config in **JSON** with a hard-coded local URL. |
| `dotenv` | 17.3.1 | **nothing** | **Dead dependency** — never imported. |
| `eslint` + `eslint-config-next` | 9.39.4 / 16.2.6 | dev | Flat config; passes but does not flag unused vars. |
| `typescript` | 5.9.3 | dev | `strict: true`, `noEmit`. |

**Grade: B.** A lean, modern dependency set with only two real smells: `dotenv` is unused, and `next` is pinned to a version with published advisories.

### 3.2 What is *not* in the repository

| Missing | Consequence |
|---|---|
| `public/` directory | Hero image and OG image 404 (verified). |
| `.gitignore` | `node_modules/` (572 MB), `.next/`, `tsconfig.tsbuildinfo`, `next-env.d.ts` are all untracked-but-committable. |
| `package-lock.json` | Non-reproducible installs. Now generated and added. |
| `LICENSE` | GitHub reports `licenseInfo: null`; redistribution rights are undefined. |
| `.env.example` | No documentation of `DATABASE_URL`. Added in this change. |
| Committed migrations | Schema changes require `drizzle-kit push`, which is not documented. |
| Tests / CI | No safety net for the calculation engine. |
| `not-found.tsx`, `error.tsx`, `loading.tsx` | Default Next.js 404/error UI (verified 28,966-byte generic 404). |

---

## 4. Architecture

### 4.1 System overview

```mermaid
flowchart LR
  U[Browser] -->|HTML + RSC| N[Next.js 16 App Router]
  N --> P[Server Components<br/>/ · /cpm-by-country · /cpm-by-niche]
  P --> D[(src/lib/data.ts<br/>23 countries · 18 niches · 4 seasons)]
  N --> C[Client Components<br/>Calculator · Charts · FAQ · Motion · Header]
  C -->|POST /api/calculate| A[Route Handler]
  A --> E[estimateEarnings]
  A --> O[Drizzle ORM]
  O --> PG[(PostgreSQL<br/>calculations)]
  N --> M[/monitor dynamic/]
  M --> O
  N --> S[sitemap.xml · robots.txt · JSON-LD]
  P --> F[flagcdn.com<br/>flag images]
```

### 4.2 Layers

| Layer | Files | Responsibility | Notes |
|---|---|---|---|
| **App shell** | `layout.tsx`, `site-header.tsx`, `site-footer.tsx` | Fonts, metadata, global nav, CTA footer | Header is a client component only for active-state + mobile menu. |
| **Routing / pages** | `app/page.tsx`, `cpm-by-country/*`, `cpm-by-niche/*`, `monitor/*` | SSG content + dynamic dashboard | 41 detail pages from `generateStaticParams`. |
| **Presentation components** | `calculator.tsx`, `charts.tsx`, `motion.tsx`, `faq.tsx` | Interactive UI | All client components; imported into server pages. |
| **Domain/data** | `lib/data.ts`, `lib/flags.ts`, `lib/niche-icons.ts` | Dataset, formulas, formatters, lookups | Single source of truth shared by client and server. |
| **API** | `api/calculate/route.ts`, `api/health/route.ts` | Log a calculation; DB liveness | `nodejs` runtime; force-dynamic health check. |
| **Persistence** | `db/index.ts`, `db/schema.ts` | Pool + Drizzle schema | Global pool caching in non-production. |
| **SEO/ops** | `sitemap.ts`, `robots.ts`, `icon.svg` | Crawlability | Generated at build. |

### 4.3 Rendering strategy (verified from build output)

| Route | Mode | Cache | Count |
|---|---|---|---|
| `/` | Static (○) | `s-maxage=31536000` | 1 |
| `/cpm-by-country` | Static (○) | 1 year | 1 |
| `/cpm-by-country/[slug]` | **SSG (●)** | 1 year | 23 |
| `/cpm-by-niche` | Static (○) | 1 year | 1 |
| `/cpm-by-niche/[slug]` | **SSG (●)** | 1 year | 18 |
| `/monitor` | Dynamic (ƒ) | `force-dynamic`, `noindex` | 1 |
| `/api/calculate` | Dynamic (ƒ) | POST only | 1 |
| `/api/health` | Dynamic (ƒ) | `force-dynamic` | 1 |
| `/sitemap.xml`, `/robots.txt`, `/icon.svg` | Static | 1 year | 3 |

The build reported **50 generated entries**; the sitemap contains **45 URLs** (4 static + 23 countries + 18 niches), of which `/monitor` is `noindex` — a contradiction discussed in §7.2.

### 4.4 Request flows

**A. Static page view.** CDN → prerendered HTML (RSC payload inline) → client hydrates 5 shared client components (header, motion wrappers, charts, FAQ) → flag images fetched from `flagcdn.com`.

**B. Calculator interaction.** Slider/select change → local React state → `estimateEarnings()` runs synchronously in the browser → animated money value updates → after a **900 ms debounce**, `POST /api/calculate` fires with `keepalive: true`. The response is **ignored**; it exists only for logging. This is a sensible "local-first, log-async" design, but it means every pause in slider movement writes a row.

**C. Monitor.** Request → `getStats()` issues **8 queries** (count, average, week count, niches, countries, 14-day series, recent rows, plus shorts count) → any failure falls back to a "not connected" card. No caching, no pagination, no aggregation tables.

**D. Build.** Next collects page data → importing `@/db` evaluates `src/db/index.ts` → **throws if `DATABASE_URL` is missing**, failing the build (verified). With a dummy URL set, all 50 entries generate in ~1.2 s.

### 4.5 Architectural strengths and weaknesses

**Strengths**

- Clear server/client boundary; only 5 files carry `"use client"` (calculator, charts, FAQ, motion, header).
- The calculation engine has no I/O and is trivially testable — yet untested.
- API uses the *same* engine as the client, eliminating duplicated math.
- Static pages are truly static, with long-lived CDN caching.
- Database failure does not break the core product (verified).

**Weaknesses**

- **Import-time side effect** in `db/index.ts` couples *the entire build* to runtime configuration.
- Analytics and product data are mixed into the same request path as logging (awaited insert adds latency).
- `lib/data.ts` is imported by client components, so the entire 23-country/18-niche dataset ships to the browser (small, but unnecessary for the chart-free pages).
- All presentation components are client components, so even static tables hydrate.
- No repository/service abstraction around Drizzle; SQL strings are inline in the monitor page.

---

## 5. Data model & calculation engine

### 5.1 Types

```ts
interface Country {
  slug: string; name: string; code: string;   // ISO-3166 alpha-2 (UK is mapped to GB)
  tier: 1 | 2 | 3 | 4;
  cpmLow: number; cpmHigh: number;            // advertiser CPM, USD per 1,000 impressions
  currency: string; fx: number;               // ISO-4217 + local units per USD
  locale: string; note: string;
}

interface Niche {
  slug: string; name: string; icon: string;   // lucide key
  tier: "S" | "A" | "B" | "C";
  cpmLow: number; cpmHigh: number;            // US-audience baseline
  desc: string; tip: string;
}

const DATA_YEAR = 2026;
const CREATOR_SHARE = 0.55;
```

### 5.2 Dataset statistics (verified programmatically)

| Metric | Value |
|---|---|
| Countries | **23** (T1: 11, T2: 7, T3: 3, T4: 2) |
| Niches | **18** (S: 3, A: 5, B: 5, C: 5) |
| Seasons | 4 (Q1 0.85, Q2 0.95, Q3 1.00, Q4 1.60) |
| Duplicate slugs | 0 |
| Invalid ranges (`high <= low`) | 0 |
| Icon coverage | 18/18 mapped in `NICHE_ICONS` |
| Flag coverage | 23/23 mapped in `CODE_MAP` |
| Top 5 countries by blended CPM | US 18.0, AU 15.3, UK 13.5, CH 12.3, NO 11.5 |
| Bottom 5 | BD 0.7, PK 0.9, ID 1.2, IN 1.6, BR 2.1 |
| Highest-paying niches | Finance $15–50, Insurance/Legal $12–40, Business $12–35 |
| Lowest-paying niches | Kids $1.5–5, Gaming $1.5–6, Music $2–6 |

### 5.3 Formulas as implemented

```ts
// Country scaling: blended country CPM relative to the US blended CPM (6+30 = 36)
countryMultiplier(c) = (c.cpmLow + c.cpmHigh) / (US.cpmLow + US.cpmHigh);

// Long-form
cpmLow  = niche.cpmLow  * multiplier;
cpmHigh = niche.cpmHigh * multiplier;
rpmLow  = cpmLow  * 0.55;
rpmHigh = cpmHigh * 0.55;
monthly = (views / 1000) * rpm;

// Shorts (niche is ignored entirely)
rpmLow  = 0.05 * max(multiplier, 0.15);
rpmHigh = min(0.16 * max(multiplier, 0.15), 1.4);
cpm     = 0 (rendered as "n/a")
```

### 5.4 Worked examples (computed from the real module)

| Scenario | Views / mo | CPM | RPM | Monthly estimate |
|---|---|---|---|---|
| US · Tech · long | 1,000 | $8.00–$22.00 | $4.40–$12.10 | **$4.40–$12.10** |
| US · Tech · long | 1,000,000 | $8.00–$22.00 | $4.40–$12.10 | **$4,400–$12,100** |
| India · Tech · long | 1,000,000 | $0.69–$1.89 | $0.38–$1.04 | **$378.89–$1,041.94** |
| India · Finance · long | 1,000,000 | $1.29–$4.31 | $0.71–$2.37 | **$710–$2,370** |
| India · Tech · Shorts | 1,000,000 | n/a | $0.0075–$0.024 | **$7.50–$24.00** |
| US · Tech · Shorts | 1,000,000 | n/a | $0.05–$0.16 | **$50–$160** |

Country multipliers: **US = 100%**, India = **8.61%**, Bangladesh = **3.89%**.

### 5.5 Methodology critique (the most important section)

#### 1. The RPM formula conflates two different denominators

`CREATOR_SHARE = 0.55` is documented as "YouTube cut × monetized playbacks", but the math applies it only as a revenue share. Real RPM is:

```
RPM = (CPM × creator_share × monetized_playback_rate)   // revenue ÷ ALL views × 1000
```

`monetized_playback_rate` (ad impressions ÷ total views) is typically far below 100% due to ad blockers, non-monetized views, Shorts, and limited-ads status. With the current model, the headline "Estimated Monthly Earnings" is likely **optimistic for most channels** unless the user's "views" already means monetized views. The site's own FAQ correctly explains the difference, which makes the engine's conflation more noticeable.

#### 2. A single country cannot describe an audience

Audiences are mixed. If 40% of views are US and 60% are India, the correct CPM is a weighted blend, not the India rate. The model has no audience-mix input, so every estimate is a best case (if the user picks their highest-CPM country) or a worst case (if they pick the dominant one). Adding a simple 3-country mix control would materially improve accuracy and differentiate the product.

#### 3. Country scaling is linear and uniform across niches

The multiplier is the *blended* country ratio (e.g., India 8.61%) applied uniformly to all niches. In reality, the US premium is much larger for finance/insurance/B2B than for gaming or vlogs. A per-niche country index (even a coarse 4×18 tier matrix) would be more defensible.

#### 4. Static dataset, "real-time" claims

`data.ts` is a hard-coded snapshot with `DATA_YEAR = 2026`. There is no fetch, database read, or refresh mechanism. Yet the homepage says **"Real-time CPM data"**, and the header CTA implies live checks. That is a credibility and potential advertising-claims risk. Either implement a refresh pipeline (even quarterly CSV import) or change the copy to "2026 benchmark data".

#### 5. No provenance or freshness metadata

The dataset comment cites source *categories* ("public creator disclosures, Influencer Marketing Hub surveys, YTLarge trackers, eMarketer forecasts") but provides **no links, sample sizes, percentiles, or update date**. For YMYL-adjacent finance content this is the single biggest E-E-A-T gap. A `/methodology` page with sources, collection dates, and limitations would fix most of it.

#### 6. Shorts model contradicts the FAQ and ignores inputs

- FAQ: *"Expect $0.01–$0.06 RPM per 1K Shorts views."*
- Engine: `$0.05–$0.16` at US multiplier, `$0.0075–$0.024` for India.
- The US range (`$0.05–$0.16`) is **2.7–5× above** the FAQ; India (`$0.0075–$0.024`) is **1.3–2.5× below** it.
- The niche selector has **no effect** in Shorts mode.
- The `max(multiplier, 0.15)` floor makes India, Pakistan, and Bangladesh produce **identical** Shorts estimates.
- CPM is reported as 0/"n/a", which is conceptually right (no classic CPM) but leaves the "CPM Range" card empty.

#### 7. Seasonality is displayed but never applied

`SEASONS` multipliers appear only in the marketing cards. The calculator always uses annual baselines. Worse, the cards compute "Avg. CPM" as `mult × 12` — a hidden magic number that does not correspond to the site's own US blended average of **$18** (it yields $10.20–$19.20). Either use a named baseline (e.g., US blended CPM) or show the values as indices (`0.85×`) instead of dollars.

#### 8. Range presentation overstates precision

Ranges such as $6–$30 (US) and $15–$50 (finance) span 5× and 3.3× respectively. Without percentiles (P25/P75), sample size, or confidence, the midpoint used in the big "Estimated Monthly Earnings" number implies precision the model does not have. Consider showing "typical range" from P25–P75 and labeling midpoints as such.

#### 9. FX rates are undated constants

Every country carries `fx` (e.g., INR 86, IDR 16,200). These drift; no date or source is recorded, and `fxNote()` presents them as fact ("Converted at ≈ 1 USD = ₹86"). Add `FX_DATE` and a source, or fetch daily rates at build time.

### 5.6 Verified presentation bugs

| Bug | Evidence | Impact |
|---|---|---|
| **Slider tick labels do not match the logarithmic scale** | Slider 0 → **1,000** views but label says "10K"; 20 → **6,000** (label 100K); 40 → **40,000** (500K); 60 → **251,000** (1M); 80 → **1,585,000** (5M); 100 → 10M. | Only the final tick is correct; users misjudge views by up to **~16×** (the 100K label sits where the slider produces ~6K). |
| **Shorts FAQ vs engine** | FAQ 1K-view RPM $0.01–$0.06; engine $0.05–$0.16 (US) / $0.0075–$0.024 (IN). | Contradictory guidance on the same site. |
| **Seasonality base 12** | `SeasonChart` renders `(s.mult * 12)` as "Avg. CPM". | Inconsistent with the $18 US blended CPM used elsewhere. |
| **Hero proof points** | Hard-coded `$825` and `+12%`; CPM/RPM cards hard-code `$24` and `−45%`. | Illustration contradicts the data-driven calculator. |

---

## 6. Frontend, UX & accessibility

### 6.1 Component inventory

| Component | Lines | Type | Role | Complexity |
|---|---|---|---|---|
| `app/page.tsx` | 248 | Server | Hero, calculator mount, CPM strip, niche/geography/seasonality/FAQ sections | Medium (dense JSX) |
| `lib/data.ts` | 228 | Shared | Dataset + engine + formatters | Medium |
| `globals.css` | 169 | Global | Tailwind v4 theme, 20+ custom utilities | Medium |
| `components/charts.tsx` | 149 | Client | Niche bars, country bars, flag cards, season cards, monitor stat bars | Medium |
| `components/calculator.tsx` | 139 | Client | State, debounce logging, result panel | High |
| `components/motion.tsx` | 111 | Client | `Reveal`, `CountUp`, `AnimatedMoney` | Low |
| `app/monitor/page.tsx` | 87 | Server (dynamic) | 8 SQL queries, charts, recent rows | High |
| `app/cpm-by-country/[slug]/page.tsx` | 92 | Server (SSG) | Country hero, earnings table, niche table, FAQs, related | Medium |
| `app/cpm-by-niche/[slug]/page.tsx` | 89 | Server (SSG) | Niche hero, earnings table, country table, FAQs, related | Medium |
| `components/site-header.tsx` | 70 | Client | Fixed nav + mobile menu | Low |
| `components/site-footer.tsx` | 62 | Server | CTA banner, link columns | Low |
| `components/faq.tsx` | 38 | Client | Accordion with height animation | Low |
| `lib/flags.ts` | 22 | Shared | Flag CDN URLs + emoji fallback (emoji unused) | Low |
| `lib/niche-icons.ts` | 27 | Shared | Icon map | Low |

### 6.2 Design system

| Token | Value | Usage |
|---|---|---|
| `--color-ink` / `--color-panel` | `#ffffff` | Page/panel background |
| `--color-surface` / `-2` | `#f9f9f9` / `#f1f1f1` | Section and control backgrounds |
| `--color-heading` | `#0f0f0f` | Headings |
| `--color-yt-red` | `#ff0000` | Brand/CTA |
| `--color-mint` | `#0f766e` | Earnings/RPM accents |
| `--color-gold` | `#a16207` | Pro tips |
| `--color-fog` | `#606060` | Body/secondary text |
| `--font-display` | Space Grotesk | Headings, numbers |
| `--font-body` | Inter | Body |
| `--font-mono` | JetBrains Mono | Tabular figures |
| `--font-serif` | Instrument Serif | **Unused in components** |

The system is coherent and editorial (light theme, hairline borders, soft shadows, 1rem panel radius, red accents). Motion is consistent (`[0.22, 1, 0.36, 1]`, 0.55–0.8 s), though applied to nearly every section.

### 6.3 Calculator UX

**Good:** range slider with logarithmic mapping (1K–10M), grouped niche/country selects (S/A vs B/C tiers; T1–T4), long/Shorts toggle, local-currency result plus USD, CPM/RPM cards, breakdown table, yearly projection, and a debounced analytics write.

**Problems:**

- Tick labels are wrong (§5.6) — the most user-visible defect.
- The result is a **midpoint**, not the range, so "Estimated Monthly Earnings" looks more precise than the model.
- The Shorts toggle leaves a blank CPM card, ignores the niche entirely, and collapses every country below a 15% multiplier to the same rate.
- No permalink/query state, copy, or share.
- No input for monetized-view rate or audience mix.
- The 900 ms debounce still writes a row on every pause; a user exploring the slider can generate dozens of rows per session.
- The range input has `id`/`label` but no `aria-valuetext` (screen readers announce 0–100, not views).

### 6.4 Accessibility review

| Check | Result |
|---|---|
| Semantic landmarks | `header`, `main`, `footer`, `nav` present. |
| Heading hierarchy | One `h1` per page; `h2` sections. Good. |
| Form labels | `htmlFor`/`id` on both selects and the slider. Good. |
| Accordion | `aria-expanded` present; missing `aria-controls`; no region role. |
| Mobile menu | `<button aria-label="Menu">` but **no `aria-expanded`**, no `aria-controls`, no Escape handling. |
| Skip link | Missing. |
| Focus visibility | Relies on browser defaults; many custom buttons have no `focus-visible` ring. |
| Reduced motion | Not handled; `Reveal`, `animate-float`, `animate-pulse-dot` run regardless of `prefers-reduced-motion`. |
| Contrast (WCAG AA, normal text) | `#ff0000` on white = **4.00:1 (fail)**; white on red buttons = 4.00:1 (fail for 14 px); red on `#fff0f0` = 3.61:1 (fail); `text-white/50` on footer green = 3.77:1 (fail). `#606060` on white = 6.29:1 (pass), mint 5.47:1 (pass). |
| Touch targets | Mobile menu button 36×36 px (below the 44×44 recommendation); several 10–12 px links. |
| Slider semantics | Numeric value 0–100 exposed instead of a human-readable view count. |
| Charts | Bars are decorative links with text values; acceptable, but no `<table>` fallback or accessible summary. |

**Grade: C+.** The foundations (labels, landmarks, headings) are better than most v1 tools; color contrast and motion are the systemic issues.

### 6.5 Frontend defects worth fixing

1. **Header active state is always true for "Calculator".** `pathname.startsWith(l.href.split("#")[0])` evaluates `startsWith("/")` for `/#calculator`, so Calculator is highlighted on every route.
2. **Fake tab bar.** "Advanced" and "Compare Niches" have hover styling but no handlers.
3. **Missing hero/OG assets** (§3.2, §12 P0-1).
4. **Instrument Serif is downloaded but never used.**
5. **11 unused imports/locals** under `tsc --noUnusedLocals` (e.g., `Play`, `DATA_YEAR`, `CREATOR_SHARE`, `Percent`, `Globe2`, `money`, `max`).
6. **Dead exports:** `flagEmoji`, `compactMoney`, `num`.
7. **Duplicated tier label maps:** `TIER_LABEL` in `data.ts` vs `TIER_LABELS` in `charts.tsx`.
8. **Magic constants:** `12` in season cards, `0.15`/`1.4` in Shorts, `20` axis max in the country chart, `50` chart max.
9. **`CountryBarChart` computes an unused `max`** and hard-codes a 0–20 axis; data above 20 would overflow the container.
10. **Monitor day labels** use `d.day.split(" ")[1]`, so a 14-day window spanning two months shows duplicate day numbers (e.g., "01" twice).

---

## 7. SEO & content architecture

### 7.1 What is in place (strong)

| Element | Implementation |
|---|---|
| Sitemap surface | 45 URLs: home, 2 hubs, 23 countries, 18 niches, `/monitor` (noindex) — 44 indexable. |
| Titles | Template `%s \| ytcpm.online`; per-page descriptive titles with year and price ranges. |
| Descriptions | Unique per country/niche page; includes USD and local currency. |
| Canonicals | Per-page relative canonicals; root canonical `/`. |
| Structured data | `WebApplication` + `FAQPage` on home; `FAQPage` on every country/niche page. |
| Crawl controls | `robots.ts` allows all, disallows `/api/`, references the sitemap. |
| Internal linking | Country ↔ niche tables, similar markets, related niches, footer top-5 lists. |
| Rendering | Full HTML at build time — no client-only content. |
| Breadcrumb UI | Visible breadcrumb trail on detail pages. |
| Mobile | Responsive grids, collapsible nav, fluid type scale. |

### 7.2 Gaps and risks

| Issue | Detail | Priority |
|---|---|---|
| **Broken OG image** | `/og.png` returns 404; all social shares use it. No per-page OG metadata on child pages. | P0 |
| **`/monitor` in sitemap while `noindex`** | Verified: sitemap includes `/monitor`, page emits `noindex, follow`. Contradictory signals; also `changeFrequency: "always"`. | P1 |
| **`lastModified` is build time** | Every page reports the deploy time, not the data update time — weakens lastmod trust. Use a `DATA_UPDATED_AT` constant. | P2 |
| **No breadcrumb JSON-LD** | Visible breadcrumbs but no `BreadcrumbList` schema. | P2 |
| **No `Organization` / `WebSite` schema** | No brand entity or sitelinks search box. | P2 |
| **No authorship / methodology page** | YMYL-adjacent finance content with no author, sources, or review date. | P1 |
| **FAQ rich results unlikely** | Google restricted FAQ rich results to authoritative government/health sites in 2023; markup still helps understanding but should not be sold as a rich-result win. | P3 |
| **Templated page similarity** | 41 pages share the same layout, table structure, and FAQ phrasing. The unique `note`/`tip`/`desc` helps, but there is thin-content risk at scale. | P2 |
| **"Real-time" claims** | Static data; misleading copy risks trust and ad-policy review. | P1 |
| **No trust pages** | No routes exist for `/about`, `/contact`, `/privacy`, `/terms`, or `/methodology`. Needed for ads, E-E-A-T, and GDPR. | P1 |
| **No image sitemap / image SEO** | Flags and hero are the only images; minor. | P3 |
| **No localized pages** | Currency is localized, but copy is English-only. Reasonable for v1. | P3 |

### 7.3 Programmatic content quality

Each country page contains: tier + rank, a 1–2 sentence unique note, CPM/RPM panel with local currency and vs-US multiplier, four view-count earnings cards, a top-6 niche table in local currency, a conditional tip, 3 computed FAQs, 6 related markets, and a calculator CTA. That is a solid template with genuine unique data.

Each niche page contains: tier + rank, description, CPM/RPM panel, four view-count cards (US only), a 6-row country table, a pro tip, 2 FAQs, 6 related niches, and a CTA. Also solid, but **US-only earnings** on a page that otherwise emphasizes geography is an inconsistency.

### 7.4 Recommended SEO additions

1. Add `opengraph-image.tsx` (dynamic per route) or at minimum `public/og.png`, and per-page `openGraph`/`twitter` metadata.
2. Move `/monitor` out of the sitemap (or remove `noindex` if it should rank).
3. Add `/methodology` with sources, collection dates, FX date, and limitations — link it from every page.
4. Add `BreadcrumbList` + `Organization` + `WebSite` JSON-LD.
5. Add author/reviewer bylines and `dateModified` (`DATA_UPDATED_AT`).
6. Add `/about`, `/contact`, `/privacy`, `/terms` before applying to ad networks.
7. Add a downloadable CSV/JSON dataset and a "2026 CPM report" page as a link magnet.
8. Avoid creating country×niche combinations (23 × 18 = 414 pages) until each can have unique content — that would be index bloat.

---

## 8. Backend, API & database

### 8.1 Route handlers

| Endpoint | Method | Runtime | Validation | Success | Failure |
|---|---|---|---|---|---|
| `/api/calculate` | POST | `nodejs` | JSON parse → 400; niche/country lookup; `views` finite and `1,000 ≤ views ≤ 1,000,000,000` → 422 | `200 { ok: true, logged: true, estimate }` | `400 Invalid JSON`; `422 Invalid input`; DB error → `200 { ok: true, logged: false, estimate }` |
| `/api/health` | GET | dynamic | — | `200 { ok: true }` after `select 1` | `500 { ok: false }` |

Verified request/response:

```json
POST /api/calculate
{"views":100000,"niche":"technology-software","country":"india","type":"long"}

200 {"ok":true,"logged":false,"estimate":{
  "cpmLow":0.6889,"cpmHigh":1.8944,
  "rpmLow":0.3789,"rpmHigh":1.0419,
  "monthlyLow":37.8889,"monthlyHigh":104.1944,
  "multiplier":0.0861
}}
```

Invalid input returns `422 {"ok":false,"error":"Invalid input"}` (verified).

### 8.2 Database schema

`calculations` — one row per logged estimate.

| Column | Type | Constraints |
|---|---|---|
| `id` | `serial` | PK |
| `views` | `integer` | not null |
| `niche_slug` / `niche_name` | `text` | not null |
| `country_slug` / `country_name` | `text` | not null |
| `content_type` | `text` | not null, default `long` |
| `rpm_low` / `rpm_high` | `numeric(10,4)` | not null |
| `est_low` / `est_high` | `numeric(12,2)` | not null |
| `created_at` | `timestamptz` | not null, default `now()` |

Indexes: `created_at`, `niche_slug`, `country_slug`. No unique constraints, no retention policy, no partitioning.

### 8.3 Failure behavior matrix

Rows 2–3 were verified against a running production server; row 1 is the intended path (no PostgreSQL instance was available in the audit sandbox).

| State | `/` | `/monitor` | `/api/health` | `POST /api/calculate` |
|---|---|---|---|---|
| `DATABASE_URL` set, DB reachable (expected) | 200 | 200 with data | 200 `{ok:true}` | 200 `logged:true` |
| `DATABASE_URL` set, DB unreachable | 200 | **200 fallback** ("Database not connected yet") | **500** | **200 `logged:false` + estimate** |
| `DATABASE_URL` unset | 200 | **500** | **500** | **500** |

This is the clearest architectural defect in the project: **the entire build depends on a runtime secret**, even though only three routes (`/monitor` and the two APIs) need the database. `next build` fails without the variable (verified) because module evaluation throws during page-data collection.

### 8.4 Operational issues

1. **Import-time throw** in `src/db/index.ts` (`throw new Error("DATABASE_URL is required")`). Move pool creation into a `getDb()` lazy singleton, or return `null` and let handlers degrade.
2. **No rate limiting** on a public write endpoint. A trivial loop can insert millions of rows and inflate hosting costs.
3. **Unbounded table growth.** No retention job, no rollups, no TTL.
4. **Monitor queries are full-table.** `count(*)`, `avg(...)`, and `group by` run on every dashboard view, with no caching. Cost grows linearly with usage.
5. **Awaited insert on the hot path.** The client ignores the response; the write could be queued or deferred.
6. **Log flooding.** Every failed monitor request logs a full Drizzle stack trace (observed in server logs); every failed insert does the same.
7. **No query timeout / pool limits.** Defaults only; a hung DB can hold requests.
8. **No migrations committed.** `drizzle-kit push` is required and undocumented; `drizzle.config.json` hard-codes `postgres:postgres@127.0.0.1`.
9. **`dotenv` is installed but unused**; the DB module never loads `.env` for CLI tooling.
10. **No SSL configuration** for managed Postgres (many providers require `?sslmode=require`).
11. **No PII stored** — a genuine privacy strength.

### 8.5 Production checklist

- [ ] Lazy DB initialization with a clear 503 (not a 500/throw).
- [ ] `DATABASE_URL` validated once at startup; documented in `.env.example`.
- [ ] `drizzle-kit generate` + committed `drizzle/` migrations and a documented migrate step.
- [ ] Rate limit (IP + session token) and body-size cap on `/api/calculate`.
- [ ] Retention/rollup job for `calculations`; indices already present.
- [ ] `/monitor` gated behind auth or kept `noindex` and excluded from the sitemap.
- [ ] Connection pool limits + `statement_timeout`; SSL for managed DBs.
- [ ] Health check wired to uptime monitoring.
- [ ] Structured error logging with sampling/redaction.

---

## 9. Security & privacy

### 9.1 Dependency audit (verified 2026-10-20)

| Scope | Critical | High | Moderate | Total |
|---|---|---|---|---|
| Production (`--omit=dev`) | **1** | 2 | 0 | **3** |
| All dependencies | 1 | 7 | 4 | **12** |

| Package | Severity | Detail | Fix |
|---|---|---|---|
| `next@16.2.6` | **Critical** | Bundle of 17 advisories, including middleware/proxy bypass, SSRF, cache poisoning, RCE in the image optimizer and `next/og`, and DoS in Server Actions. | Upgrade to **16.4.2** (per `npm audit`), re-run tests/build. |
| `postcss ≤8.5.22` (via Next) | High | XSS via unescaped `</style>`; arbitrary file read via `sourceMappingURL`. | Resolved by the Next upgrade or an override. |
| `sharp ≤0.35.5-rc.1` (via Next) | High | libvips/libheif/librsvg CVEs. | Resolved by the Next upgrade. |

**Exploitability today is reduced** because the app does not use middleware, Server Actions, custom servers, or remote image optimization (flags are `unoptimized`). The Image Optimization API is still reachable for local images, and SSG cache poisoning matters for self-hosted deployments. Upgrading is still mandatory.

### 9.2 HTTP security headers (verified via `curl -I`)

| Header | Present | Notes |
|---|---|---|
| `Content-Security-Policy` | ❌ | No CSP; inline JSON-LD and inline `style` attributes require nonces/hashes or `unsafe-inline` if added. |
| `X-Frame-Options` / `frame-ancestors` | ❌ | Clickjacking protection missing. |
| `X-Content-Type-Options` | ❌ | MIME sniffing protection missing. |
| `Referrer-Policy` | ❌ | Add `strict-origin-when-cross-origin`. |
| `Permissions-Policy` | ❌ | No camera/mic/geolocation needs; deny them. |
| `Strict-Transport-Security` | ❌ | May be added by the hosting platform (e.g., Vercel); verify in production. |
| `X-Powered-By` | ⚠️ **present (remove)** | Leaks the framework; set `poweredByHeader: false`. |

### 9.3 Threat model for this app

| Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Write-endpoint abuse / DB inflation | High (public POST, no auth) | Cost, slow monitor | Rate limit, body cap, per-IP quota, retention. |
| Monitor as a DoS amplifier | Medium | Expensive queries per request | Cache stats for 60 s, rollup table, auth. |
| Dependency RCE/SSRF (Next) | Medium | Server compromise | Upgrade; no Server Actions; keep image optimizer unreachable if unused. |
| Third-party flag CDN outage/blocking | Medium | Broken flags (visual) | Self-host 23 SVGs (≈20 KB). |
| Secret leakage | Low | — | Only a local default credential is committed; still move to env-driven config. |
| Clickjacking | Low-Medium | UI redressing | `frame-ancestors 'none'`. |

### 9.4 Privacy

**Collected data:** calculation inputs and outputs only (`views`, niche, country, content type, RPM/estimate ranges, timestamp). **No IP, user agent, cookie, referrer, or identifier is stored.** This is excellent data minimization and should be documented in a privacy policy.

**Third parties:** `flagcdn.com` receives the visitor's IP for every flag image; Google Fonts is self-hosted by `next/font` at build time (good). No analytics, ad, or tracking scripts are present.

**Gaps:** no privacy policy, no cookie/consent banner (none needed today, but required if ads/analytics are added), no data-retention statement, no contact for data requests. The `/monitor` page publicly exposes aggregate usage — acceptable for a free tool, but it should be a deliberate product decision.

---

## 10. Performance, reliability & observability

### 10.1 Performance profile (structural)

| Factor | Observation | Effect |
|---|---|---|
| Rendering | 44 of 45 pages are static/SSG; `s-maxage=31536000` | Excellent TTFB at the edge. |
| HTML size | `/` 124 KB, `/cpm-by-niche` 130 KB, `/cpm-by-country` 113 KB, detail pages 64–67 KB (uncompressed, includes RSC payload) | Large but not alarming; compresses well. Index pages duplicate many links and values. |
| Fonts | **4 families** via `next/font/google`: Inter, Space Grotesk, JetBrains Mono, **Instrument Serif (unused)**. All variable fonts are preloaded. | Avoidable bytes and preload contention; remove Instrument Serif at minimum. |
| JavaScript | 5 client components; `framer-motion` powers reveals, chart bars, count-ups, money animation, accordion. | Hydration cost on every page, including purely informational country/niche pages. |
| Images | Flags from `flagcdn.com` with `unoptimized`; hero image 404; no `sizes` attributes. | 20+ third-party requests; broken hero; no responsive sizing. |
| CSS | Tailwind v4 JIT, small custom layer | Fine. |
| Third parties | flagcdn only | Fine, though self-hosting is better. |

**No Lighthouse/CWV data could be collected in this sandbox.** Before optimizing further, run Lighthouse mobile on `/`, a country page, and `/monitor`; the likely top issues are unused JS (framer-motion), font preloads, and LCP (hero image is missing, so LCP is currently text).

### 10.2 Reliability

**Good**

- Static pages do not depend on the DB.
- Calculator works entirely client-side.
- DB-down path returns a valid estimate and a monitor fallback (verified).
- API input validation is explicit and returns correct status codes (400/422).

**Bad**

- Build fails without `DATABASE_URL` (verified).
- `/monitor` and APIs return 500 (not 503) when the env is missing.
- No retry/backoff, no circuit breaker, no query timeout.
- No error boundary or custom error page.

### 10.3 Observability

| Capability | Status |
|---|---|
| Error tracking (Sentry etc.) | ❌ |
| Product analytics (Plausible/GA) | ❌ |
| Uptime/health monitoring | Health endpoint exists but nothing consumes it. |
| Structured logs | `console.error` only; full stack traces per failed request. |
| Metrics/dashboards | `/monitor` is usage analytics, not system metrics. |
| Alerting | ❌ |

**Recommendation:** add Sentry (or equivalent) with sampling, a 60-second cache or materialized rollup for monitor stats, and uptime checks against `/api/health` (with a dedicated `/api/ready` that reports DB status without returning 500 on every probe).

---

## 11. Build, testing & delivery

### 11.1 Verification log (commands actually run)

| # | Command | Result | Notes |
|---|---|---|---|
| 1 | `npm install --no-audit --no-fund` | ✅ | 397 packages in 52 s; deprecation warnings for `@esbuild-kit/*` and `eslint@9.39.4`. |
| 2 | `npm run typecheck` (`tsc --noEmit`) | ✅ | 0 errors. |
| 3 | `npm run lint` (`eslint .`) | ✅ | 0 errors/warnings; unused imports are not enforced. |
| 4 | `tsc --noEmit --noUnusedLocals` | ⚠️ | **11 findings** (unused imports/locals). |
| 5 | `npm run build` (original) | ❌ | `next/font` could not reach `fonts.googleapis.com` in the sandbox — **build-time network dependency**. |
| 6 | Build with fonts temporarily stubbed, **no** `DATABASE_URL` | ❌ | `Error: DATABASE_URL is required` while "Collecting page data for /api/calculate". |
| 7 | Build with fonts stubbed + dummy `DATABASE_URL` | ✅ | Compiled in 6.0 s; TypeScript 4.3 s; **50 entries**, 41 SSG pages, 1.2 s generation. |
| 8 | `next start` + HTTP probes | ✅ | Statuses in §8.3; `/og.png` and `/images/hero-illustration.png` → **404**. |
| 9 | `npm audit --omit=dev` | ⚠️ | 3 vulnerabilities (1 critical, 2 high). |
| 10 | Data audit script (`node --experimental-strip-types`) | ✅ | 23 countries / 18 niches; 0 duplicate slugs; 0 invalid ranges; multiplier/invariants computed. |
| 11 | Slider mapping audit | ✅ | Confirmed tick-label mismatch (1K vs 10K, etc.). |

> The font stub used for builds #6–#7 was reverted immediately; `git diff` is clean. No application code was changed by this audit.

### 11.2 Test plan (currently 0 tests)

The engine is pure and easy to test. A minimal but high-value suite:

**Unit — `estimateEarnings`**

- Returns `rpmLow <= rpmHigh`, `cpmLow <= cpmHigh`, `monthlyLow <= monthlyHigh` for all 23×18×2 combinations.
- US multiplier is exactly `1`.
- Monotonicity: doubling views doubles monthly estimates.
- India long-form Tech at 1M views ≈ `$378.89–$1,041.94` (regression pin).
- Shorts: niche has no effect (document this as intended or change it).
- Shorts floor: India, Pakistan, Bangladesh produce identical output (assert/document).

**Unit — formatters**

- `money`, `localMoney`, `currencySymbol`, `fxNote`, `viewsLabel`, `compactMoney` for 0, 9.99, 10, 1e3, 1e6, 1e9 and all 23 locales.
- `CountryFlagCards` count and "+N more" arithmetic.

**Component — Calculator**

- Changing niche/country/format updates the displayed estimate.
- Debounced POST fires once after 900 ms.
- No POST on first mount.
- Shorts renders `n/a` for CPM.

**Route — API**

- 400 for invalid JSON; 422 for unknown niche/country/out-of-range views.
- 200 `logged:false` when DB fails; `logged:true` when it succeeds.

**E2E (Playwright)**

- Home → calculator → select India → assert local currency and USD line.
- Navigation active state per route.
- `/monitor` fallback when DB is down.
- 404 page for an unknown country slug.

**Contract/SQL**

- `drizzle-kit generate` produces a migration that matches `schema.ts`.
- Monitor queries run under a seeded fixture.

### 11.3 CI proposal (GitHub Actions)

```yaml
name: ci
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: app_db }
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/app_db
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test   # once the test runner is added
      - run: npm run build
      - run: npx drizzle-kit push   # or migrate, once migrations exist
```

Add `npm audit --omit=dev --audit-level=high`, Dependabot, and a Lighthouse CI budget once the baseline is measured.

### 11.4 Tooling gaps

| Gap | Effect | Recommendation |
|---|---|---|
| No formatter | Inconsistent line widths and quoting | Prettier + `prettier-plugin-tailwindcss`. |
| ESLint does not catch unused vars | Dead code accumulates | Enable `@typescript-eslint/no-unused-vars` and `--max-warnings=0`. |
| No test runner | Engine is unverified | Vitest + Testing Library + Playwright. |
| No lockfile (pre-change) | Non-reproducible installs | Commit `package-lock.json` (added). |
| No `.gitignore` | 572 MB of `node_modules` committable | Added. |
| No migrations | Schema drift | `drizzle-kit generate`, commit `drizzle/`. |
| No env validation | Runtime 500s | Validate `DATABASE_URL` lazily, document in `.env.example`. |
| No CI | Regressions ship | Workflow above. |

---

## 12. Findings register

Severity: **P0** = ship blocker, **P1** = high (fix this week), **P2** = medium, **P3** = low/polish.

### P0 — Blockers

| ID | Finding | Evidence | Fix |
|---|---|---|---|
| **P0-1** | Missing `public/` assets: hero illustration and OG image | `GET /og.png` → 404; `GET /images/hero-illustration.png` → 404; `public/` does not exist | Add `public/og.png` and `public/images/hero-illustration.png` (or replace the hero with CSS/SVG and generate OG via `opengraph-image.tsx`). |
| **P0-2** | Build fails without `DATABASE_URL` | Verified build error at page-data collection for `/api/calculate` | Lazy-initialize the pool inside handlers; do not throw at module import. Make build work with no DB env. |
| **P0-3** | No `.gitignore` at audit time; 572 MB `node_modules` and build artifacts were committable | `git status` showed untracked `node_modules/`, `.next/`, `tsconfig.tsbuildinfo`, `next-env.d.ts` | **Added `.gitignore`** in this change; commit it before any further work. |
| **P0-4** | Critical framework vulnerabilities | `npm audit --omit=dev`: 3 (1 critical, 2 high); `next@16.2.6` → 16.4.2 | Upgrade Next; re-run build/tests; add `npm audit` to CI. |

### P1 — High

| ID | Finding | Evidence | Fix |
|---|---|---|---|
| **P1-1** | Slider tick labels do not match actual views | Slider 0 → 1,000 (label 10K); 20 → 6,000 (100K); 40 → 40,000 (500K); 60 → 251,000 (1M); 80 → 1.585M (5M) | Compute labels from the same function as the value, or use a non-log slider with explicit stops. |
| **P1-2** | Shorts estimate contradicts the FAQ and ignores niche/country | FAQ $0.01–$0.06/1K; engine $0.05–$0.16 (US) and $0.0075–$0.024 (IN); `niche` unused in Shorts; the 0.15 floor equalizes every country below 15% | Define one Shorts model, document it, and align the FAQ; consider niche/country factors above the floor. |
| **P1-3** | RPM formula omits the monetized-view ratio | `rpm = cpm × 0.55` applied to all views | Add a `monetizedShare` input (default 0.5–0.7) or rename the output "optimistic RPM". Document the assumption. |
| **P1-4** | Seasonality cards use a magic base of 12 | `(s.mult * 12)` → $10.20/$11.40/$12.00/$19.20 vs $18 US blended CPM | Use a named baseline from the dataset or display index multipliers. |
| **P1-5** | No rate limiting on `POST /api/calculate` | Public unauthenticated write endpoint; every 900 ms pause writes a row | Per-IP token bucket + body cap + retention policy. |
| **P1-6** | No committed migrations; hard-coded DB credentials | No `drizzle/` folder; `drizzle.config.json` contains `postgres:postgres@127.0.0.1`; `dotenv` unused | Generate/commit migrations; switch to `drizzle.config.ts` + `process.env.DATABASE_URL`. |
| **P1-7** | "/monitor" is in the sitemap but `noindex` | Verified sitemap URL + `noindex, follow` meta | Remove it from the sitemap or make it indexable. Also drop `changeFrequency: "always"`. |
| **P1-8** | "Calculator" nav item is always active | `startsWith(l.href.split("#")[0])` → `startsWith("/")` | Compare hash links against `pathname === "/"` and scroll state, or use a separate handler. |
| **P1-9** | No tests or CI | Zero test files, no `.github/` | Add Vitest + Playwright + the GitHub Actions workflow in §11.3. |
| **P1-10** | Hard-coded hero numbers and fake tabs | `$825`, `+12%`, `$24`, `−45%` are static; "Advanced"/"Compare Niches" are spans | Derive from data or remove; implement the tabs or render them as disabled/labels. |
| **P1-11** | No trust/legal pages | `/about`, `/contact`, `/privacy`, `/terms`, `/methodology` absent | Add before launch; required for ads and E-E-A-T. |
| **P1-12** | Missing security headers; `X-Powered-By` leaked | `curl -I` showed no CSP/XFO/Referrer/Permissions; `X-Powered-By: Next.js` | Add headers in `next.config.ts`; set `poweredByHeader: false`. |
| **P1-13** | Log flooding on DB failure | Full Drizzle stack traces per `/monitor` and insert failure | Log once with sampling, redact params, add a query timeout. |

### P2 — Medium

| ID | Finding | Evidence | Fix |
|---|---|---|---|
| **P2-1** | Child pages lack OG/Twitter metadata | Only root `layout.tsx` defines `openGraph`; details inherit the home title/image | Add `openGraph` to `generateMetadata` for country/niche pages. |
| **P2-2** | No custom 404/error/loading | Default 28,966-byte 404 observed | Add `not-found.tsx`, `error.tsx`, `loading.tsx` with brand chrome. |
| **P2-3** | Accessibility contrast failures | red/white 4.00:1; white/red 4.00:1; red/red-light 3.61:1; white/50 on green 3.77:1 | Darken red for text (`#c00`), use 600+ weights/sizes, avoid 10 px red labels on white. |
| **P2-4** | Missing accessible state and motion preferences | No `aria-valuetext`, no mobile `aria-expanded`, no skip link, no `prefers-reduced-motion` | Add ARIA attributes and a `useReducedMotion` guard / CSS media query. |
| **P2-5** | Four font families; Instrument Serif unused | `next/font` imports 4 families; no `font-serif` usage | Remove Instrument Serif; consider subsetting/dropping a second family. |
| **P2-6** | framer-motion hydrates static content | Charts, reveals, cards are client components | Replace simple reveals with CSS; server-render chart bars; lazy-load motion below the fold. |
| **P2-7** | 11 unused imports/locals; 3 dead exports | `tsc --noUnusedLocals` output | Clean up; enable the lint rule. |
| **P2-8** | Template residue | `package.json` name `nextjs-postgresql-template`; `__arenaNextJsPostgresqlPool`; README starter text | Rename package, global, and docs; set repo description/homepage. |
| **P2-9** | No data provenance or freshness date | `data.ts` comment only; no source links/`lastUpdated` | Add `/methodology`, `DATA_UPDATED_AT`, FX date/source, citations. |
| **P2-10** | Thin/duplicated templated pages | 41 pages share layout/FAQ phrasing | Add unique per-page paragraphs, sources, and tables; avoid country×niche expansion. |
| **P2-11** | Third-party flag CDN | 20+ requests to `flagcdn.com`, `unoptimized` | Self-host 23 SVGs; remove remote pattern and `unoptimized`. |
| **P2-12** | Monitor queries scale poorly; gaps in charts | 8 full-table queries per request; missing days not zero-filled; duplicate day labels across months | Rollup table or 60 s cache; date-series fill; include month in labels. |
| **P2-13** | No observability/analytics | No Sentry/Plausible/GA; health endpoint unused | Add error tracking + privacy-friendly analytics + uptime checks. |
| **P2-14** | No env validation / DB pool tuning / SSL | Only `process.env.DATABASE_URL`; no `max`, `statement_timeout`, `ssl` | Validate at startup; set pool limits; document `sslmode`. |
| **P2-15** | Build depends on Google Fonts network | Build failed on `fonts.googleapis.com` in the sandbox | Self-host fonts or accept the dependency and document it; cache in CI. |
| **P2-16** | Dead/dormant UI data | `flagEmoji`, `compactMoney`, `num` unused; `remotePatterns` covers a domain used with `unoptimized` | Remove or use. |

### P3 — Low / polish

| ID | Finding | Fix |
|---|---|---|
| P3-1 | `themeColor` is `#070709` while the UI is white | Use `#ffffff`/`#ff0000` or `<meta name="theme-color" media="...">`. |
| P3-2 | Home title repeats the brand (`... \| ytcpm.online` + template) | Shorten to ≤60 characters. |
| P3-3 | No manifest/apple-touch-icon/`ads.txt` | Add if installing/ads planned. |
| P3-4 | `keywords` meta is ignored by Google | Harmless; keep or remove. |
| P3-5 | `money()` precision flips at $10 (2→0 decimals) | Document or use consistent decimals for ranges. |
| P3-6 | Breadcrumb UI lacks `BreadcrumbList` | Add JSON-LD. |
| P3-7 | FAQ rich-result expectations | Google limits FAQ rich results; don't count on them. |
| P3-8 | No localized pages despite multi-currency | Consider `/in/`, `/br/` later with hreflang. |
| P3-9 | No share/permalink of estimates | Encode state in query params. |
| P3-10 | README stale/boilerplate | Rewritten in this change. |

---

## 13. Prioritized roadmap

### Before launch (0–2 days)

1. Add `public/og.png` + hero image (or remove the hero image).
2. Commit the added `.gitignore` and lockfile; rename the package.
3. Lazy DB init; make `next build` work with no `DATABASE_URL`.
4. Upgrade `next` to `16.4.2`; re-run audit, typecheck, lint, build.
5. Fix slider labels and align the Shorts model + FAQ.
6. Remove `/monitor` from the sitemap; fix the nav active state.
7. Add the five security headers and `poweredByHeader: false`.

### Week 1

1. Rate limiting + body cap + retention for `calculations`.
2. Generate and commit Drizzle migrations; env-driven `drizzle.config.ts`.
3. Custom `not-found`/`error`/`loading`; metadata for child pages.
4. Trust pages: About, Contact, Privacy, Terms, Methodology with sources and `DATA_UPDATED_AT`.
5. Replace hard-coded hero/$24 cards with data or remove; implement or remove the fake tabs.
6. Accessibility pass: contrast, skip link, mobile menu ARIA, slider `aria-valuetext`, reduced motion.

### Month 1

1. Methodology v2: audience-mix input, monetized-view rate, optional seasonality toggle, per-niche country indices.
2. Test suite + CI (unit, component, API, E2E) and `noUnusedLocals` in lint.
3. Performance pass: remove unused font, replace simple motion, server-render charts, self-host flags, add `sizes`, measure Lighthouse/CWV.
4. Observability: Sentry, uptime checks, monitor rollups/caching.
5. SEO: Breadcrumb/Organization/WebSite schema, per-page OG images, internal-link audit, CSV dataset link magnet.

### Quarter 1

1. Monetization: ads with consent, affiliates, email capture, benchmark report download.
2. Shareable calculator state and embeddable widget (backlink engine).
3. Localized editions (IN/BR/ID) if search demand justifies it.
4. Data pipeline: quarterly benchmark imports with source tracking and changelog.
5. Country×niche pages only where unique content and demand exist.

**Effort/impact:** P0 items are hours each; the methodology and test work is 1–2 weeks; the rest is incremental. Fixing P0 + P1 would move the project from a **C+ prototype** to a **B+/A− production tool** without touching the architecture.

---

## Appendix A — Route inventory

| Route | File | Rendering | Notes |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Static | Hero, calculator, niche/geography/seasonality/FAQ sections |
| `/cpm-by-country` | `src/app/cpm-by-country/page.tsx` | Static | 23-row table with flags, CPM, RPM, local per-1M, tier |
| `/cpm-by-country/[slug]` | `src/app/cpm-by-country/[slug]/page.tsx` | SSG ×23 | Rank, CPM/RPM, view presets, top niches, FAQs, related |
| `/cpm-by-niche` | `src/app/cpm-by-niche/page.tsx` | Static | Ranked chart + 18 cards |
| `/cpm-by-niche/[slug]` | `src/app/cpm-by-niche/[slug]/page.tsx` | SSG ×18 | Rank, CPM/RPM, view presets, country table, FAQs, related |
| `/monitor` | `src/app/monitor/page.tsx` | Dynamic | Aggregate stats, 14-day chart, top niches/countries, recent rows |
| `/api/calculate` | `src/app/api/calculate/route.ts` | Dynamic | POST, logs to PostgreSQL |
| `/api/health` | `src/app/api/health/route.ts` | Dynamic | `select 1` |
| `/sitemap.xml` | `src/app/sitemap.ts` | Static | 45 URLs |
| `/robots.txt` | `src/app/robots.ts` | Static | Allows all, disallows `/api/` |
| `/icon.svg` | `src/app/icon.svg` | Static | Favicon |

## Appendix B — Country dataset (USD)

| # | Country | Code | Tier | CPM | RPM | vs US | Currency |
|---|---|---|---|---|---|---|---|
| 1 | United States | US | T1 | $6–$30 | $3.30–$16.50 | 100.0% | USD |
| 2 | Australia | AU | T1 | $5.5–$25 | $3.03–$13.75 | 84.7% | AUD |
| 3 | United Kingdom | UK | T1 | $5–$22 | $2.75–$12.10 | 75.0% | GBP |
| 4 | Switzerland | CH | T1 | $4.5–$20 | $2.48–$11.00 | 68.1% | CHF |
| 5 | Norway | NO | T1 | $5–$18 | $2.75–$9.90 | 63.9% | NOK |
| 6 | Canada | CA | T1 | $4–$19 | $2.20–$10.45 | 63.9% | CAD |
| 7 | New Zealand | NZ | T1 | $4.5–$18 | $2.48–$9.90 | 62.5% | NZD |
| 8 | Germany | DE | T1 | $4–$18 | $2.20–$9.90 | 61.1% | EUR |
| 9 | Sweden | SE | T1 | $4–$16 | $2.20–$8.80 | 55.6% | SEK |
| 10 | Denmark | DK | T1 | $4–$16 | $2.20–$8.80 | 55.6% | DKK |
| 11 | Netherlands | NL | T1 | $3.5–$15 | $1.93–$8.25 | 51.4% | EUR |
| 12 | Ireland | IE | T2 | $3.5–$15 | $1.93–$8.25 | 51.4% | EUR |
| 13 | Finland | FI | T2 | $3.5–$14 | $1.93–$7.70 | 48.6% | EUR |
| 14 | Belgium | BE | T2 | $3.2–$13 | $1.76–$7.15 | 45.0% | EUR |
| 15 | Singapore | SG | T2 | $3–$12 | $1.65–$6.60 | 41.7% | SGD |
| 16 | France | FR | T2 | $3–$12 | $1.65–$6.60 | 41.7% | EUR |
| 17 | Japan | JP | T2 | $2.5–$11 | $1.38–$6.05 | 37.5% | JPY |
| 18 | South Korea | KR | T2 | $2–$9 | $1.10–$4.95 | 30.6% | KRW |
| 19 | Brazil | BR | T3 | $0.8–$3.5 | $0.44–$1.93 | 11.9% | BRL |
| 20 | India | IN | T3 | $0.5–$2.6 | $0.28–$1.43 | 8.6% | INR |
| 21 | Indonesia | ID | T3 | $0.4–$2 | $0.22–$1.10 | 6.7% | IDR |
| 22 | Pakistan | PK | T4 | $0.3–$1.5 | $0.17–$0.83 | 5.0% | PKR |
| 23 | Bangladesh | BD | T4 | $0.2–$1.2 | $0.11–$0.66 | 3.9% | BDT |

## Appendix C — Niche dataset (US baseline)

| # | Niche | Tier | CPM | RPM | Per 1M views |
|---|---|---|---|---|---|
| 1 | Finance & Investing | S | $15–$50 | $8.25–$27.50 | $8,250–$27,500 |
| 2 | Insurance & Legal | S | $12–$40 | $6.60–$22.00 | $6,600–$22,000 |
| 3 | Business & Marketing | S | $12–$35 | $6.60–$19.25 | $6,600–$19,250 |
| 4 | Real Estate | A | $10–$30 | $5.50–$16.50 | $5,500–$16,500 |
| 5 | Make Money Online | A | $10–$28 | $5.50–$15.40 | $5,500–$15,400 |
| 6 | Tech & Software | A | $8–$22 | $4.40–$12.10 | $4,400–$12,100 |
| 7 | Health & Fitness | A | $6–$18 | $3.30–$9.90 | $3,300–$9,900 |
| 8 | Education & Science | A | $5–$18 | $2.75–$9.90 | $2,750–$9,900 |
| 9 | Automotive & EV | B | $6–$16 | $3.30–$8.80 | $3,300–$8,800 |
| 10 | Lifestyle & Motivation | B | $5–$14 | $2.75–$7.70 | $2,750–$7,700 |
| 11 | Food & Cooking | B | $4–$12 | $2.20–$6.60 | $2,200–$6,600 |
| 12 | Entertainment & Comedy | C | $3–$12 | $1.65–$6.60 | $1,650–$6,600 |
| 13 | Travel & Adventure | B | $3–$10 | $1.65–$5.50 | $1,650–$5,500 |
| 14 | Beauty & Fashion | B | $3–$10 | $1.65–$5.50 | $1,650–$5,500 |
| 15 | Vlogs & Daily Life | C | $2–$8 | $1.10–$4.40 | $1,100–$4,400 |
| 16 | Music & Audio | C | $2–$6 | $1.10–$3.30 | $1,100–$3,300 |
| 17 | Gaming | C | $1.5–$6 | $0.83–$3.30 | $825–$3,300 |
| 18 | Kids & Family | C | $1.5–$5 | $0.83–$2.75 | $825–$2,750 |

## Appendix D — File inventory

| File | Lines | Role |
|---|---:|---|
| `src/app/layout.tsx` | 83 | Fonts, metadata, header/footer shell |
| `src/app/page.tsx` | 248 | Home |
| `src/app/globals.css` | 169 | Theme + utilities |
| `src/app/icon.svg` | 11 | Favicon |
| `src/app/robots.ts` | 14 | Robots |
| `src/app/sitemap.ts` | 31 | Sitemap |
| `src/app/api/calculate/route.ts` | 56 | Logging API |
| `src/app/api/health/route.ts` | 13 | DB health |
| `src/app/cpm-by-country/page.tsx` | 65 | Country index |
| `src/app/cpm-by-country/[slug]/page.tsx` | 92 | Country detail |
| `src/app/cpm-by-niche/page.tsx` | 64 | Niche index |
| `src/app/cpm-by-niche/[slug]/page.tsx` | 89 | Niche detail |
| `src/app/monitor/page.tsx` | 87 | Usage monitor |
| `src/components/calculator.tsx` | 139 | Calculator |
| `src/components/charts.tsx` | 149 | Charts/cards/stat bars |
| `src/components/faq.tsx` | 38 | Accordion |
| `src/components/motion.tsx` | 111 | Motion primitives |
| `src/components/site-header.tsx` | 70 | Header/nav |
| `src/components/site-footer.tsx` | 62 | Footer/CTA |
| `src/db/index.ts` | 24 | Pool + Drizzle |
| `src/db/schema.ts` | 31 | `calculations` table |
| `src/lib/data.ts` | 228 | Dataset + engine |
| `src/lib/flags.ts` | 22 | Flag URLs |
| `src/lib/niche-icons.ts` | 27 | Icon map |
| **Total** | **1,923** | |

## Appendix E — Formulas, assumptions & glossary

| Term | Definition in this project |
|---|---|
| **CPM** | Advertiser cost per 1,000 ad impressions, USD. |
| **RPM** | Creator revenue per 1,000 total views, derived as `CPM × 0.55`. |
| **Creator share** | `CREATOR_SHARE = 0.55` (YouTube keeps ~45%). |
| **Country multiplier** | Blended country CPM ÷ US blended CPM (36). |
| **Long-form estimate** | `(views / 1000) × (niche CPM × country multiplier × 0.55)`. |
| **Shorts estimate** | `(views / 1000) × 0.05..0.16 × max(country multiplier, 0.15)` (cap 1.4). |
| **Seasonality** | Q1 0.85, Q2 0.95, Q3 1.00, Q4 1.60 — displayed, not applied. |
| **Tier** | Country: 1 premium → 4 volume; Niche: S highest → C volume. |
| **Data year** | 2026 (`DATA_YEAR`). |
| **FX** | Local units per USD, hard-coded per country, undated. |

## Appendix F — Reproduction commands

```bash
# 1. Install
npm install

# 2. Static checks
npm run typecheck
npm run lint

# 3. Data audit (Node 22+)
node --experimental-strip-types --input-type=module -e "
import { COUNTRIES, NICHES } from './src/lib/data.ts';
console.log({ countries: COUNTRIES.length, niches: NICHES.length });
console.log('invalid ranges', [...COUNTRIES, ...NICHES].filter(x => x.cpmHigh <= x.cpmLow).length);
"

# 4. Build (needs a dummy DATABASE_URL because of the import-time throw)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db npm run build

# 5. Run and probe
DATABASE_URL=... npm start -- -p 3100
curl -sI http://127.0.0.1:3100/ | sed -n '1,15p'
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/og.png          # 404
curl -s -X POST http://127.0.0.1:3100/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"views":100000,"niche":"technology-software","country":"india","type":"long"}'

# 6. Dependency audit
npm audit --omit=dev
```

---

*End of report. For setup and usage instructions, see [`README.md`](./README.md).*
