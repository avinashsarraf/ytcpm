import Link from "next/link";
import ProsePage from "./prose-page";
import MetricCalculator from "./metric-calculator";
import { SourceLinks } from "./source-notice";
import { SITE_URL } from "@/lib/editorial";
import { breadcrumbs, serializeJsonLd, webPageSchema } from "@/lib/seo";
export default function MetricToolPage({ metric }: { metric: "CPM" | "RPM" }) {
  const cpm = metric === "CPM";
  const path = `/youtube-${metric.toLowerCase()}-calculator`;
  const title = cpm ? "YouTube CPM Calculator" : "YouTube RPM Calculator";
  const description = cpm ? "Calculate advertiser CPM from gross ad revenue and ad impressions. Understand your rate without confusing video views with impressions or creator revenue with advertiser spend." : "Calculate creator revenue per 1,000 views from your own report. Use the same date range and video format for both inputs; this is not a public channel earnings lookup.";
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([{ "@context": "https://schema.org", "@type": "WebApplication", name: title, description, url: SITE_URL + path, applicationCategory: "FinanceApplication", operatingSystem: "Any", isAccessibleForFree: true, publisher: { "@id": SITE_URL + "/#organization" } }, breadcrumbs([{ name: "Home", path: "/" }, { name: title, path }]), webPageSchema({ path, name: title, description, section: "Creator tools", about: [cpm ? "YouTube CPM calculation" : "YouTube RPM calculation"] })]) }} />
    <ProsePage eyebrow="Free · No login · Browser-only calculation" title={title} lede={description}>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link> / {title}</nav>
      <p className="rounded-xl bg-surface p-4 leading-relaxed"><strong className="text-heading">Quick answer:</strong> {cpm ? "CPM = gross ad revenue ÷ ad impressions × 1,000. You cannot calculate actual CPM from public views alone." : "RPM = creator revenue ÷ the corresponding view count × 1,000. A measured RPM already reflects the revenue share used by the report."}</p>
      <MetricCalculator metric={metric} />
      <section className="mt-8 space-y-3 leading-relaxed"><h2 className="text-xl font-bold text-heading">{metric} formula and worked example</h2>
        <p>{cpm ? "With $100 gross ad revenue and 10,000 ad impressions in the same period, CPM is $100 ÷ 10,000 × 1,000 = $10. This is advertiser cost before sharing, not $10 of creator earnings per 1,000 video views." : "With $55 creator revenue and 20,000 matching views, RPM is $55 ÷ 20,000 × 1,000 = $2.75. At an unchanged $2.75 RPM, a forecast of 100,000 comparable views would imply $275. Future RPM may change."}</p>
        <p>These are hypothetical examples, not measured averages, payout promises or official country rates. Values are displayed in USD; convert both amounts consistently before comparing different currencies.</p>
      </section>
      <section className="mt-8 space-y-3 leading-relaxed"><h2 className="text-xl font-bold text-heading">Choose the right denominator</h2><p>{cpm ? "Ad impressions count individual ads. Monetized playbacks count video playbacks with one or more ads. Total video views also include views where no ad was shown. For playback-based CPM, use the monetized-playback denominator in the appropriate report instead." : "For long-form RPM, use all matching video views, including non-monetized views. YouTube describes Shorts RPM using engaged views. Separate formats and revenue sources; Studio RPM may include Premium, memberships and other eligible YouTube revenue that an ad-only forecast excludes."}</p></section>
      <section className="mt-8 space-y-3 leading-relaxed"><h2 className="text-xl font-bold text-heading">Find and monitor your actual rate</h2><p>Check your own YouTube Studio Analytics with a consistent date range, metric name, currency and audience filter. Our public tools do not authenticate to your channel. The website Usage Monitor is API usage analytics, not a connected YouTube revenue dashboard.</p><Link className="inline-block font-semibold text-yt-red underline" href="/guides/how-to-check-youtube-cpm">How to check and monitor CPM in YouTube Studio</Link></section>
      <nav className="mt-8 flex flex-wrap gap-4" aria-label="Related calculators"><Link href={cpm ? "/youtube-rpm-calculator" : "/youtube-cpm-calculator"} className="font-semibold text-yt-red underline">{cpm ? "Calculate creator RPM" : "Calculate advertiser CPM"}</Link><Link href="/#calculator" className="font-semibold text-yt-red underline">Estimate earnings from views and CPM</Link><Link href="/guides/youtube-cpm-vs-rpm" className="font-semibold text-yt-red underline">CPM vs RPM explained</Link></nav>
      <SourceLinks ids={["definitions", "metrics", "access"]} />
    </ProsePage>
  </>;
}
