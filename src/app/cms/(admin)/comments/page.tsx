import type { Metadata } from "next";
import Link from "next/link";
import { countComments } from "@/lib/cms/comments";
import { listAllComments } from "@/lib/cms/posts";
import CmsPageHeader from "../../page-header";
import CommentRow from "./comment-row";

export const metadata: Metadata = { title: "Comments" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const TABS = [
  { key: "pending", label: "Awaiting review" },
  { key: "approved", label: "Approved" },
  { key: "spam", label: "Spam" },
  { key: "", label: "All" },
] as const;

export default async function CmsCommentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = (raw ?? "pending") as "" | "pending" | "approved" | "spam";

  const [comments, counts] = await Promise.all([
    listAllComments(status || undefined),
    Promise.all([countComments("pending"), countComments("approved"), countComments("spam")]),
  ]);

  const [pendingCount, approvedCount, spamCount] = counts;

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="Comments"
        description="Every comment is held for review before it appears under an article."
      />

      <nav aria-label="Comment filters" className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((tab) => {
          const count =
            tab.key === "pending" ? pendingCount : tab.key === "approved" ? approvedCount : tab.key === "spam" ? spamCount : pendingCount + approvedCount + spamCount;
          const active = status === tab.key;
          return (
            <Link
              key={tab.key || "all"}
              href={tab.key ? `/cms/comments?status=${tab.key}` : "/cms/comments"}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${
                active ? "bg-navy text-white" : "bg-white text-fog hover:bg-surface"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-white/15" : "bg-surface"}`}>{count}</span>
            </Link>
          );
        })}
      </nav>

      {comments.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm font-semibold text-heading">Nothing here.</p>
          <p className="mt-1 text-sm text-fog">No comments in this state.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((row) => (
            <CommentRow
              key={row.comment.id}
              comment={{
                id: row.comment.id,
                authorName: row.comment.authorName,
                authorEmail: row.comment.authorEmail,
                body: row.comment.body,
                status: row.comment.status,
                createdAt: row.comment.createdAt.toISOString(),
                postTitle: row.postTitle,
                postSlug: row.postSlug,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
