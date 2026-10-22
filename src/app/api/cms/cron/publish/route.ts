import { revalidatePath, revalidateTag } from "next/cache";
import { isValidApiKey, apiKeyFromRequest, apiKeyConfigured } from "@/lib/cms/api-auth";
import { promoteScheduledPosts } from "@/lib/cms/posts";
import { isDatabaseConfigured } from "@/db";
import { logOnce } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * POST /api/cms/cron/publish
 *
 * Publishes every scheduled post whose date has passed, and refreshes the
 * blog caches. Call it from cron, a platform scheduler or a deploy hook:
 *
 *   curl -X POST https://ytcpm.online/api/cms/cron/publish \
 *        -H "Authorization: Bearer $CMS_API_KEY"
 *
 * It is idempotent and safe to run as often as you like. Scheduling also
 * happens lazily on the first public read after the date passes, so the blog
 * stays correct even if this is never called — the endpoint exists to make the
 * promotion immediate and to keep the cache warm.
 */
export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };

  if (!apiKeyConfigured()) {
    return Response.json({ ok: false, error: "The CMS API is not configured." }, { status: 503, headers: noStore });
  }
  if (!isValidApiKey(apiKeyFromRequest(request))) {
    return Response.json({ ok: false, error: "A valid API key is required." }, { status: 401, headers: noStore });
  }
  if (!isDatabaseConfigured()) {
    return Response.json({ ok: false, error: "The database is not configured." }, { status: 503, headers: noStore });
  }

  try {
    const published = await promoteScheduledPosts();

    if (published.length) {
      revalidateTag("cms-posts", "max");
      revalidatePath("/blog");
      revalidatePath("/sitemap.xml");
      revalidatePath("/blog/rss.xml");
      revalidatePath("/image-sitemap.xml");
      for (const post of published) {
        revalidateTag(`cms-post:${post.slug}`, "max");
        revalidatePath(`/blog/${post.slug}`);
      }
    }

    return Response.json(
      { ok: true, published: published.map((post) => post.slug), checkedAt: new Date().toISOString() },
      { headers: noStore },
    );
  } catch (error) {
    logOnce("cms", "cron publish failed", error);
    return Response.json({ ok: false, error: "The scheduled posts could not be published." }, { status: 500, headers: noStore });
  }
}

/** A GET is a health probe; it publishes nothing. */
export async function GET() {
  return Response.json(
    { ok: true, endpoint: "POST /api/cms/cron/publish", requires: "Authorization: Bearer <CMS_API_KEY>" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
