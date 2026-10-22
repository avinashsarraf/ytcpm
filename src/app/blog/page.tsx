import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Rss, Tag } from "lucide-react";
import ProsePage from "@/components/prose-page";
import { breadcrumbs, pageMetadata, serializeJsonLd, webPageSchema } from "@/lib/seo";
import { listPosts, listTags, listCategories, countPosts } from "@/lib/cms/posts";
import { blogPageHref, pageCount } from "@/lib/cms/pagination";
import { getSettings } from "@/lib/cms/settings";
import { SITE_URL } from "@/lib/editorial";
import { blogPageSeo } from "@/lib/cms/seo-registry";

export const dynamic = "force-dynamic";

const PER_PAGE = 9;


/**
 * The blog index title has to survive the " | ytcpm.online" suffix and still
 * carry the focus keyword, so it is trimmed to the SERP budget here rather
 * than trusted from the settings table.
 */
function fitTitle(value: string, max = 43): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).replace(/[\s,–—-]+$/, "")}`;
}

/**
 * Every page of the index declares itself as the canonical page.
 *
 * A blog that canonicalises pages 2, 3 and 4 back to page 1 tells a search
 * engine that the older articles live somewhere they do not — and those are
 * exactly the posts that need the help. A `?tag=` URL canonicalises to the
 * path-based archive instead, because that is the form the site links to and
 * the one that appears in the sitemap.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; category?: string }>;
}): Promise<Metadata> {
  const [settings, params] = await Promise.all([getSettings(), searchParams]);
  const seo = blogPageSeo;

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const tag = params.tag?.trim().toLowerCase() || null;
  const category = params.category?.trim() || null;
  const canonical = tag ? `/blog/tag/${encodeURIComponent(tag)}` : blogPageHref({ category }, page);

  const baseTitle = fitTitle(settings["blog.title"] || "YouTube CPM & RPM Blog");
  const title = page > 1 ? fitTitle(`${baseTitle} — Page ${page}`) : baseTitle;
  const description =
    page > 1
      ? fitTitle(`Page ${page} of the ${settings["blog.title"] || "YouTube CPM & RPM blog"}: ${settings["blog.description"]}`, 158)
      : fitTitle(settings["blog.description"], 158);

  return pageMetadata(title, description, canonical, {
    focus: seo.focus,
    keywords: seo.keywords,
    category: "finance",
    // A filtered view is a slice of the archive, not a page that should
    // compete with it for the same query.
    robots: tag || category ? { index: false, follow: true } : undefined,
  });
}

function formatDate(value: Date | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(value);
}

export default async function BlogIndexPage({ searchParams }: { searchParams: Promise<{ page?: string; tag?: string; category?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const tag = params.tag?.trim().toLowerCase() || null;
  const category = params.category?.trim() || null;

  const [settings, tags, categories, total] = await Promise.all([
    getSettings(),
    listTags(),
    listCategories(),
    countPosts({ onlyLive: true, tag: tag ?? undefined, category: category ?? undefined }),
  ]);

  const posts = await listPosts({
    onlyLive: true,
    tag: tag ?? undefined,
    category: category ?? undefined,
    limit: PER_PAGE,
    offset: (page - 1) * PER_PAGE,
  });

  const pages = pageCount(total, PER_PAGE);
  const hasFilter = Boolean(tag || category);

  return <ProsePage wide eyebrow="YTCPM blog" title={settings["blog.title"]} lede={settings["blog.description"]}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([
      webPageSchema({ path: "/blog", name: settings["blog.title"], description: settings["blog.description"], section: "Blog", about: ["YouTube CPM guides", "YouTube RPM guides", "YouTube earnings guides"] }),
      breadcrumbs([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]),
      {
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": `${SITE_URL}/blog#blog`,
        name: settings["blog.title"],
        description: settings["blog.description"],
        url: `${SITE_URL}/blog`,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": `${SITE_URL}/#organization` },
        blogPost: posts.map((post) => ({ "@type": "BlogPosting", headline: post.title, url: `${SITE_URL}/blog/${post.slug}` })),
      },
    ]) }} />

    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-fog"><Link href="/" className="py-2 underline">Home</Link><span aria-hidden="true">/</span><span aria-current="page" className="font-semibold text-heading">Blog</span></nav>

    {hasFilter ? (
      <p className="mb-6 rounded-xl border border-border bg-surface p-4 text-sm text-fog">
        Filtering by <strong className="text-heading">{tag ? `tag “${tag}”` : `category “${category}”`}</strong>.{" "}
        <Link href="/blog" className="font-semibold text-yt-red underline underline-offset-4">Show every post</Link>
      </p>
    ) : null}

    {/* The standing introduction — it explains what the blog is for, and it is
        also what a reader lands on before the first article is published. */}
    <section className="mb-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
      <h2 className="text-xl font-bold text-heading">What this blog covers</h2>
      <div className="mt-3 space-y-4 text-[15px] leading-7 text-fog">
        <p>
          Every article on this page is written for one job: to explain a single YouTube earnings question
          clearly enough that you can act on it. That usually means taking one number — a CPM, an RPM, a watch-time
          figure, a retention curve — and showing what it actually implies for a channel of your size and audience.
          There is no filler, no listicles and no invented statistics.
        </p>
        <p>
          The same rule applies to the numbers. Every rate shown here is a labelled model scenario built on the
          assumptions published on the <Link href="/methodology" className="font-semibold text-yt-red underline underline-offset-4">methodology page</Link>,
          and every claim is traceable to a source listed on the <Link href="/sources" className="font-semibold text-yt-red underline underline-offset-4">sources page</Link>.
          When a figure is an estimate, the article says so. When real YouTube Studio data is the better answer, the
          article tells you to open Studio and read it there instead of trusting a model.
        </p>
        <p>
          If you would rather run the numbers yourself than read about them, the <Link href="/youtube-cpm-calculator" className="font-semibold text-yt-red underline underline-offset-4">CPM calculator</Link>,
          the <Link href="/youtube-rpm-calculator" className="font-semibold text-yt-red underline underline-offset-4">RPM calculator</Link> and the
          {" "}<Link href="/youtube-views-to-money-calculator" className="font-semibold text-yt-red underline underline-offset-4">views-to-money calculator</Link> are free,
          need no signup, and run entirely in your browser. The <Link href="/channel-auditor" className="font-semibold text-yt-red underline underline-offset-4">channel auditor</Link> scans a public
          channel and shows where the money and the drop-off actually sit.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
        <Link href="/guides" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-heading hover:border-yt-red/40">
          Guides library<ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
        <Link href="/methodology" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-heading hover:border-yt-red/40">
          How the numbers are built
        </Link>
        <Link href="/blog/rss.xml" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-heading hover:border-yt-red/40">
          <Rss aria-hidden className="h-3.5 w-3.5" />RSS feed
        </Link>
      </div>
    </section>

    {/* Three kinds of article, so a reader knows which one to open first. */}
    <section className="mb-10 grid gap-4 md:grid-cols-3">
      {[
        {
          title: "Metric explainers",
          body: "What a number actually means, where it comes from, and why two numbers that sound similar are not the same thing.",
          href: "/blog",
        },
        {
          title: "Worked examples",
          body: "Real report screenshots turned into arithmetic — the CPM, the RPM, the share, and what the difference means for a month of views.",
          href: "/youtube-cpm-calculator",
        },
        {
          title: "Decision guides",
          body: "What to change next: format mix, audience country, watch time or upload rhythm, with the trade-off spelled out.",
          href: "/guides",
        },
      ].map((card) => (
        <article key={card.title} className="card p-5">
          <h3 className="text-base font-bold text-heading">{card.title}</h3>
          <p className="mt-2 text-sm leading-7 text-fog">{card.body}</p>
          <Link href={card.href} className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-yt-red underline underline-offset-4">
            Open it<ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </article>
      ))}
    </section>

    {posts.length === 0 ? (
      <div className="rounded-2xl border border-border bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-heading">No posts here yet</h2>
        <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-7 text-fog">Published articles appear here as soon as they are written. Until then, the <Link href="/guides" className="font-semibold text-yt-red underline underline-offset-4">guides library</Link> covers the same ground with worked examples.</p>
      </div>
    ) : (
      <>
        <h2 className="mb-4 text-lg font-bold text-heading">Latest articles</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="card flex flex-col p-5">
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-fog">
                {post.category ? <span className="text-yt-red">{post.category}</span> : null}
                <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
                <span className="inline-flex items-center gap-1"><Clock3 aria-hidden className="h-3.5 w-3.5" />{post.readingMinutes} min</span>
              </div>
              <h3 className="mt-3 text-xl font-bold leading-snug text-heading">
                <Link href={`/blog/${post.slug}`} className="hover:text-yt-red">{post.title}</Link>
              </h3>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-fog">{post.excerpt || post.subtitle || ""}</p>
              {post.tags.length ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {post.tags.map((postTag) => (
                    <li key={postTag}><Link href={`/blog/tag/${encodeURIComponent(postTag)}`} className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-[11px] font-medium text-fog hover:border-yt-red/40 hover:text-heading"><Tag aria-hidden className="h-3 w-3" />{postTag}</Link></li>
                  ))}
                </ul>
              ) : null}
              <Link href={`/blog/${post.slug}`} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 text-sm font-semibold text-yt-red underline underline-offset-4">Read the post<ArrowRight aria-hidden className="h-3.5 w-3.5" /></Link>
            </article>
          ))}
        </div>
      </>
    )}

    {pages > 1 ? (
      <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
        {page > 1 ? (
          <Link href={blogPageHref({ tag, category }, page - 1)} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-heading hover:border-yt-red/40">← Newer posts</Link>
        ) : <span />}
        <span className="text-sm text-fog">Page {page} of {pages}</span>
        {page < pages ? (
          <Link href={blogPageHref({ tag, category }, page + 1)} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-heading hover:border-yt-red/40">Older posts →</Link>
        ) : <span />}
      </nav>
    ) : null}

    {tags.length || categories.length ? (
      <section className="mt-12 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-lg font-bold text-heading">Browse the archive</h2>
        {categories.length ? (
          <div className="mt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fog">Categories</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {categories.map((item) => (
                <li key={item.category}><Link href={`/blog?category=${encodeURIComponent(item.category)}`} className="inline-flex min-h-9 items-center rounded-full border border-border bg-white px-3.5 text-sm font-medium text-heading hover:border-yt-red/40">{item.category} <span className="ml-1.5 text-xs text-fog">{item.count}</span></Link></li>
              ))}
            </ul>
          </div>
        ) : null}
        {tags.length ? (
          <div className="mt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-fog">Tags</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {tags.map((item) => (
                <li key={item.tag}><Link href={`/blog/tag/${encodeURIComponent(item.tag)}`} className="inline-flex min-h-9 items-center rounded-full border border-border bg-white px-3.5 text-sm font-medium text-heading hover:border-yt-red/40">{item.tag} <span className="ml-1.5 text-xs text-fog">{item.count}</span></Link></li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    ) : null}
  </ProsePage>;
}
