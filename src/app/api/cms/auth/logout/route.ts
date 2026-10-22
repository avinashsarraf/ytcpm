import { cookies } from "next/headers";
import { getCurrentUser, destroySession } from "@/lib/cms/session";
import { recordActivity } from "@/lib/cms/activity";
import { sessionCookieOptions } from "@/lib/cms/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/cms/auth/logout
 *
 * Ends the current CMS session and clears the cookie. Safe to call without a
 * session — it simply reports that nobody is signed in.
 */
export async function POST() {
  const noStore = { "Cache-Control": "no-store" };
  const user = await getCurrentUser();

  await destroySession();
  if (user) {
    await recordActivity({ userId: user.id, action: "auth.logout", entity: "user", entityId: user.id, summary: `${user.name} signed out through the API.` });
  }

  const store = await cookies();
  const options = sessionCookieOptions();
  store.set(options.name, "", { httpOnly: true, sameSite: "lax", secure: options.secure, path: "/", maxAge: 0 });

  return Response.json({ ok: true, signedIn: false }, { headers: noStore });
}
