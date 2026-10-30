import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, Clock3, Tag } from "lucide-react";
import { breadcrumbs, pageMetadata, serializeJsonLd, webPageSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/editorial";
import { getPostBySlug, relatedPosts, listPosts } from "@/lib/cms/posts";
import { getSettings } from "@/lib/cms/settings";
import { effectiveDescription, effectiveTitle } from "@/lib/cms/seo";
import { absoluteMediaUrl, defaultOgImage, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "@/lib/cms/media-config";
import { renderMarkdown } from "@/lib/cms/markdown";
import { listComments } from "@/lib/cms/comments";
import { verifyPreviewToken } from "@/lib/cms/preview";
import CommentForm from "./comment-form";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams?: Promise<{ preview?: string }> };

/**
 * Loads a post for the public page.
 *
 * A published post is found the normal way. Anything else needs a valid
 * preview token, which the editor generates: the page then renders in full
 * but stays `noindex` and is never listed anywhere.
 */
async function loadPost(slug: string, searchParams?: Promise<{ preview?: string }>) {
  const published = await getPostBySlug(slug);
  if (published) return { post: published, preview: false };

  const token = (await searchParams)?.preview;
  if (!token || !verifyPreviewToken(slug, token)) return null;
  const draft = await getPostBySlug(slug, { includeUnpublished: true });
  if (!draft) return null;
  return { post: draft, preview: true };
}

export async function generateMetadata({ params, searchParams }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await loadPost(slug, searchParams);
  if (!found) return { title: "Post not found", robots: { index: false, follow: false } };

  const { post, preview } = found;
  if (preview) {
    // A draft is never indexed, and never claims a canonical of its own.
    return {
      title: `${post.title} — preview`,
      description: post.excerpt,
      robots: { index: false, follow: false, nocache: true },
    };
  }

  const title = effectiveTitle({ title: post.title, seoTitle: post.seoTitle });
  const description = effectiveDescription({ excerpt: post.excerpt, seoDescription: post.seoDescription, contentMd: post.contentMd });
  const image = socialImageFor(post.ogImageUrl, post.slug);
  const imageAlt = post.ogImageAlt ?? `${post.title} — social preview card`;

  return pageMetadata(title, description, `/blog/${post.slug}`, {
    focus: post.focusKeyword ?? undefined,
    keywords: post.seoKeywords.length ? post.seoKeywords : undefined,
    type: "article",
    publishedTime: post.publishedAt?.toISOString(),
    modifiedTime: post.updatedAt.toISOString(),
    image: { url: image, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: imageAlt },
    robots: post.noindex ? { index: false, follow: true } : undefined,
    category: post.category ?? undefined,
  });
}

function formatDate(value: Date | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(value);
}

/**
 * The social card for a post.
 *
 * An uploaded image always wins. Without one, the post gets its own card,
 * generated from the post title, rather than the generic site card.
 */
function socialImageFor(ogImageUrl: string | null, slug: string): string {
  if (ogImageUrl) return ogImageUrl;
  if (slug) return `/blog/${slug}/opengraph-image`;
  return defaultOgImage;
}

export default async function BlogPostPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const found = await loadPost(slug, searchParams);
  if (!found) notFound();
  const { post, preview } = found;

  const settings = await getSettings();
  const rendered = renderMarkdown(post.contentMd);
  const related = await relatedPosts(post, 3);
  const commentsEnabled = settings["blog.commentsEnabled"] === "true";
  const comments = commentsEnabled ? await listComments(post.id, "approved") : [];
  const seoTitle = effectiveTitle({ title: post.title, seoTitle: post.seoTitle });
  const description = effectiveDescription({ excerpt: post.excerpt, seoDescription: post.seoDescription, contentMd: post.contentMd });
  const image = socialImageFor(post.ogImageUrl, post.slug);
  const imageAlt = post.ogImageAlt ?? `${post.title} — social preview card`;

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}/blog/${post.slug}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
    headline: post.title,
    description,
    alternativeHeadline: post.subtitle ?? undefined,
    image: [absoluteMediaUrl(SITE_URL, image)],
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    wordCount: rendered.wordCount,
    timeRequired: `PT${rendered.readingMinutes}M`,
    articleSection: post.category ?? undefined,
    keywords: post.seoKeywords.length ? post.seoKeywords.join(", ") : post.focusKeyword ?? undefined,
    inLanguage: "en",
    isAccessibleForFree: true,
    author: { "@type": "Organization", name: settings["blog.authorName"], url: `${SITE_URL}/about` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    commentCount: comments.length,
    comment: comments.slice(0, 20).map((comment) => ({
      "@type": "Comment",
      text: comment.body,
      author: { "@type": "Person", name: comment.authorName },
      datePublished: comment.createdAt.toISOString(),
    })),
  };

  return <>
    {preview ? null : (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([
      blogPosting,
      webPageSchema({ path: `/blog/${post.slug}`, name: post.title, description, image, dateModified: post.updatedAt.toISOString(), section: post.category ?? "Blog", about: post.focusKeyword ? [post.focusKeyword] : [] }),
      breadcrumbs([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }]),
    ]) }} />
    )}

    {preview ? (
      <div className="border-b border-amber/40 bg-amber-bg">
        <div className="shell flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
          <span className="font-bold text-heading">Preview</span>
          <span className="text-fog">
            This post is <strong className="font-semibold text-heading">{post.status}</strong> and not public. Only a signed link like this one can open it, and search engines are told to ignore it.
          </span>
          <Link href={`/cms/posts/${post.id}`} className="font-semibold text-yt-red underline underline-offset-4">
            Back to the editor
          </Link>
        </div>
      </div>
    ) : null}

    <article className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 blob-pink" aria-hidden />
      <header className="relative border-b border-border bg-gradient-to-b from-yt-red-light/70 via-white to-white pb-9 pt-10 sm:pb-10 sm:pt-14 lg:pt-16">
        <div className="shell">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-fog">
            <Link href="/" className="py-2 underline">Home</Link><span aria-hidden="true">/</span>
            <Link href="/blog" className="py-2 underline">Blog</Link><span aria-hidden="true">/</span>
            <span aria-current="page" className="font-semibold text-heading">{post.title}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold uppercase tracking-wider text-fog">
            {post.category ? <span className="rounded-full bg-yt-red-bg px-3 py-1 text-yt-red">{post.category}</span> : null}
            <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden className="h-3.5 w-3.5" />{formatDate(post.publishedAt)}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden className="h-3.5 w-3.5" />{rendered.readingMinutes} min read</span>
            {post.updatedAt && post.publishedAt && post.updatedAt.getTime() - post.publishedAt.getTime() > 86_400_000 ? (
              <span className="inline-flex items-center gap-1.5">Updated {formatDate(post.updatedAt)}</span>
            ) : null}
          </div>
          <h1 className="display-2 mt-4 max-w-[24ch]">{post.title}</h1>
          {post.subtitle ? <p className="lede mt-4 max-w-3xl">{post.subtitle}</p> : null}
        </div>
      </header>

      <div className="shell py-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0">
            {rendered.headings.filter((heading) => heading.level === 2).length > 1 ? (
              <nav aria-label="On this page" className="mb-8 rounded-2xl border border-border bg-surface p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-heading">On this page</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {rendered.headings.filter((heading) => heading.level === 2).map((heading) => (
                    <li key={heading.id}><a href={`#${heading.id}`} className="inline-flex min-h-9 items-center text-yt-red underline underline-offset-4">{heading.text}</a></li>
                  ))}
                </ul>
              </nav>
            ) : null}

            <div className="prose-post space-y-5 leading-relaxed" dangerouslySetInnerHTML={{ __html: rendered.html }} />

            {post.tags.length ? (
              <ul className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
                {post.tags.map((postTag) => (
                  <li key={postTag}><Link href={`/blog/tag/${encodeURIComponent(postTag)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-sm font-medium text-fog hover:border-yt-red/40 hover:text-heading"><Tag aria-hidden className="h-3.5 w-3.5" />{postTag}</Link></li>
                ))}
              </ul>
            ) : null}

            <section className="mt-10 rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-base font-bold text-heading">About the author</h2>
              <p className="mt-2 text-sm leading-7 text-fog">{settings["blog.authorBio"]}</p>
            </section>

            {related.length ? (
              <section className="mt-10">
                <h2 className="text-xl font-bold text-heading">Keep reading</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {related.map((item) => (
                    <Link key={item.id} href={`/blog/${item.slug}`} className="group rounded-xl border border-border bg-white p-4 transition-colors hover:border-yt-red/40">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-fog">{item.category ?? "Article"}</p>
                      <p className="mt-2 text-sm font-bold leading-snug text-heading group-hover:text-yt-red">{item.title}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-yt-red">Read <ArrowRight aria-hidden className="h-3 w-3" /></span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {commentsEnabled && !preview ? (
              <section id="comments" className="mt-12 scroll-mt-24 border-t border-border pt-8">
                <h2 className="text-xl font-bold text-heading">Comments</h2>
                <p className="mt-2 text-sm text-fog">Comments are moderated before they appear. Keep it about the numbers, not the person.</p>
                {comments.length ? (
                  <ul className="mt-6 space-y-4">
                    {comments.map((comment) => (
                      <li key={comment.id} className="rounded-xl border border-border bg-white p-5">
                        <p className="text-sm font-semibold text-heading">{comment.authorName}</p>
                        <p className="mt-2 text-sm leading-7 text-fog">{comment.body}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-6 rounded-xl border border-border bg-surface p-5 text-sm text-fog">No comments yet — be the first to add one.</p>
                )}
                <CommentForm postId={post.id} />
              </section>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-heading">Try the numbers</h2>
              <p className="mt-2 text-sm leading-7 text-fog">Run your own figures instead of guessing. Everything runs in your browser.</p>
              <ul className="mt-4 space-y-1">
                {[
                  { href: "/youtube-cpm-calculator", label: "CPM calculator" },
                  { href: "/youtube-rpm-calculator", label: "RPM calculator" },
                  { href: "/youtube-views-to-money-calculator", label: "Views to money" },
                  { href: "/cpm-by-country", label: "CPM by country" },
                  { href: "/channel-auditor", label: "Channel auditor" },
                ].map((link) => (
                  <li key={link.href}><Link href={link.href} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-yt-red underline underline-offset-4">{link.label}<ArrowRight aria-hidden className="h-3 w-3" /></Link></li>
                ))}
              </ul>
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-white p-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-heading">More reading</h2>
              <ul className="mt-3 space-y-1">
                <li><Link href="/guides" className="inline-flex min-h-11 items-center text-sm font-semibold text-heading hover:text-yt-red">Guides library</Link></li>
                <li><Link href="/methodology" className="inline-flex min-h-11 items-center text-sm font-semibold text-heading hover:text-yt-red">Methodology</Link></li>
                <li><Link href="/sources" className="inline-flex min-h-11 items-center text-sm font-semibold text-heading hover:text-yt-red">Sources</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </article>
  </>;
}
