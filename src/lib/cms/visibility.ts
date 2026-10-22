/**
 * When is a post public?
 *
 * The rule is deliberately tiny, and it lives in its own module so it can be
 * unit-tested without a database. It is used by the repository for single-post
 * lookups and mirrored in SQL by `liveClause()` for list queries.
 *
 * A post is public when either:
 *   - it is published and its publish date has arrived, or
 *   - it is scheduled and the date it was scheduled for has arrived.
 *
 * The second case matters: scheduling must not depend on a cron job having
 * run. A post scheduled for 09:00 is readable at 09:00 on the next request,
 * and a background job later tidies the row into "published".
 */

export type PostVisibilityFields = {
  status: string;
  publishedAt: Date | null;
  scheduledFor: Date | null;
};

export function isPostLive(post: PostVisibilityFields, now: Date = new Date()): boolean {
  const t = now.getTime();
  if (post.status === "published") {
    // A published row without a date is treated as live: the date is only
    // missing on rows written before scheduling existed.
    return !post.publishedAt || post.publishedAt.getTime() <= t;
  }
  if (post.status === "scheduled") {
    return post.scheduledFor !== null && post.scheduledFor.getTime() <= t;
  }
  return false;
}

/** True when the post is scheduled but its date has not arrived yet. */
export function isPostPending(post: PostVisibilityFields, now: Date = new Date()): boolean {
  return post.status === "scheduled" && !isPostLive(post, now);
}
