import { NextResponse } from "next/server";
import { listPosts } from "@/lib/cms/posts";
import { getSettings } from "@/lib/cms/settings";
import { SITE_URL } from "@/lib/editorial";
import { logOnce } from "@/lib/log";

export const dynamic = "force-dynamic";

/**
 * The blog RSS feed.
 *
 * Feed readers do not run JavaScript, so the feed is rendered here as plain
 * XML rather than pointing at the HTML page.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absolute(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function GET() {
  try {
    const [posts, settings] = await Promise.all([
      listPosts({ onlyLive: true, limit: 30, order: "newest" }),
      getSettings(),
    ]);

    const items = posts
      .map((post) => {
        const link = absolute(`/blog/${post.slug}`);
        const description = escapeXml(post.excerpt || post.subtitle || "");
        const categories = (post.tags ?? []).map((tag) => `<category>${escapeXml(tag)}</category>`).join("");
        return [
          "<item>",
          `<title>${escapeXml(post.title)}</title>`,
          `<link>${escapeXml(link)}</link>`,
          `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
          `<pubDate>${(post.publishedAt ?? post.createdAt).toUTCString()}</pubDate>`,
          `<description>${description}</description>`,
          categories,
          "</item>",
        ].join("");
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings["blog.title"])}</title>
    <link>${escapeXml(`${SITE_URL}/blog`)}</link>
    <description>${escapeXml(settings["blog.description"])}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    logOnce("cms", "rss feed failed", error);
    return new NextResponse("Feed unavailable", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
