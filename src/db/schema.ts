import { pgTable, serial, integer, bigint, boolean, text, numeric, timestamp, jsonb, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Successful public calculation API requests are logged here (browser-only calculations are not) — this powers the /monitor dashboard
 * (usage analytics, popular niches/countries, daily volume).
 */
export const calculations = pgTable(
  "calculations",
  {
    id: serial("id").primaryKey(),
    views: integer("views").notNull(),
    nicheSlug: text("niche_slug").notNull(),
    nicheName: text("niche_name").notNull(),
    countrySlug: text("country_slug").notNull(),
    countryName: text("country_name").notNull(),
    contentType: text("content_type").notNull().default("long"),
    season: text("season").notNull().default("annual"),
    monetizedShare: numeric("monetized_share", { precision: 4, scale: 3 }).notNull().default("1.000"),
    rpmLow: numeric("rpm_low", { precision: 10, scale: 4 }).notNull(),
    rpmHigh: numeric("rpm_high", { precision: 10, scale: 4 }).notNull(),
    estLow: numeric("est_low", { precision: 12, scale: 2 }).notNull(),
    estHigh: numeric("est_high", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("calculations_created_idx").on(t.createdAt),
    index("calculations_niche_idx").on(t.nicheSlug),
    index("calculations_country_idx").on(t.countrySlug),
    index("calculations_type_idx").on(t.contentType),
  ]
);

export type Calculation = typeof calculations.$inferSelect;
export type NewCalculation = typeof calculations.$inferInsert;

/* ══════════════════════════════════════════════════════════════════════════
   CMS
   ─────────────────────────────────────────────────────────────────────────
   The CMS is self-hosted: PostgreSQL is the only store. There is no external
   content service, so publishing is a transaction plus a cache revalidation.

   Everything below is namespaced with a `cms_` prefix so the existing
   `calculations` table and its migration history stay untouched.
   ══════════════════════════════════════════════════════════════════════════ */

export const cmsUserRole = pgEnum("cms_user_role", ["admin", "editor"]);
export type CmsUserRole = (typeof cmsUserRole.enumValues)[number];

export const cmsPostStatus = pgEnum("cms_post_status", ["draft", "published", "scheduled", "archived"]);
export type CmsPostStatus = (typeof cmsPostStatus.enumValues)[number];

export const cmsCommentStatus = pgEnum("cms_comment_status", ["pending", "approved", "spam"]);
export type CmsCommentStatus = (typeof cmsCommentStatus.enumValues)[number];

/** CMS accounts. Passwords are scrypt hashes — never plaintext, never reversible. */
export const cmsUsers = pgTable(
  "cms_users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: cmsUserRole("role").notNull().default("editor"),
    isActive: boolean("is_active").notNull().default(true),
    /** Bumped when the password changes so old sessions can be invalidated. */
    tokenVersion: integer("token_version").notNull().default(1),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cms_users_email_idx").on(sql`lower(${t.email})`)]
);

export type CmsUser = typeof cmsUsers.$inferSelect;
export type NewCmsUser = typeof cmsUsers.$inferInsert;

/**
 * Server-side sessions. Only a SHA-256 hash of the session token is stored,
 * so a database leak cannot be replayed as a login cookie.
 */
export const cmsSessions = pgTable(
  "cms_sessions",
  {
    /** SHA-256 of the session token, hex encoded — the token itself is never stored. */
    id: text("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => cmsUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("cms_sessions_user_idx").on(t.userId),
    index("cms_sessions_expiry_idx").on(t.expiresAt),
  ]
);

export type CmsSession = typeof cmsSessions.$inferSelect;

/**
 * Blog posts. The content is stored as Markdown and rendered to HTML on write,
 * so a published post never depends on a renderer being available at read
 * time (and a parser bug can never change an already-published page).
 */
export const cmsPosts = pgTable(
  "cms_posts",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    excerpt: text("excerpt").notNull().default(""),
    contentMd: text("content_md").notNull().default(""),
    contentHtml: text("content_html").notNull().default(""),
    status: cmsPostStatus("status").notNull().default("draft"),
    authorId: integer("author_id").notNull().references(() => cmsUsers.id, { onDelete: "restrict" }),
    category: text("category"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),

    /* ── SEO controls ───────────────────────────────────────────────────── */
    /** The single query this page is meant to win. */
    focusKeyword: text("focus_keyword"),
    /** Overrides the page title in <title>/og:title when set. */
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    seoKeywords: text("seo_keywords").array().notNull().default(sql`'{}'::text[]`),
    ogImageUrl: text("og_image_url"),
    ogImageAlt: text("og_image_alt"),
    canonicalUrl: text("canonical_url"),
    /** Keeps the page out of the index while it is still reachable. */
    noindex: boolean("noindex").notNull().default(false),
    /** Controls whether the post is listed in sitemap.xml. */
    allowIndex: boolean("allow_index").notNull().default(true),
    /** Optional custom template: "article" (default) or "landing". */
    template: text("template").notNull().default("article"),

    /* ── Lifecycle ──────────────────────────────────────────────────────── */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cms_posts_slug_idx").on(t.slug),
    index("cms_posts_status_idx").on(t.status),
    index("cms_posts_published_idx").on(t.publishedAt),
    index("cms_posts_category_idx").on(t.category),
  ]
);

export type CmsPost = typeof cmsPosts.$inferSelect;
export type NewCmsPost = typeof cmsPosts.$inferInsert;

/** Snapshot of a post, written before every destructive or publishing change. */
export const cmsRevisions = pgTable(
  "cms_revisions",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull().references(() => cmsPosts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    contentMd: text("content_md").notNull(),
    /** "edit" | "publish" | "unpublish" | "restore" — shown in the history list. */
    reason: text("reason").notNull().default("edit"),
    createdById: integer("created_by_id").references(() => cmsUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cms_revisions_post_idx").on(t.postId)]
);

export type CmsRevision = typeof cmsRevisions.$inferSelect;

/** Media library. `storageKey` is the on-disk path; `url` is the public URL. */
export const cmsMedia = pgTable(
  "cms_media",
  {
    id: serial("id").primaryKey(),
    filename: text("filename").notNull(),
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    /** Alt text is a ranking and accessibility requirement, not decoration. */
    altText: text("alt_text").notNull().default(""),
    title: text("title"),
    uploadedById: integer("uploaded_by_id").references(() => cmsUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cms_media_storage_idx").on(t.storageKey),
    index("cms_media_created_idx").on(t.createdAt),
  ]
);

export type CmsMedia = typeof cmsMedia.$inferSelect;
export type NewCmsMedia = typeof cmsMedia.$inferInsert;

/** Editor-managed 301/302 redirects, applied by the request proxy. */
export const cmsRedirects = pgTable(
  "cms_redirects",
  {
    id: serial("id").primaryKey(),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
    statusCode: integer("status_code").notNull().default(301),
    isActive: boolean("is_active").notNull().default(true),
    hits: bigint("hits", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cms_redirects_from_idx").on(t.fromPath)]
);

export type CmsRedirect = typeof cmsRedirects.$inferSelect;
export type NewCmsRedirect = typeof cmsRedirects.$inferInsert;

/** Key/value site settings edited from /cms/settings. */
export const cmsSettings = pgTable("cms_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CmsSetting = typeof cmsSettings.$inferSelect;

/** Append-only audit trail for every administrative mutation. */
export const cmsActivity = pgTable(
  "cms_activity",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => cmsUsers.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    summary: text("summary").notNull().default(""),
    meta: jsonb("meta").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("cms_activity_created_idx").on(t.createdAt),
    index("cms_activity_user_idx").on(t.userId),
  ]
);

export type CmsActivity = typeof cmsActivity.$inferSelect;

/** Reader comments. Every comment starts as `pending` and needs moderation. */
export const cmsComments = pgTable(
  "cms_comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull().references(() => cmsPosts.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email").notNull(),
    body: text("body").notNull(),
    status: cmsCommentStatus("status").notNull().default("pending"),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    moderatedById: integer("moderated_by_id").references(() => cmsUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("cms_comments_post_idx").on(t.postId),
    index("cms_comments_status_idx").on(t.status),
  ]
);

export type CmsComment = typeof cmsComments.$inferSelect;
export type NewCmsComment = typeof cmsComments.$inferInsert;
