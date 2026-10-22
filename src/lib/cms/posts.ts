import { and, asc, desc, eq, ilike, inArray, isNotNull, lte, or, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsComments, cmsPosts, cmsRevisions, type CmsPost, type CmsPostStatus } from "@/db/schema";
import { logOnce } from "@/lib/log";
import { recordActivity } from "./activity";
import { renderMarkdown, markdownExcerpt } from "./markdown";
import { isPostLive } from "./visibility";
import { slugify } from "./markdown";

/**
 * The post repository.
 *
 * Every read degrades gracefully when the database is not configured, so the
 * public blog renders an empty state instead of crashing the site (and a
 * production build without DATABASE_URL still succeeds).
 */

export type PostWithMeta = CmsPost & {
  authorName: string;
  authorEmail: string;
  readingMinutes: number;
  wordCount: number;
};

export type PostQuery = {
  status?: CmsPostStatus | CmsPostStatus[];
  limit?: number;
  offset?: number;
  search?: string;
  category?: string;
  tag?: string;
  authorId?: number;
  /** Only posts whose publish date has arrived. */
  onlyLive?: boolean;
  order?: "newest" | "oldest" | "updated";
};

/**
 * The definition of "public": a published post whose date has arrived, or a
 * scheduled post whose scheduled date has arrived.
 *
 * The second half matters because scheduling must not depend on a cron job
 * having run. A post scheduled for 09:00 becomes readable at 09:00 on the next
 * request, and `promoteScheduledPosts` tidies the row into "published"
 * afterwards.
 */
function liveClause(now = new Date()) {
  return or(
    and(eq(cmsPosts.status, "published"), lte(cmsPosts.publishedAt, now)),
    and(eq(cmsPosts.status, "scheduled"), lte(cmsPosts.scheduledFor, now)),
  )!;
}

/* ── Scheduled publishing ──────────────────────────────────────────────────
   A post can be scheduled for a date in the future. Nothing in a self-hosted
   deployment guarantees that a cron job runs, so the promotion from
   "scheduled" to "published" happens lazily: the first public read after the
   date passes flips the row. It is throttled to one small UPDATE per process
   per interval, and `POST /api/cms/cron/publish` exposes the same work for
   deployments that do run a scheduler. */

const PROMOTION_INTERVAL_MS = 30_000;
let lastPromotionCheck = 0;

/**
 * Publishes every scheduled post whose date has arrived.
 *
 * The published date becomes the date it was scheduled for, not the moment
 * the promotion happened to run, so a late scheduler does not shift the
 * article. Returns the posts that went live.
 *
 * Deliberately does **no** cache revalidation: this runs from page renders as
 * well as from the cron endpoint, and Next only allows revalidation from an
 * action or a route handler. The cron endpoint handles that itself, and the
 * public blog is rendered dynamically anyway.
 */
export async function promoteScheduledPosts(): Promise<{ id: number; slug: string; title: string }[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const now = new Date();
    const due = await db
      .update(cmsPosts)
      .set({
        status: "published",
        publishedAt: sql`coalesce(${cmsPosts.scheduledFor}, ${now})`,
        updatedAt: now,
      })
      .where(
        and(
          eq(cmsPosts.status, "scheduled"),
          isNotNull(cmsPosts.scheduledFor),
          lte(cmsPosts.scheduledFor, now),
        ),
      )
      .returning({ id: cmsPosts.id, slug: cmsPosts.slug, title: cmsPosts.title });

    for (const post of due) {
      await recordActivity({
        userId: null,
        action: "post.published",
        entity: "post",
        entityId: post.id,
        summary: `Published the scheduled post “${post.title}”.`,
      });
    }
    return due;
  } catch (error) {
    logOnce("cms", "scheduled publish failed", error);
    return [];
  }
}

/** The same work, rate-limited so a busy blog does not run an UPDATE per request. */
export async function promoteScheduledPostsThrottled(): Promise<{ id: number; slug: string; title: string }[]> {
  if (Date.now() - lastPromotionCheck < PROMOTION_INTERVAL_MS) return [];
  lastPromotionCheck = Date.now();
  return promoteScheduledPosts();
}

function buildWhere(query: PostQuery) {
  const clauses = [];
  if (query.status) {
    clauses.push(
      Array.isArray(query.status)
        ? inArray(cmsPosts.status, query.status)
        : eq(cmsPosts.status, query.status),
    );
  }
  if (query.onlyLive) clauses.push(liveClause());
  if (query.category) clauses.push(eq(cmsPosts.category, query.category));
  if (query.authorId) clauses.push(eq(cmsPosts.authorId, query.authorId));
  if (query.search) {
    const needle = `%${query.search.replace(/[%_]/g, (m) => `\\${m}`)}%`;
    clauses.push(
      or(
        ilike(cmsPosts.title, needle),
        ilike(cmsPosts.excerpt, needle),
        ilike(cmsPosts.contentMd, needle),
      )!,
    );
  }
  if (query.tag) clauses.push(sql`${query.tag} = ANY(${cmsPosts.tags})`);
  if (!clauses.length) return undefined;
  return and(...clauses);
}

/** Reads posts, newest first by default. Returns [] when the database is down. */
export async function listPosts(query: PostQuery = {}): Promise<PostWithMeta[]> {
  if (!isDatabaseConfigured()) return [];
  // A scheduled post goes live the first time the public asks for the blog.
  if (query.onlyLive) await promoteScheduledPostsThrottled();
  const publicDate = sql`coalesce(${cmsPosts.publishedAt}, ${cmsPosts.scheduledFor})`;
  const order =
    query.order === "oldest"
      ? asc(publicDate)
      : query.order === "updated"
        ? desc(cmsPosts.updatedAt)
        : desc(publicDate);

  try {
    const rows = await db
      .select({
        post: cmsPosts,
        authorName: sql<string>`coalesce(${cmsPosts.title}, 'Unknown')`,
      })
      .from(cmsPosts)
      .where(buildWhere(query))
      .orderBy(order)
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);
    return rows.map((row) => decorate(row.post));
  } catch (error) {
    logOnce("cms", "post list failed", error);
    return [];
  }
}

/** Counts posts matching a query (used for pagination). */
export async function countPosts(query: PostQuery = {}): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  try {
    const rows = await db.select({ id: cmsPosts.id }).from(cmsPosts).where(buildWhere(query));
    return rows.length;
  } catch (error) {
    logOnce("cms", "post count failed", error);
    return 0;
  }
}

function decorate(post: CmsPost): PostWithMeta {
  const rendered = renderMarkdown(post.contentMd);
  return {
    ...post,
    authorName: "",
    authorEmail: "",
    readingMinutes: rendered.readingMinutes,
    wordCount: rendered.wordCount,
  };
}

/** Reads a single post by slug. Only live posts are returned to the public. */
export async function getPostBySlug(slug: string, options: { includeUnpublished?: boolean } = {}): Promise<PostWithMeta | null> {
  if (!isDatabaseConfigured()) return null;
  if (!options.includeUnpublished) await promoteScheduledPostsThrottled();
  try {
    const rows = await db.select().from(cmsPosts).where(eq(cmsPosts.slug, slug)).limit(1);
    const post = rows[0];
    if (!post) return null;
    if (!options.includeUnpublished && !isPostLive(post)) return null;
    return decorate(post);
  } catch (error) {
    logOnce("cms", "post lookup failed", error);
    return null;
  }
}

export async function getPostById(id: number): Promise<CmsPost | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await db.select().from(cmsPosts).where(eq(cmsPosts.id, id)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    logOnce("cms", "post id lookup failed", error);
    return null;
  }
}

/** True when the slug is already taken (optionally by a different post). */
export async function slugExists(slug: string, exceptId?: number): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const rows = await db.select({ id: cmsPosts.id }).from(cmsPosts).where(eq(cmsPosts.slug, slug)).limit(1);
    if (!rows.length) return false;
    return exceptId === undefined ? true : rows[0].id !== exceptId;
  } catch {
    return false;
  }
}

/** Finds an unused slug by appending -2, -3, … */
export async function uniqueSlug(base: string, exceptId?: number): Promise<string> {
  const root = slugify(base) || "post";
  let candidate = root;
  let n = 2;
  while (await slugExists(candidate, exceptId)) {
    candidate = `${root}-${n}`;
    n += 1;
    if (n > 200) {
      candidate = `${root}-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}

/** Every tag in use, with a post count. */
export async function listTags(): Promise<{ tag: string; count: number }[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await db
      .select({ tag: sql<string>`unnest(${cmsPosts.tags})`, count: sql<number>`count(*)` })
      .from(cmsPosts)
      .where(liveClause())
      .groupBy(sql`unnest(${cmsPosts.tags})`)
      .orderBy(desc(sql`count(*)`));
    return rows.map((row) => ({ tag: row.tag, count: Number(row.count) }));
  } catch (error) {
    logOnce("cms", "tag list failed", error);
    return [];
  }
}

/** Every category in use, with a post count. */
export async function listCategories(): Promise<{ category: string; count: number }[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await db
      .select({ category: cmsPosts.category, count: sql<number>`count(*)` })
      .from(cmsPosts)
      .where(and(liveClause(), sql`${cmsPosts.category} is not null`))
      .groupBy(cmsPosts.category)
      .orderBy(desc(sql`count(*)`));
    return rows.map((row) => ({ category: row.category ?? "", count: Number(row.count) }));
  } catch (error) {
    logOnce("cms", "category list failed", error);
    return [];
  }
}

/** Posts that share tags or a category with the given post. */
export async function relatedPosts(post: CmsPost, limit = 3): Promise<PostWithMeta[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await db
      .select()
      .from(cmsPosts)
      .where(and(eq(cmsPosts.status, "published"), sql`${cmsPosts.id} <> ${post.id}`))
      .orderBy(desc(cmsPosts.publishedAt))
      .limit(30);
    return rows
      .map((row) => ({ row, score: sharedScore(post, row) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.row.publishedAt!.getTime() - a.row.publishedAt!.getTime())
      .slice(0, limit)
      .map((entry) => decorate(entry.row));
  } catch (error) {
    logOnce("cms", "related posts failed", error);
    return [];
  }
}

function sharedScore(a: CmsPost, b: CmsPost): number {
  const tagsA = new Set(a.tags ?? []);
  const shared = (b.tags ?? []).filter((tag) => tagsA.has(tag)).length;
  let score = shared * 2;
  if (a.category && b.category && a.category === b.category) score += 3;
  return score;
}

/** Approved comments for a post, oldest first. */
export async function listComments(postId: number, status?: "pending" | "approved" | "spam") {
  if (!isDatabaseConfigured()) return [];
  try {
    const clauses = [eq(cmsComments.postId, postId)];
    if (status) clauses.push(eq(cmsComments.status, status));
    return await db.select().from(cmsComments).where(and(...clauses)).orderBy(asc(cmsComments.createdAt));
  } catch (error) {
    logOnce("cms", "comment list failed", error);
    return [];
  }
}

/** All comments with the post title attached — the moderation queue. */
export async function listAllComments(status?: "pending" | "approved" | "spam") {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await db
      .select({ comment: cmsComments, postTitle: cmsPosts.title, postSlug: cmsPosts.slug })
      .from(cmsComments)
      .innerJoin(cmsPosts, eq(cmsComments.postId, cmsPosts.id))
      .where(status ? eq(cmsComments.status, status) : undefined)
      .orderBy(desc(cmsComments.createdAt))
      .limit(200);
    return rows;
  } catch (error) {
    logOnce("cms", "comment moderation list failed", error);
    return [];
  }
}

/** Snapshot of the current post body — written before every destructive change. */
export async function createRevision(postId: number, title: string, contentMd: string, reason: string, userId: number | null): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await db.insert(cmsRevisions).values({ postId, title, contentMd, reason, createdById: userId });
    // Keep only the 20 most recent revisions per post.
    await db.execute(sql`
      delete from ${cmsRevisions}
      where ${cmsRevisions.postId} = ${postId}
        and ${cmsRevisions.id} not in (
          select id from ${cmsRevisions} where ${cmsRevisions.postId} = ${postId} order by id desc limit 20
        )
    `);
  } catch (error) {
    logOnce("cms", "revision write failed", error);
  }
}

export async function listRevisions(postId: number) {
  if (!isDatabaseConfigured()) return [];
  try {
    return await db.select().from(cmsRevisions).where(eq(cmsRevisions.postId, postId)).orderBy(desc(cmsRevisions.createdAt)).limit(20);
  } catch (error) {
    logOnce("cms", "revision list failed", error);
    return [];
  }
}

export async function getRevision(id: number) {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await db.select().from(cmsRevisions).where(eq(cmsRevisions.id, id)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/** Derives an excerpt from the body when the author did not write one. */
export function deriveExcerpt(contentMd: string, fallback = ""): string {
  return fallback || markdownExcerpt(contentMd, 200);
}
