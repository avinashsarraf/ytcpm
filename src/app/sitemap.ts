import type { MetadataRoute } from "next";
import { CREATOR_TOOLS, CREATOR_TOOLS_UPDATED } from "@/lib/creator-tools";
import { LEGAL_POLICIES, LEGAL_UPDATED } from "@/lib/legal";
import { CONTENT_UPDATED, GUIDES } from "@/lib/editorial";
import { COUNTRIES, NICHES, DATA_UPDATED_AT } from "@/lib/data";
import { listPosts, listTags } from "@/lib/cms/posts";

const BASE = "https://ytcpm.online";

export const dynamic = "force-dynamic";

/**
 * The sitemap.
 *
 * The static pages are fixed, but the blog is database-driven — so the CMS
 * posts and their tag archives are added here as well. Without a database the
 * blog section simply lists the archive page, and the rest of the sitemap is
 * unchanged.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date(`${DATA_UPDATED_AT}T00:00:00Z`);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/cpm-by-country`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/cpm-by-niche`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/channel-auditor`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const countryRoutes: MetadataRoute.Sitemap = COUNTRIES.map((c) => ({
    url: `${BASE}/cpm-by-country/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: c.tier <= 2 ? 0.8 : 0.7,
  }));

  const nicheRoutes: MetadataRoute.Sitemap = NICHES.map((n) => ({
    url: `${BASE}/cpm-by-niche/${n.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: n.tier === "S" || n.tier === "A" ? 0.8 : 0.7,
  }));

  const editorialRoutes: MetadataRoute.Sitemap = ["/youtube-cpm-calculator", "/youtube-rpm-calculator", "/guides", "/sources", "/contact", ...GUIDES.map(g => `/guides/${g.slug}`)].map(path => ({ url: BASE + path, lastModified: new Date(`${CONTENT_UPDATED}T00:00:00Z`) }));
  const legalRoutes: MetadataRoute.Sitemap = ["/legal", ...LEGAL_POLICIES.map(p => p.path)].map(path => ({ url: BASE + path, lastModified: new Date(`${LEGAL_UPDATED}T00:00:00Z`), changeFrequency: "yearly", priority: 0.3 }));
  const toolRoutes: MetadataRoute.Sitemap = ["/tools", ...CREATOR_TOOLS.map(t => "/" + t.slug)].map(path => ({ url: BASE + path, lastModified: new Date(`${CREATOR_TOOLS_UPDATED}T00:00:00Z`) }));

  // ── Blog ──────────────────────────────────────────────────────────────
  const blogRoutes: MetadataRoute.Sitemap = [{ url: `${BASE}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.8 }];

  const [posts, tags] = await Promise.all([
    listPosts({ status: "published", limit: 500, order: "updated" }),
    listTags(),
  ]);

  for (const post of posts) {
    if (post.noindex || !post.allowIndex) continue;
    blogRoutes.push({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const tag of tags) {
    blogRoutes.push({
      url: `${BASE}/blog/tag/${tag.tag}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return [...toolRoutes, ...legalRoutes, ...staticRoutes, ...countryRoutes, ...nicheRoutes, ...editorialRoutes, ...blogRoutes];
}
