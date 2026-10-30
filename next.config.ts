import type { NextConfig } from "next";
import { THIRD_PARTY_ORIGINS } from "./src/lib/analytics";

/**
 * Security headers. `unsafe-inline` for styles is required by Next's injected
 * style tags and the inline CSS custom property on the calculator slider.
 * Scripts allow same-origin and Next's inline bootstrap; JSON-LD
 * blocks are data (application/ld+json) and are not executed.
 */
const preview = process.env.ARENA_PREVIEW === "true" && process.env.NODE_ENV !== "production";
const development = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  ...(!preview ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  /*
    HSTS. Search Console listed http://ytcpm.online/ as a separate homepage
    from https://ytcpm.online/, with two clicks landing on the insecure URL and
    the larger share of impressions. The canonical tag was correct; the HTTP
    host was still serving the page. This header (with the redirect in
    src/proxy.ts) tells a browser to rewrite the host before it ever sends the
    request, so the two copies collapse into one URL.

    No `preload` and a one-year max-age: preload is effectively irreversible and
    belongs to a deliberate decision, not a config default.
  */
  ...(development ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js hydration bootstrap + framer-motion need inline scripts.
      // Third-party origins come from src/lib/analytics.ts, one list for both
      // directives, so a new integration cannot be half-allowed.
      `script-src 'self' 'unsafe-inline' ${THIRD_PARTY_ORIGINS.scripts.join(" ")}${development ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // Without this each script loads and then reports nothing.
      development
        ? `connect-src 'self' ws: wss: ${THIRD_PARTY_ORIGINS.connect.join(" ")}`
        : `connect-src 'self' ${THIRD_PARTY_ORIGINS.connect.join(" ")}`,
      ...(!preview ? ["frame-ancestors 'none'"] : []),
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Produces .next/standalone for the multi-stage Dockerfile (see deployment.md).
  output: "standalone",
  allowedDevOrigins: ["*.e2b.app"],
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Health endpoint is polled by Coolify — never cache it.
        source: "/api/health",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
      /*
        Static artwork in /public is served with `Cache-Control: public,
        max-age=0`, so every repeat visit re-downloads the flags and the hero.
        Behind Cloudflare that zero is replaced by the zone's fallback TTL,
        which Lighthouse measured at 4 hours — shorter than these files' real
        lifetime, and the reason it reported them as cacheable savings.

        These files are content-addressed by path, not by hash, so a changed
        flag means a new filename. `immutable` is honest here: the browser may
        keep it for a year without ever asking again.
      */
      {
        source: "/flags/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/hero-illustration.webp",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
