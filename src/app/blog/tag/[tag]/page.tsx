import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import ProsePage from "@/components/prose-page";
import { breadcrumbs, pageMetadata, serializeJsonLd, webPageSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/editorial";
import { countPosts, listPosts, listTags } from "@/lib/cms/posts";
import { pageCount, tagPageHref } from "@/lib/cms/pagination";
import { blogTagPageSeo } from "@/lib/cms/seo-registry";

export const dynamic = "force-dynamic";

const PER_PAGE = 9;

type Params = { params: Promise<{ tag: string }> };

function titleCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function loadTag(rawTag: string) {
  const tag = decodeURIComponent(rawTag).trim().toLowerCase();
  if (!tag || tag.length > 60) return null;
  const tags = await listTags();
  const match = tags.find((entry) => entry.tag === tag);
  if (!match) return null;
  return { tag, count: match.count };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tag: rawTag } = await params;
  const match = await loadTag(rawTag);
  if (!match) return { title: "Tag not found", robots: { index: false, follow: false } };

  const seo = blogTagPageSeo(match.tag);
  const label = titleCase(match.tag);
  return pageMetadata(
    `YouTube ${label} Articles — CPM & RPM Guides | ytcpm.online`,
    `${seo.shortDescription} ${match.count} post${match.count === 1 ? "" : "s"} covering ${label}, with worked examples and stated sources.`,
    `/blog/tag/${match.tag}`,
    { focus: seo.focus, keywords: seo.keywords, category: "finance" },
  );
}

function formatDate(value: Date | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(value);
}

export default async function BlogTagPage({ params, searchParams }: Params & { searchParams: Promise<{ page?: string }> }) {
  const [{ tag: rawTag }, query] = await Promise.all([params, searchParams]);
  const match = await loadTag(rawTag);
  if (!match) notFound();

  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const [posts, total, tags] = await Promise.all([
    listPosts({ onlyLive: true, tag: match.tag, limit: PER_PAGE, offset: (page - 1) * PER_PAGE }),
    countPosts({ onlyLive: true, tag: match.tag }),
    listTags(),
  ]);

  const label = titleCase(match.tag);
  const pages = pageCount(total, PER_PAGE);
  const seo = blogTagPageSeo(match.tag);

  return <ProsePage wide eyebrow="YTCPM blog" title={`YouTube ${label} articles`} lede={seo.shortDescription}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([
      webPageSchema({ path: `/blog/tag/${match.tag}`, name: `YouTube ${label} articles`, description: seo.shortDescription, section: "Blog", about: seo.keywords }),
      breadcrumbs([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: label, path: `/blog/tag/${match.tag}` }]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/blog/tag/${match.tag}#collection`,
        name: `YouTube ${label} articles`,
        description: seo.shortDescription,
        url: `${SITE_URL}/blog/tag/${match.tag}`,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/blog#blog` },
        hasPart: posts.map((post) => ({ "@type": "BlogPosting", headline: post.title, url: `${SITE_URL}/blog/${post.slug}` })),
      },
    ]) }} />

    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-fog"><Link href="/" className="py-2 underline">Home</Link><span aria-hidden="true">/</span><Link href="/blog" className="py-2 underline">Blog</Link><span aria-hidden="true">/</span><span aria-current="page" className="font-semibold text-heading">{label}</span></nav>

    {posts.length === 0 ? (
      <div className="rounded-2xl border border-border bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-heading">Nothing tagged “{label}” yet</h2>
        <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-7 text-fog">
          <Link href="/blog" className="font-semibold text-yt-red underline underline-offset-4">Read every article</Link> instead — the guides library covers the same ground.
        </p>
      </div>
    ) : (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article key={post.id} className="card flex flex-col p-5">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-fog">
              {post.category ? <span className="text-yt-red">{post.category}</span> : null}
              <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
              <span className="inline-flex items-center gap-1"><Clock3 aria-hidden className="h-3.5 w-3.5" />{post.readingMinutes} min</span>
            </div>
            <h2 className="mt-3 text-xl font-bold leading-snug text-heading">
              <Link href={`/blog/${post.slug}`} className="hover:text-yt-red">{post.title}</Link>
            </h2>
            <p className="mt-3 line-clamp-3 text-sm leading-7 text-fog">{post.excerpt || post.subtitle || ""}</p>
            <Link href={`/blog/${post.slug}`} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-semibold text-yt-red underline underline-offset-4">Read the post<ArrowRight aria-hidden className="h-3.5 w-3.5" /></Link>
          </article>
        ))}
      </div>
    )}

    {pages > 1 ? (
      <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
        {page > 1 ? (
          <Link href={tagPageHref(match.tag, page - 1)} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-heading hover:border-yt-red/40">← Newer posts</Link>
        ) : <span />}
        <span className="text-sm text-fog">Page {page} of {pages}</span>
        {page < pages ? (
          <Link href={tagPageHref(match.tag, page + 1)} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-heading hover:border-yt-red/40">Older posts →</Link>
        ) : <span />}
      </nav>
    ) : null}

    {tags.length ? (
      <section className="mt-12 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-bold text-heading">Other tags</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {tags.filter((entry) => entry.tag !== match.tag).slice(0, 20).map((entry) => (
            <li key={entry.tag}>
              <Link href={`/blog/tag/${entry.tag}`} className="inline-flex min-h-9 items-center rounded-full border border-border bg-white px-3.5 text-sm font-medium text-heading hover:border-yt-red/40">
                {entry.tag} <span className="ml-1.5 text-xs text-fog">{entry.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    ) : null}
  </ProsePage>;
}
