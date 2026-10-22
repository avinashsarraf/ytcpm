import { and, asc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsComments, type CmsComment } from "@/db/schema";
import { logOnce } from "@/lib/log";
import { rateLimit } from "@/lib/rate-limit";
import { getPostById } from "./posts";
import { isPostLive } from "./visibility";

/**
 * Reader comments.
 *
 * Every comment starts as `pending` and is invisible until an editor approves
 * it. The email address is never rendered publicly — only the name and the
 * text — and the address is stored so an editor can follow up if needed.
 */

const SUBMIT_LIMIT = 5;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000;

export async function listComments(postId: number, status: "pending" | "approved" | "spam" = "approved"): Promise<CmsComment[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    return await db
      .select()
      .from(cmsComments)
      .where(and(eq(cmsComments.postId, postId), eq(cmsComments.status, status)))
      .orderBy(asc(cmsComments.createdAt));
  } catch (error) {
    logOnce("cms", "comment list failed", error);
    return [];
  }
}

export type CommentSubmitResult = { ok: true } | { ok: false; error: string };

/** True when the post exists and is public right now. */
async function isPostOpenForComments(postId: number): Promise<boolean> {
  try {
    const post = await getPostById(postId);
    return post !== null && isPostLive(post);
  } catch {
    return false;
  }
}

export async function submitComment(input: {
  postId: number;
  authorName: string;
  authorEmail: string;
  body: string;
  clientKey: string;
}): Promise<CommentSubmitResult> {
  if (!isDatabaseConfigured()) return { ok: false, error: "Comments are unavailable right now." };

  const limit = rateLimit(`cms-comment:${input.clientKey}`, SUBMIT_LIMIT, SUBMIT_WINDOW_MS);
  if (!limit.ok) {
    return { ok: false, error: "You have posted several comments already. Try again later." };
  }

  // A comment on a post nobody can read is invisible forever, and a crafted
  // request could otherwise use the form to probe post ids.
  if (!(await isPostOpenForComments(input.postId))) {
    return { ok: false, error: "That post is no longer open for comments." };
  }

  try {
    await db.insert(cmsComments).values({
      postId: input.postId,
      authorName: input.authorName.slice(0, 80),
      authorEmail: input.authorEmail.slice(0, 200).toLowerCase(),
      body: input.body.slice(0, 4000),
      status: "pending",
    });
    return { ok: true };
  } catch (error) {
    logOnce("cms", "comment insert failed", error);
    return { ok: false, error: "The comment could not be saved." };
  }
}

export async function moderateComment(id: number, status: "approved" | "spam" | "pending", moderatorId: number | null): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const rows = await db
      .update(cmsComments)
      .set({ status, moderatedAt: new Date(), moderatedById: moderatorId })
      .where(eq(cmsComments.id, id))
      .returning({ id: cmsComments.id });
    return rows.length > 0;
  } catch (error) {
    logOnce("cms", "comment moderation failed", error);
    return false;
  }
}

export async function deleteComment(id: number): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const rows = await db.delete(cmsComments).where(eq(cmsComments.id, id)).returning({ id: cmsComments.id });
    return rows.length > 0;
  } catch (error) {
    logOnce("cms", "comment delete failed", error);
    return false;
  }
}

export async function countComments(status?: "pending" | "approved" | "spam"): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  try {
    const rows = status
      ? await db.select({ id: cmsComments.id }).from(cmsComments).where(eq(cmsComments.status, status))
      : await db.select({ id: cmsComments.id }).from(cmsComments);
    return rows.length;
  } catch {
    return 0;
  }
}
