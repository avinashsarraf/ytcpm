import { describe, it, expect } from "vitest";
import {
  canonicalRedirectTarget,
  firstHeaderValue,
  hostnameFromValue,
  publicOrigin,
  requestHostname,
  requestProtocol,
  type IncomingRequestHeaders,
} from "@/lib/request-origin";

const CANONICAL = "ytcpm.online";

/**
 * Build the header bag the way the proxy does. `fallbackHost` is the value
 * `next start` actually reports — `localhost:3000` — which is exactly the trap
 * that made the first version of this redirect silently do nothing.
 */
function headers(over: Partial<IncomingRequestHeaders> = {}): IncomingRequestHeaders {
  return {
    host: "localhost:3000",
    forwardedHost: null,
    forwardedProto: null,
    fallbackHost: "localhost:3000",
    fallbackProtocol: "http:",
    ...over,
  };
}

const prod = (over: Partial<IncomingRequestHeaders> = {}) =>
  headers({ host: "ytcpm.online", forwardedHost: "ytcpm.online", forwardedProto: "https", ...over });

describe("firstHeaderValue", () => {
  it("takes the first entry of a proxy chain", () => {
    expect(firstHeaderValue("https, http")).toBe("https");
    expect(firstHeaderValue("ytcpm.online, internal:3000")).toBe("ytcpm.online");
  });

  it("trims and lower-cases", () => {
    expect(firstHeaderValue("  HTTPS  ")).toBe("https");
  });

  it("treats missing and blank values as absent", () => {
    expect(firstHeaderValue(null)).toBeNull();
    expect(firstHeaderValue(undefined)).toBeNull();
    expect(firstHeaderValue("")).toBeNull();
    expect(firstHeaderValue("   ")).toBeNull();
  });
});

describe("hostnameFromValue", () => {
  it("drops a port", () => {
    expect(hostnameFromValue("ytcpm.online:3100")).toBe("ytcpm.online");
  });

  it("copies the host name as-is apart from case", () => {
    expect(hostnameFromValue("WWW.YTCPM.Online")).toBe("www.ytcpm.online");
  });

  it("survives an IPv6 literal", () => {
    expect(hostnameFromValue("[::1]:3000")).toBe("[::1]");
  });

  it("returns null for absent or unparseable values", () => {
    expect(hostnameFromValue(null)).toBeNull();
    expect(hostnameFromValue("not a host")).toBeNull();
  });
});

describe("requestHostname", () => {
  it("prefers the proxy's restatement of the host", () => {
    expect(requestHostname(headers({ forwardedHost: "ytcpm.online", host: "internal:3000" }))).toBe(
      "ytcpm.online",
    );
  });

  it("falls back to the Host header", () => {
    expect(requestHostname(headers({ host: "www.ytcpm.online:80" }))).toBe("www.ytcpm.online");
  });

  it("uses the bind address only when no host header exists", () => {
    expect(requestHostname(headers({ host: null }))).toBe("localhost");
  });
});

describe("requestProtocol", () => {
  it("is null when no proxy reported a scheme", () => {
    expect(requestProtocol(headers())).toBeNull();
  });

  it("reads the forwarded scheme", () => {
    expect(requestProtocol(headers({ forwardedProto: "HTTP" }))).toBe("http");
  });
});

describe("publicOrigin", () => {
  it("builds the public origin instead of the bind address", () => {
    expect(publicOrigin(prod())).toBe("https://ytcpm.online");
  });

  it("keeps the scheme the proxy reported", () => {
    expect(publicOrigin(prod({ forwardedProto: "http" }))).toBe("http://ytcpm.online");
  });

  it("falls back to the bind address, port included, when no host header exists", () => {
    expect(publicOrigin(headers({ host: null, fallbackProtocol: "https:" }))).toBe(
      "https://localhost:3000",
    );
  });

  /* The bug this suite exists for: a redirect that loses the port still looks
     like a working redirect, and lands on port 80 instead of the app. */
  it("keeps a non-default port", () => {
    expect(publicOrigin(headers({ host: "127.0.0.1:3131" }))).toBe("http://127.0.0.1:3131");
    expect(publicOrigin(prod({ forwardedHost: "ytcpm.online:8443" }))).toBe(
      "https://ytcpm.online:8443",
    );
  });

  it("drops the default port for the scheme", () => {
    expect(publicOrigin(prod({ forwardedHost: "ytcpm.online:443" }))).toBe("https://ytcpm.online");
    expect(publicOrigin(headers({ host: "ytcpm.online:80" }))).toBe("http://ytcpm.online");
  });

  it("keeps port 443 when the request is plain http", () => {
    expect(publicOrigin(headers({ host: "ytcpm.online:443" }))).toBe("http://ytcpm.online:443");
  });
});

describe("canonicalRedirectTarget", () => {
  it("sends http to https on the apex host", () => {
    const target = canonicalRedirectTarget(prod({ forwardedProto: "http" }), CANONICAL, "/", "");
    expect(target?.toString()).toBe("https://ytcpm.online/");
  });

  it("keeps the path and query string", () => {
    const target = canonicalRedirectTarget(
      prod({ forwardedProto: "http" }),
      CANONICAL,
      "/cpm-by-country/bangladesh",
      "?ref=ga",
    );
    expect(target?.toString()).toBe("https://ytcpm.online/cpm-by-country/bangladesh?ref=ga");
  });

  it("collapses www to the apex host even over https", () => {
    const target = canonicalRedirectTarget(
      headers({ host: "www.ytcpm.online", forwardedHost: "www.ytcpm.online", forwardedProto: "https" }),
      CANONICAL,
      "/blog",
      "",
    );
    expect(target?.toString()).toBe("https://ytcpm.online/blog");
  });

  it("sends http://www to https://apex in one hop", () => {
    const target = canonicalRedirectTarget(
      headers({ host: "www.ytcpm.online", forwardedHost: "www.ytcpm.online", forwardedProto: "http" }),
      CANONICAL,
      "/",
      "",
    );
    expect(target?.toString()).toBe("https://ytcpm.online/");
  });

  it("leaves an https apex request alone", () => {
    expect(canonicalRedirectTarget(prod(), CANONICAL, "/", "")).toBeNull();
  });

  it("fails open when no proxy reports a scheme — no redirect loop", () => {
    expect(
      canonicalRedirectTarget(prod({ forwardedProto: null }), CANONICAL, "/", ""),
    ).toBeNull();
  });

  it("never redirects a preview host", () => {
    expect(
      canonicalRedirectTarget(
        headers({
          host: "3100-abc.e2b.app",
          forwardedHost: "3100-abc.e2b.app",
          forwardedProto: "http",
        }),
        CANONICAL,
        "/",
        "",
      ),
    ).toBeNull();
  });

  it("never redirects localhost", () => {
    expect(canonicalRedirectTarget(headers({ forwardedProto: "http" }), CANONICAL, "/", "")).toBeNull();
  });

  it("matches the canonical host even when the header carries a port", () => {
    const target = canonicalRedirectTarget(
      headers({ host: "ytcpm.online:3100", forwardedProto: "http" }),
      CANONICAL,
      "/",
      "",
    );
    expect(target?.toString()).toBe("https://ytcpm.online/");
  });

  it("does not treat a look-alike host as canonical", () => {
    for (const host of ["ytcpm.online.evil.test", "notytcpm.online", "www.ytcpm.online.evil.test"]) {
      expect(
        canonicalRedirectTarget(headers({ host, forwardedProto: "http" }), CANONICAL, "/", ""),
      ).toBeNull();
    }
  });
});
