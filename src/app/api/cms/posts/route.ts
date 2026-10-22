import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsPosts, cmsUsers } from "@/db/schema";
import { logOnce } from "@/lib/log";
import { apiKeyConfigured, apiKeyFromRequest, isValidApiKey } from "@/lib/cms/api-auth";
import { listPosts, uniqueSlug } from "@/lib/cms/posts";
import { renderMarkdown, slugify } from "@/lib/cms/markdown";
import { analyzePost } from "@/lib/cms/seo";
import { recordActivity } from "@/lib/cms/activity";
import { validatePostInput } from "@/lib/cms/validation";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 512 * 1024;

/**
 * GET  /api/cms/posts — list posts.
 * POST /api/cms/posts — create a post.
 *
 * Both need the bearer API key. The POST body mirrors the editor form, so a
 * script and a human publish the same validated content, and the same blocking
 * SEO checks run before anything goes live.
 */
function guard(request: Request): NextResponse | null {
  const headers = { "Cache-Control": "no-store" };
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "The database is not configured." }, { status: 503, headers });
  }
  if (!apiKeyConfigured()) {
    return NextResponse.json({ ok: false, error: "CMS_API_KEY is not configured on this deployment." }, { status: 503, headers });
  }
  if (!isValidApiKey(apiKeyFromRequest(request))) {
    return NextResponse.json({ ok: false, error: "A valid bearer API key is required." }, { status: 401, headers });
  }
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
  const offset = Math.max(0, Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const statusParam = url.searchParams.get("status");

  const posts = await listPosts({
    ...(statusParam && ["draft", "published", "scheduled", "archived"].includes(statusParam)
      ? { status: statusParam as "draft" | "published" | "scheduled" | "archived" }
      : {}),
    limit,
    offset,
    order: "updated",
  });

  return NextResponse.json(
    {
      ok: true,
      count: posts.length,
      posts: posts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        status: post.status,
        category: post.category,
        tags: post.tags,
        focusKeyword: post.focusKeyword,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords,
        canonicalUrl: post.canonicalUrl,
        noindex: post.noindex,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        updatedAt: post.updatedAt.toISOString(),
        wordCount: post.wordCount,
        readingMinutes: post.readingMinutes,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: "That post is too large." }, { status: 413, headers: { "Cache-Control": "no-store" } });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "Send a JSON body." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const form = new FormData();
  const set = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) form.set(key, value.map((entry) => String(entry)).join(", "));
    else if (typeof value === "boolean") form.set(key, value ? "on" : "");
    else form.set(key, String(value));
  };

  set("title", payload.title);
  set("subtitle", payload.subtitle);
  set("slug", payload.slug);
  set("excerpt", payload.excerpt);
  set("contentMd", payload.contentMd ?? payload.content);
  set("status", payload.status ?? "draft");
  set("category", payload.category);
  set("tags", payload.tags);
  set("focusKeyword", payload.focusKeyword);
  set("seoTitle", payload.seoTitle);
  set("seoDescription", payload.seoDescription);
  set("seoKeywords", payload.seoKeywords);
  set("ogImageUrl", payload.ogImageUrl);
  set("ogImageAlt", payload.ogImageAlt);
  set("canonicalUrl", payload.canonicalUrl);
  set("template", payload.template ?? "article");
  if (payload.noindex) form.set("noindex", "on");
  if (payload.allowIndex !== false) form.set("allowIndex", "on");

  const parsed = validatePostInput(form);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: "The post did not pass validation.", fieldErrors: parsed.errors }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const input = parsed.data;

  if (input.status === "published") {
    const report = analyzePost({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      contentMd: input.contentMd,
      focusKeyword: input.focusKeyword,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
      ogImageUrl: input.ogImageUrl,
      ogImageAlt: input.ogImageAlt,
      canonicalUrl: input.canonicalUrl,
      noindex: input.noindex,
    });
    if (report.blocking.length) {
      return NextResponse.json(
        { ok: false, error: "Fix the blocking SEO issues before publishing.", blocking: report.blocking.map((check) => ({ id: check.id, label: check.label, detail: check.detail })) },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  try {
    const slug = input.slug ? await uniqueSlug(input.slug) : await uniqueSlug(slugify(input.title));
    const rendered = renderMarkdown(input.contentMd);
    const now = new Date();

    const authors = await db.select({ id: cmsUsers.id }).from(cmsUsers).where(eq(cmsUsers.isActive, true)).orderBy(cmsUsers.id).limit(1);
    const authorId = authors[0]?.id;
    if (!authorId) {
      return NextResponse.json({ ok: false, error: "No active CMS account exists yet. Create one in /cms/users first." }, { status: 409, headers: { "Cache-Control": "no-store" } });
    }

    const rows = await db
      .insert(cmsPosts)
      .values({
        slug,
        title: input.title,
        subtitle: input.subtitle,
        excerpt: input.excerpt || rendered.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
        contentMd: input.contentMd,
        contentHtml: rendered.html,
        status: input.status,
        // An API-created post is attributed to the first active account.
        authorId,
        category: input.category,
        tags: input.tags,
        focusKeyword: input.focusKeyword,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoKeywords: input.seoKeywords,
        ogImageUrl: input.ogImageUrl,
        ogImageAlt: input.ogImageAlt,
        canonicalUrl: input.canonicalUrl,
        noindex: input.noindex,
        allowIndex: input.allowIndex,
        template: input.template,
        publishedAt: input.status === "published" ? now : null,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      })
      .returning({ id: cmsPosts.id, slug: cmsPosts.slug });

    await recordActivity({ userId: null, action: "post.created", entity: "post", entityId: rows[0].id, summary: `Created “${input.title}” through the API.` });

    // Route Handlers cannot use updateTag (it is Server-Action only), so the
    // tagged caches are revalidated with the "max" profile instead.
    revalidateTag("cms-posts", "max");
    revalidateTag(`cms-post:${rows[0].slug}`, "max");
    revalidatePath("/blog");
    revalidatePath(`/blog/${rows[0].slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ ok: true, id: rows[0].id, slug: rows[0].slug, status: input.status }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logOnce("cms", "api post create failed", error);
    return NextResponse.json({ ok: false, error: "The post could not be created." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
