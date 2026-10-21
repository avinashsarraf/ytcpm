import type { Metadata } from "next";
import Link from "next/link";
import { countPosts, listPosts, listCategories, listTags } from "@/lib/cms/posts";
import { analyzePost } from "@/lib/cms/seo";
import CmsPageHeader from "../../page-header";

export const metadata: Metadata = { title: "Posts" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  published: "bg-mint-bg text-mint",
  scheduled: "bg-blue-bg text-blue",
  draft: "bg-surface text-fog",
  archived: "bg-yt-red-bg text-yt-red",
};

function formatDate(value: Date | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(value);
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CmsPostsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = first(params.status);
  const search = first(params.q).trim();
  const category = first(params.category).trim();
  const tag = first(params.tag).trim();
  const page = Math.max(1, Number.parseInt(first(params.page) || "1", 10) || 1);

  const query = {
    ...(status && ["draft", "published", "scheduled", "archived"].includes(status)
      ? { status: status as "draft" | "published" | "scheduled" | "archived" }
      : {}),
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(tag ? { tag } : {}),
  };

  const [posts, total, categories, tags] = await Promise.all([
    listPosts({ ...query, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, order: "updated" }),
    countPosts(query),
    listCategories(),
    listTags(),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (next: Record<string, string>) => {
    const merged = new URLSearchParams();
    if (status) merged.set("status", status);
    if (search) merged.set("q", search);
    if (category) merged.set("category", category);
    if (tag) merged.set("tag", tag);
    for (const [key, value] of Object.entries(next)) merged.set(key, value);
    const queryString = merged.toString();
    return queryString ? `/cms/posts?${queryString}` : "/cms/posts";
  };

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="Posts"
        description={`${total} post${total === 1 ? "" : "s"} match the current filters.`}
        actions={
          <Link href="/cms/posts/new" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-yt-red px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-yt-red-hover">
            New post
          </Link>
        }
      />

      {/* Filters */}
      <form method="get" className="mt-6 rounded-xl border border-border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <div>
            <label htmlFor="q" className="text-xs font-bold uppercase tracking-wider text-fog">Search</label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={search}
              placeholder="Title, summary or body"
              className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red"
            />
          </div>
          <div>
            <label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-fog">Status</label>
            <select id="status" name="status" defaultValue={status} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red">
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-fog">Category</label>
            <select id="category" name="category" defaultValue={category} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-heading outline-none focus:border-yt-red">
              <option value="">All categories</option>
              {categories.map((entry) => (
                <option key={entry.category} value={entry.category}>{entry.category} ({entry.count})</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-lg bg-navy px-4 text-sm font-bold text-white hover:bg-yt-dark">
              Filter
            </button>
            {status || search || category || tag ? (
              <Link href="/cms/posts" className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-fog hover:bg-surface">
                Clear
              </Link>
            ) : null}
          </div>
        </div>

        {tags.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-fog">Tags</span>
            {tags.slice(0, 14).map((entry) => (
              <Link
                key={entry.tag}
                href={buildHref({ tag: tag === entry.tag ? "" : entry.tag })}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  tag === entry.tag ? "bg-yt-red text-white" : "bg-surface text-fog hover:bg-surface-2"
                }`}
              >
                {entry.tag} <span className="opacity-70">{entry.count}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </form>

      {/* Table */}
      {posts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm font-semibold text-heading">No posts match these filters.</p>
          <p className="mt-1 text-sm text-fog">
            <Link href="/cms/posts/new" className="font-semibold text-yt-red underline underline-offset-4">Write a new post</Link> or clear the filters.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <caption className="sr-only">Posts in the content library</caption>
              <thead>
                <tr className="border-b border-border bg-surface text-xs uppercase tracking-wider text-fog">
                  <th scope="col" className="px-4 py-3 font-bold">Title</th>
                  <th scope="col" className="px-4 py-3 font-bold">Status</th>
                  <th scope="col" className="px-4 py-3 font-bold">SEO</th>
                  <th scope="col" className="px-4 py-3 font-bold">Updated</th>
                  <th scope="col" className="px-4 py-3 font-bold">Published</th>
                  <th scope="col" className="px-4 py-3 font-bold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => {
                  const report = analyzePost({
                    title: post.title,
                    slug: post.slug,
                    excerpt: post.excerpt,
                    contentMd: post.contentMd,
                    focusKeyword: post.focusKeyword,
                    seoTitle: post.seoTitle,
                    seoDescription: post.seoDescription,
                    seoKeywords: post.seoKeywords,
                    ogImageUrl: post.ogImageUrl,
                    ogImageAlt: post.ogImageAlt,
                    canonicalUrl: post.canonicalUrl,
                    noindex: post.noindex,
                  });
                  const scoreTone =
                    report.score >= 90 ? "text-mint" : report.score >= 70 ? "text-blue" : report.score >= 45 ? "text-amber" : "text-yt-red";
                  return (
                    <tr key={post.id} className="align-top">
                      <td className="px-4 py-3">
                        <Link href={`/cms/posts/${post.id}`} className="font-semibold text-heading hover:text-yt-red">{post.title}</Link>
                        <p className="mt-0.5 text-xs text-fog">/blog/{post.slug}</p>
                        {post.tags.length ? (
                          <p className="mt-1.5 flex flex-wrap gap-1">
                            {post.tags.slice(0, 4).map((tagName) => (
                              <span key={tagName} className="rounded-full bg-surface px-2 py-0.5 text-[11px] text-fog">{tagName}</span>
                            ))}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[post.status] ?? "bg-surface text-fog"}`}>{post.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${scoreTone}`}>{report.score}</span>
                        <span className="text-xs text-fog">/100</span>
                        {report.blocking.length ? (
                          <p className="mt-0.5 text-[11px] text-yt-red">{report.blocking.length} blocking</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs text-fog">{formatDate(post.updatedAt)}</td>
                      <td className="px-4 py-3 text-xs text-fog">{formatDate(post.publishedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {post.status === "published" ? (
                            <Link href={`/blog/${post.slug}`} className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-semibold text-fog hover:bg-surface">
                              View
                            </Link>
                          ) : null}
                          <Link href={`/cms/posts/${post.id}`} className="inline-flex min-h-9 items-center rounded-lg bg-navy px-3 text-xs font-bold text-white hover:bg-yt-dark">
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pages > 1 ? (
        <nav aria-label="Posts pagination" className="mt-5 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={buildHref({ page: String(page - 1) })} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-heading hover:bg-surface">
              Previous
            </Link>
          ) : <span />}
          <p className="text-sm text-fog">Page {page} of {pages}</p>
          {page < pages ? (
            <Link href={buildHref({ page: String(page + 1) })} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-heading hover:bg-surface">
              Next
            </Link>
          ) : <span />}
        </nav>
      ) : null}
    </div>
  );
}
