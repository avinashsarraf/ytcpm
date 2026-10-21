import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The CMS is a private area and the API is for the site's own
        // front-end, so neither belongs in a search index.
        disallow: ["/api/", "/cms/"],
      },
    ],
    sitemap: ["https://ytcpm.online/sitemap.xml", "https://ytcpm.online/image-sitemap.xml"],
  };
}
