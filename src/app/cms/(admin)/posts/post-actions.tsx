"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deletePostAction, restoreRevisionAction, setPostStatusAction, type ActionState } from "../../actions";

const INITIAL: ActionState = { ok: false, message: "" };

/**
 * The destructive controls around a post: publish state, version restore and
 * delete. Every one of them writes a revision first, so nothing here is
 * irreversible by accident.
 */
export default function PostActions({
  postId,
  status,
  scheduledFor,
  revisions,
}: {
  postId: number;
  status: string;
  /** The date the post is (or was) scheduled for, as a datetime-local value. */
  scheduledFor: string | null;
  revisions: { id: number; title: string; reason: string; createdAt: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    // The status buttons send `status`; the delete and restore buttons send
    // `__intent`.
    const intent = String(formData.get("__intent") ?? "");
    const result =
      intent === "delete"
        ? await deletePostAction(formData)
        : intent === "restore"
          ? await restoreRevisionAction(formData)
          : await setPostStatusAction(formData);
    if (result.ok && result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
    return result;
  }, INITIAL);

  const [confirming, setConfirming] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(scheduledFor ?? "");

  return (
    <div>
      {state.message ? (
        <p
          role="status"
          className={`mb-3 rounded-lg px-3.5 py-2.5 text-sm ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}
        >
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className="space-y-2">
        <input type="hidden" name="id" value={postId} />
        <div>
          <label htmlFor="post-scheduled-for" className="text-xs font-semibold text-heading">
            Publish date <span className="font-normal text-fog">(required to schedule)</span>
          </label>
          <input
            id="post-scheduled-for"
            name="scheduledFor"
            type="datetime-local"
            value={scheduleDate}
            onChange={(event) => setScheduleDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-heading outline-none focus:border-yt-red sm:max-w-xs"
          />
          {status === "scheduled" ? (
            <p className="mt-1 text-xs text-fog">
              The post becomes public the moment this date passes. A date in the past publishes it on the next visit.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {status !== "published" ? (
            <button
              type="submit"
              name="status"
              value="published"
              disabled={pending}
              className="inline-flex min-h-10 items-center rounded-lg bg-mint px-4 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              Publish now
            </button>
          ) : (
            <button
              type="submit"
              name="status"
              value="draft"
              disabled={pending}
              className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-bold text-heading hover:bg-surface disabled:opacity-60"
            >
              Unpublish
            </button>
          )}
          {status !== "scheduled" ? (
            <button
              type="submit"
              name="status"
              value="scheduled"
              disabled={pending}
              className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-bold text-heading hover:bg-surface disabled:opacity-60"
            >
              Schedule
            </button>
          ) : null}
          {status !== "archived" ? (
            <button
              type="submit"
              name="status"
              value="archived"
              disabled={pending}
              className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-bold text-heading hover:bg-surface disabled:opacity-60"
            >
              Archive
            </button>
          ) : null}
        </div>
      </form>

      {revisions.length ? (
        <div className="mt-5 border-t border-border pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-fog">Version history</h3>
          <ul className="mt-3 space-y-2">
            {revisions.map((revision) => (
              <li key={revision.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-semibold text-heading">{revision.title}</p>
                <p className="mt-0.5 text-xs text-fog">
                  {revision.reason} · {new Date(revision.createdAt).toLocaleString("en-GB")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/cms/posts/${postId}/revisions/${revision.id}`}
                    className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-bold text-heading hover:bg-surface"
                  >
                    Compare
                  </Link>
                <form action={formAction}>
                  <input type="hidden" name="postId" value={postId} />
                  <input type="hidden" name="revisionId" value={revision.id} />
                  <button
                    type="submit"
                    name="__intent"
                    value="restore"
                    disabled={pending}
                    className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 text-xs font-bold text-heading hover:bg-surface disabled:opacity-60"
                  >
                    Restore this version
                  </button>
                </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        {confirming ? (
          <form action={formAction} className="rounded-lg border border-yt-red/30 bg-yt-red-bg/40 p-3">
            <p className="text-sm font-semibold text-heading">Delete this post permanently?</p>
            <p className="mt-1 text-xs text-fog">The post and its comments are removed. This cannot be undone.</p>
            <input type="hidden" name="id" value={postId} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                name="__intent"
                value="delete"
                disabled={pending}
                className="inline-flex min-h-10 items-center rounded-lg bg-yt-red px-4 text-sm font-bold text-white hover:bg-yt-red-hover disabled:opacity-60"
              >
                Yes, delete it
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="inline-flex min-h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-bold text-heading hover:bg-surface"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex min-h-10 items-center rounded-lg border border-yt-red/40 px-4 text-sm font-bold text-yt-red hover:bg-yt-red-bg"
          >
            Delete post
          </button>
        )}
      </div>
    </div>
  );
}
