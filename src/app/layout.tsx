import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});
const jbmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ytcpm.online"),
  title: {
    default:
      "YouTube CPM Calculator 2026 — Check CPM & Earnings by Country and Niche | ytcpm.online",
    template: "%s | ytcpm.online",
  },
  description:
    "Free YouTube CPM calculator & money calculator. Check real 2026 CPM and RPM rates for 23 countries and 18 niches, and estimate how much YouTube pays per 1,000 views for your channel.",
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
  authors: [{ name: "ytcpm.online" }],
  creator: "ytcpm.online",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ytcpm.online",
    title: "YouTube CPM Calculator 2026 — Check Rates by Country & Niche",
    description:
      "How much does YouTube pay you? Check real CPM/RPM rates for your country and niche, then calculate your earnings per 1,000 views — free.",
    url: "https://ytcpm.online",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "YouTube CPM Calculator — ytcpm.online" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube CPM Calculator 2026 — ytcpm.online",
    description:
      "Check real 2026 CPM & RPM rates for 23 countries and 18 niches. Free YouTube money calculator.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#070709",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${space.variable} ${instrument.variable} ${jbmono.variable}`}
    >
      <body className="bg-ink antialiased">
        <div className="bg-noise" aria-hidden />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
