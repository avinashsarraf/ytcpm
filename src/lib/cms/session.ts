import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsSessions, cmsUsers, type CmsUser } from "@/db/schema";
import { logOnce } from "@/lib/log";
import { clientKey } from "@/lib/rate-limit";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  hashSessionToken,
  sessionCookieOptions,
} from "./auth";

/**
 * Session lifecycle and the admin guard.
 *
 * Every server action and every admin page calls `requireUser()` first — the
 * guard lives in the data layer, not only in the UI, so a hidden button is
 * never the thing that protects an endpoint.
 */

export type CmsUserSession = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor";
};

export type CmsUserRow = CmsUser;

function toSession(user: CmsUser): CmsUserSession {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/** True when a database is available. The CMS is unusable without one. */
export function cmsAvailable(): boolean {
  return isDatabaseConfigured();
}

/**
 * Resolves the current CMS user from the session cookie.
 * Returns null when there is no cookie, the session expired or the DB is down.
 */
export async function getCurrentUser(): Promise<CmsUserSession | null> {
  if (!isDatabaseConfigured()) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20 || token.length > 256) return null;

  const sessionId = hashSessionToken(token);
  try {
    const rows = await db
      .select({ user: cmsUsers, session: cmsSessions })
      .from(cmsSessions)
      .innerJoin(cmsUsers, eq(cmsSessions.userId, cmsUsers.id))
      .where(and(eq(cmsSessions.id, sessionId), gt(cmsSessions.expiresAt, new Date())))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    if (!row.user.isActive) return null;

    // Sliding expiry: keep an active editor signed in.
    if (Date.now() - row.session.lastSeenAt.getTime() > 5 * 60 * 1000) {
      await db
        .update(cmsSessions)
        .set({ lastSeenAt: new Date() })
        .where(eq(cmsSessions.id, sessionId));
    }

    return toSession(row.user);
  } catch (error) {
    logOnce("cms", "session lookup failed", error);
    return null;
  }
}

/**
 * The admin guard. Redirects to the login page when there is no session.
 * `roles` restricts an action to administrators.
 */
export async function requireUser(roles?: ("admin" | "editor")[]): Promise<CmsUserSession> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/cms/login");
  }
  if (roles && !roles.includes(user.role)) {
    redirect("/cms?error=forbidden");
  }
  return user;
}

/** The guard for server actions: throws instead of redirecting so the action can return an error. */
/**
 * Like `requireUserOrThrow`, but returns a result instead of throwing.
 *
 * A Server Action that throws renders Next's error page, which replaces the
 * admin screen and shows the user a stack-trace-shaped message they cannot do
 * anything with. Actions prefer this: they answer with an ordinary error
 * message inside the form they were submitted from.
 *
 * The distinction is deliberate. Being signed out and being signed in without
 * the right role are different failures, and the caller decides how to phrase
 * them.
 */
export type AuthResult =
  | { ok: true; user: CmsUserSession }
  | { ok: false; reason: "signed-out" | "forbidden" };

export async function requireUserResult(roles?: ("admin" | "editor")[]): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "signed-out" };
  if (roles && !roles.includes(user.role)) return { ok: false, reason: "forbidden" };
  return { ok: true, user };
}

/** The message an action returns when `requireUserResult` fails. */
export function authMessage(reason: "signed-out" | "forbidden"): string {
  return reason === "signed-out"
    ? "Your session has expired. Sign in again in another tab, then retry."
    : "Only an administrator can do that.";
}

export async function requireUserOrThrow(roles?: ("admin" | "editor")[]): Promise<CmsUserSession> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in.");
  if (roles && !roles.includes(user.role)) throw new Error("Not allowed.");
  return user;
}

/** Creates a session row and returns the raw token to put in the cookie. */
export async function createSession(userId: number, request: Request | null): Promise<string> {
  const token = createSessionToken();
  const now = new Date();
  await db.insert(cmsSessions).values({
    id: hashSessionToken(token),
    userId,
    expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
    lastSeenAt: now,
    userAgent: request ? request.headers.get("user-agent")?.slice(0, 400) ?? null : null,
    ip: request ? clientKey(request).slice(0, 64) : null,
  });
  return token;
}

/** Removes the session row and clears the cookie. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && isDatabaseConfigured()) {
    try {
      await db.delete(cmsSessions).where(eq(cmsSessions.id, hashSessionToken(token)));
    } catch (error) {
      logOnce("cms", "session delete failed", error);
    }
  }
  store.delete(SESSION_COOKIE);
}

/** Removes every session for a user (used after a password change). */
export async function destroyUserSessions(userId: number): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await db.delete(cmsSessions).where(eq(cmsSessions.userId, userId));
  } catch (error) {
    logOnce("cms", "user session purge failed", error);
  }
}

/** Removes expired sessions. Called opportunistically from the dashboard. */
export async function pruneExpiredSessions(): Promise<number> {
  if (!isDatabaseConfigured()) return 0;
  try {
    const deleted = await db.delete(cmsSessions).where(lt(cmsSessions.expiresAt, new Date())).returning({ id: cmsSessions.id });
    return deleted.length;
  } catch {
    return 0;
  }
}

export { SESSION_COOKIE, sessionCookieOptions };
