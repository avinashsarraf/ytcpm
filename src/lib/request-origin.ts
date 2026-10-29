/**
 * Working out the URL a visitor actually asked for.
 *
 * The proxy cannot trust `request.nextUrl` for this. Next builds that URL from
 * the address the server bound to, so a `next start` or standalone deployment
 * reports `localhost:3000` for a request whose Host header says `ytcpm.online`.
 * Two things went wrong because of it:
 *
 *   - The http→https redirect compared `nextUrl.hostname` with the canonical
 *     host, never matched, and silently did nothing.
 *   - Redirects cloned from `nextUrl` sent real visitors to localhost.
 *
 * Proxies restate the original host in `x-forwarded-host`; a direct request
 * carries it in `host`. Both are handled here, in one place, with the rules
 * written down and tested — because the failure modes are quiet: a redirect
 * that never fires still returns a perfectly normal page, and one that loses
 * the port still answers with a redirect, just to the wrong address. That
 * second mistake broke the CMS end-to-end test, whose server runs on :3131.
 *
 * This module deliberately has no import from `next/server`, so the behaviour
 * can be unit-tested as plain values.
 */

/** Raw header values for one request. Each may be null when absent. */
export type IncomingRequestHeaders = {
  /** The `host` header, which usually includes a port. */
  host: string | null;
  /** The `x-forwarded-host` header set by a reverse proxy. */
  forwardedHost?: string | null;
  /** The `x-forwarded-proto` header set by a reverse proxy. */
  forwardedProto?: string | null;
  /** `nextUrl.host` — last resort only, and usually the bind address. */
  fallbackHost: string;
  /** `nextUrl.protocol`, with or without the trailing colon. */
  fallbackProtocol: string;
};

/**
 * First value of a possibly-comma-separated header, lower-cased.
 *
 * A chain of proxies appends rather than replaces, so `https, http` means the
 * request reached the first proxy over https and that is the value that counts.
 */
export function firstHeaderValue(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.length > 0 ? first : null;
}

/** The host the request names, without a port, or null when unparseable. */
export function hostnameFromValue(host: string | null): string | null {
  if (!host) return null;
  try {
    // `host` is a bare authority, so give it any scheme to parse it safely.
    // This also copes with IPv6 literals such as `[::1]:3000`.
    return new URL(`http://${host}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * The authority to write into a Location header: host plus port, with the
 * scheme's default port removed.
 *
 * Keeping the port matters. `ytcpm.online` and `localhost:3131` are both
 * "the host" for a comparison, but only the second one can be reached on
 * :3131 — strip the port and the redirect lands on port 80 instead.
 */
function authorityFor(host: string, proto: string): string | null {
  try {
    // Parsing against the real scheme is what normalises the default port
    // away: https://x:443 and http://x:80 come back without one.
    return new URL(`${proto}://${host}`).host;
  } catch {
    return null;
  }
}

/** The scheme the visitor used, or null when no proxy told us. */
export function requestProtocol(headers: IncomingRequestHeaders): string | null {
  return firstHeaderValue(headers.forwardedProto);
}

/**
 * The scheme the visitor used, falling back to what the server was serving.
 *
 * A missing header is not guessed as "http": a proxy that terminates TLS but
 * forgets `x-forwarded-proto` would then be answered with a redirect to the
 * same https URL, forever. Enforcement decisions use `requestProtocol` and
 * stay silent; building a Location header uses this and has to produce
 * something.
 */
function effectiveProtocol(headers: IncomingRequestHeaders): string {
  return (
    requestProtocol(headers) ??
    (headers.fallbackProtocol.replace(/:$/, "").toLowerCase() || "http")
  );
}

/** The raw `host[:port]` the request names, preferring the proxy's restatement. */
export function rawAuthority(headers: IncomingRequestHeaders): string | null {
  return (
    firstHeaderValue(headers.forwardedHost) ??
    firstHeaderValue(headers.host) ??
    firstHeaderValue(headers.fallbackHost)
  );
}

/** The host the visitor asked for, without a port — for comparisons only. */
export function requestHostname(headers: IncomingRequestHeaders): string | null {
  return hostnameFromValue(rawAuthority(headers));
}

/** Absolute origin for Location headers, built from the request, never the bind address. */
export function publicOrigin(headers: IncomingRequestHeaders): string {
  const proto = effectiveProtocol(headers);
  const raw = rawAuthority(headers);
  if (raw) {
    const authority = authorityFor(raw, proto);
    if (authority) return `${proto}://${authority}`;
  }
  return `${proto}://${hostnameFromValue(headers.fallbackHost) ?? headers.fallbackHost}`;
}

/**
 * The https, no-www address for this request, or null when nothing needs to
 * change.
 *
 * Scoped on purpose. Only this site's own hosts are redirected: a preview
 * deployment, a staging domain or `localhost` must never be bounced to
 * production, and a blanket "anything not canonical" rule would do exactly that.
 */
export function canonicalRedirectTarget(
  headers: IncomingRequestHeaders,
  canonicalHost: string,
  pathname: string,
  search: string,
): URL | null {
  const hostname = requestHostname(headers);
  const isApex = hostname === canonicalHost;
  const isWww = hostname === `www.${canonicalHost}`;
  if (!isApex && !isWww) return null;

  const proto = requestProtocol(headers);
  const isInsecure = proto !== null && proto !== "https";
  if (!isInsecure && !isWww) return null;

  return new URL(`${pathname}${search}`, `https://${canonicalHost}`);
}
