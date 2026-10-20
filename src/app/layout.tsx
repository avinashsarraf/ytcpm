import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { DATA_UPDATED_AT, DATA_YEAR } from "@/lib/data";

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
    `Free YouTube CPM calculator & money calculator. Check ${DATA_YEAR} CPM and RPM rates for 23 countries and 18 niches, and estimate how much YouTube pays per 1,000 views for your channel.`,
  keywords: [
    "youtube cpm calculator",
    "youtube money calculator",
    "youtube earnings calculator",
    "youtube rpm calculator",
    "youtube cpm rates by country",
    "how much does youtube pay per 1000 views",
    "youtube cpm checker",
  ],
  applicationName: "ytcpm.online",
  manifest: "/site.webmanifest",
  authors: [{ name: "ytcpm.online" }],
  creator: "ytcpm.online",
  alternates: { canonical: "/" },
  other: { "data-last-reviewed": DATA_UPDATED_AT },
  openGraph: {
    type: "website",
    siteName: "ytcpm.online",
    title: `YouTube CPM Calculator ${DATA_YEAR} — Check Rates by Country & Niche`,
    description:
      "How much does YouTube pay you? Check CPM/RPM rates for your country and niche, then calculate your earnings per 1,000 views — free.",
    url: "https://ytcpm.online",
  },
  twitter: {
    card: "summary_large_image",
    title: `YouTube CPM Calculator ${DATA_YEAR} — ytcpm.online`,
    description:
      `Check ${DATA_YEAR} CPM & RPM rates for 23 countries and 18 niches. Free YouTube money calculator.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
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
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
