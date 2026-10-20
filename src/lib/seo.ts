import type { Metadata } from "next";
import { SITE_URL } from "./editorial";
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path }, openGraph: { type: "website", title, description, url: `${SITE_URL}${path}`, siteName: "YTCPM", images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "YTCPM: YouTube earnings, CPM and RPM planning tools" }] }, twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] } };
}
/** Escape script delimiters even if a future source comes from an external CMS. */
export function serializeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
export function breadcrumbs(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: SITE_URL + item.path })) };
}
