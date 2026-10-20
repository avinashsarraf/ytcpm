import type { MetadataRoute } from "next";
import { COUNTRIES, NICHES, DATA_UPDATED_AT } from "@/lib/data";

const BASE = "https://ytcpm.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date(`${DATA_UPDATED_AT}T00:00:00Z`);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/cpm-by-country`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/cpm-by-niche`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
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

  return [...staticRoutes, ...countryRoutes, ...nicheRoutes];
}
