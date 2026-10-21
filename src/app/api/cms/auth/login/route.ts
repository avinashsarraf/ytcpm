import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, isDatabaseConfigured } from "@/db";
import { cmsUsers } from "@/db/schema";
import { logOnce } from "@/lib/log";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { sessionCookieOptions, verifyPassword } from "@/lib/cms/auth";
import { createSession } from "@/lib/cms/session";
import { recordActivity } from "@/lib/cms/activity";

export const dynamic = "force-dynamic";

/**
 * POST /api/cms/auth/login
 *
 * Signs in an editor from an external tool (a script, a CI job, a desktop
 * shortcut) and returns the session cookie. The browser sign-in form does not
 * use this route — it calls a Server Action — so this one exists purely for
 * automation.
 *
 * Body: { "email": "...", "password": "..." }
 */
export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };

  if (!isDatabaseConfigured()) {
    return Response.json({ ok: false, error: "The database is not configured." }, { status: 503, headers: noStore });
  }

  const limit = rateLimit(`cms-api-login:${clientKey(request)}`, 8, 15 * 60 * 1000);
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: "Too many sign-in attempts. Try again later." },
      { status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Send a JSON body with an email address and a password." }, { status: 400, headers: noStore });
  }

  const email = typeof (body as { email?: unknown })?.email === "string" ? String((body as { email: string }).email).trim().toLowerCase() : "";
  const password = typeof (body as { password?: unknown })?.password === "string" ? String((body as { password: string }).password) : "";
  if (!email || !password) {
    return Response.json({ ok: false, error: "An email address and a password are required." }, { status: 400, headers: noStore });
  }

  try {
    const rows = await db.select().from(cmsUsers).where(eq(cmsUsers.email, email)).limit(1);
    const user = rows[0];
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid || !user.isActive) {
      return Response.json({ ok: false, error: "Those credentials do not match an active account." }, { status: 401, headers: noStore });
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
    await recordActivity({ userId: user.id, action: "auth.login", entity: "user", entityId: user.id, summary: `${user.name} signed in through the API.` });

    return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { headers: noStore });
  } catch (error) {
    logOnce("cms", "api login failed", error);
    return Response.json({ ok: false, error: "Sign-in failed." }, { status: 500, headers: noStore });
  }
}

/** A valid hash of a random value, so a missing account and a wrong password take the same time. */
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
