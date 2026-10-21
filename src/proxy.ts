import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { cmsRedirects } from "@/db/schema";
import { logOnce } from "@/lib/log";
import { SESSION_COOKIE } from "@/lib/cms/auth";

/**
 * The request proxy.
 *
 * Next 16 runs the proxy on the Node.js runtime, so it can talk to Postgres
 * directly. It does two jobs:
 *
 * 1. CMS gate — a request for /cms without a session cookie is sent to the
 *    sign-in page before any CMS page renders. The session itself is still
 *    verified in the CMS layout and in every Server Action, so this is a fast
 *    path, not the protection.
 *
 * 2. Editor-managed redirects — a 301/302 rule stored in the database. The
 *    rule set is cached in-process for 60 seconds, and every database problem
 *    fails open: the request continues as if no redirect existed, because a
 *    broken database must never take the site down.
 */

const REDIRECT_CACHE_MS = 60_000;

type RedirectRule = { fromPath: string; toPath: string; statusCode: number };

const globalForProxy = globalThis as typeof globalThis & {
  __ytcpmRedirectCache?: { rules: RedirectRule[]; expiresAt: number };
};

function cachedRules(): RedirectRule[] | null {
  const cache = globalForProxy.__ytcpmRedirectCache;
  if (!cache) return null;
  if (cache.expiresAt <= Date.now()) {
    globalForProxy.__ytcpmRedirectCache = undefined;
    return null;
  }
  return cache.rules;
}

async function loadRules(): Promise<RedirectRule[] | null> {
  const cached = cachedRules();
  if (cached) return cached;

  if (!isDatabaseConfigured()) return null;

  try {
    const rows = await db
      .select({ fromPath: cmsRedirects.fromPath, toPath: cmsRedirects.toPath, statusCode: cmsRedirects.statusCode })
      .from(cmsRedirects)
      .where(eq(cmsRedirects.isActive, true))
      .limit(500);

    const rules = rows.map((row) => ({ fromPath: row.fromPath, toPath: row.toPath, statusCode: row.statusCode }));
    globalForProxy.__ytcpmRedirectCache = { rules, expiresAt: Date.now() + REDIRECT_CACHE_MS };
    return rules;
  } catch (error) {
    // Fail open — a database outage must not break the public site.
    logOnce("cms", "redirect lookup failed", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CMS gate.
  if (pathname === "/cms" || pathname.startsWith("/cms/")) {
    if (pathname === "/cms/login" || pathname.startsWith("/cms/login/")) {
      return NextResponse.next();
    }
    if (!request.cookies.get(SESSION_COOKIE)?.value) {
      const target = request.nextUrl.clone();
      target.pathname = "/cms/login";
      target.search = "";
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  // 2. Editor-managed redirects.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const rules = await loadRules();
  if (!rules || rules.length === 0) return NextResponse.next();

  const match = rules.find((rule) => rule.fromPath === pathname);
  if (!match) return NextResponse.next();

  const destination = new URL(match.toPath, request.nextUrl.origin);
  const response = NextResponse.redirect(destination, match.statusCode === 302 ? 302 : match.statusCode === 307 ? 307 : match.statusCode === 308 ? 308 : 301);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|image-sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|txt|xml)$).*)"],
};
