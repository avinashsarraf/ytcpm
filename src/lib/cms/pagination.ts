/**
 * Pagination URLs for the blog.
 *
 * The first page deliberately has no `page` parameter, so page one has exactly
 * one address and can be canonicalised. Building the query string by hand is
 * how the blog once produced `/blog&page=2` — a URL that silently loaded the
 * first page again — so the string is assembled here, in one tested place.
 */

export type BlogQuery = {
  tag?: string | null;
  category?: string | null;
};

/** The URL for one page of the blog index. */
export function blogPageHref(query: BlogQuery, page: number): string {
  const params = new URLSearchParams();
  if (query.tag) params.set("tag", query.tag);
  if (query.category) params.set("category", query.category);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/blog?${value}` : "/blog";
}

/** The URL for one page of a tag archive. */
export function tagPageHref(tag: string, page: number): string {
  const base = `/blog/tag/${encodeURIComponent(tag)}`;
  return page > 1 ? `${base}?page=${page}` : base;
}

/** Total pages, never fewer than one. */
export function pageCount(total: number, perPage: number): number {
  if (perPage <= 0) return 1;
  return Math.max(1, Math.ceil(total / perPage));
}
