import type { Metadata } from "next";
import { SITE_URL } from "./editorial";

/**
 * Central metadata builder.
 *
 * Every indexable page goes through `pageMetadata` so the SEO surface stays
 * consistent: canonical URL, Open Graph, Twitter card, robots directives and
 * the optional keywords / focus-keyword block. Route-specific social images
 * are passed through `image` so a page can override the site-wide default.
 */

export type SocialImage = { url: string; width?: number; height?: number; alt: string };

export type PageMetadataOptions = {
  /** Focus keyword for the page. It should appear in the title, H1 and description. */
  focus?: string;
  /** Full keyword set for the page. Keep it honest — no stuffing, no invented volumes. */
  keywords?: string[];
  /** Route-specific social image. Defaults to the site-wide card. */
  image?: SocialImage;
  /** Open Graph type. Guides and articles use "article". */
  type?: "website" | "article";
  /** ISO date for article-style pages. */
  publishedTime?: string;
  modifiedTime?: string;
  /** Extra robots directives merged with the defaults. */
  robots?: Record<string, unknown>;
  /** Schema.org category for the page. */
  category?: string;
};

const DEFAULT_IMAGE: SocialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "YTCPM: YouTube earnings, CPM and RPM planning tools",
};

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  options: PageMetadataOptions = {},
): Metadata {
  const image = options.image ?? DEFAULT_IMAGE;
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    ...(options.keywords?.length ? { keywords: options.keywords } : {}),
    ...(options.category ? { category: options.category } : {}),
    alternates: { canonical: path },
    openGraph: {
      type: options.type ?? "website",
      title,
      description,
      url,
      siteName: "ytcpm.online",
      locale: "en_US",
      images: [{ url: image.url, width: image.width ?? 1200, height: image.height ?? 630, alt: image.alt }],
      ...(options.publishedTime ? { publishedTime: options.publishedTime } : {}),
      ...(options.modifiedTime ? { modifiedTime: options.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
      ...(options.robots ?? {}),
    },
  };
}

/** Escape script delimiters even if a future source comes from an external CMS. */
export function serializeJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }

export function breadcrumbs(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: SITE_URL + item.path })) };
}

export type WebPageSchemaOptions = {
  path: string;
  name: string;
  description: string;
  /** Route-specific social image used as primaryImageOfPage. */
  image?: string;
  /** ISO date for dateModified. */
  dateModified?: string;
  datePublished?: string;
  /** Schema.org things the page is about. */
  about?: string[];
  /** Section of the site, e.g. "Creator tools". */
  section?: string;
  /** Extra nodes merged into the graph, e.g. an FAQPage or SoftwareApplication. */
  extra?: Record<string, unknown>[];
};

/**
 * A WebPage node for the page's own JSON-LD graph.
 *
 * Every indexable page should ship one so search engines can tie the visible
 * copy, the canonical URL and the social image to a single entity.
 */
export function webPageSchema(options: WebPageSchemaOptions) {
  const url = `${SITE_URL}${options.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: options.name,
    description: options.description,
    inLanguage: "en",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(options.image ? { primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}${options.image}`, width: 1200, height: 630 } } : {}),
    ...(options.dateModified ? { dateModified: options.dateModified } : {}),
    ...(options.datePublished ? { datePublished: options.datePublished } : {}),
    ...(options.section ? { articleSection: options.section } : {}),
    ...(options.about?.length ? { about: options.about.map(name => ({ "@type": "Thing", name })) } : {}),
    ...(options.extra?.length ? { ...Object.assign({}, ...options.extra) } : {}),
  };
}
