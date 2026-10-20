# ytcpm.online — YouTube CPM Calculator

A free, data-driven **YouTube CPM & RPM calculator** built with the Next.js App Router. Estimate what a channel earns per 1,000 views for **23 countries** and **18 niches**, in **local currency**, with separate long-form and Shorts models — plus 41 statically generated country/niche reference pages and a live usage dashboard.

> **Production domain (configured):** `https://ytcpm.online`
> **Deep technical audit:** see [`report.md`](./report.md) for the full architecture, methodology critique, security review, and prioritized roadmap.

---

## Project status

| Check | Result (2026-10-20) |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run build` | ✅ 50 route entries (41 SSG country/niche pages) — requires `DATABASE_URL` |
| Production server (`next start`) | ✅ Home, hubs, all 41 detail pages, sitemap, robots serve 200 |
| `npm audit --omit=dev` | ⚠️ 3 vulnerabilities (1 critical, 2 high) in `next@16.2.6` |
| Tests / CI | ❌ None yet |
| Overall audit grade | **C+** — strong front-end and SEO foundation; production hardening, data credibility, and testing are the gaps |

This is an early-stage v1. Read [Known limitations](#known-limitations) before deploying, and consult the [findings register](./report.md#12-findings-register) for the full prioritized issue list.

---

## Table of contents

- [Project status](#project-status)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Available scripts](#available-scripts)
- [Routes](#routes)
- [How the estimate is calculated](#how-the-estimate-is-calculated)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Data coverage](#data-coverage)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Interactive calculator** — monthly views (1K–10M, logarithmic slider), channel niche (S/A/B/C tiers), audience country (Tier 1–4), and long-form vs Shorts.
- **Local-currency output** — 23 ISO currencies/locales via `Intl.NumberFormat`, with a USD cross-check and an FX note.
- **CPM / RPM breakdown** — CPM range, RPM range, average CPM/RPM, yearly projection, and total estimated earnings.
- **Programmatic SEO pages** — 23 country pages + 18 niche pages, statically generated, each with unique notes, rankings, earnings tables, FAQs, and related links.
- **Seasonality guide** — Q1–Q4 ad-spend multipliers with commentary.
- **Usage monitor** — `/monitor` aggregates anonymous calculator runs from PostgreSQL (top niches/countries, 14-day volume, recent calculations).
- **SEO plumbing** — per-page canonicals, generated sitemap, `robots.txt`, `FAQPage` + `WebApplication` JSON-LD, Open Graph/Twitter metadata.
- **Graceful degradation** — the calculator keeps working if PostgreSQL is unavailable; the monitor shows a fallback state.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack, RSC) |
| UI | React 19, Tailwind CSS v4 (CSS-first `@theme`), Lucide icons, Framer Motion |
| Language | TypeScript 5.9 (`strict`) |
| Database | PostgreSQL + [Drizzle ORM](https://orm.drizzle.team) (`node-postgres` driver) |
| Tooling | ESLint 9 (flat config), Drizzle Kit |
| Fonts | Inter, Space Grotesk, JetBrains Mono (Instrument Serif is imported but unused), via `next/font/google` |

## Architecture

```mermaid
flowchart LR
  U[Browser] --> N[Next.js App Router]
  N --> P[Server Components<br/>home · hubs · 41 SSG pages]
  P --> D[(lib/data.ts<br/>dataset + formulas)]
  N --> C[Client Components<br/>calculator · charts · motion]
  C -->|POST /api/calculate| A[Route Handler]
  A --> O[Drizzle ORM]
  O --> PG[(PostgreSQL)]
  N --> M[/monitor]
  M --> O
```

- **Static-first:** only `/monitor` and the two API routes are dynamic.
- **One source of truth:** `src/lib/data.ts` is shared by the browser calculator and the server route, so results cannot drift.
- **Analytics is non-blocking:** a failed database write never breaks an estimate (`logged: false`).

## Getting started

### Prerequisites

- **Node.js 22+** (tested with 22.22.3) and npm 10+
- **PostgreSQL 14+** (only needed for `/monitor` and calculation logging)

### 1. Clone and install

```bash
git clone https://github.com/avinashsarraf/ytcpm.git
cd ytcpm
npm install
```

### 2. Configure the environment

```bash
cp .env.example .env
# edit .env if your PostgreSQL connection string differs
```

### 3. Create the database

```bash
createdb app_db        # or use your existing database
npx drizzle-kit push   # creates the `calculations` table from src/db/schema.ts
```

> The repository does not yet include generated migrations. Until it does, `drizzle-kit push` is the way to create the schema. `drizzle.config.json` currently hard-codes `postgresql://postgres:postgres@127.0.0.1:5432/app_db`; update it if your local database differs.

### 4. Run

```bash
npm run dev
# http://localhost:3000
```

### 5. Production build

```bash
npm run build
npm start
```

> **Build requires `DATABASE_URL`.** `src/db/index.ts` throws at import time when the variable is missing, and Next.js evaluates API route modules during page-data collection. Set the variable for any build environment (a dummy local URL is enough for a purely static build). This is tracked in [report.md](./report.md) as **P0-2**.

> **Fonts need network access at build time.** `next/font/google` downloads the four families during `next build`. Offline/locked-down CI will fail until the fonts are self-hosted or cached.

## Environment variables

| Variable | Required | Example | Used by |
|---|---|---|---|
| `DATABASE_URL` | Yes (for build, monitor, APIs) | `postgresql://postgres:postgres@127.0.0.1:5432/app_db` | `src/db/index.ts`, `/api/*`, `/monitor` |
| `NODE_ENV` | Auto | `production` | Next.js / pool caching |
| `NEXT_TELEMETRY_DISABLED` | Optional | `1` | Disables Next.js telemetry in CI |

`.env.example` contains the local-development values. `.env` is git-ignored.

## Database setup

Schema: one table, `calculations`, defined in [`src/db/schema.ts`](./src/db/schema.ts).

| Column | Type | Notes |
|---|---|---|
| `id` | `serial` | Primary key |
| `views` | `integer` | Monthly views |
| `niche_slug` / `niche_name` | `text` | Selected niche |
| `country_slug` / `country_name` | `text` | Selected country |
| `content_type` | `text` | `long` or `shorts` |
| `rpm_low` / `rpm_high` | `numeric(10,4)` | Per-1,000-view range |
| `est_low` / `est_high` | `numeric(12,2)` | Monthly estimate range |
| `created_at` | `timestamptz` | Defaults to `now()` |

Indexes exist on `created_at`, `niche_slug`, and `country_slug`.

## Available scripts

| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Local development server |
| `npm run build` | `next build` | Production build (50 entries) |
| `npm start` | `next start` | Serve the production build |
| `npm run lint` | `eslint .` | Lint |
| `npm run typecheck` | `tsc --noEmit` | Type check |

There is currently **no test script** — see [report.md §11.2](./report.md#112-test-plan-currently-0-tests) for the proposed suite.

## Routes

| Route | Rendering | Description |
|---|---|---|
| `/` | Static | Hero, calculator, CPM by niche/geography, seasonality, FAQ |
| `/cpm-by-country` | Static | All 23 markets with CPM/RPM and local per-1M earnings |
| `/cpm-by-country/[slug]` | SSG ×23 | Country detail: rank, earnings presets, top niches, FAQs |
| `/cpm-by-niche` | Static | 18 niches ranked by CPM |
| `/cpm-by-niche/[slug]` | SSG ×18 | Niche detail: CPM/RPM, country table, FAQs |
| `/monitor` | Dynamic (`noindex`) | Anonymous usage analytics from PostgreSQL |
| `/api/calculate` | Dynamic | `POST` estimate (and optional logging) |
| `/api/health` | Dynamic | Database liveness check |
| `/sitemap.xml`, `/robots.txt`, `/icon.svg` | Static | Crawl and icon assets |

## How the estimate is calculated

All benchmarks live in [`src/lib/data.ts`](./src/lib/data.ts) and are quoted in USD.

```ts
countryMultiplier = (country.cpmLow + country.cpmHigh) / (US.cpmLow + US.cpmHigh);

// Long-form
cpmLow   = niche.cpmLow  * countryMultiplier;
cpmHigh  = niche.cpmHigh * countryMultiplier;
rpmLow   = cpmLow  * 0.55;   // CREATOR_SHARE
rpmHigh  = cpmHigh * 0.55;
monthly  = (views / 1000) * rpm;

// Shorts
rpmLow  = 0.05 * max(countryMultiplier, 0.15);
rpmHigh = min(0.16 * max(countryMultiplier, 0.15), 1.4);
```

Worked example — **India · Tech & Software · 1,000,000 views/month**:

| Metric | Value |
|---|---|
| Country multiplier | 8.61% of US |
| CPM | $0.69–$1.89 |
| RPM | $0.38–$1.04 |
| Monthly estimate | **$378.89–$1,041.94** |

**Important assumptions and limitations** (full analysis in [report.md §5.5](./report.md#55-methodology-critique-the-most-important-section)):

- Estimates assume a **single-country audience**; real audiences are mixed.
- RPM is derived as `CPM × 55%` and does **not** model the monetized-playback ratio, so results are optimistic for channels with low ad-impression rates.
- Country scaling is **linear and uniform across niches**.
- Seasonality multipliers are shown in the UI but **not applied** to estimates.
- FX rates are hard-coded and **undated**.
- Shorts uses a pooled-revenue heuristic and currently ignores the niche selector.

## API reference

### `POST /api/calculate`

```bash
curl -X POST http://localhost:3000/api/calculate \
  -H 'Content-Type: application/json' \
  -d '{"views":100000,"niche":"technology-software","country":"india","type":"long"}'
```

```json
{
  "ok": true,
  "logged": true,
  "estimate": {
    "cpmLow": 0.6889,
    "cpmHigh": 1.8944,
    "rpmLow": 0.3789,
    "rpmHigh": 1.0419,
    "monthlyLow": 37.8889,
    "monthlyHigh": 104.1944,
    "multiplier": 0.0861
  }
}
```

| Case | Status | Body |
|---|---|---|
| Success, row inserted | `200` | `{ ok: true, logged: true, estimate }` |
| Success, database unavailable | `200` | `{ ok: true, logged: false, estimate }` |
| Malformed JSON | `400` | `{ ok: false, error: "Invalid JSON" }` |
| Unknown niche/country or views outside 1,000–1,000,000,000 | `422` | `{ ok: false, error: "Invalid input" }` |

### `GET /api/health`

Runs `select 1`. Returns `200 { "ok": true }` or `500 { "ok": false }`.

**Note:** there is no authentication or rate limiting on these endpoints yet.

## Project structure

```text
.
├── src/
│   ├── app/
│   │   ├── api/calculate/route.ts     # POST estimate + logging
│   │   ├── api/health/route.ts        # DB health check
│   │   ├── cpm-by-country/             # index + [slug] SSG pages
│   │   ├── cpm-by-niche/               # index + [slug] SSG pages
│   │   ├── monitor/page.tsx            # dynamic usage dashboard
│   │   ├── globals.css                 # Tailwind v4 theme + utilities
│   │   ├── layout.tsx                  # fonts, metadata, shell
│   │   ├── page.tsx                    # home
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/                     # calculator, charts, faq, motion, header, footer
│   ├── db/                             # Drizzle pool + schema
│   └── lib/
│       ├── data.ts                     # 23 countries, 18 niches, formulas
│       ├── flags.ts                    # flag CDN URLs
│       └── niche-icons.ts              # Lucide icon map
├── drizzle.config.json
├── report.md                           # deep technical audit
└── package.json
```

## Data coverage

| Dimension | Values |
|---|---|
| Countries | **23** — Tier 1 (11), Tier 2 (7), Tier 3 (3), Tier 4 (2) |
| Niches | **18** — S (3), A (5), B (5), C (5) |
| Content types | Long-form, Shorts |
| Seasonality | Q1 0.85×, Q2 0.95×, Q3 1.00×, Q4 1.60× |
| Benchmarks year | 2026 (`DATA_YEAR`) |
| Sitemap URLs | 45 (41 country/niche detail pages) |

## Deployment

1. Provision PostgreSQL and set `DATABASE_URL` in the hosting provider's environment.
2. Run `npx drizzle-kit push` (or a committed migration once available) against the production database.
3. Build with the environment variable present: `npm run build`. Most pages are static; `/monitor` and `/api/*` are server-rendered.
4. Use a Node.js runtime — the database driver (`pg`) is not Edge-compatible.
5. Configure the production domain in `metadataBase` (`src/app/layout.tsx`) and the sitemap/robots constants if it changes.

### Before going live

- [ ] Add the missing assets: `public/og.png` and `public/images/hero-illustration.png` (both currently 404).
- [ ] Add `about`, `contact`, `privacy`, `terms`, and `methodology` pages.
- [ ] Upgrade `next` to a patched release (`npm audit --omit=dev` currently reports 3 vulnerabilities, including 1 critical).
- [ ] Add rate limiting to `POST /api/calculate`.
- [ ] Add security headers (`CSP`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) and set `poweredByHeader: false`.
- [ ] Decide whether `/monitor` should be public, and make the sitemap agree with its `noindex` status.

## Known limitations

This is an early v1 with a strong front-end/SEO foundation but several production gaps. The short list:

- No tests, CI, or committed migrations (the lockfile is now committed).
- No data sources/citations or "last updated" date for the benchmarks; the UI's "real-time" claims are inaccurate.
- The views slider's tick labels do not match the underlying logarithmic scale.
- The Shorts model conflicts with the FAQ and ignores niche/country below a 15% multiplier floor.
- No rate limiting, observability, or analytics.
- `npm audit`: 3 production vulnerabilities (1 critical, 2 high).

See [`report.md`](./report.md) for evidence, severity ratings, and a prioritized roadmap.

## Contributing

1. Fork the repository and create a feature branch.
2. Run `npm install` (commit `package-lock.json` if dependencies change).
3. Make your change and run:

   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

4. Open a pull request describing the change and any data-source updates.

Because the site publishes financial estimates, changes to `src/lib/data.ts` or the formulas in `estimateEarnings()` should include the source, sample period, and a note in the PR. Do not add country/niche combinations without unique content.

## License

No license file is present. Until a license is added, the source is **all rights reserved** and may not be redistributed. Add a `LICENSE` file (e.g., MIT) if you intend to open-source the project.
