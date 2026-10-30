"use client";

import { useActionState } from "react";
import { submitCommentAction } from "@/app/blog/actions";

export type CommentFormState = { ok: boolean; message: string; fieldErrors?: Record<string, string> };

/**
 * The public comment form.
 *
 * It posts through a server action so the same validation and moderation
 * rules apply as in the admin panel, and it works without JavaScript.
 */
export default function CommentForm({ postId }: { postId: number }) {
  const [state, formAction, pending] = useActionState<CommentFormState, FormData>(
    async (_previous, formData) => submitCommentAction(formData),
    { ok: false, message: "" },
  );

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
      <input type="hidden" name="postId" value={postId} />
      {/*
        A honeypot. People never see it — it is pulled off the page with CSS,
        not hidden with a style attribute, and is marked aria-hidden so a screen
        reader skips it too. Comment bots fill every field they find, so a value
        here means the submission is not from a person.
      */}
      <div className="comment-honeypot" aria-hidden="true">
        <label htmlFor="comment-website">Website</label>
        <input id="comment-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <h3 className="text-base font-bold text-heading">Leave a comment</h3>
      <p className="mt-1 text-sm text-fog">Your email address is never published. Comments are reviewed before they appear.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="comment-name" className="text-sm font-semibold text-heading">Name</label>
          <input
            id="comment-name"
            name="authorName"
            required
            maxLength={80}
            autoComplete="name"
            aria-invalid={errors.authorName ? true : undefined}
            aria-describedby={errors.authorName ? "comment-name-error" : undefined}
            className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-yt-red"
          />
          {errors.authorName ? <p id="comment-name-error" className="mt-1.5 text-xs font-semibold text-yt-red">{errors.authorName}</p> : null}
        </div>
        <div>
          <label htmlFor="comment-email" className="text-sm font-semibold text-heading">Email</label>
          <input
            id="comment-email"
            name="authorEmail"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            aria-invalid={errors.authorEmail ? true : undefined}
            aria-describedby={errors.authorEmail ? "comment-email-error" : undefined}
            className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-yt-red"
          />
          {errors.authorEmail ? <p id="comment-email-error" className="mt-1.5 text-xs font-semibold text-yt-red">{errors.authorEmail}</p> : null}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="comment-body" className="text-sm font-semibold text-heading">Comment</label>
        <textarea
          id="comment-body"
          name="body"
          required
          rows={4}
          maxLength={4000}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? "comment-body-error" : undefined}
          className="mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-yt-red"
        />
        {errors.body ? <p id="comment-body-error" className="mt-1.5 text-xs font-semibold text-yt-red">{errors.body}</p> : null}
      </div>

      {state.message ? (
        <p role="status" className={`mt-4 rounded-lg px-4 py-3 text-sm ${state.ok ? "bg-mint-bg text-mint" : "bg-yt-red-bg text-yt-red"}`}>
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-yt-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-yt-red-hover disabled:opacity-60">
        {pending ? "Sending…" : "Post comment"}
      </button>
    </form>
  );
}
