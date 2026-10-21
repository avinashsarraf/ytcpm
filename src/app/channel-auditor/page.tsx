import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, BarChart3, CheckCircle2, FileSearch, Hash, Layers,
  ListVideo, Lock, Search, ShieldCheck, TrendingUp, X,
} from "lucide-react";
import ChannelAuditor from "@/components/channel-auditor";
import Faq from "@/components/faq";
import { pageMetadata, breadcrumbs, serializeJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/editorial";
import {
  AUDIT_COVERAGE, AUDIT_STEPS, AUDITOR_FAQS, COMPARISON, LIMITATIONS, PROVENANCE, USE_CASES,
} from "@/lib/auditor/content";

const PATH = "/channel-auditor";
const TITLE = "YouTube Channel Auditor — Free Channel Audit & Analysis Tool";
const DESCRIPTION = "Audit any public YouTube channel for free. See its category, every video, playlists, tags, keywords, best and worst performing uploads plus clearly labeled CPM, RPM and revenue scenarios. No signup.";

export const metadata: Metadata = {
  ...pageMetadata(TITLE, DESCRIPTION, PATH),
  keywords: [
    "youtube channel auditor", "youtube channel audit tool", "audit youtube channel",
    "youtube channel analyzer", "free youtube channel audit", "youtube channel analysis",
    "youtube keyword analysis tool", "youtube tag analyzer", "best performing videos finder",
    "youtube channel stats checker", "youtube competitor analysis", "youtube channel revenue estimate",
  ],
  category: "finance",
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    siteName: "ytcpm.online",
    images: [{ url: `${PATH}/opengraph-image`, width: 1200, height: 630, alt: "YouTube Channel Auditor: public channel categories, keywords, top videos and modeled CPM/RPM scenarios" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${PATH}/opengraph-image`],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

const PROVENANCE_STYLE: Record<string, string> = {
  Public: "bg-mint-bg text-mint border-mint/25",
  Inferred: "bg-yt-red-light text-yt-red border-yt-red/20",
  Estimated: "bg-amber-bg text-gold border-gold/25",
};

export default function ChannelAuditorPage() {
  const schema = [
    breadcrumbs([{ name: "Home", path: "/" }, { name: "Channel Auditor", path: PATH }]),
    {
      "@context": "https://schema.org", "@type": "WebPage", "@id": `${SITE_URL}${PATH}#webpage`,
      url: `${SITE_URL}${PATH}`, name: TITLE, description: DESCRIPTION, inLanguage: "en",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      breadcrumb: { "@id": `${SITE_URL}${PATH}#breadcrumb` },
      primaryImageOfPage: { "@type": "ImageObject", url: `${SITE_URL}${PATH}/opengraph-image`, width: 1200, height: 630 },
      about: { "@type": "Thing", name: "YouTube channel analysis" },
    },
    {
      "@context": "https://schema.org", "@type": "WebApplication", "@id": `${SITE_URL}${PATH}#app`,
      name: "YTCPM Channel Auditor", url: `${SITE_URL}${PATH}`,
      applicationCategory: "UtilitiesApplication", applicationSubCategory: "YouTube analytics",
      operatingSystem: "Any", browserRequirements: "Requires JavaScript", inLanguage: "en",
      isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Public channel snapshot with subscribers, views and upload count",
        "Every public upload with tags, categories, views, likes and comments",
        "Public playlist inventory",
        "Best and worst performing videos plus fastest riser",
        "Keyword and tag analysis from titles and public tags",
        "Modeled CPM, RPM and revenue scenarios with a controllable market assumption",
        "Copyable summary and CSV download",
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
      image: `${SITE_URL}${PATH}/opengraph-image`,
    },
    {
      "@context": "https://schema.org", "@type": "HowTo", "@id": `${SITE_URL}${PATH}#howto`,
      name: "How to audit a public YouTube channel", description: "Run a full public channel audit in three steps — no login and no signup required.",
      totalTime: "PT2M", step: AUDIT_STEPS.map((step, index) => ({
        "@type": "HowToStep", position: index + 1, name: step.title, text: step.body,
        url: `${SITE_URL}${PATH}#step-${index + 1}`,
      })),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage", "@id": `${SITE_URL}${PATH}#faq`,
      mainEntity: AUDITOR_FAQS.map(faq => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })),
    },
  ];

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />

    <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-yt-red-light/80 via-white to-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 blob-pink" aria-hidden />
      <div className="relative shell pb-9 pt-10 sm:pb-11 sm:pt-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-fog"><Link href="/" className="underline">Home</Link> / <span aria-current="page">Channel Auditor</span></nav>
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="min-w-0">
            <p className="tag-red w-fit text-[11px]">Channel intelligence · Free tool</p>
            <h1 className="display-2 mt-4 max-w-[22ch]">YouTube Channel<br /><span className="text-yt-gradient">Auditor</span></h1>
            <p className="lede mt-4 max-w-[54ch]">Audit any public YouTube channel in seconds. Get the category, every video, playlists, tags, keywords, best and worst performing uploads and clearly labeled CPM, RPM and revenue scenarios — free, with no signup and no channel login.</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-xs font-semibold text-fog">
              {[{ icon: Search, label: "Public data only" }, { icon: ShieldCheck, label: "No channel login" }, { icon: Layers, label: "Full catalogue" }, { icon: BadgeCheck, label: "Labelled estimates" }].map(({ icon: Icon, label }) => <li key={label} className="flex items-center gap-1.5"><Icon aria-hidden className="h-3.5 w-3.5 text-mint" />{label}</li>)}
            </ul>
            <a href="#auditor" className="hot-gradient mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl px-5 text-sm font-bold text-white shadow-[0_6px_18px_-8px_rgba(238,18,73,0.65)]">Audit a channel now<ArrowRight aria-hidden className="h-4 w-4" /></a>
          </div>
          <div className="rounded-3xl border border-border bg-white/85 p-5 shadow-[0_18px_50px_-28px_rgba(30,40,60,0.35)] backdrop-blur sm:p-6">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-fog">What the report returns</p>
            <ul className="mt-4 space-y-3">
              {AUDIT_COVERAGE.slice(0, 6).map(item => <li key={item.label} className="flex items-start gap-3">
                <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                <span className="min-w-0"><span className="block text-sm font-bold text-heading">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-fog">{item.detail}</span></span>
                <span className={`ml-auto shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${PROVENANCE_STYLE[item.source]}`}>{item.source}</span>
              </li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div id="auditor" className="shell scroll-mt-24 py-10 lg:py-12">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="min-w-0"><ChannelAuditor /></div>
        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-heading"><ListVideo aria-hidden className="h-4 w-4 text-yt-red" />What you get</h2>
            <ul className="mt-3 space-y-2 text-xs leading-6 text-fog">
              <li>Channel snapshot with subscriber, view and upload counts</li>
              <li>Category breakdown and upload cadence</li>
              <li>Full analysed video table with sorting and filtering</li>
              <li>Strongest and weakest repeated phrases</li>
              <li>Modelled CPM, RPM, monthly run rate and lifetime range</li>
            </ul>
            <Link href="/tools" className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-yt-red">Other creator tools <ArrowRight aria-hidden className="h-3.5 w-3.5" /></Link>
          </div>
          <div className="rounded-2xl border border-mint/25 bg-mint-bg/60 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-heading"><ShieldCheck aria-hidden className="h-4 w-4 text-mint" />Free, complete and honest</h2>
            <ul className="mt-3 space-y-2 text-xs leading-6 text-fog">
              <li>Every public upload the API returns, not a short sample</li>
              <li>Copy the summary or download the video table as CSV</li>
              <li>No signup, no card, no checkout step</li>
            </ul>
            <p className="mt-3 text-[11px] leading-5 text-fog">We never ask for your YouTube login and never read private channel data.</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-bold text-heading">Read alongside</h2>
            <ul className="mt-2 space-y-0.5 text-xs text-fog">
              <li><Link href="/cpm-by-niche" className="inline-flex min-h-11 items-center underline">CPM by niche benchmarks</Link></li>
              <li><Link href="/cpm-by-country" className="inline-flex min-h-11 items-center underline">CPM by country benchmarks</Link></li>
              <li><Link href="/methodology" className="inline-flex min-h-11 items-center underline">How the revenue model works</Link></li>
              <li><Link href="/youtube-rpm-calculator" className="inline-flex min-h-11 items-center underline">Calculate RPM from your own report</Link></li>
            </ul>
          </div>
        </aside>
      </div>

      <section className="mt-16">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-yt-red">How it works</p>
        <h2 className="mt-3 text-2xl font-bold text-heading">How to audit a YouTube channel in three steps</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-fog">No account, no extension and no channel connection. The whole flow runs in your browser against public API data.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {AUDIT_STEPS.map((step, index) => <li key={step.title} id={`step-${index + 1}`} className="scroll-mt-24 rounded-2xl border border-border bg-white p-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-yt-red-light font-mono text-sm font-bold text-yt-red">{index + 1}</span>
            <h3 className="mt-4 text-base font-bold text-heading">{step.title}</h3>
            <p className="mt-2 text-sm leading-7 text-fog">{step.body}</p>
          </li>)}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-heading">What the Channel Auditor checks</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-fog">Every line in the report is tagged with where it came from, so a published number is never confused with our own calculation.</p>
        <div className="table-scroll mt-6 overflow-x-auto rounded-2xl border border-border" role="region" aria-label="What the Channel Auditor checks and the source of each item" tabIndex={0}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Data the Channel Auditor reports and the source of each item</caption>
            <thead className="bg-surface text-[11px] uppercase tracking-wider text-fog"><tr><th scope="col" className="px-4 py-3 font-semibold">Report section</th><th scope="col" className="px-4 py-3 font-semibold">What it contains</th><th scope="col" className="px-4 py-3 font-semibold">Source</th></tr></thead>
            <tbody>{AUDIT_COVERAGE.map(item => <tr key={item.label} className="border-t border-border/70">
              <th scope="row" className="px-4 py-3 text-left font-semibold text-heading">{item.label}</th>
              <td className="px-4 py-3 text-fog">{item.detail}</td>
              <td className="px-4 py-3"><span className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${PROVENANCE_STYLE[item.source]}`}>{item.source}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-heading">Public audit vs. YouTube Studio analytics</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-fog">The auditor shows what the public can already see for any channel. Studio shows your own private metrics. Neither replaces the other.</p>
        <div className="table-scroll mt-6 overflow-x-auto rounded-2xl border border-border" role="region" aria-label="Public channel audit compared with YouTube Studio analytics" tabIndex={0}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Comparison of what a public channel audit shows against YouTube Studio analytics</caption>
            <thead className="bg-surface text-[11px] uppercase tracking-wider text-fog"><tr><th scope="col" className="px-4 py-3 font-semibold">Capability</th><th scope="col" className="px-4 py-3 font-semibold">Channel Auditor (public)</th><th scope="col" className="px-4 py-3 font-semibold">YouTube Studio (owner)</th></tr></thead>
            <tbody>{COMPARISON.map(row => <tr key={row.capability} className="border-t border-border/70">
              <th scope="row" className="px-4 py-3 text-left font-semibold text-heading">{row.capability}</th>
              <td className="px-4 py-3 text-fog">{row.publicAudit}</td>
              <td className="px-4 py-3 text-fog">{row.studio}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-heading">How to read the three data labels</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-fog">Trust in an audit comes from knowing which numbers are measured and which are modelled. These labels appear on every tile of the report.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PROVENANCE.map(item => <div key={item.label} className="rounded-2xl border border-border bg-white p-5">
            <span className={`inline-block rounded-md border px-2 py-1 font-mono text-[10px] font-bold uppercase ${PROVENANCE_STYLE[item.label]}`}>{item.label}</span>
            <h3 className="mt-3 text-base font-bold text-heading">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-fog">{item.body}</p>
          </div>)}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-heading">What creators use a channel audit for</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map(item => <div key={item.title} className="rounded-2xl border border-border bg-white p-5">
            <h3 className="text-base font-bold text-heading">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-fog">{item.body}</p>
          </div>)}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-heading">Limitations we will not hide</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-fog">A channel audit is genuinely useful only if its blind spots are stated. These are ours.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LIMITATIONS.map(item => <div key={item.title} className="rounded-2xl border border-border bg-surface/70 p-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-yt-red"><X aria-hidden className="h-4 w-4" /></span>
            <h3 className="mt-4 text-base font-bold text-heading">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-fog">{item.body}</p>
          </div>)}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-heading">Built for honest channel intelligence</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-fog">A channel audit is only useful if it separates what YouTube publishes from what we infer and what we estimate. Every panel in the auditor carries that label.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FileSearch, title: "Full public inventory", copy: "Videos, playlists, tags, categories and public engagement counts for every upload the API returns — not a top-10 sample." },
            { icon: Hash, title: "Keyword intelligence", copy: "Strongest and weakest repeated phrases with the views behind them, plus tag coverage and description gaps you can act on." },
            { icon: TrendingUp, title: "Performance ranking", copy: "Best and worst performers by views and by views per day, so a slow burn is not mistaken for a weak video." },
            { icon: BarChart3, title: "Honest revenue scenarios", copy: "CPM and RPM ranges from a transparent benchmark model with a market assumption you control — never presented as real channel earnings." },
            { icon: ShieldCheck, title: "Privacy first", copy: "No channel login, no scraping of private pages and no owner data. A channel that hides its subscriber count is reported as hidden." },
            { icon: BadgeCheck, title: "Provenance labels", copy: "Every figure is marked Public, Inferred or Estimated so an estimate is never mistaken for a measurement." },
          ].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-border bg-white p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-yt-red-light text-yt-red"><Icon aria-hidden className="h-5 w-5" /></span>
            <h3 className="mt-4 text-base font-bold text-heading">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-fog">{copy}</p>
          </div>)}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-5 text-2xl font-bold text-heading">Channel Auditor questions</h2>
        <Faq items={AUDITOR_FAQS} idPrefix="auditor-faq" />
      </section>

      <section className="mt-14 rounded-3xl border border-border bg-gradient-to-br from-yt-red-light/70 via-white to-white p-6 sm:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-xl font-bold text-heading">Turn an audit into a plan</h2>
            <p className="mt-2 max-w-[56ch] text-sm leading-7 text-fog">Pair the public audit with the benchmarks: compare your niche and your audience market, then verify your own real CPM or RPM from a Studio report instead of a model.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/cpm-by-niche" className="hot-gradient inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white">Compare niche CPM<ArrowRight aria-hidden className="h-4 w-4" /></Link>
              <Link href="/youtube-cpm-calculator" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-bold text-heading">Calculate your CPM<ArrowRight aria-hidden className="h-4 w-4" /></Link>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[{ href: "/cpm-by-country", label: "Audience country benchmarks" }, { href: "/youtube-rpm-calculator", label: "Calculate actual RPM" }, { href: "/guides/how-to-check-youtube-cpm", label: "Check your CPM in Studio" }, { href: "/sources", label: "Sources and limitations" }].map(item => <li key={item.href}><Link href={item.href} className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-sm font-semibold text-heading hover:border-yt-red/30">{item.label}<ArrowRight aria-hidden className="h-3.5 w-3.5 text-yt-red" /></Link></li>)}
          </ul>
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="flex items-center gap-2 text-sm font-bold text-heading"><Lock aria-hidden className="h-4 w-4 text-yt-red" />Sources for the data behind an audit</h2>
        <ul className="mt-3 space-y-2 text-sm leading-7 text-fog">
          <li><a href="https://developers.google.com/youtube/v3/docs" className="text-yt-red underline underline-offset-4">YouTube Data API v3 reference</a> — the public channels, playlist items, video statistics, tags and categories the auditor reads.</li>
          <li><a href="https://support.google.com/youtube/answer/9314357?hl=en" className="text-yt-red underline underline-offset-4">YouTube Help: understand ad revenue analytics</a> — how CPM, playback-based CPM and RPM are actually defined.</li>
          <li><a href="https://developers.google.com/youtube/analytics/channel_reports" className="text-yt-red underline underline-offset-4">YouTube Analytics API: channel reports</a> — why monetary and audience reports require owner authorization.</li>
          <li><Link href="/methodology" className="text-yt-red underline underline-offset-4">Our calculation methodology</Link> and <Link href="/sources" className="text-yt-red underline underline-offset-4">sources and editorial policy</Link> for the CPM and RPM model used in the revenue scenarios.</li>
        </ul>
        <p className="mt-5 text-xs leading-6 text-fog">Independent of YouTube and Google. Audits read public data only; revenue figures are modeled scenarios, not channel earnings or a promise of payment.</p>
      </section>
    </div>
  </>;
}
