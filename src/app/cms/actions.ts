"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsPosts, cmsRedirects, cmsUsers } from "@/db/schema";
import { logOnce } from "@/lib/log";
import { renderMarkdown, slugify } from "@/lib/cms/markdown";
import { analyzePost } from "@/lib/cms/seo";
import {
  asBool,
  asInt,
  asOptionalString,
  asString,
  asTrimmed,
  validatePostInput,
  validateRedirectInput,
  validateUserInput,
} from "@/lib/cms/validation";
import { createRevision, getRevision, slugExists, uniqueSlug } from "@/lib/cms/posts";
import { recordActivity } from "@/lib/cms/activity";
import { deleteMedia, updateMedia, uploadMedia } from "@/lib/cms/media";
import { moderateComment, deleteComment } from "@/lib/cms/comments";
import { setSettings, type CmsSettingKey } from "@/lib/cms/settings";
import { createSession, destroySession, destroyUserSessions, requireUserOrThrow } from "@/lib/cms/session";
import { clearRedirectCache } from "@/lib/cms/redirects";
import { hashPassword, verifyPassword } from "@/lib/cms/auth";
import { sessionCookieOptions } from "@/lib/cms/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Every administrative mutation.
 *
 * Rules that hold for every action in this file:
 * 1. The session is checked first — a hidden button is never the protection.
 * 2. Input is validated before it reaches the database.
 * 3. A revision is written before anything destructive.
 * 4. The change is recorded in the activity log.
 * 5. The affected pages are revalidated so the public site updates at once.
 */

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  /** A redirect target for the client to follow after a successful write. */
  redirectTo?: string;
};

const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function revalidateBlog(slug?: string) {
  updateTag("cms-posts");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (slug) {
    updateTag(`cms-post:${slug}`);
    revalidatePath(`/blog/${slug}`);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Authentication
   ══════════════════════════════════════════════════════════════════════════ */

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "The database is not configured, so the CMS cannot sign anyone in." };
  }

  const email = asTrimmed(formData.get("email")).toLowerCase();
  const password = asString(formData.get("password"));
  const request = new Request("http://localhost", { headers: await headers() });
  const key = clientKey(request);

  const limit = rateLimit(`cms-login:${key}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.ok) {
    return { ok: false, message: "Too many sign-in attempts. Try again in a few minutes." };
  }

  if (!email || !password) {
    return { ok: false, message: "Enter your email address and password." };
  }

  try {
    const rows = await db.select().from(cmsUsers).where(eq(cmsUsers.email, email)).limit(1);
    const user = rows[0];

    // Always run a hash comparison so a missing account and a wrong password
    // take the same amount of time.
    const stored = user?.passwordHash ?? DUMMY_HASH;
    const valid = await verifyPassword(password, stored);

    if (!user || !valid || !user.isActive) {
      await recordActivity({ userId: user?.id ?? null, action: "auth.failed", entity: "user", entityId: user?.id ?? null, summary: `Failed sign-in for ${email}.` });
      return { ok: false, message: "Those credentials do not match an active account." };
    }

    const token = await createSession(user.id, request);
    const store = await cookies();
    const options = sessionCookieOptions();
    store.set(options.name, token, {
      httpOnly: options.httpOnly,
      sameSite: options.sameSite,
      secure: options.secure,
      path: options.path,
      maxAge: options.maxAge,
    });

    await db.update(cmsUsers).set({ lastLoginAt: new Date() }).where(eq(cmsUsers.id, user.id));
    await recordActivity({ userId: user.id, action: "auth.login", entity: "user", entityId: user.id, summary: `${user.name} signed in.` });

    return { ok: true, message: "Signed in.", redirectTo: "/cms" };
  } catch (error) {
    logOnce("cms", "login failed", error);
    return { ok: false, message: "Sign-in failed. Try again in a moment." };
  }
}

/** A valid hash of a random value, used to keep the timing of a failed login constant. */
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export async function logoutAction(): Promise<void> {
  const user = await requireUserOrThrow().catch(() => null);
  await destroySession();
  if (user) {
    await recordActivity({ userId: user.id, action: "auth.logout", entity: "user", entityId: user.id, summary: `${user.name} signed out.` });
  }
  redirect("/cms/login");
}

/* ══════════════════════════════════════════════════════════════════════════
   Posts
   ══════════════════════════════════════════════════════════════════════════ */

export async function savePostAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const postId = asInt(formData.get("id"), 0);
  const parsed = validatePostInput(formData);
  if (!parsed.ok) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.errors };
  }

  const input = parsed.data;

  // SEO guard: a post cannot go public while a blocking check fails. A
  // scheduled post counts, because the scheduler will publish it unattended.
  const wantsPublish = input.status === "published" || input.status === "scheduled";
  if (wantsPublish) {
    const report = analyzePost({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      contentMd: input.contentMd,
      focusKeyword: input.focusKeyword,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
      ogImageUrl: input.ogImageUrl,
      ogImageAlt: input.ogImageAlt,
      canonicalUrl: input.canonicalUrl,
      noindex: input.noindex,
    });
    if (report.blocking.length) {
      return {
        ok: false,
        message: `Fix the blocking SEO issues before publishing: ${report.blocking.map((check) => check.label).join(", ")}.`,
        fieldErrors: Object.fromEntries(report.blocking.map((check) => [check.id, check.detail])),
      };
    }
  }

  try {
    const slug = input.slug ? await uniqueSlug(input.slug, postId || undefined) : await uniqueSlug(slugify(input.title));
    if (postId && await slugExists(slug, postId)) {
      return { ok: false, message: "That URL slug is already used by another post.", fieldErrors: { slug: "Choose a different slug." } };
    }

    const rendered = renderMarkdown(input.contentMd);
    const now = new Date();

    const values = {
      slug,
      title: input.title,
      subtitle: input.subtitle,
      excerpt: input.excerpt || rendered.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
      contentMd: input.contentMd,
      contentHtml: rendered.html,
      status: input.status,
      category: input.category,
      tags: input.tags,
      focusKeyword: input.focusKeyword,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      seoKeywords: input.seoKeywords,
      ogImageUrl: input.ogImageUrl,
      ogImageAlt: input.ogImageAlt,
      canonicalUrl: input.canonicalUrl,
      noindex: input.noindex,
      allowIndex: input.allowIndex,
      template: input.template,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      updatedAt: now,
    };

    if (!postId) {
      const inserted = await db
        .insert(cmsPosts)
        .values({
          ...values,
          authorId: user.id,
          status: input.status === "published" ? "published" : input.status,
          publishedAt: input.status === "published" ? now : null,
        })
        .returning({ id: cmsPosts.id, slug: cmsPosts.slug });
      await recordActivity({ userId: user.id, action: "post.created", entity: "post", entityId: inserted[0].id, summary: `Created “${input.title}”.` });
      revalidateBlog(inserted[0].slug);
      return { ok: true, message: "Post created.", redirectTo: `/cms/posts/${inserted[0].id}` };
    }

    const existingRows = await db.select().from(cmsPosts).where(eq(cmsPosts.id, postId)).limit(1);
    const existing = existingRows[0];
    if (!existing) return { ok: false, message: "That post no longer exists." };

    // A revision is the undo history — write one before the content changes.
    await createRevision(postId, existing.title, existing.contentMd, "edit", user.id);

    const publishedAt =
      input.status === "published" ? existing.publishedAt ?? now : existing.publishedAt;

    const updated = await db
      .update(cmsPosts)
      .set({ ...values, publishedAt })
      .where(eq(cmsPosts.id, postId))
      .returning({ id: cmsPosts.id, slug: cmsPosts.slug });

    await recordActivity({ userId: user.id, action: "post.updated", entity: "post", entityId: postId, summary: `Updated “${input.title}”.` });
    revalidateBlog(updated[0]?.slug);
    revalidateBlog(existing.slug);
    return { ok: true, message: "Post saved.", redirectTo: `/cms/posts/${postId}` };
  } catch (error) {
    logOnce("cms", "save post failed", error);
    return { ok: false, message: "The post could not be saved." };
  }
}

export async function setPostStatusAction(formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const postId = asInt(formData.get("id"), 0);
  const status = asTrimmed(formData.get("status"));
  if (!postId || !["draft", "published", "scheduled", "archived"].includes(status)) {
    return { ok: false, message: "Unknown post or status." };
  }

  try {
    const rows = await db.select().from(cmsPosts).where(eq(cmsPosts.id, postId)).limit(1);
    const post = rows[0];
    if (!post) return { ok: false, message: "That post no longer exists." };

    await createRevision(postId, post.title, post.contentMd, status, user.id);

    const now = new Date();
    const patch: Partial<typeof cmsPosts.$inferInsert> = { status: status as "draft" | "published" | "scheduled" | "archived", updatedAt: now };
    if (status === "published" && !post.publishedAt) patch.publishedAt = now;
    if (status === "draft") patch.publishedAt = null;

    // Scheduling without a future date would hide the post forever, because
    // nothing would ever promote it.
    if (status === "scheduled") {
      const raw = asTrimmed(formData.get("scheduledFor"));
      const when = raw ? new Date(raw) : post.scheduledFor;
      if (!when || Number.isNaN(when.getTime())) {
        return { ok: false, message: "Pick a publish date before scheduling this post." };
      }
      patch.scheduledFor = when;
      patch.publishedAt = null;
    }

    // Publishing — now or on a schedule — re-runs the blocking SEO checks.
    if (status === "published" || status === "scheduled") {
      const report = analyzePost({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        contentMd: post.contentMd,
        focusKeyword: post.focusKeyword,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords,
        ogImageUrl: post.ogImageUrl,
        ogImageAlt: post.ogImageAlt,
        canonicalUrl: post.canonicalUrl,
        noindex: post.noindex,
      });
      if (report.blocking.length) {
        return {
          ok: false,
          message: `Fix the blocking SEO issues before publishing: ${report.blocking.map((check) => check.label).join(", ")}.`,
          fieldErrors: Object.fromEntries(report.blocking.map((check) => [check.id, check.detail])),
        };
      }
    }

    await db.update(cmsPosts).set(patch).where(eq(cmsPosts.id, postId));
    await recordActivity({ userId: user.id, action: `post.${status}`, entity: "post", entityId: postId, summary: `“${post.title}” is now ${status}.` });
    revalidateBlog(post.slug);
    return { ok: true, message: `Post is now ${status}.` };
  } catch (error) {
    logOnce("cms", "post status change failed", error);
    return { ok: false, message: "The status could not be changed." };
  }
}

export async function deletePostAction(formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow(["admin"]);
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const postId = asInt(formData.get("id"), 0);
  if (!postId) return { ok: false, message: "Unknown post." };

  try {
    const rows = await db.select().from(cmsPosts).where(eq(cmsPosts.id, postId)).limit(1);
    const post = rows[0];
    if (!post) return { ok: false, message: "That post no longer exists." };

    await db.delete(cmsPosts).where(eq(cmsPosts.id, postId));
    await recordActivity({ userId: user.id, action: "post.deleted", entity: "post", entityId: postId, summary: `Deleted “${post.title}”.` });
    revalidateBlog(post.slug);
    return { ok: true, message: "Post deleted.", redirectTo: "/cms/posts" };
  } catch (error) {
    logOnce("cms", "post delete failed", error);
    return { ok: false, message: "The post could not be deleted." };
  }
}

export async function restoreRevisionAction(formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const postId = asInt(formData.get("postId"), 0);
  const revisionId = asInt(formData.get("revisionId"), 0);
  if (!postId || !revisionId) return { ok: false, message: "Unknown revision." };

  try {
    const revision = await getRevision(revisionId);
    if (!revision || revision.postId !== postId) return { ok: false, message: "That revision no longer exists." };

    const rows = await db.select().from(cmsPosts).where(eq(cmsPosts.id, postId)).limit(1);
    const post = rows[0];
    if (!post) return { ok: false, message: "That post no longer exists." };

    await createRevision(postId, post.title, post.contentMd, "restore", user.id);

    const rendered = renderMarkdown(revision.contentMd);
    await db
      .update(cmsPosts)
      .set({ title: revision.title, contentMd: revision.contentMd, contentHtml: rendered.html, updatedAt: new Date() })
      .where(eq(cmsPosts.id, postId));

    await recordActivity({ userId: user.id, action: "post.restored", entity: "post", entityId: postId, summary: `Restored an earlier version of “${post.title}”.` });
    revalidateBlog(post.slug);
    return { ok: true, message: "Version restored.", redirectTo: `/cms/posts/${postId}` };
  } catch (error) {
    logOnce("cms", "revision restore failed", error);
    return { ok: false, message: "The version could not be restored." };
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Media
   ══════════════════════════════════════════════════════════════════════════ */

export async function uploadMediaAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image to upload." };
  }

  const result = await uploadMedia(file, {
    altText: asTrimmed(formData.get("altText")),
    title: asOptionalString(formData.get("title")),
    userId: user.id,
  });

  if (!result.ok) return { ok: false, message: result.error };

  await recordActivity({ userId: user.id, action: "media.uploaded", entity: "media", entityId: result.media.id, summary: `Uploaded ${result.media.filename}.` });
  return { ok: true, message: `Uploaded ${result.media.filename}.` };
}

export async function updateMediaAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  const id = asInt(formData.get("id"), 0);
  if (!id) return { ok: false, message: "Unknown media item." };

  const updated = await updateMedia(id, {
    altText: asTrimmed(formData.get("altText")),
    title: asOptionalString(formData.get("title")) ?? undefined,
  });
  if (!updated) return { ok: false, message: "That media item no longer exists." };

  await recordActivity({ userId: user.id, action: "media.updated", entity: "media", entityId: id, summary: `Updated the details of ${updated.filename}.` });
  return { ok: true, message: "Media details saved." };
}

export async function deleteMediaAction(formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  const id = asInt(formData.get("id"), 0);
  if (!id) return { ok: false, message: "Unknown media item." };

  const deleted = await deleteMedia(id);
  if (!deleted) return { ok: false, message: "That media item no longer exists." };

  await recordActivity({ userId: user.id, action: "media.deleted", entity: "media", entityId: id, summary: "Deleted a media item." });
  return { ok: true, message: "Media deleted." };
}

/* ══════════════════════════════════════════════════════════════════════════
   Comments
   ══════════════════════════════════════════════════════════════════════════ */

export async function moderateCommentAction(formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  const id = asInt(formData.get("id"), 0);
  const status = asTrimmed(formData.get("status"));
  if (!id || !["approved", "spam", "pending"].includes(status)) {
    return { ok: false, message: "Unknown comment." };
  }

  const ok = await moderateComment(id, status as "approved" | "spam" | "pending", user.id);
  if (!ok) return { ok: false, message: "That comment no longer exists." };

  await recordActivity({ userId: user.id, action: `comment.${status}`, entity: "comment", entityId: id, summary: `A comment was marked ${status}.` });
  return { ok: true, message: `Comment marked ${status}.` };
}

export async function deleteCommentAction(formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  const id = asInt(formData.get("id"), 0);
  if (!id) return { ok: false, message: "Unknown comment." };

  const ok = await deleteComment(id);
  if (!ok) return { ok: false, message: "That comment no longer exists." };

  await recordActivity({ userId: user.id, action: "comment.deleted", entity: "comment", entityId: id, summary: "Deleted a comment." });
  return { ok: true, message: "Comment deleted." };
}

/* ══════════════════════════════════════════════════════════════════════════
   Redirects
   ══════════════════════════════════════════════════════════════════════════ */

export async function saveRedirectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const parsed = validateRedirectInput(formData);
  if (!parsed.ok) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.errors };
  }

  const id = asInt(formData.get("id"), 0);
  try {
    if (id) {
      await db
        .update(cmsRedirects)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(cmsRedirects.id, id));
    } else {
      const existing = await db.select({ id: cmsRedirects.id }).from(cmsRedirects).where(eq(cmsRedirects.fromPath, parsed.data.fromPath)).limit(1);
      if (existing.length) {
        await db.update(cmsRedirects).set({ ...parsed.data, updatedAt: new Date() }).where(eq(cmsRedirects.id, existing[0].id));
      } else {
        await db.insert(cmsRedirects).values(parsed.data);
      }
    }
    await recordActivity({ userId: user.id, action: "redirect.saved", entity: "redirect", entityId: id || null, summary: `${parsed.data.fromPath} → ${parsed.data.toPath}` });
    // The rule has to work straight away, not after the cache expires.
    clearRedirectCache();
    revalidatePath("/cms/redirects");
    return { ok: true, message: "Redirect saved." };
  } catch (error) {
    logOnce("cms", "redirect save failed", error);
    return { ok: false, message: "The redirect could not be saved." };
  }
}

export async function deleteRedirectAction(formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  const id = asInt(formData.get("id"), 0);
  if (!id) return { ok: false, message: "Unknown redirect." };

  const rows = await db.select().from(cmsRedirects).where(eq(cmsRedirects.id, id)).limit(1);
  await db.delete(cmsRedirects).where(eq(cmsRedirects.id, id));
  await recordActivity({ userId: user.id, action: "redirect.deleted", entity: "redirect", entityId: id, summary: rows[0] ? `Deleted ${rows[0].fromPath}.` : "Deleted a redirect." });
  clearRedirectCache();
  revalidatePath("/cms/redirects");
  return { ok: true, message: "Redirect deleted." };
}

/* ══════════════════════════════════════════════════════════════════════════
   Users
   ══════════════════════════════════════════════════════════════════════════ */

export async function saveUserAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow(["admin"]);
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const id = asInt(formData.get("id"), 0);
  const parsed = validateUserInput(formData, { requirePassword: !id });
  if (!parsed.ok) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: parsed.errors };
  }

  try {
    if (id) {
      const rows = await db.select().from(cmsUsers).where(eq(cmsUsers.id, id)).limit(1);
      const target = rows[0];
      if (!target) return { ok: false, message: "That account no longer exists." };

      const patch: Partial<typeof cmsUsers.$inferInsert> = {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        isActive: asBool(formData.get("isActive")),
        updatedAt: new Date(),
      };
      if (parsed.data.password) {
        patch.passwordHash = await hashPassword(parsed.data.password);
        patch.tokenVersion = target.tokenVersion + 1;
      }
      await db.update(cmsUsers).set(patch).where(eq(cmsUsers.id, id));
      if (parsed.data.password) await destroyUserSessions(id);

      await recordActivity({ userId: user.id, action: "user.updated", entity: "user", entityId: id, summary: `Updated the account ${parsed.data.email}.` });
      return { ok: true, message: "Account updated." };
    }

    const existing = await db.select({ id: cmsUsers.id }).from(cmsUsers).where(eq(cmsUsers.email, parsed.data.email)).limit(1);
    if (existing.length) return { ok: false, message: "An account with that email already exists.", fieldErrors: { email: "That email is already in use." } };

    await db.insert(cmsUsers).values({
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await hashPassword(parsed.data.password!),
      isActive: asBool(formData.get("isActive")) || true,
    });
    await recordActivity({ userId: user.id, action: "user.created", entity: "user", entityId: null, summary: `Created the account ${parsed.data.email}.` });
    return { ok: true, message: "Account created." };
  } catch (error) {
    logOnce("cms", "user save failed", error);
    return { ok: false, message: "The account could not be saved." };
  }
}

export async function deleteUserAction(formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow(["admin"]);
  const id = asInt(formData.get("id"), 0);
  if (!id) return { ok: false, message: "Unknown account." };
  if (id === user.id) return { ok: false, message: "You cannot delete the account you are signed in with." };

  const rows = await db.select().from(cmsUsers).where(eq(cmsUsers.id, id)).limit(1);
  const target = rows[0];
  if (!target) return { ok: false, message: "That account no longer exists." };

  // The last administrator must stay, or nobody could sign in to fix it.
  if (target.role === "admin") {
    const admins = await db.select({ id: cmsUsers.id }).from(cmsUsers).where(eq(cmsUsers.role, "admin"));
    if (admins.length <= 1) return { ok: false, message: "The last administrator account cannot be removed." };
  }

  await db.delete(cmsUsers).where(eq(cmsUsers.id, id));
  await recordActivity({ userId: user.id, action: "user.deleted", entity: "user", entityId: id, summary: `Deleted the account ${target.email}.` });
  return { ok: true, message: "Account deleted." };
}

/* ══════════════════════════════════════════════════════════════════════════
   Settings
   ══════════════════════════════════════════════════════════════════════════ */

export async function saveSettingsAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow(["admin"]);
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const values: Partial<Record<CmsSettingKey, string>> = {};
  for (const [key] of Object.entries(formData.getAll("__setting") as string[])) void key;
  for (const key of [
    "blog.title",
    "blog.description",
    "blog.postsPerPage",
    "blog.defaultOgImage",
    "blog.commentsEnabled",
    "blog.authorName",
    "blog.authorBio",
    "seo.titleSuffix",
    "seo.defaultKeywords",
    "revalidate.webhookSecret",
    "security.sessionIdleMinutes",
  ] as CmsSettingKey[]) {
    const value = formData.get(key);
    if (value !== null) values[key] = asTrimmed(value);
  }

  try {
    await setSettings(values);
    await recordActivity({ userId: user.id, action: "settings.updated", entity: "settings", entityId: null, summary: "Updated the site settings." });
    revalidatePath("/blog");
    revalidatePath("/cms/settings");
    return { ok: true, message: "Settings saved." };
  } catch (error) {
    logOnce("cms", "settings save failed", error);
    return { ok: false, message: "The settings could not be saved." };
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Profile
   ══════════════════════════════════════════════════════════════════════════ */

export async function changePasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUserOrThrow();
  if (!isDatabaseConfigured()) return { ok: false, message: "The database is not configured." };

  const current = asString(formData.get("currentPassword"));
  const next = asString(formData.get("newPassword"));

  const rows = await db.select().from(cmsUsers).where(eq(cmsUsers.id, user.id)).limit(1);
  const account = rows[0];
  if (!account) return { ok: false, message: "That account no longer exists." };

  if (!(await verifyPassword(current, account.passwordHash))) {
    return { ok: false, message: "Your current password is not correct.", fieldErrors: { currentPassword: "That is not your current password." } };
  }
  if (current === next) {
    return { ok: false, message: "Choose a different password.", fieldErrors: { newPassword: "The new password must be different." } };
  }

  const { validatePassword } = await import("@/lib/cms/validation");
  const problem = validatePassword(next);
  if (problem) return { ok: false, message: problem, fieldErrors: { newPassword: problem } };

  await db.update(cmsUsers).set({ passwordHash: await hashPassword(next), tokenVersion: account.tokenVersion + 1, updatedAt: new Date() }).where(eq(cmsUsers.id, user.id));
  await destroyUserSessions(user.id);

  // Sign the editor back in with a fresh session on this device.
  const request = new Request("http://localhost", { headers: await headers() });
  const token = await createSession(user.id, request);
  const store = await cookies();
  const options = sessionCookieOptions();
  store.set(options.name, token, { httpOnly: options.httpOnly, sameSite: options.sameSite, secure: options.secure, path: options.path, maxAge: options.maxAge });

  await recordActivity({ userId: user.id, action: "user.password_changed", entity: "user", entityId: user.id, summary: `${user.name} changed their password.` });
  return { ok: true, message: "Password changed." };
}
