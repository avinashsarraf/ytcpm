import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, FileSearch, Hash, ListVideo, Search, ShieldCheck, TrendingUp } from "lucide-react";
import ChannelAuditor from "@/components/channel-auditor";
import Faq from "@/components/faq";
import { pageMetadata, breadcrumbs, serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata(
    "YouTube Channel Auditor — Audit Any Public Channel",
    "Audit any public YouTube channel: category, videos, playlists, tags, keywords, best and worst performing content plus clearly labeled CPM, RPM and revenue scenarios. Completely free, no signup.",
    "/channel-auditor",
  ),
  keywords: ["youtube channel auditor", "youtube channel analysis", "channel audit tool", "youtube keyword analysis", "youtube channel revenue estimate", "best performing videos"],
};

const FAQS = [
  { q: "What does the Channel Auditor actually pull?", a: "Public YouTube data only: channel name, handle, description, published date, subscriber count when the creator has not hidden it, lifetime views, published video count, public videos with titles, descriptions, tags, categories, durations and public view/like/comment counts, plus public playlists. Anything private, unlisted, deleted or owner-only stays private." },
  { q: "Can I see a channel's real CPM, RPM or revenue?", a: "No. A public channel URL never exposes ad impressions, advertiser spend or creator revenue. The auditor shows modelled CPM and RPM ranges from the ytcpm.online benchmark model using an explicit audience-market assumption and a chosen niche, and every estimated figure is labelled as estimated." },
  { q: "Where do the keywords and best/worst performing content come from?", a: "Phrases are inferred from public titles and public tags on the videos that were analysed, ranked by the views associated with them. Best and worst performers are ranked by views and by views per day since publication. These are content signals — they are not verified search volumes, keyword rankings or a verdict on strategy." },
  { q: "Which channels can be audited?", a: "Any public channel that can be resolved from its current @handle, an @handle URL or a /channel/UC… URL. Custom vanity /c/ links, deleted channels and private channels cannot be resolved. You need the YouTube Data API key configured on the server for live audits." },
  { q: "Can I audit my own channel's private analytics?", a: "Not yet. Connecting a channel with Google authorization to read private analytics is a separate flow. Until it exists, this tool never presents owner-only numbers as if they came from a public audit, and a public audit of your own channel still shows public data only." },
  { q: "Is the audit really free?", a: "Yes. Every audit is free, with no signup, no card and no limits on how much of a channel is analysed. You can also copy the written summary or download the analysed video table as a CSV." },
];

const DIFFERENTIATORS = [
  { icon: FileSearch, title: "Full public inventory", copy: "Videos, playlists, tags, categories and public engagement counts for every upload the API returns — not a top-10 sample." },
  { icon: Hash, title: "Keyword intelligence", copy: "Strongest and weakest repeated phrases with the views behind them, plus tag coverage and description gaps you can act on." },
  { icon: TrendingUp, title: "Performance ranking", copy: "Best and worst performers by views and by views per day, so a slow burn is not mistaken for a weak video." },
  { icon: BarChart3, title: "Honest revenue scenarios", copy: "CPM and RPM ranges from a transparent benchmark model with a market assumption you control — never presented as real channel earnings." },
  { icon: ShieldCheck, title: "Privacy first", copy: "No channel login, no scraping of private pages and no owner data. A channel that hides its subscriber count is reported as hidden." },
  { icon: BadgeCheck, title: "Provenance labels", copy: "Every figure is marked Public, Inferred, Estimated or Owner-verified so an estimate is never mistaken for a measurement." },
];

export default function ChannelAuditorPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd([
      breadcrumbs([{ name: "Home", path: "/" }, { name: "Channel Auditor", path: "/channel-auditor" }]),
      { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "YTCPM Channel Auditor", applicationCategory: "BusinessApplication", operatingSystem: "Any", url: "https://ytcpm.online/channel-auditor", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, description: "Audits a public YouTube channel and reports its public content, keywords, top and worst performers and modeled CPM/RPM revenue scenarios." },
    ]) }} />
    <div className="border-b border-border bg-gradient-to-b from-yt-red-light/70 via-white to-white">
      <div className="shell pb-9 pt-10 sm:pb-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-fog"><Link href="/" className="underline">Home</Link> / <span aria-current="page">Channel Auditor</span></nav>
        <p className="tag-red w-fit text-[11px]">New · Channel intelligence</p>
        <h1 className="display-2 mt-4 max-w-[24ch]">Audit any public<br /><span className="text-yt-gradient">YouTube channel.</span></h1>
        <p className="lede mt-4 max-w-3xl">Paste a channel URL or @handle and get the full public picture — category, every video, playlists, tags, keywords, best and worst performers and clearly labeled CPM, RPM and revenue scenarios. Completely free, no signup.</p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5 text-xs font-semibold text-fog">
          <li className="flex items-center gap-1.5"><Search aria-hidden className="h-3.5 w-3.5 text-mint" />Public data only</li>
          <li className="flex items-center gap-1.5"><ShieldCheck aria-hidden className="h-3.5 w-3.5 text-mint" />No channel login</li>
          <li className="flex items-center gap-1.5"><BarChart3 aria-hidden className="h-3.5 w-3.5 text-mint" />Labelled estimates</li>
        </ul>
      </div>
    </div>

    <div className="shell py-10 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1.05fr)_320px] xl:items-start">
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

      <section className="mt-14">
        <h2 className="text-2xl font-bold text-heading">Built for honest channel intelligence</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-fog">A channel audit is only useful if it separates what YouTube publishes from what we infer and what we estimate. Every panel in the auditor carries that label.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIFFERENTIATORS.map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-border bg-white p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-yt-red-light text-yt-red"><Icon aria-hidden className="h-5 w-5" /></span>
            <h3 className="mt-4 text-base font-bold text-heading">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-fog">{copy}</p>
          </div>)}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-2xl font-bold text-heading">Channel Auditor questions</h2>
        <Faq items={FAQS} idPrefix="auditor-faq" />
      </section>
    </div>
  </>;
}
