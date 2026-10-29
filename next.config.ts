import type { NextConfig } from "next";
import { AHREFS_ANALYTICS } from "./src/lib/analytics";

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
      // analytics.ahrefs.com is the one third-party script (src/lib/analytics.ts).
      `script-src 'self' 'unsafe-inline' ${AHREFS_ANALYTICS.origin}${development ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // The analytics script posts its measurements back to the same origin it
      // was loaded from; without this it loads and reports nothing.
      development
        ? `connect-src 'self' ws: wss: ${AHREFS_ANALYTICS.origin}`
        : `connect-src 'self' ${AHREFS_ANALYTICS.origin}`,
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
    ];
  },
};

export default nextConfig;
