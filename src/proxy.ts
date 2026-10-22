import { NextResponse, type NextRequest } from "next/server";
import { loadRedirectRules } from "@/lib/cms/redirects";
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
 *    rule set is cached in-process for 60 seconds and cleared as soon as a
 *    rule is saved, and every database problem fails open: the request
 *    continues as if no redirect existed, because a broken database must
 *    never take the site down.
 */

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. CMS gate.
  if (pathname === "/cms" || pathname.startsWith("/cms/")) {
    if (pathname === "/cms/login" || pathname.startsWith("/cms/login/")) {
      return NextResponse.next();
    }

    /*
      Only page loads are redirected. A Server Action is a POST to a /cms URL,
      and answering it with a redirect turns an expired session into "an
      unexpected response was received from the server" in the browser — the
      action never runs, so it cannot return its own message. Actions
      authenticate themselves and answer inside the form, so they are let
      through; the layout still guards every page.
    */
    const isAction = request.method === "POST";
    if (!isAction && !request.cookies.get(SESSION_COOKIE)?.value) {
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

  const rules = await loadRedirectRules();
  if (!rules || rules.length === 0) return NextResponse.next();

  const match = rules.find((rule) => rule.fromPath === pathname);
  if (!match) return NextResponse.next();

  const destination = new URL(match.toPath, request.nextUrl.origin);
  const response = NextResponse.redirect(
    destination,
    match.statusCode === 302 ? 302 : match.statusCode === 307 ? 307 : match.statusCode === 308 ? 308 : 301,
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|image-sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|txt|xml)$).*)"],
};
