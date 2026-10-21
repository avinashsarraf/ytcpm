import Link from "next/link";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import ProsePage from "@/components/prose-page";
import { GUIDES } from "@/lib/editorial";
import { breadcrumbs, pageMetadata, serializeJsonLd, webPageSchema } from "@/lib/seo";
import { STATIC_PAGE_SEO } from "@/lib/seo-keywords";

const seo = STATIC_PAGE_SEO["/guides"];
export const metadata = pageMetadata(
  "YouTube CPM & RPM Guides — Learning Center",
  "Learn how to check your own YouTube CPM in Studio, compare CPM vs RPM, estimate earnings per 1,000 views and avoid misleading estimates. Examples included.",
  "/guides",
  { focus: seo.focus, keywords: seo.keywords, type: "article", modifiedTime: "2026-10-20" },
);

export default function GuidesPage() {
  return <ProsePage wide eyebrow="YTCPM learning center" title="Understand your YouTube CPM and earnings" lede="Practical guides for checking your own metrics, comparing the right numbers and avoiding misleading earnings estimates. Every guide states its sources and its limits.">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([
      webPageSchema({ path: "/guides", name: "YouTube CPM, RPM & Earnings Guides", description: "Practical guides to checking your own YouTube CPM, comparing CPM and RPM and estimating earnings per 1,000 views.", dateModified: "2026-10-20", section: "Guides", about: ["YouTube CPM guides", "YouTube RPM guides", "YouTube monetization guides"] }),
      { "@context": "https://schema.org", "@type": "CollectionPage", "@id": "https://ytcpm.online/guides#collection", url: "https://ytcpm.online/guides", name: "YouTube CPM, RPM & Earnings Guides", inLanguage: "en", isPartOf: { "@id": "https://ytcpm.online/#website" }, hasPart: GUIDES.map(g => ({ "@type": "WebPage", name: g.title, url: `https://ytcpm.online/guides/${g.slug}` })) },
      breadcrumbs([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }]),
    ]) }} />

    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-fog"><Link href="/" className="py-2 underline">Home</Link><span aria-hidden="true">/</span><span aria-current="page" className="font-semibold text-heading">Guides</span></nav>

    <div className="grid gap-5 lg:grid-cols-3">{GUIDES.map(g => <article key={g.slug} className="card flex flex-col p-5">
      <h2 className="text-xl font-bold text-heading"><Link href={`/guides/${g.slug}`} className="hover:text-yt-red">{g.title}</Link></h2>
      <p className="mt-3 leading-relaxed">{g.description}</p>
      <p className="mt-4 border-t border-border pt-3 text-xs leading-6 text-fog"><strong className="font-semibold text-heading">Quick answer:</strong> {g.answer}</p>
      <Link href={`/guides/${g.slug}`} className="mt-4 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-yt-red underline underline-offset-4">Read the guide<ArrowRight aria-hidden className="h-3.5 w-3.5" /></Link>
    </article>)}</div>

    <section className="mt-12 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="flex items-center gap-2 text-xl font-bold text-heading"><BookOpen aria-hidden className="h-5 w-5 text-yt-red" />What these guides cover</h2>
      <div className="mt-4 grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-base font-bold text-heading">Reading your own reports</h3>
          <p className="mt-2 text-sm leading-7 text-fog">Where CPM, playback-based CPM and RPM appear in YouTube Studio, why the numbers do not match what you expected, and which metric to quote when you compare periods.</p>
        </div>
        <div>
          <h3 className="text-base font-bold text-heading">Turning reports into numbers</h3>
          <p className="mt-2 text-sm leading-7 text-fog">The arithmetic: dividing revenue by views or impressions, matching the denominator to the format, and using the right unit so a Shorts figure is never compared against a long-form one.</p>
        </div>
        <div>
          <h3 className="text-base font-bold text-heading">Recognising bad estimates</h3>
          <p className="mt-2 text-sm leading-7 text-fog">Why a single global average is misleading, how revenue share applies to each format, and what a creator can and cannot learn from another channel&apos;s public page.</p>
        </div>
      </div>
    </section>

    <section className="mt-10 rounded-2xl border border-border bg-white p-6 sm:p-8">
      <h2 className="flex items-center gap-2 text-xl font-bold text-heading"><Search aria-hidden className="h-5 w-5 text-yt-red" />Turn a guide into a number</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-fog">Once you have your own measured figures, the calculators do the arithmetic so you can test a scenario instead of guessing. Everything runs in your browser and no signup is required.</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          { href: "/youtube-cpm-calculator", label: "Calculate CPM from ad revenue and impressions" },
          { href: "/youtube-rpm-calculator", label: "Calculate RPM from creator revenue and views" },
          { href: "/youtube-views-to-money-calculator", label: "Convert views to money with your own RPM" },
          { href: "/youtube-revenue-goal-calculator", label: "Work out the views a revenue goal needs" },
          { href: "/cpm-by-country", label: "Compare audience-country CPM benchmarks" },
          { href: "/cpm-by-niche", label: "Compare niche CPM benchmarks" },
          { href: "/channel-auditor", label: "Audit a public channel for its catalogue and keywords" },
          { href: "/methodology", label: "Read how the benchmark model is built" },
        ].map(l => <li key={l.href}><Link href={l.href} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-heading hover:text-yt-red">{l.label}<ArrowRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-yt-red" /></Link></li>)}
      </ul>
    </section>
  </ProsePage>;
}
