# Deploying ytcpm.online

Production deployment guide for [Coolify](https://coolify.io) using Docker, plus local Docker testing and alternative hosts.

**Stack:** Next.js 16 (standalone output) · PostgreSQL 16 · Drizzle ORM
**Image:** multi-stage `Dockerfile`, non-root user, built-in healthcheck
**Migrations:** `drizzle/*.sql`, applied automatically on container start

---

## Table of contents

- [Quick start (Coolify, 10 minutes)](#quick-start-coolify-10-minutes)
- [Environment variables](#environment-variables)
- [Option A — Coolify with the Dockerfile build pack (recommended)](#option-a--coolify-with-the-dockerfile-build-pack-recommended)
- [Option B — Coolify with docker-compose](#option-b--coolify-with-docker-compose)
- [Database setup and migrations](#database-setup-and-migrations)
- [Domains, HTTPS and proxies](#domains-https-and-proxies)
- [Health checks](#health-checks)
- [Local Docker testing](#local-docker-testing)
- [Performance and caching](#performance-and-caching)
- [Backups and retention](#backups-and-retention)
- [Updating a deployment](#updating-a-deployment)
- [Scaling beyond one container](#scaling-beyond-one-container)
- [Troubleshooting](#troubleshooting)
- [Alternative hosts](#alternative-hosts)
- [Security checklist](#security-checklist)

---

## Quick start (Coolify, 10 minutes)

1. **Create a PostgreSQL database** in Coolify → *+ New* → *Database* → *PostgreSQL 16*. Note the **internal connection URL**.
2. **Create an application** → *+ New* → *Application* → *Public Repository* (or GitHub App) → `avinashsarraf/ytcpm`, branch `main`.
3. **Build pack:** choose **Dockerfile** (the repo has one at the root). Port: `3000`.
4. **Environment variables** (Coolify → app → *Environment Variables*):

   ```env
   DATABASE_URL=postgresql://postgres:<password>@<db-internal-host>:5432/postgres?sslmode=disable
   RUN_MIGRATIONS=true
   NEXT_TELEMETRY_DISABLED=1
   ```

   Use the database's **internal** URL (Coolify shows it on the DB page), not a public one.
5. **Set the domain** (e.g. `ytcpm.online`), enable HTTPS, and deploy.
6. Open `/api/health` — expect `{"ok":true,"database":"up"}`.
7. Open `/monitor`, send a valid `POST /api/calculate` request, and confirm the API activity appears after the cache expires. Browser-only calculator edits are not logged.

> The app builds and boots **without** a database — pages and the calculator work, while `/monitor` shows a fallback, calculation requests still return an unlogged estimate, and `/api/health` returns a readiness 503. That makes a missing `DATABASE_URL` a soft failure, not an outage.

---

## Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Yes** for DB features | — | PostgreSQL connection string. Internal URL inside Coolify. |
| `DATABASE_SSL` | No | `false` | Set `true` for managed providers that require TLS. |
| `DATABASE_SSL_STRICT` | No | `false` | `true` verifies the server certificate chain. |
| `DATABASE_POOL_MAX` | No | `10` | Max pooled connections per container. |
| `DATABASE_STATEMENT_TIMEOUT_MS` | No | `10000` | Per-statement timeout; prevents stuck queries. |
| `RUN_MIGRATIONS` | No | `true` | Apply `drizzle/*.sql` on container start (entrypoint). |
| `NEXT_TELEMETRY_DISABLED` | No | `1` in image | Disables Next.js telemetry. |
| `PORT` | No | `3000` | Server port. Coolify maps this automatically. |
| `HOSTNAME` | No | `0.0.0.0` | Bind address (must stay `0.0.0.0` inside containers). |
| `NODE_ENV` | No | `production` | Set by the image. |

**Copy-paste templates:** [`.env.example`](./.env.example).
**Never commit** a real `.env` — it is git-ignored.

For a Coolify-managed Postgres, the URL looks like:

```
postgresql://postgres:AbCdEf123456@ytcpm-db-xyz:5432/postgres
```

Inside Coolify's private network the hostname is the service name — **do not** use `127.0.0.1`.

---

## Option A — Coolify with the Dockerfile build pack (recommended)

**Why:** one image, smallest footprint (`output: "standalone"`), the database can be managed separately by Coolify (backups, upgrades, monitoring), and scaling the web tier is straightforward.

### 1. Database resource

| Setting | Value |
|---|---|
| Type | PostgreSQL 16 |
| Name | `ytcpm-db` |
| Username / DB | `postgres` / `postgres` (or your own) |
| Public port | **not required** — keep it private |
| Backups | enable daily (Coolify → DB → Backups) |

### 2. Application resource

| Setting | Value |
|---|---|
| Source | Public repo `avinashsarraf/ytcpm` or GitHub App |
| Branch | `main` |
| Build pack | **Dockerfile** |
| Dockerfile location | `/Dockerfile` |
| Base directory | `/` |
| Ports exposed | `3000` |
| Watch paths | leave empty |

### 3. Environment

Add the variables from the table above. In Coolify's UI, prefer the **secret** toggle for `DATABASE_URL`.

### 4. Domain and HTTPS

*Configuration → Domains* → add `https://ytcpm.online` (and `https://www.ytcpm.online` with a redirect). Coolify/Traefik provisions Let's Encrypt automatically once DNS points at the server.

### 5. Deploy

Press **Deploy**. The first build takes ~2–4 minutes (npm ci + Next build). Subsequent builds reuse the dependency layer.

### 6. Verify

```bash
curl -s https://ytcpm.online/api/health          # {"ok":true,"database":"up"}
curl -sI https://ytcpm.online/ | head -20        # security headers + s-maxage
curl -s https://ytcpm.online/sitemap.xml | head  # 46+ <url> entries
```

---

## Option B — Coolify with docker-compose

Use this when you want the app **and** the database in a single stack (simplest for a single small server).

1. Coolify → *+ New* → *Resource* → **Docker Compose**.
2. Point it at this repository, file `docker-compose.yml`.
3. Add the environment variables (Coolify injects them into `${VARS}` in the compose file):

   ```env
   POSTGRES_USER=ytcpm
   POSTGRES_PASSWORD=<long-random-password>
   POSTGRES_DB=ytcpm
   DATABASE_URL=postgresql://ytcpm:<long-random-password>@db:5432/ytcpm
   RUN_MIGRATIONS=true
   ```

   `db` is the compose service name — it resolves inside the stack network.
4. Set the domain **on the `web` service** (Coolify asks which service should receive traffic), port `3000`.
5. Remove the `ports:` mapping for `web` if Coolify's proxy handles routing (optional; publishing the port is harmless on a single host).

**Data lives in the `db_data` volume.** Deleting the stack deletes the volume unless you detach it first.

Generate a password:

```bash
openssl rand -base64 24
```

---

## Database setup and migrations

Schema changes live in `src/db/schema.ts`; SQL is generated into `drizzle/`.

```bash
# after editing schema.ts
npm run db:generate     # creates drizzle/000N_*.sql
git add drizzle && git commit -m "db: add ..."
```

**In the container**, `docker-entrypoint.sh` runs `scripts/migrate.mjs` when `RUN_MIGRATIONS=true` (default):

- Waits up to `MIGRATION_MAX_ATTEMPTS` × 3 s for the database to accept connections.
- Creates a `_migrations` table and applies each `drizzle/*.sql` **once** (idempotent).
- On failure it **logs and starts the app anyway**, so a database hiccup never takes the site down.
- Runs as the non-root `nextjs` user.

Manual run (e.g. from a Coolify terminal):

```bash
DATABASE_URL=... node scripts/migrate.mjs
```

Alternative — Drizzle CLI (needs dev dependencies, useful locally):

```bash
DATABASE_URL=... npm run db:push       # push schema directly (dev only)
DATABASE_URL=... npm run db:studio     # browse data
```

**Fresh database checklist**

- [ ] `DATABASE_URL` set and reachable from the app container
- [ ] `RUN_MIGRATIONS=true` on the first deploy
- [ ] `/api/health` returns `{"ok":true,"database":"up"}`
- [ ] `calculations` table + 4 indexes exist (`\d calculations` in psql)

---

## Domains, HTTPS and proxies

The app reads **client IPs** from `x-forwarded-for` (first hop) and `x-real-ip` for rate limiting. Coolify's Traefik sets these automatically — no app config needed.

If you put **Cloudflare** in front:

- Enable "Full (strict)" SSL mode.
- Cloudflare overwrites `x-forwarded-for` with the real client IP, so rate limits keep working.
- Do **not** enable "Under Attack Mode" during normal operation; it breaks the API for legitimate users.

Static assets are content-hashed by Next.js and served with long-lived cache headers. Pages are prerendered at build time with `s-maxage=31536000`; `/monitor` is cached for 60 s via `revalidate`.

---

## Health checks

| Endpoint | Meaning | Status codes |
|---|---|---|
| `GET /` | Liveness — app process is serving | `200` |
| `GET /api/health` | Readiness — app **and** database | `200` ok · `503` DB down/not configured |

The image's `HEALTHCHECK` uses `/` so a database outage does not cause a restart loop. Configure Coolify's healthcheck the same way (*Configuration → Health Checks* → path `/`, port `3000`).

Use `/api/health` for uptime monitoring (BetterStack, UptimeRobot, Coolify notifications) if you want DB failures to alert.

Sample readiness payloads:

```json
{ "ok": true, "database": "up", "latencyMs": 3 }

{ "ok": false, "database": "not_configured", "missing": ["DATABASE_URL"],
  "hint": "Set DATABASE_URL in Coolify → the app → Environment Variables. …" }

{ "ok": false, "database": "down", "code": "ECONNREFUSED",
  "detail": "connect ECONNREFUSED 127.0.0.1:5432",
  "hint": "DATABASE_URL points at localhost. Inside a container localhost is the app itself — use the Postgres service name …" }
```

Failures include the driver `code` and a `hint` for the 12 most common causes
(`ECONNREFUSED`, `ENOTFOUND`, `ETIMEDOUT`, `28P01`, `28000`, `3D000`, `42501`,
self-signed-certificate errors, …). Credentials are masked — the response never
echoes the password. The startup log prints the same masked target:

```text
[entrypoint] database target: postgresql://***:***@postgres:5432/ytcpm
[entrypoint] migrations OK — schema is up to date
```

---

## Local Docker testing

```bash
# Build the production image
docker build -t ytcpm:local .

# App + Postgres together
cp .env.example .env      # then edit POSTGRES_PASSWORD / DATABASE_URL if you like
docker compose up -d --build
docker compose logs -f web

curl -s localhost:3000/api/health
open http://localhost:3000/monitor
```

Tear down **without** losing data:

```bash
docker compose down
```

Tear down **and** delete the database volume:

```bash
docker compose down -v
```

Inspect the running container:

```bash
docker compose exec web sh
docker compose exec db psql -U ytcpm -d ytcpm -c '\d calculations'
```

---

## Performance and caching

| Layer | Behavior |
|---|---|
| Static pages | Prerendered at build time; `s-maxage=31536000` (1 year) |
| `/monitor` | Server-rendered, revalidated every **60 s** (`revalidate = 60`) |
| `/api/*` | Never cached (`no-store` on health) |
| Images | `next/image` for flags (remote `flagcdn.com`) — no optimizer needed for local assets |
| Fonts | Self-hosted (`next/font/local`, committed `woff2`) — **no Google Fonts request at build or runtime** |
| Compression | `compress: true` (gzip); Coolify/Traefik can add Brotli |

The Docker image contains **only** the standalone server, static assets and `node_modules` that Next traced — roughly 150–250 MB, versus ~570 MB for a full `node_modules`.

Cold build on a 2 vCPU / 2 GB server: ~2–4 minutes. If the build is OOM-killed, add 1 GB swap or build on a larger instance.

---

## Backups and retention

**Database**

- Coolify-managed Postgres: enable scheduled backups (daily) and copy them off-box (S3 or another host).
- Compose Postgres: `docker compose exec db pg_dump -U ytcpm ytcpm | gzip > backup-$(date +%F).sql.gz` via cron.

Restore:

```bash
gunzip -c backup-2026-10-20.sql.gz | docker compose exec -T db psql -U ytcpm -d ytcpm
```

**Data growth.** Every calculator run writes one row to `calculations` (rate limited to 60/min per IP). For a low-traffic site this is negligible; if it grows, prune monthly:

```sql
DELETE FROM calculations WHERE created_at < now() - interval '180 days';
```

Or roll up daily aggregates into a summary table and prune raw rows. Monitor size with:

```sql
SELECT pg_size_pretty(pg_total_relation_size('calculations'));
```

---

## Updating a deployment

1. Push to `main` (Coolify can auto-deploy on push — enable *Webhooks → Autodeploy*).
2. If the schema changed, `drizzle/*.sql` comes with the commit; the entrypoint applies it on boot.
3. Coolify builds the new image and swaps containers with zero downtime (Traefik health-gated).

Manual:

```bash
git pull
docker compose up -d --build
```

**Rollback:** redeploy the previous commit from Coolify's deployment history. Database migrations are additive in this project; if a rollback crosses a destructive migration, restore the DB backup taken before the deploy.

---

## Scaling beyond one container

The app is stateless **except** for the in-memory rate limiter (`src/lib/rate-limit.ts`). With more than one replica:

- Rate limits become per-replica (60 req/min × N). Acceptable for most setups.
- For strict global limits, swap the limiter for Redis/Upstash:

  ```ts
  // src/lib/rate-limit.ts — replace the Map with, e.g. @upstash/ratelimit
  const { success } = await ratelimit.limit(key);
  ```

- Keep `DATABASE_POOL_MAX × replicas` below the database's `max_connections` (default 100). With Postgres 16 and 3 replicas, `10 × 3 = 30` is comfortable.
- `/monitor` revalidates per instance; for exact numbers use a shared cache.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `503 {"ok":false,"database":"not_configured"}` | `DATABASE_URL` not set in the app environment | Add it, redeploy/restart |
| `503 {"ok":false,"database":"down"}` | Wrong host/port, DB not ready, TLS mismatch | Read the `hint`/`code` in the response; use the **internal** URL; check `DATABASE_SSL`; test with `psql` from the app container |
| Health says `ECONNREFUSED 127.0.0.1:5432` | URL uses `localhost` inside a container | Replace `localhost` with the Postgres service name (compose) or the resource's internal host (Coolify) |
| Health says `3D000` | Database name in the URL does not exist | Use the DB created by the Postgres resource, or `CREATE DATABASE` |
| `password authentication failed` | Special characters in the password not URL-encoded | Encode `@ : / ?` as `%40 %3A %2F %3F`, or use a generated password |
| `ENOTFOUND` / `ECONNREFUSED` on `db:5432` | App and DB in different networks | Put both in the same Coolify project/network, or use the DB's public/internal hostname |
| Build fails: `npm ci` lockfile mismatch | `package.json` changed without the lockfile | Run `npm install`, commit `package-lock.json` |
| Build OOM-killed | Next build needs ~1.5 GB peak | Add swap or a bigger instance |
| `/monitor` empty | No rows yet, or migrations not applied | Run the calculator once; check `_migrations` and `calculations` |
| `429 Too Many Requests` in normal use | Shared IP (office/NAT) hitting 60 req/min | Raise `limit` in `src/app/api/calculate/route.ts` or move to Redis |
| Logs full of `db insert failed` | DB unreachable while the app serves traffic | Fix `DATABASE_URL`; de-duplicated logging keeps noise low |
| Container "unhealthy" during DB outage | Healthcheck pointed at `/api/health` | Point Coolify's healthcheck at `/` |
| `next start` warns about standalone output | `next start` is incompatible with `output: "standalone"` | Use `node server.js` (the image does this) |
| Fonts missing / tofu characters | Custom build removed `src/app/fonts/*.woff2` | Keep the committed fonts; they are loaded by `next/font/local` |

Useful commands:

```bash
docker compose logs -f web
docker compose exec web node scripts/migrate.mjs
docker compose exec db psql -U ytcpm -d ytcpm -c '\dt'
curl -s localhost:3000/api/health
```

---

## Alternative hosts

| Host | Notes |
|---|---|
| **Vercel** | Works as-is. Set `DATABASE_URL` in Project → Settings → Environment Variables. Remove `output: "standalone"` (Vercel ignores it) and **do not** rely on the Docker entrypoint for migrations — run them from CI instead. Use a pooled connection string (Neon/Supabase pooler) because serverless functions open many connections. |
| **Railway / Render** | Use the Dockerfile. Add a Postgres plugin, copy its internal URL, set `DATABASE_URL`, keep `RUN_MIGRATIONS=true`. |
| **Fly.io** | `fly launch --dockerfile Dockerfile`, attach Postgres (`fly postgres attach`), set secrets. Rate limiting stays per-machine. |
| **Plain VPS + Compose** | Follow Option B, add a reverse proxy (Caddy/Traefik) for TLS, and set up a cron for `pg_dump`. |

---

## Security checklist

- [x] Security headers (`CSP`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`)
- [x] `X-Powered-By` disabled (`poweredByHeader: false`)
- [x] Rate limiting on `POST /api/calculate` (60 req/min/IP) + request body cap (4 KB)
- [x] Input validation with `400`/`413`/`422` responses
- [x] Parameterized SQL via Drizzle (no string interpolation)
- [x] Non-root container user (`nextjs`, uid 1001)
- [x] Lazy DB initialization — no crash when the database is absent
- [x] No secrets in the image (build uses a throwaway placeholder URL)
- [x] No PII stored (anonymous aggregates only)
- [x] `npm audit --omit=dev` → **0 vulnerabilities** (Next 16.4.2)

Before going live, also:

- [ ] Replace `hello@ytcpm.online` in `/contact` and `/privacy` with a real monitored inbox
- [ ] Update `metadataBase`, sitemap `BASE` and `robots.ts` if the domain changes
- [ ] Add the sitemap to Google Search Console / Bing Webmaster Tools
- [ ] Enable database backups and test a restore
- [ ] Configure uptime monitoring against `/api/health`
- [ ] Rotate the database password if it was ever pasted into a chat or issue
