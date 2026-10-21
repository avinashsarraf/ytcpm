# The ytcpm.online CMS

A self-hosted content system for the blog at `/blog`, administered at `/cms`.
PostgreSQL is the only store — there is no third-party content service, so
publishing is a transaction plus a cache revalidation.

Everything degrades gracefully: with no `DATABASE_URL` the public site still
builds and runs, the blog shows an empty state, and `/cms` explains that the
database is not connected.

---

## 1. Quick start

```bash
# 1. Apply the schema (or let the container do it on start).
npm run db:generate     # only after editing src/db/schema.ts
npm run db:migrate

# 2. Create the first administrator.
npm run db:seed-admin -- --email editor@ytcpm.online
#    → prints a generated password once

# 3. Start the app.
npm run dev
#    → sign in at http://localhost:3000/cms/login
```

In production the migration step runs automatically on container start
(`RUN_MIGRATIONS=true`). The seed step does not — it is run once, by hand.

---

## 2. What is in the box

| Screen | Route | What it does |
|---|---|---|
| Dashboard | `/cms` | Post/comment counts, recent posts, published posts with blocking SEO issues, activity feed |
| Posts | `/cms/posts` | Search, filter by status/category/tag, SEO score per post |
| Editor | `/cms/posts/new`, `/cms/posts/[id]` | Write, set the search appearance, publish, schedule, restore versions |
| Media | `/cms/media` | Upload images, edit alt text, copy the URL, delete |
| Comments | `/cms/comments` | Approve, hold, mark as spam, delete |
| Redirects | `/cms/redirects` | 301/302 rules applied by the request proxy |
| Users | `/cms/users` | Accounts, roles, password resets (admin only) |
| Activity | `/cms/activity` | Append-only audit log of every administrative change |
| Settings | `/cms/settings` | Blog title, description, author, SEO defaults, webhook secret, own password |

---

## 3. Roles

| Role | Can do |
|---|---|
| `admin` | Everything, including users and settings |
| `editor` | Write, edit, publish, moderate comments, manage media and redirects |

Every Server Action checks the session **and** the role again — hiding a
button in the interface is never the protection.

---

## 4. Sessions and sign-in

- Passwords are hashed with **scrypt** (N=16384, r=8, p=1, 64-byte key). The
  plaintext is never stored and the hash is never reversible.
- A sign-in issues a 32-byte random token. Only its **SHA-256 hash** is stored,
  so a database leak cannot be replayed as a cookie.
- The cookie is `ytcpm_cms_session` — `HttpOnly`, `SameSite=Lax`, `Secure` in
  production, 7-day lifetime with a sliding `lastSeenAt`.
- `tokenVersion` is bumped whenever a password changes, which invalidates every
  session for that account.
- Sign-in is rate-limited to 8 attempts per 15 minutes per IP.
- CSRF is handled by Next's built-in Origin check on Server Actions plus
  `SameSite=Lax`.

---

## 5. The SEO panel

The editor shows a live SEO score (0–100) computed by the same analyzer the
server uses to gate publishing, so what the author sees is exactly what will
be checked. `src/lib/cms/seo.ts` holds the rules:

| Check | Blocking | Rule |
|---|---|---|
| Title | yes | 30–60 characters including `\| ytcpm.online` |
| URL slug | yes | Lowercase letters, numbers and single hyphens, ≤60 characters |
| Meta description | no | 90–160 characters |
| Focus keyword | yes | One query, present in the title, description, slug, opening paragraph and a sub-heading |
| Keyword density | no | ≤2.5% |
| Content length | yes | ≥300 words to publish, 600+ recommended |
| Sub-headings | yes | At least one `##`; three or more H2 sections recommended |
| Heading order | no | Never skip a level (H2 → H3) |
| Images | yes | Every image needs alt text |
| Social image | no | An OG image and its alt text |
| Internal links | yes | At least one link to another page on this site |
| Source links | no | At least one external citation |
| Canonical URL | yes | Must be absolute `https://`; a foreign domain is a warning |
| Indexing | no | `noindex` on a published post is flagged |
| Keyword list | no | Three or more keyword variants |

**Blocking checks stop a publish.** A post that fails one cannot be moved to
`published` — neither from the editor nor from the API.

Per-post SEO controls stored in the database:

`seo_title` · `seo_description` · `seo_keywords[]` · `focus_keyword` ·
`slug` · `canonical_url` · `og_image_url` · `og_image_alt` · `noindex` ·
`allow_index` (sitemap listing) · `category` · `tags[]` · `template`

---

## 6. Markdown

The renderer in `src/lib/cms/markdown.ts` is a deliberately small, safe
subset:

- Headings (`#`–`######`), paragraphs, lists, tables, blockquotes, fenced and
  inline code, bold/italic/strikethrough, links and images.
- **All raw HTML is escaped.** A `<script>` tag in the body is shown as text.
- Link targets are limited to `http`, `https`, `mailto`, `tel` and relative
  paths. `javascript:`, `data:` and protocol-relative URLs are dropped.
- External links get `rel="noopener noreferrer nofollow ugc"` and
  `target="_blank"`.
- Headings get stable ids, which build the "On this page" table of contents.
- The renderer reports the word count, reading time, heading list, internal and
  external links, and every image with its alt text — the SEO analyzer uses
  exactly that data.

---

## 7. Media

- Uploads are validated by **magic bytes**, not by the browser's content type.
  Allowed: JPEG, PNG, WebP, GIF, AVIF. SVG is excluded by default.
- Maximum size 5 MB (`CMS_MAX_UPLOAD_BYTES`).
- Files are written **outside** `public/` to `CMS_STORAGE_DIR` (default
  `./storage/uploads`) and served by `GET /media/<year>/<month>/<file>`.
- In production, point `CMS_STORAGE_DIR` at a mounted volume — otherwise
  uploads disappear on the next deploy.
- The storage path is resolved through a single guard that refuses anything
  escaping the storage directory (path traversal).

---

## 8. HTTP API

All endpoints need `Authorization: Bearer <CMS_API_KEY>` (or
`x-cms-api-key`). The key lives in the environment and is compared in
constant time. Without `CMS_API_KEY` the API returns 503 and stays closed.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/cms/auth/login` | Sign in from a script; returns the session cookie |
| `POST` | `/api/cms/auth/logout` | End the session |
| `GET` | `/api/cms/posts` | List posts (`?status=`, `?limit=`, `?offset=`) |
| `POST` | `/api/cms/posts` | Create a post — the same validation and the same publish gate as the editor |
| `GET` | `/api/cms/media` | List the media library |
| `POST` | `/api/cms/media` | Upload an image (multipart) |
| `POST` | `/api/cms/revalidate` | Signed cache-invalidation webhook |

### The revalidation webhook

```bash
BODY='{"slug":"my-post"}'
TS=$(date +%s)
SIG=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$CMS_REVALIDATE_SECRET" -binary | base64 | tr '+/' '-_' | tr -d '=')

curl -X POST https://ytcpm.online/api/cms/revalidate \
  -H "x-cms-timestamp: $TS" \
  -H "x-cms-signature: $SIG" \
  -H "content-type: application/json" \
  -d "$BODY"
```

The signature covers the timestamp **and** the exact bytes of the body, and
requests older than five minutes are rejected, so a captured request cannot be
replayed.

---

## 9. Redirects

Redirect rules live in `cms_redirects` and are applied by `src/proxy.ts`
(Next 16's Node-runtime proxy). The rule set is cached in-process for 60
seconds, and **every database problem fails open** — a broken database never
takes the site down.

The proxy also sends any request for `/cms/*` without a session cookie
straight to `/cms/login`, so a protected page is never rendered for an
anonymous visitor. The session itself is still verified in the CMS layout and
in every Server Action.

---

## 10. Caching

`cacheComponents` is not enabled, so the CMS uses the explicit APIs:

- **Server Actions** — `updateTag("cms-posts")` plus `revalidatePath()` for the
  affected routes. `updateTag` gives read-your-own-writes, so the editor sees
  its own change immediately.
- **Route Handlers** — `revalidateTag(tag, "max")` (stale-while-revalidate);
  `updateTag` is Server-Action only.
- Changing a slug invalidates both the old and the new tag and path.

---

## 11. Comments

Reader comments start as `pending` and never appear until an editor approves
them. Submission is rate-limited to five per hour per client. The public form
posts to `src/app/blog/actions.ts`; the moderation queue is `/cms/comments`.

---

## 12. Database

Nine tables, all prefixed `cms_` so the existing `calculations` table and its
migration history stay untouched.

| Table | Purpose |
|---|---|
| `cms_users` | Accounts: scrypt hash, role, active flag, token version |
| `cms_sessions` | Server-side sessions (SHA-256 hash of the token) |
| `cms_posts` | Posts: Markdown, rendered HTML, SEO fields, lifecycle |
| `cms_revisions` | Snapshots written before every destructive change |
| `cms_media` | Media library: storage key, URL, dimensions, alt text |
| `cms_redirects` | Redirect rules |
| `cms_settings` | Key/value site settings |
| `cms_activity` | Append-only audit log |
| `cms_comments` | Reader comments and their moderation state |

Schema changes follow the usual Drizzle flow:

```bash
# edit src/db/schema.ts
npm run db:generate    # writes drizzle/000N_*.sql — commit it
```

---

## 13. Environment variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `CMS_STORAGE_DIR` | No | `./storage/uploads` | Where uploaded images are written |
| `CMS_MAX_UPLOAD_BYTES` | No | `5242880` | Maximum upload size |
| `CMS_API_KEY` | No | — | Bearer key for the HTTP API (32+ characters) |
| `CMS_REVALIDATE_SECRET` | No | — | HMAC secret for the revalidation webhook |
| `CMS_ADMIN_EMAIL` | No | — | Used by `npm run db:seed-admin` |
| `CMS_ADMIN_PASSWORD` | No | — | Used by `npm run db:seed-admin` |

---

## 14. Testing

```bash
npm test                          # 422 unit tests, no database needed
npx vitest run src/lib/cms       # just the CMS suite (87 tests)
npm run test:cms                  # full end-to-end test, real database
```

The unit suite covers the Markdown renderer's escaping and URL rules, the SEO
analyzer, password hashing and session tokens, every form validator, and the
storage path guard. None of it needs a live database.

`npm run test:cms` is the end-to-end test. It starts a throwaway PostgreSQL
(PGlite, the real database compiled to WebAssembly), applies the migrations,
seeds an administrator, starts the production build and drives it with a real
browser. It signs in, opens every admin screen, writes and publishes a post,
checks that the publish gate blocks a thin article, confirms the post on the
blog, the feed and the sitemap, uploads an image and serves it from `/media`,
creates a redirect and follows it, moderates a comment, calls the HTTP API,
changes the password, restores an earlier version, deletes a post, a file, a
redirect and an account, and signs out again.

```bash
npm run test:cms
# → 59/59 checks passed
```

The test needs a Chromium binary. Point `CHROMIUM_EXECUTABLE_PATH` at one, or
let Playwright download it. `CMS_TEST_PORT` moves the test server off the
default port 3131.
