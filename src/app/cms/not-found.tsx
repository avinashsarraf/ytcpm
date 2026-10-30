import Link from "next/link";
import { FileQuestion } from "lucide-react";

/**
 * A not-found page inside the admin.
 *
 * A deleted post, an unknown id or a stale bookmark all end up here, so the
 * page says what probably happened and offers the way back. The public
 * not-found page would sweep the reader out of the CMS entirely.
 */
export default function CmsNotFound() {
  return (
    <div className="px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-white p-8 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface">
          <FileQuestion className="h-5 w-5 text-fog" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-heading">Not found</h1>
        <p className="mt-2 text-sm leading-6 text-fog">
          That post, image or record does not exist any more. It may have been deleted, or the
          link may be out of date.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/cms/posts"
            className="inline-flex min-h-11 items-center rounded-lg bg-yt-red px-5 text-sm font-bold text-white hover:bg-yt-red-hover"
          >
            All posts
          </Link>
          <Link
            href="/cms"
            className="inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-5 text-sm font-semibold text-heading hover:bg-surface"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
