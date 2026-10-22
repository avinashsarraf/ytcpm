"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { deleteCommentAction, moderateCommentAction, type ActionState } from "../../actions";

const INITIAL: ActionState = { ok: false, message: "" };

/** One comment with its moderation controls. */
export default function CommentRow({
  comment,
}: {
  comment: {
    id: number;
    authorName: string;
    authorEmail: string;
    body: string;
    status: string;
    createdAt: string;
    postTitle: string;
    postSlug: string;
  };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await moderateCommentAction(formData);
    if (result.ok) router.refresh();
    return result;
  }, INITIAL);

  const [deleteState, deleteAction, deleting] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await deleteCommentAction(formData);
    if (result.ok) router.refresh();
    return result;
  }, INITIAL);

  const statusTone =
    comment.status === "approved" ? "bg-mint-bg text-mint" : comment.status === "spam" ? "bg-yt-red-bg text-yt-red" : "bg-amber-bg text-amber";

  return (
    <li className="rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-heading">{comment.authorName}</p>
          <p className="text-xs text-fog">{comment.authorEmail}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusTone}`}>{comment.status}</span>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-heading">{comment.body}</p>

      <p className="mt-3 text-xs text-fog">
        On <span className="font-semibold text-heading">{comment.postTitle}</span> · {new Date(comment.createdAt).toLocaleString("en-GB")}
      </p>

      {state.message ? (
        <p role="status" className={`mt-3 rounded-lg px-3.5 py-2.5 text-xs ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
          {state.message}
        </p>
      ) : null}
      {deleteState.message ? (
        <p role="status" className={`mt-3 rounded-lg px-3.5 py-2.5 text-xs ${deleteState.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
          {deleteState.message}
        </p>
      ) : null}

      <form action={formAction} className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <input type="hidden" name="id" value={comment.id} />
        {comment.status !== "approved" ? (
          <button type="submit" name="status" value="approved" disabled={pending} className="inline-flex min-h-10 items-center rounded-lg bg-mint px-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
            Approve
          </button>
        ) : null}
        {comment.status !== "pending" ? (
          <button type="submit" name="status" value="pending" disabled={pending} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-bold text-heading hover:bg-surface disabled:opacity-60">
            Move back to pending
          </button>
        ) : null}
        {comment.status !== "spam" ? (
          <button type="submit" name="status" value="spam" disabled={pending} className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-bold text-heading hover:bg-surface disabled:opacity-60">
            Mark as spam
          </button>
        ) : null}
        <button type="submit" formAction={deleteAction} disabled={deleting} className="inline-flex min-h-10 items-center rounded-lg border border-yt-red/40 px-4 text-sm font-bold text-yt-red hover:bg-yt-red-bg disabled:opacity-60">
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </form>
    </li>
  );
}
