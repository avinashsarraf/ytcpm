import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import { SITE_URL } from "@/lib/editorial";
import { serializeJsonLd } from "@/lib/seo";
import { DATA_UPDATED_AT, DATA_YEAR } from "@/lib/data";
import { AHREFS_ANALYTICS, analyticsEnabled } from "@/lib/analytics";

/**
 * Plus Jakarta Sans drives the whole interface (display + body), matching the
 * reference design's geometric grotesque. JetBrains Mono is kept for tabular
 * data on the reference pages. Both are self-hosted so `next build` never needs
 * network access to fonts.googleapis.com — see src/app/fonts/LICENSE-*.txt.
 */
const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  display: "swap",
});
const jbmono = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  variable: "--font-jbmono",
  weight: "100 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ytcpm.online"),
  title: {
    default: `YouTube CPM Calculator ${DATA_YEAR} — Earnings by Country & Niche`,
    template: "%s | ytcpm.online",
  },
  description:
    "Free YouTube CPM, RPM and earnings calculators. Understand your report metrics and compare clearly labeled audience-country and niche scenarios.",
  applicationName: "ytcpm.online",
  manifest: "/site.webmanifest",
  authors: [{ name: "ytcpm.online" }],
  creator: "ytcpm.online",
  alternates: { canonical: "/" },
  other: { "data-snapshot-date": DATA_UPDATED_AT },
  openGraph: {
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "YTCPM: YouTube country and niche earnings scenarios" }],
    type: "website",
    siteName: "ytcpm.online",
    title: `YouTube CPM Calculator ${DATA_YEAR} — Check Rates by Country & Niche`,
    description:
      "Calculate CPM and RPM from your reports, estimate YouTube earnings, and learn how to check your actual monetization metrics.",
    url: "https://ytcpm.online",
  },
  twitter: {
      images: ["/opengraph-image"],
    card: "summary_large_image",
    title: `YouTube CPM Calculator ${DATA_YEAR} — ytcpm.online`,
    description:
      `Check ${DATA_YEAR} CPM & RPM rates for 23 countries and 18 niches. Free YouTube money calculator.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jbmono.variable}`}
    >
      <body className="bg-ink antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        {/* Without JS the reveal wrappers would stay at opacity 0. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <div className="bg-noise" aria-hidden />
        {/*
          Ahrefs Web Analytics, exactly as Ahrefs issue it: one async script in
          the head. React 19 hoists an async <script> out of the tree and into
          <head> during server rendering, so the tag is in the HTML a crawler or
          Ahrefs' own installer check receives — `next/script` with
          afterInteractive only injected it from JavaScript, and with
          beforeInteractive only preloaded it.

          `async` means it downloads in parallel and runs whenever it is ready,
          so it never blocks parsing or hydration.

          The CSP in next.config.ts allows the same origin in script-src and
          connect-src; see src/lib/analytics.ts for why both are required and
          for the post-deploy check.

          It records which page was viewed, so a draft's preview URL (which
          carries a short-lived token) would be recorded if somebody opened it
          in a browser. Preview URLs are noindex and unguessable and the token
          expires in seven days, but that is why preview links should not be
          pasted into public places.
        */}
        {analyticsEnabled() && (
          <script
            async
            src={AHREFS_ANALYTICS.scriptSrc}
            data-key={AHREFS_ANALYTICS.key}
          />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({ "@context": "https://schema.org", "@graph": [
          { "@type": "Organization", "@id": SITE_URL + "/#organization", name: "YTCPM", url: SITE_URL, logo: SITE_URL + "/icon.svg" },
          { "@type": "WebSite", "@id": SITE_URL + "/#website", name: "YTCPM", alternateName: "ytcpm.online", url: SITE_URL, inLanguage: "en", publisher: { "@id": SITE_URL + "/#organization" } }
        ] }) }} />
        <PublicHeader />
        <main id="main">{children}</main>
        <PublicFooter />
      </body>
    </html>
  );
}
