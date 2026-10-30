import { NextResponse, type NextRequest } from "next/server";
import { loadRedirectRules } from "@/lib/cms/redirects";
import { SESSION_COOKIE } from "@/lib/cms/auth";
import { canonicalRedirectTarget, publicOrigin } from "@/lib/request-origin";

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

/**
 * The one host this site is served from.
 *
 * HTTPS is only enforced for this host, and only when a proxy says the request
 * arrived over http — see `canonicalRedirectTarget`.
 */
const CANONICAL_HOST = "ytcpm.online";

/**
 * The request headers that decide which URL the visitor asked for.
 *
 * `request.nextUrl` is passed only as a last resort: Next builds it from the
 * address the server bound to, so it reports `localhost:3000` behind a proxy.
 * See `src/lib/request-origin.ts` for the rules and their tests.
 */
function originHeaders(request: NextRequest) {
  return {
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    fallbackHost: request.nextUrl.host,
    fallbackProtocol: request.nextUrl.protocol,
  };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
    0. One URL per page.
    Search Console reported http://ytcpm.online/ and https://ytcpm.online/ as
    two separate homepages, and the insecure copy held the larger share of
    impressions. A canonical tag fixes that slowly; a redirect fixes it on the
    next crawl.

    Scoped deliberately: the redirect only applies to this site's own hosts.
    A preview deployment, a staging domain or localhost must not be bounced to
    production, and a blanket "anything not canonical" rule would do exactly
    that.
  */
  const headers = originHeaders(request);
  const target = canonicalRedirectTarget(
    headers,
    CANONICAL_HOST,
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  if (target) return NextResponse.redirect(target, 308);

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
      const target = new URL("/cms/login", publicOrigin(headers));
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

  const destination = new URL(match.toPath, publicOrigin(headers));
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
