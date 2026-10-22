import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { getPostById, getRevision } from "@/lib/cms/posts";
import { collapseContext, diffLines, omittedCount } from "@/lib/cms/diff";
import { restoreRevisionPageAction } from "@/app/cms/actions";
import CmsPageHeader from "@/app/cms/page-header";

export const metadata: Metadata = { title: "Compare versions" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string; revisionId: string }>;
type Search = Promise<{ failed?: string }>;

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(value);
}

/**
 * Compares an earlier version of a post with the current one.
 *
 * Restoring blind is not editing — this is the screen that shows what the
 * restore would actually change. The diff is computed on the server so the
 * whole body never has to be shipped to the browser just to look at it.
 */
export default async function CompareRevisionPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [{ id, revisionId }, query] = await Promise.all([params, searchParams]);
  const postId = Number.parseInt(id, 10);
  const versionId = Number.parseInt(revisionId, 10);
  if (!Number.isFinite(postId) || !Number.isFinite(versionId) || postId <= 0 || versionId <= 0) notFound();

  const [post, revision] = await Promise.all([getPostById(postId), getRevision(versionId)]);
  if (!post || !revision || revision.postId !== postId) notFound();

  /*
    A version is more than its body: the title is what a reader sees first and
    what a search result shows, so a change to it belongs in the comparison.
    The title is rendered as a Markdown heading, which keeps one diff view for
    both and puts the change where an editor expects to find it.
  */
  const titleChanged = revision.title !== post.title;
  const body = diffLines(revision.contentMd, post.contentMd);
  const diff = titleChanged
    ? {
        lines: [
          { type: "remove" as const, text: `# ${revision.title}` },
          { type: "add" as const, text: `# ${post.title}` },
          ...body.lines,
        ],
        added: body.added + 1,
        removed: body.removed + 1,
        truncated: body.truncated,
      }
    : body;
  const { lines, hidden } = collapseContext(diff.lines, 3);
  const changed = diff.added + diff.removed;

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title={`Compare: ${post.title}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>Version saved {formatDate(revision.createdAt)}</span>
            <span>·</span>
            <span>{revision.reason}</span>
          </span>
        }
        actions={
          <Link
            href={`/cms/posts/${postId}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-heading hover:bg-surface"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to the editor
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center rounded-full bg-mint-bg px-3 py-1 font-bold text-mint">+{diff.added} added</span>
        <span className="inline-flex items-center rounded-full bg-yt-red-bg px-3 py-1 font-bold text-yt-red">−{diff.removed} removed</span>
        {hidden ? <span className="text-fog">{hidden} unchanged line{hidden === 1 ? "" : "s"} collapsed</span> : null}
        {diff.truncated ? <span className="font-semibold text-amber">This article is long — only the first 800 lines were compared.</span> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fog">
        <span>
          The left column is <strong className="font-semibold text-heading">this saved version</strong>. The right column is{" "}
          <strong className="font-semibold text-heading">the post as it stands now</strong>.
        </span>
      </div>

      {changed === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-sm font-semibold text-heading">This version is identical to the current post.</p>
          <p className="mt-1 text-sm text-fog">Nothing to restore.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wider text-fog">
              <span>Unified diff</span>
              <span className="normal-case tracking-normal font-normal">old lines in red, new lines in green</span>
            </div>
            <ol className="max-h-[70vh] overflow-auto font-mono text-[12.5px] leading-6">
              {lines.map((line, index) => {
                const omitted = omittedCount(line.text);
                if (omitted !== null) {
                  return (
                    <li key={`gap-${index}`} className="border-y border-dashed border-border bg-surface px-4 py-1 text-center text-xs text-fog">
                      ⋯ {omitted} unchanged line{omitted === 1 ? "" : "s"} ⋯
                    </li>
                  );
                }
                const tone =
                  line.type === "add"
                    ? "bg-mint-bg/60 text-[#0a5c45]"
                    : line.type === "remove"
                      ? "bg-yt-red-bg/60 text-[#8a0b2e]"
                      : "text-fog";
                const marker = line.type === "add" ? "+" : line.type === "remove" ? "−" : " ";
                return (
                  <li key={index} className={`flex gap-3 px-4 ${tone}`}>
                    <span aria-hidden className="w-3 shrink-0 select-none opacity-70">
                      {marker}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{line.text || " "}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <form action={restoreRevisionPageAction} className="mt-6 rounded-xl border border-border bg-white p-5">
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="revisionId" value={versionId} />
            <input type="hidden" name="__intent" value="restore" />
            <h2 className="text-base font-bold text-heading">Restore this version</h2>
            {query.failed ? (
              <p role="status" className="mt-3 rounded-lg bg-yt-red-bg px-3.5 py-2.5 text-sm text-yt-red">
                That version could not be restored. It may have been removed, or the post may have changed since this page loaded.
              </p>
            ) : null}
            <p className="mt-1 text-sm text-fog">
              The current text is saved as a new version first, so the restore can itself be undone.
            </p>
            <button
              type="submit"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-yt-red px-5 text-sm font-bold text-white hover:bg-yt-red-hover"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Restore and open the editor
            </button>
          </form>
        </>
      )}
    </div>
  );
}
