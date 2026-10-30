"use server";

import { headers } from "next/headers";
import { clientKey } from "@/lib/rate-limit";
import { validateCommentInput } from "@/lib/cms/validation";
import { submitComment } from "@/lib/cms/comments";
import { recordActivity } from "@/lib/cms/activity";
import type { CommentFormState } from "./[slug]/comment-form";

/**
 * Public comment submission.
 *
 * The comment is written as `pending` and is never rendered until an editor
 * approves it. The form works without JavaScript, so the action returns a
 * result object the client renders as a status message.
 */
export async function submitCommentAction(formData: FormData): Promise<CommentFormState> {
  /*
    A filled honeypot means a bot. Report success and store nothing: a bot that
    is told it failed tries again, and the comment would never be approved
    anyway. The reply is deliberately identical to the real one.
  */
  const honeypot = String(formData.get("website") ?? "").trim();
  if (honeypot) {
    return { ok: true, message: "Thanks — your comment was submitted and will appear once it is approved." };
  }

  const parsed = validateCommentInput(formData);
  if (!parsed.ok) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.errors };
  }

  const headerList = await headers();
  const request = new Request("http://localhost", { headers: headerList });
  const key = clientKey(request);

  const result = await submitComment({ ...parsed.data, clientKey: key });
  if (!result.ok) {
    return { ok: false, message: result.error };
  }

  await recordActivity({
    userId: null,
    action: "comment.submitted",
    entity: "comment",
    entityId: String(parsed.data.postId),
    summary: `A comment was submitted on post #${parsed.data.postId} and is waiting for moderation.`,
  });

  return { ok: true, message: "Thanks — your comment was submitted and will appear once it is approved." };
}
